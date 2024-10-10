#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

// Get current directory for relative paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to format the current date and time
const getTimestamp = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  return `${year}${month}${day}-${hours}${minutes}${seconds}`; // Format: YYYYMMDD-HHmmss
};

// Function to create 'project-files' directory if it doesn't exist
const ensureDirectory = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath);
  }
};

// Function to write file content to the output file
const writeFileContent = (filePath, outputFile) => {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    fs.appendFileSync(outputFile, `File: ${filePath}\n`);
    fs.appendFileSync(outputFile, content + '\n');
    fs.appendFileSync(outputFile, '\n\n' + '='.repeat(50) + '\n\n');
  } catch (err) {
    console.error(`Error reading file: ${filePath}`);
  }
};

// Function to recursively collect files from a directory
const collectFiles = (directory, outputFile) => {
  const items = fs.readdirSync(directory);

  items.forEach((item) => {
    const fullPath = path.join(directory, item);
    const stats = fs.statSync(fullPath);

    if (stats.isDirectory()) {
      collectFiles(fullPath, outputFile); // Recurse into subdirectories
    } else if (item.endsWith('.svelte') || item.endsWith('.js') || item.endsWith('.ts')) {
      writeFileContent(fullPath, outputFile);
    }
  });
};

// Function to handle --app flag (specific app or route)
const appMode = (routeName, outputFile) => {
  const routeDir = path.join(__dirname, 'src', 'routes', routeName);
  const componentsDir = path.join(__dirname, 'src', 'lib', 'components', routeName);

  if (fs.existsSync(routeDir)) {
    console.log(`Collecting files from route: ${routeName}`);
    collectFiles(routeDir, outputFile);
  } else {
    console.error(`Route "${routeName}" not found in src/routes.`);
    process.exit(1);
  }

  if (fs.existsSync(componentsDir)) {
    console.log(`Collecting components from: ${componentsDir}`);
    collectFiles(componentsDir, outputFile);
  } else {
    console.warn(`No components found for route "${routeName}" in src/lib/components.`);
  }
};

// Function to handle --full flag (all apps and routes)
const fullMode = (outputFile) => {
  const routesDir = path.join(__dirname, 'src', 'routes');
  const componentsDir = path.join(__dirname, 'src', 'lib', 'components');

  console.log(`Collecting all files from routes and components...`);
  collectFiles(routesDir, outputFile);
  collectFiles(componentsDir, outputFile);
};

// Setup yargs for command-line arguments
const argv = yargs(hideBin(process.argv))
  .option('app', {
    alias: 'a',
    type: 'string',
    description: 'Specify the app/route name to collect files from',
  })
  .option('full', {
    alias: 'f',
    type: 'boolean',
    description: 'Collect all apps/routes and components in the project',
  })
  .check((argv) => {
    if (!argv.app && !argv.full) {
      throw new Error('You must provide either --app or --full flag');
    }
    return true;
  })
  .conflicts('app', 'full') // Ensure --app and --full are not used together
  .help()
  .argv;

// Create 'project-files' directory if it doesn't exist
const projectFilesDir = path.join(__dirname, 'project-files');
ensureDirectory(projectFilesDir);

// Get the current timestamp
const timestamp = getTimestamp();

// Handle the flags and set the output file paths
let outputFile = '';
if (argv.app) {
  outputFile = path.join(projectFilesDir, `project-${argv.app}-${timestamp}.txt`);
  appMode(argv.app, outputFile);
}

if (argv.full) {
  outputFile = path.join(projectFilesDir, `project-full-${timestamp}.txt`);
  fullMode(outputFile);
}

console.log(`File collection complete. Output saved to: ${outputFile}`);
