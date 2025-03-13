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
    const { text, targetLanguage = 'es' } = req.body
    
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
          content: `You are a helpful assistant that translates text to ${targetLanguage}.`
        },
        {
          role: 'user',
          content: `Please translate the following text to ${targetLanguage}:\n\n${text}`
        }
      ],
      max_tokens: 1000,
    })

    const translation = response.choices[0].message.content

    return res.status(200).json({ translation })
  } catch (error) {
    console.error('Error in translate API:', error)
    return res.status(500).json({ error: 'Error translating text' })
  }
} 