// src/routes/affirmations/+server.js

import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';
import prisma from '$lib/prisma.js';
import jwt from 'jsonwebtoken';

ffmpeg.setFfmpegPath(ffmpegStatic.path);
ffmpeg.setFfprobePath(ffprobeStatic.path);

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key_here'; // Replace with your secret key

export const POST = async ({ request }) => {
  try {
    // Verify JWT Token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let userId;

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      userId = decoded.userId;
    } catch (err) {
      console.error('JWT verification failed:', err);
      return new Response('Unauthorized', { status: 401 });
    }

    const data = await request.formData();
    const uploadedFile = data.get('file');
    const backgroundMusicFile = data.get('backgroundMusic');
    const title = data.get('title');
    const artist = data.get('artist');

    if (!uploadedFile || !backgroundMusicFile || !title || !artist) {
      return new Response('Missing required fields.', { status: 400 });
    }

    // Directories
    const uploadsDir = path.join(process.cwd(), 'uploads');
    const processedDir = path.join(process.cwd(), 'static', 'processed'); // Serve processed files from static directory

    // Create directories if they don't exist
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir);
    }
    if (!fs.existsSync(processedDir)) {
      fs.mkdirSync(processedDir);
    }

    // Save uploaded audio file
    const audioBuffer = Buffer.from(await uploadedFile.arrayBuffer());
    const audioFileName = `${Date.now()}-${uploadedFile.name}`;
    const audioFilePath = path.join(uploadsDir, audioFileName);
    fs.writeFileSync(audioFilePath, audioBuffer);

    // Get background music path
    const backgroundMusicPath = path.join(process.cwd(), 'static', 'background-music', backgroundMusicFile);

    // Ensure background music file exists
    if (!fs.existsSync(backgroundMusicPath)) {
      console.error('Background music file not found:', backgroundMusicPath);
      return new Response('Background music file not found.', { status: 400 });
    }

    // Prepare output file path
    const outputFileName = `affirmation-${Date.now()}.mp3`;
    const outputFilePath = path.join(processedDir, outputFileName);

    // Process audio with FFmpeg
    await new Promise((resolve, reject) => {
      ffmpeg()
        .setFfmpegPath(ffmpegStatic.path)
        .setFfprobePath(ffprobeStatic.path)
        .input(audioFilePath)
        .input(backgroundMusicPath)
        .complexFilter([
          '[0:a]volume=1[aud];',
          '[1:a]volume=0.5[bkg];',
          '[aud][bkg]amix=inputs=2:duration=longest',
        ])
        .outputOptions([
          '-metadata', `title=${title}`,
          '-metadata', `artist=${artist}`,
        ])
        .on('start', (commandLine) => {
          console.log('Spawned FFmpeg with command:', commandLine);
        })
        .on('error', (err, stdout, stderr) => {
          console.error('FFmpeg error:', err);
          console.error('FFmpeg stdout:', stdout);
          console.error('FFmpeg stderr:', stderr);
          reject(err);
        })
        .on('end', resolve)
        .save(outputFilePath);
    });

    // Delete original uploaded file
    fs.unlinkSync(audioFilePath);

    // Save affirmation record in the database
    await prisma.affirmation.create({
      data: {
        userId, // Associate the affirmation with the authenticated user
        title,
        artist,
        filePath: `/processed/${outputFileName}`, // Adjusted to serve from static directory
        createdAt: new Date(),
      },
    });

    return new Response('Affirmation processed and saved successfully.', { status: 200 });
  } catch (error) {
    console.error('Error processing affirmation:', error);
    return new Response('Error processing affirmation.', { status: 500 });
  }
};
