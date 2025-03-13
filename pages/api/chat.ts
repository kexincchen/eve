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
    const { messages, context } = req.body
    
    if (!messages || !context) {
      return res.status(400).json({ error: 'Missing required parameters' })
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const systemMessage = {
      role: 'system',
      content: `You are a helpful assistant discussing the following summary of content. 
      Respond to user questions about this content.
      
      Summary: ${context}`
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [systemMessage, ...messages],
      max_tokens: 500,
    })

    const reply = response.choices[0].message.content

    return res.status(200).json({ response: reply })
  } catch (error) {
    console.error('Error in chat API:', error)
    return res.status(500).json({ error: 'Error processing chat' })
  }
} 