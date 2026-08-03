import { GoogleGenAI, Type } from '@google/genai'
import { NextResponse } from 'next/server'

function getAi() {
  const apiKey = process.env.GEMINI_API_KEY?.trim() || process.env.NEXT_PUBLIC_GEMINI_API_KEY?.trim()
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured.')
  }
  return new GoogleGenAI({ apiKey })
}

export async function POST(request: Request) {
  try {
    const { command } = (await request.json()) as { command?: string }
    if (!command) {
      return NextResponse.json({ error: 'Command string is required.' }, { status: 400 })
    }

    const ai = getAi()
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Parse the following user command: "${command}"`,
      config: {
        systemInstruction: `You are an AI assistant command parser. 
Extract the intent from the user's command. 
Map the command to one of the following actions:
- CALL: if the user wants to call someone by phone.
- EMAIL: if the user wants to email someone.
- OPEN_VIDEO: if the user wants to open videos (like youtube).
- SEARCH_WEB: if the user wants to search for something general.
- OPEN_NOTEPAD: if the user wants to leave a note, write in the notepad/guestbook, or display the notes.
- UNKNOWN: if the command doesn't match above or is conversational.

Provide a friendly text response acknowledging the action.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            action: {
              type: Type.STRING,
              description: 'The parsed action (CALL, EMAIL, OPEN_VIDEO, SEARCH_WEB, OPEN_NOTEPAD, UNKNOWN)',
            },
            target: {
              type: Type.STRING,
              description: 'The name, email, or search query extracted from the command.',
            },
            responseMessage: {
              type: Type.STRING,
              description: 'A friendly, conversational response summarizing what you are doing.',
            },
          },
          required: ['action', 'responseMessage'],
        },
      },
    })

    const resultText = response.text || '{}'
    const parsedCommand = JSON.parse(resultText)
    return NextResponse.json(parsedCommand)
  } catch (error) {
    console.error('Error parsing command:', error)
    return NextResponse.json({ error: 'Internal Server Error', message: String(error) }, { status: 500 })
  }
}
