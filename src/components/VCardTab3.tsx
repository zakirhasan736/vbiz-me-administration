'use client'

import { VCardDocumentUpload } from '@/components/vcard/VCardDocumentUpload'
import { applyVCardContextAutoFill } from '@/lib/applyVCardAutoFill'
import type { VCardAutoFillResult } from '@/lib/vcardAutoFillDemo'
import { useVCard } from '@/lib/VCardContext'
import { createDefaultVCardSocial } from '@/lib/vcardSocial'
import type { VCardCustomSocialLink } from '@/types/vcard'
import { AlertCircle, Gamepad2, Link as LinkIcon, Plus, Share2, Trash2 } from 'lucide-react'

const SOCIAL_FIELDS: { key: string; label: string; placeholder: string }[] = [
  { key: 'instagram', label: 'Instagram', placeholder: '@ Instagram username' },
  { key: 'facebook', label: 'Facebook', placeholder: '@ Facebook username' },
  { key: 'twitter', label: 'Twitter / X', placeholder: '@ Twitter / X username' },
  { key: 'tiktok', label: 'TikTok', placeholder: '@ TikTok username' },
  { key: 'youtube', label: 'YouTube', placeholder: '@ YouTube username' },
  { key: 'truth', label: 'Truth Social', placeholder: '@ Truth Social username' },
  { key: 'rumble', label: 'Rumble', placeholder: '@ Rumble username' },
  { key: 'linkedin', label: 'LinkedIn', placeholder: '@ LinkedIn username' },
]

const GAME_PLATFORMS = [
  ['steam', 'Steam', 'Steam username'],
  ['psn', 'PlayStation Network', 'PSN username'],
  ['xbox', 'Xbox', 'Xbox username'],
  ['switch', 'Nintendo Switch', 'Switch username'],
  ['epic', 'Epic Games', 'Epic username'],
  ['discord', 'Discord', 'Discord username'],
] as const

const inputClasses =
  'w-full bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-white/10 rounded-[16px] px-5 py-4 text-[13px] font-medium text-slate-900 dark:text-white transition-all outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 shadow-sm'

const urlRegex = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d+)?(\/.*)?$/

