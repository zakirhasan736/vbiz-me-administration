/** Custom events the live agent dispatches; profile shells listen and run UI actions. */
export const LIVE_AGENT_OPEN_SAVE_CONTACT = 'open-save-contact-flow'
export const LIVE_AGENT_GO_TO_SECTION = 'live-agent-go-to-section'
/** v3 legacy event names — still emitted by central LiveAgentPanel. */
export const LIVE_AGENT_SAVE_CONTACT_LEGACY = 'saveContactAction'
export const LIVE_AGENT_OPEN_NOTEPAD = 'openNotepadAction'

export function dispatchOpenSaveContactFlow() {
  window.dispatchEvent(new CustomEvent(LIVE_AGENT_OPEN_SAVE_CONTACT))
}

export function dispatchGoToProfileSection(sectionId: string) {
  window.dispatchEvent(
    new CustomEvent(LIVE_AGENT_GO_TO_SECTION, {
      detail: { sectionId: sectionId.trim() || 'home' },
    })
  )
}
