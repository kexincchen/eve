import type { NextApiRequest, NextApiResponse } from 'next'
import { OpenAI } from 'openai'
import { IncomingForm, Files, Fields } from 'formidable'
import fs from 'fs'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const form = new IncomingForm({ keepExtensions: true });
    
    const [fields, files] = await new Promise<[Fields, Files]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err)
        resolve([fields, files])
      })
    });

    const fileArray = files.file;
    if (!fileArray || fileArray.length === 0) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = Array.isArray(fileArray) ? fileArray[0] : fileArray;
    
    if (!file.filepath) {
      return res.status(400).json({ error: 'Invalid file' });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(file.filepath),
      model: 'whisper-1',
    });

    return res.status(200).json({ text: transcription.text });
  } catch (error) {
    console.error('Error in transcribe API:', error);
    return res.status(500).json({ error: 'Error processing audio' });
  }
} 