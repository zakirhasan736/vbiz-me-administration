import { fetchMyCardProfileId } from '@/lib/api/myCard/fetchMyCardProfileId'
import { fetchProfileAiData } from '@/lib/api/profileAiData/fetchProfileAiData'
import {
  buildLiveAgentSystemPrompt,
  DEFAULT_LIVE_AGENT_CARD,
  type LiveAgentCardData,
} from '@/profile-app/lib/liveAgentPrompt'

export type ResolvedLiveAgentPrompt = {
  cardData: LiveAgentCardData
  systemPrompt: string
}

/** Fetches profile AI data and builds the live agent system prompt on the server. */
export async function resolveLiveAgentPrompt(slug: string): Promise<ResolvedLiveAgentPrompt | null> {
  const profileId = await fetchMyCardProfileId(slug)
  if (!profileId) return null
  return resolveLiveAgentPromptFromProfileId(profileId)
}

/** Builds live agent prompt when profile id is already known (avoids duplicate slug fetch). */
export async function resolveLiveAgentPromptFromProfileId(profileId: number): Promise<ResolvedLiveAgentPrompt | null> {
  const cardData = await fetchProfileAiData(profileId)
  if (!cardData) return null

  return {
    cardData,
    systemPrompt: buildLiveAgentSystemPrompt(cardData),
  }
}

export function fallbackLiveAgentPrompt(
  cardData: LiveAgentCardData = DEFAULT_LIVE_AGENT_CARD
): ResolvedLiveAgentPrompt {
  return {
    cardData,
    systemPrompt: buildLiveAgentSystemPrompt(cardData),
  }
}
