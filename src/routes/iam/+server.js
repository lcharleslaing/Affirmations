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
        '[0]volume=4dB,aresample=44100[a]', // Boost volume of main audio
        '[1]aloop=loop=-1:size=2e+09,volume=-4dB,aresample=44100[b]', // Loop background music
        '[a][b]amix=inputs=2:duration=first', // Mix both audio tracks
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
    const selectedAudioFilePath = data.get('selectedFilePath'); // Path of an existing file (optional)
    const recordedAudio = data.get('recordedAudio'); // Audio recorded via the app (optional)
    let audioFileName = ''; // To store the original file name
    let fileExtension = '.m4a'; // Default extension for output files

    const timestamp = new Date().toISOString().replace(/:/g, '-'); // For appending to the filenames

    // Path to background music
    const backgroundMusicPath = path.normalize('E:/MyComposedSongs/00-AFFIRMATIONS/family.mp3');

    // Ensure the output directory exists
    const directory = path.normalize('C:/Users/lchar/Downloads/NewAffirmations');
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }

    let audioFilePath; // Path of the input audio file

    if (uploadedAudioFile) {
      // Extract the base name (without extension) from the uploaded file
      audioFileName = path.basename(uploadedAudioFile.name, path.extname(uploadedAudioFile.name));
      fileExtension = path.extname(uploadedAudioFile.name);

      // Save the uploaded file to the raw file
      const rawFilePath = path.join(directory, `${audioFileName}-raw-${timestamp}${fileExtension}`);
      const arrayBuffer = await uploadedAudioFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      fs.writeFileSync(rawFilePath, buffer);
      audioFilePath = rawFilePath;
    } else if (selectedAudioFilePath) {
      // Extract the base name from the selected file path
      audioFileName = path.basename(selectedAudioFilePath, path.extname(selectedAudioFilePath));
      fileExtension = path.extname(selectedAudioFilePath);

      // Use the selected file directly as the input
      audioFilePath = selectedAudioFilePath;
    } else if (recordedAudio) {
      // For recorded audio, generate a default file name
      audioFileName = 'recorded-audio';
      fileExtension = '.m4a'; // Default extension for recorded files

      // Save the recorded audio to the raw file
      const rawFilePath = path.join(directory, `${audioFileName}-raw-${timestamp}${fileExtension}`);
      const arrayBuffer = await recordedAudio.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      fs.writeFileSync(rawFilePath, buffer);
      audioFilePath = rawFilePath;
    } else {
      throw new Error('No audio file provided');
    }

    // Define filenames for the conversion and mixing steps
    const convertedFilePath = path.join(directory, `${audioFileName}-converted-${timestamp}${fileExtension}`); // Converted audio
    const tempMixedFilePath = path.join(directory, `${audioFileName}-temp-mixed-${timestamp}${fileExtension}`); // Temporary mixed file
    const finalFilePath = path.join(directory, `${audioFileName}-final-${timestamp}${fileExtension}`); // Final output

    // Convert the file to Apple Music-compatible format
    console.log('Converting to Apple Music compatible format...');
    await convertToAppleMusicFormat(audioFilePath, convertedFilePath);

    // Verify background music exists
    if (!fs.existsSync(backgroundMusicPath)) {
      throw new Error(`Background music file not found: ${backgroundMusicPath}`);
    }

    // Mix the converted audio with background music
    console.log('Mixing with background music...');
    await mixWithBackgroundMusic(convertedFilePath, backgroundMusicPath, tempMixedFilePath, finalFilePath);

    // Cleanup: remove intermediate files
    if (uploadedAudioFile || recordedAudio) {
      await unlinkAsync(audioFilePath); // Remove raw file after conversion
    }
    await unlinkAsync(convertedFilePath); // Remove converted file after mixing

    console.log('File saved successfully with background music');
    return new Response('File saved successfully with background music and proper format');
  } catch (error) {
    console.error('Error processing file:', error.message);
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
};
