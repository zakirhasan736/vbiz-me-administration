import { Type } from '@google/genai'

/** Canonical Gemini Live tool declarations (v3 configuration). */
export const LIVE_AGENT_TOOL_DECLARATIONS = [
  {
    name: 'callUser',
    description:
      'Open the visitor device phone dialer to call the card owner. Use when they ask to call or phone the owner.',
    parameters: { type: Type.OBJECT, properties: {} },
  },
  {
    name: 'emailUser',
    description:
      'Open the visitor email app with a ready-to-send message to the card owner. Provide polished subject and body.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        subject: {
          type: Type.STRING,
          description: 'Short professional email subject line.',
        },
        body: {
          type: Type.STRING,
          description: 'Complete email body in polished US business English with real line breaks.',
        },
      },
    },
  },
  {
    name: 'textUser',
    description:
      'Open the visitor SMS / Messages app to text the card owner. Use when they ask to text, SMS, or message by phone.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        body: {
          type: Type.STRING,
          description: 'Optional SMS body text in clear, concise English.',
        },
      },
    },
  },
  {
    name: 'openVideos',
    description: 'Open YouTube intro videos based on a query.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: { type: Type.STRING, description: 'Search query for videos' },
      },
    },
  },
  {
    name: 'saveContact',
    description: "Open Save Contact so the visitor can download the card owner's vCard.",
    parameters: { type: Type.OBJECT, properties: {} },
  },
  {
    name: 'openNotepad',
    description: 'Open the notepad/guestbook section for leaving notes.',
    parameters: { type: Type.OBJECT, properties: {} },
  },
] as const

export function buildLiveAgentToolConfig() {
  return [{ functionDeclarations: [...LIVE_AGENT_TOOL_DECLARATIONS] }]
}