export function Tab3SocialGames() {
  const { vCardData, updateData } = useVCard()
  const social = vCardData.social ?? createDefaultVCardSocial()
  const customLinks = social.customLinks.length > 0 ? social.customLinks : [{ id: '1', name: '', url: '' }]

  const handleAutoFill = (fields: VCardAutoFillResult) => {
    applyVCardContextAutoFill(updateData, fields)
    for (const { key } of SOCIAL_FIELDS) {
      if (fields[key]) updateData(`social.handles.${key}`, fields[key])
    }
    if (fields.gameTitle) updateData('social.games.steam', fields.gameTitle)
  }

  const setCustomLinks = (links: VCardCustomSocialLink[]) => {
    updateData('social.customLinks', links)
  }

  const addCustomLink = () => {
    setCustomLinks([...customLinks, { id: String(Date.now()), name: '', url: '' }])
  }

  const removeCustomLink = (id: string) => {
    const next = customLinks.filter((link) => link.id !== id)
    setCustomLinks(next.length > 0 ? next : [{ id: String(Date.now()), name: '', url: '' }])
  }

  const updateCustomLink = (id: string, field: 'name' | 'url', value: string) => {
    setCustomLinks(customLinks.map((link) => (link.id === id ? { ...link, [field]: value } : link)))
  }

  const isValidUrl = (url: string) => {
    if (!url) return true
    return urlRegex.test(url)
  }

  return (
    <div className="animate-in fade-in mx-auto w-full max-w-7xl pb-12 duration-500">
      <VCardDocumentUpload section="social-games" onAutoFill={handleAutoFill} />

      <div className="bg-primary-50/50 dark:bg-primary-500/2 border-primary-100 dark:border-primary-500/10 mb-8 rounded-[24px] border p-6">
        <h3 className="text-primary-600 dark:text-primary-400 mb-2 text-lg font-black">Social Networks & Games</h3>
        <p className="mb-0 text-[14px] leading-relaxed font-medium text-slate-500 dark:text-slate-400">
          Connect your audience across all your digital platforms. Fill only the ones you want to display.
        </p>
      </div>

      <div className="space-y-8">
        <section className="overflow-hidden rounded-[32px] border border-slate-200/50 bg-slate-50/50 shadow-sm dark:border-white/5 dark:bg-white/2">
          <div className="flex items-center gap-4 border-b border-slate-200/50 px-4 py-6 sm:px-8 dark:border-white/5">
            <div className="bg-primary-50 dark:bg-primary-500/10 border-primary-100 dark:border-primary-500/20 flex h-10 w-10 items-center justify-center rounded-[14px] border">
              <Share2 className="text-primary-600 dark:text-primary-400 h-5 w-5" />
            </div>
            <h4 className="text-[16px] font-black text-slate-900 dark:text-white">Social Handles</h4>
          </div>
          <div className="grid grid-cols-1 gap-x-6 gap-y-8 p-4 sm:p-8 md:grid-cols-2">
            {SOCIAL_FIELDS.map(({ key, label, placeholder }) => (
              <div key={key} className="group flex flex-col space-y-1.5">
                <label className="pl-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase transition-colors group-focus-within:text-slate-500 dark:text-slate-400">
                  {label}
                </label>
                <div className="focus-within:border-primary-500/50 focus-within:ring-primary-500/50 group flex overflow-hidden rounded-[16px] border border-slate-200/80 bg-white shadow-sm transition-all focus-within:ring-1 dark:border-white/10 dark:bg-[#0b0f19]">
                  <span className="flex items-center justify-center border-r border-slate-200/80 bg-slate-50 px-5 py-4 text-[14px] font-bold tracking-wider text-slate-500 dark:border-white/10 dark:bg-[#0b0f19] dark:text-slate-400">
                    @
                  </span>
                  <input
                    type="text"
                    value={social.handles[key] || ''}
                    onChange={(e) => updateData(`social.handles.${key}`, e.target.value)}
                    placeholder={placeholder}
                    className="w-full bg-transparent px-5 py-4 text-[13px] font-medium text-slate-900 transition-colors outline-none placeholder:text-slate-500 dark:text-white"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-6 overflow-hidden rounded-[32px] border border-slate-200/50 bg-slate-50/50 p-4 shadow-sm sm:p-8 dark:border-white/5 dark:bg-white/2">
          <div className="mb-2 flex items-center gap-4">
            <div className="bg-primary-50 dark:bg-primary-500/10 border-primary-100 dark:border-primary-500/20 flex h-10 w-10 items-center justify-center rounded-[14px] border">
              <LinkIcon className="text-primary-600 dark:text-primary-400 h-5 w-5" />
            </div>
            <h4 className="text-[16px] font-black text-slate-900 dark:text-white">Custom Social Links</h4>
          </div>

          <div className="space-y-4">
            {customLinks.map((link) => (
              <div
                key={link.id}
                className="flex flex-col items-end gap-5 rounded-[24px] border border-slate-200/80 bg-white p-6 shadow-sm sm:flex-row dark:border-white/10 dark:bg-[#0b0f19]"
              >
                <div className="group w-full space-y-1.5 sm:w-1/3">
                  <label className="pl-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase transition-colors group-focus-within:text-slate-500 dark:text-slate-400">
                    Platform Name
                  </label>
                  <input
                    type="text"
                    value={link.name}
                    onChange={(e) => updateCustomLink(link.id, 'name', e.target.value)}
                    placeholder="e.g. Dribbble"
                    className={inputClasses}
                  />
                </div>
                <div className="group w-full space-y-1.5 sm:flex-1">
                  <div className="flex items-center justify-between">
                    <label className="pl-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase transition-colors group-focus-within:text-slate-500 dark:text-slate-400">
                      URL
                    </label>
                    {!isValidUrl(link.url) && (
                      <span className="flex items-center gap-1.5 text-[11px] font-bold text-red-500">
                        <AlertCircle className="h-3.5 w-3.5" /> Invalid URL
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="url"
                      value={link.url}
                      onChange={(e) => updateCustomLink(link.id, 'url', e.target.value)}
                      placeholder="https://..."
                      className={`${inputClasses} ${!isValidUrl(link.url) ? '!focus:ring-red-500/50 border-red-500/50!' : ''}`}
                    />
                    <button
                      onClick={() => removeCustomLink(link.id)}
                      className="shrink-0 rounded-[16px] border border-red-500/20 bg-red-50/50 p-4 text-red-500 shadow-sm transition-all hover:bg-red-500 hover:text-white active:scale-95 dark:bg-red-500/10"
                      aria-label="Remove link"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={addCustomLink}
            className="flex w-full items-center justify-center gap-2 rounded-[16px] bg-slate-900 px-6 py-4 text-[13px] font-bold text-white shadow-md transition-colors hover:bg-slate-800 active:scale-95 sm:w-auto dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
          >
            <Plus className="h-4 w-4" /> Add Social Link
          </button>
        </section>

        <section className="overflow-hidden rounded-[32px] border border-slate-200/50 bg-slate-50/50 shadow-sm dark:border-white/5 dark:bg-white/2">
          <div className="flex items-center gap-4 border-b border-slate-200/50 px-4 py-6 sm:px-8 dark:border-white/5">
            <div className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-purple-100 bg-purple-50 dark:border-purple-500/20 dark:bg-purple-500/10">
              <Gamepad2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h4 className="text-[16px] font-black text-slate-900 dark:text-white">Game IDs</h4>
          </div>
          <div className="grid grid-cols-1 gap-x-6 gap-y-8 p-4 sm:p-8 md:grid-cols-2 lg:grid-cols-3">
            {GAME_PLATFORMS.map(([id, label, placeholder]) => (
              <div key={id} className="group flex flex-col space-y-1.5">
                <label className="pl-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase transition-colors group-focus-within:text-slate-500 dark:text-slate-400">
                  {label}
                </label>
                <div className="focus-within:border-primary-500/50 focus-within:ring-primary-500/50 group flex overflow-hidden rounded-[16px] border border-slate-200/80 bg-white shadow-sm transition-all focus-within:ring-1 dark:border-white/10 dark:bg-[#0b0f19]">
                  <span className="flex items-center justify-center border-r border-slate-200/80 bg-slate-50 px-5 py-4 text-[14px] font-bold tracking-wider text-slate-500 dark:border-white/10 dark:bg-[#0b0f19] dark:text-slate-400">
                    @
                  </span>
                  <input
                    type="text"
                    value={social.games[id] || ''}
                    onChange={(e) => updateData(`social.games.${id}`, e.target.value)}
                    placeholder={placeholder}
                    className="w-full bg-transparent px-5 py-4 text-[13px] font-medium text-slate-900 transition-colors outline-none placeholder:text-slate-500 dark:text-white"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
