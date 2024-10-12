import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static'; // Import ffprobe-static
import { promisify } from 'util';

const unlinkAsync = promisify(fs.unlink);

// Set ffmpeg and ffprobe paths explicitly
ffmpeg.setFfmpegPath(ffmpegStatic);
ffmpeg.setFfprobePath(ffprobeStatic.path);  // Set ffprobe path

export const POST = async ({ request }) => {
  try {
    const data = await request.formData();
    const audioFile = data.get('file');
    const title = data.get('title');
    const artist = data.get('artist');

    // Path to the background music
    const backgroundMusicPath = path.normalize('E:/MyComposedSongs/00-AFFIRMATIONS/background-music.mp3');

    // Generate a sanitized timestamp for filenames
    const timestamp = new Date().toISOString().replace(/:/g, '-');

    // Filename based on title and sanitized timestamp
    const rawFilename = `${title}-raw-${timestamp}.mp3`; // Temporary raw file
    const finalFilename = `${title}-${timestamp}.mp3`; // Final encoded file

    // Define the target directory
    const directory = path.normalize('C:/Users/lchar/Downloads/NewAffirmations');
    const rawFilePath = path.join(directory, rawFilename);
    const finalFilePath = path.join(directory, finalFilename);

    // Ensure the directory exists, if not, create it
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }

    // Log audioFile details
    if (!audioFile) {
      throw new Error('No audio file received');
    }

    // Convert the audio file blob to a buffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Write the raw file to disk
    fs.writeFileSync(rawFilePath, buffer);

    // Verify that the background music file exists
    if (!fs.existsSync(backgroundMusicPath)) {
      throw new Error(`Background music file not found: ${backgroundMusicPath}`);
    }

    // Use ffmpeg to get the length of the recorded audio
    const getAudioDuration = (filePath) => {
      return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(filePath, (err, metadata) => {
          if (err) return reject(err);
          resolve(metadata.format.duration); // Return duration of audio
        });
      });
    };

    // Get durations of both audio files
    const recordedAudioDuration = await getAudioDuration(rawFilePath);
    const backgroundMusicDuration = await getAudioDuration(backgroundMusicPath);

    // Use ffmpeg to mix the background music and recorded audio, loop/trim background music as needed
    console.log('Mixing audio with background music using ffmpeg...');
    await new Promise((resolve, reject) => {
      ffmpeg()
        .input(rawFilePath) // Recorded audio input
        .input(backgroundMusicPath) // Background music input
        .complexFilter([
          '[0]volume=4dB,aresample=44100[a]', // Boost volume for recorded audio and resample to 44.1kHz
          `[1]aloop=loop=-1:size=2e+09,volume=-4dB,aresample=44100[b]`, // Loop background music if shorter
          `[a][b]amix=inputs=2:duration=first`, // Mix both audio tracks and trim to match the shortest duration (recorded audio)
        ])
        .on('end', async () => {
          // Delete the raw file after encoding
          try {
            await unlinkAsync(rawFilePath);
          } catch (err) {
            console.error('Error deleting raw file:', err);
          }

          resolve();
        })
        .on('error', (err) => {
          reject(err);
        })
        .save(finalFilePath);
    });

    console.log('File saved successfully with background music and correct MP3 format');

    return new Response('File saved successfully with background music');
  } catch (error) {
    console.error('Error saving file:', error.message);
    console.error('Stack trace:', error.stack);
    return new Response(`Error saving file: ${error.message}`, { status: 500 });
  }
};
