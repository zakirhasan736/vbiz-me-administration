/** Canonical live-agent configuration shared across all profile templates (v3 behavior). */

import {
  LIVE_AGENT_OPEN_NOTEPAD,
  LIVE_AGENT_OPEN_SAVE_CONTACT,
  LIVE_AGENT_SAVE_CONTACT_LEGACY,
} from '@/profile-app/lib/liveAgentEvents'

export const LIVE_AGENT_CONFIG = {
  /** Primary Gemini Live model (v3). */
  model: 'gemini-3.1-flash-live-preview',
  /** Command parser model for typed commands. */
  commandModel: 'gemini-3-flash-preview',
  /** Male prebuilt voice for Gemini Live — Puck (upbeat, conversational). */
  voice: 'Puck',
  micSampleRate: 16000,
  playbackSampleRate: 24000,
  commandApiPath: '/api/command',
  /** Custom events dispatched by tool handlers. */
  events: {
    saveContact: LIVE_AGENT_SAVE_CONTACT_LEGACY,
    openNotepad: LIVE_AGENT_OPEN_NOTEPAD,
    openSaveContactFlow: LIVE_AGENT_OPEN_SAVE_CONTACT,
  },
} as const

export type LiveAgentCommandAction = 'CALL' | 'EMAIL' | 'OPEN_VIDEO' | 'SEARCH_WEB' | 'OPEN_NOTEPAD' | 'UNKNOWN'
