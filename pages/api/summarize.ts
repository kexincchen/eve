import type { NextApiRequest, NextApiResponse } from 'next'
import { OpenAI } from 'openai'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { text } = req.body
    
    if (!text) {
      return res.status(400).json({ error: 'No text provided' })
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that summarizes text concisely and accurately.'
        },
        {
          role: 'user',
          content: `Please summarize the following text:\n\n${text}`
        }
      ],
      max_tokens: 500,
    })

    const summary = response.choices[0].message.content

    return res.status(200).json({ summary })
  } catch (error) {
    console.error('Error in summarize API:', error)
    return res.status(500).json({ error: 'Error summarizing text' })
  }
} 