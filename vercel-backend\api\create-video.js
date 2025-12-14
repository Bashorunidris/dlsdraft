import { exec } from 'child_process';
import { promisify } from 'util';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';

const execAsync = promisify(exec);

export default async function handler(req, res) {
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { photoUrl, audioUrl, duration, userId } = req.body;

    if (!photoUrl || !audioUrl || !duration) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    let tempDir = null;

    try {
        // Create temp directory
        tempDir = path.join(os.tmpdir(), `video_${uuidv4()}`);
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const photoPath = path.join(tempDir, 'input.jpg');
        const audioPath = path.join(tempDir, 'input.mp3');
        const outputPath = path.join(tempDir, 'output.mp4');

        // Download photo
        console.log('Downloading photo...');
        const photoResponse = await fetch(photoUrl);
        const photoBuffer = await photoResponse.buffer();
        fs.writeFileSync(photoPath, photoBuffer);

        // Download audio
        console.log('Downloading audio...');
        const audioResponse = await fetch(audioUrl);
        const audioBuffer = await audioResponse.buffer();
        fs.writeFileSync(audioPath, audioBuffer);

        // Create video with FFmpeg
        console.log('Creating video...');
        const ffmpegCommand = `ffmpeg -loop 1 -i "${photoPath}" -i "${audioPath}" -c:v libx264 -pix_fmt yuv420p -c:a aac -shortest -t ${duration} "${outputPath}" -y`;
        
        await execAsync(ffmpegCommand, { timeout: 60000 });

        // Read output video
        const videoBuffer = fs.readFileSync(outputPath);

        // Set response headers
        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Content-Length', videoBuffer.length);
        res.setHeader('Cache-Control', 'no-cache');

        // Send video
        res.send(videoBuffer);

    } catch (error) {
        console.error('Video creation error:', error);
        
        // Check if FFmpeg is installed
        if (error.message.includes('ffmpeg')) {
            return res.status(500).json({ 
                error: 'FFmpeg not installed on server',
                details: error.message 
            });
        }

        return res.status(500).json({ 
            error: 'Failed to create video',
            details: error.message 
        });

    } finally {
        // Cleanup temp files
        if (tempDir && fs.existsSync(tempDir)) {
            try {
                fs.rmSync(tempDir, { recursive: true, force: true });
                console.log('Cleaned up temp directory');
            } catch (cleanupError) {
                console.error('Cleanup error:', cleanupError);
            }
        }
    }
}
