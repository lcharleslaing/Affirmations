import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';
import { promisify } from 'util';

const unlinkAsync = promisify(fs.unlink);

ffmpeg.setFfmpegPath(ffmpegStatic);
ffmpeg.setFfprobePath(ffprobeStatic.path);

// Function to convert audio to Apple Music-compatible format
const convertToAppleMusicFormat = async (inputFilePath, outputFilePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg(inputFilePath)
      .output(outputFilePath)
      .audioCodec('aac') // Set to AAC
      .audioBitrate('128k') // Standard bitrate for Apple Music
      .audioChannels(2) // Stereo
      .audioFrequency(44100) // 44.1kHz sample rate
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .run();
  });
};

// Function to mix audio with background music
const mixWithBackgroundMusic = async (convertedFilePath, backgroundMusicPath, tempMixedFilePath, finalFilePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(convertedFilePath) // Input the already converted file
      .input(backgroundMusicPath) // Background music
      .complexFilter([
        '[0]volume=4dB,aresample=44100[a]', // Boost volume of main audio (recorded audio)
        '[1]aloop=loop=-1:size=2e+09,volume=-4dB,aresample=44100[b]', // Loop background music
        '[a][b]amix=inputs=2:duration=shortest', // Mix both audio tracks, shortest to avoid timing issues
      ])
      .on('end', async () => {
        // After mixing, move the mixed temp file to the final output location
        fs.renameSync(tempMixedFilePath, finalFilePath);
        resolve();
      })
      .on('error', reject)
      .save(tempMixedFilePath); // Save to temporary mixed file
  });
};

export const POST = async ({ request }) => {
  try {
    const data = await request.formData();
    const uploadedAudioFile = data.get('file'); // Uploaded file (optional)
    const recordedAudio = data.get('recordedAudio'); // Audio recorded via the app (optional)
    const title = data.get('title');
    const artist = data.get('artist');
    let audioFileName = ''; // Filename prefix

    // Path to background music
    const backgroundMusicPath = path.normalize('E:/MyComposedSongs/00-AFFIRMATIONS/family.mp3');

    // Filename generation
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const directory = path.normalize('C:/Users/lchar/Downloads/NewAffirmations');

    // Ensure the directory exists
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }

    let audioFilePath; // Path of the audio file

    if (uploadedAudioFile) {
      // Use the uploaded file's original name (without extension) as the prefix
      audioFileName = path.basename(uploadedAudioFile.name, path.extname(uploadedAudioFile.name));
      const rawFilePath = path.join(directory, `${audioFileName}-raw-${timestamp}.m4a`);

      // Handle uploaded audio file
      const arrayBuffer = await uploadedAudioFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      fs.writeFileSync(rawFilePath, buffer);
      audioFilePath = rawFilePath;
    } else if (recordedAudio) {
      // Use "recorded-audio" as the prefix for recorded audio
      audioFileName = 'recorded-audio';
      const rawFilePath = path.join(directory, `${audioFileName}-raw-${timestamp}.m4a`);

      // Handle recorded audio
      const arrayBuffer = await recordedAudio.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      fs.writeFileSync(rawFilePath, buffer);
      audioFilePath = rawFilePath;
    } else {
      throw new Error('No audio file provided');
    }

    // Paths for converted and final mixed files
    const convertedFilePath = path.join(directory, `${audioFileName}-converted-${timestamp}.m4a`); // Converted audio
    const tempMixedFilePath = path.join(directory, `${audioFileName}-temp-mixed-${timestamp}.m4a`); // Temporary mixed file
    const finalFilePath = path.join(directory, `${audioFileName}-final-${timestamp}.m4a`); // Final output

    // Convert to Apple Music-compatible format
    console.log('Converting to Apple Music compatible format...');
    await convertToAppleMusicFormat(audioFilePath, convertedFilePath);

    // Verify background music exists
    if (!fs.existsSync(backgroundMusicPath)) {
      throw new Error(`Background music file not found: ${backgroundMusicPath}`);
    }

    // Mix the converted audio with background music
    console.log('Mixing with background music...');
    await mixWithBackgroundMusic(convertedFilePath, backgroundMusicPath, tempMixedFilePath, finalFilePath);

    // Cleanup
    await unlinkAsync(audioFilePath); // Remove raw file after processing
    await unlinkAsync(convertedFilePath); // Remove the intermediate converted file

    console.log('File saved successfully with background music');
    return new Response('File saved successfully with background music and proper format');
  } catch (error) {
    console.error('Error processing file:', error.message);
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
};
