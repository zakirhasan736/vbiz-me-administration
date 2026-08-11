'use client'

import { AiDropFillZone, type ParsedEntry } from '@/components/AiDropFillZone'
import { MediaFileUploader } from '@/components/media/MediaFileUploader'
import { SectionJumpPills } from '@/components/SectionJumpPills'
import { useVCard } from '@/lib/VCardContext'
import { createDefaultPortfolioEntry, normalizePortfolioList } from '@/lib/vcardPortfolio'
import type { VCardPortfolioEntry } from '@/types/vcard'
import { FileText, FolderOpen, LayoutGrid, Link as LinkIcon, Plus, Trash2, Youtube } from 'lucide-react'
import { useEffect, useRef } from 'react'

const inputClasses =
  'w-full bg-white dark:bg-[#0b0f19] border border-slate-200/80 dark:border-white/10 rounded-[16px] px-5 py-4 text-[13px] font-medium text-slate-900 dark:text-white transition-all outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 shadow-sm'
const selectClasses =
  'appearance-none bg-white dark:bg-[#0b0f19] border border-slate-200/80 dark:border-white/10 rounded-[16px] px-5 py-4 w-full text-[13px] font-medium text-slate-900 dark:text-white outline-none cursor-pointer focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all shadow-sm'

export function TabPortfolio() {
  const { cardId, vCardData, updateData } = useVCard()
  const portfolios = normalizePortfolioList(vCardData.portfolio)
  const portfoliosRef = useRef(portfolios)

  useEffect(() => {
    portfoliosRef.current = portfolios
  }, [portfolios])

  const setPortfolios = (next: VCardPortfolioEntry[]) => updateData('portfolio', next)

  const addPortfolio = () => {
    setPortfolios([createDefaultPortfolioEntry(), ...portfoliosRef.current])
  }

  const removePortfolio = (id: string) => {
    setPortfolios(portfoliosRef.current.filter((p) => p.id !== id))
  }

  const updatePortfolio = (
    id: string,
    field: keyof VCardPortfolioEntry,
    value: VCardPortfolioEntry[keyof VCardPortfolioEntry]
  ) => {
    setPortfolios(portfoliosRef.current.map((p) => (p.id === id ? { ...p, [field]: value } : p)))
  }

  const patchPortfolio = (id: string, patch: Partial<VCardPortfolioEntry>) => {
    setPortfolios(portfoliosRef.current.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  }

  const applyParsed = (entries: ParsedEntry[]) => {
    const mapped = entries.map((e) => ({
      ...createDefaultPortfolioEntry(),
      title: e.title,
      description: e.description,
    }))
    setPortfolios([...mapped, ...portfoliosRef.current.filter((p) => p.title || p.description)])
  }

  return (
    <div className="animate-in fade-in mx-auto flex h-full w-full max-w-7xl flex-col pb-12 duration-500">
      <div className="mb-8 rounded-3xl border border-teal-100 bg-teal-50/50 p-6 dark:border-teal-500/10 dark:bg-teal-500/2">
        <div className="mb-2 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-teal-100 bg-teal-50 dark:border-teal-500/20 dark:bg-teal-500/10">
              <LayoutGrid className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            </div>
            <h3 className="text-lg font-black text-teal-600 dark:text-teal-400">Portfolio Collection</h3>
          </div>
          <button
            type="button"
            onClick={addPortfolio}
            className="hidden items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-bold whitespace-nowrap text-white shadow-sm transition-all hover:bg-teal-700 active:scale-95 sm:flex"
          >
            <Plus className="h-4 w-4" /> Add Portfolio
          </button>
        </div>
        <p className="mb-0 text-[14px] leading-relaxed font-medium text-slate-500 dark:text-slate-400">
          Showcase your best work and projects. Saved to the public Gallery section.
        </p>
        <button
          type="button"
          onClick={addPortfolio}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-3.5 text-[13px] font-bold text-white shadow-sm transition-all hover:bg-teal-700 active:scale-95 sm:hidden"
        >
          <Plus className="h-4 w-4" /> Add Portfolio
        </button>
      </div>

      <AiDropFillZone
        section="portfolio"
        currentDraft={{ portfolio: portfolios }}
        accent="violet"
        hint="Paste or upload projects — AI fills title + description (OCR for images)"
        onParsed={applyParsed}
      />

      <SectionJumpPills
        accent="teal"
        label="Jump to project"
        items={portfolios.map((p) => ({
          id: p.id,
          title: p.title || 'Project',
          detail: p.description?.slice(0, 40),
        }))}
      />

      <div className="flex flex-1 flex-col">
        {portfolios.length === 0 ? (
          <div className="rounded-4xl border border-slate-200/50 bg-slate-50/50 p-12 text-center shadow-sm dark:border-white/5 dark:bg-white/2">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[20px] border border-slate-200 bg-slate-100 dark:border-white/5 dark:bg-white/5">
              <FolderOpen className="h-8 w-8 text-slate-400" />
            </div>
            <h4 className="mb-2 text-[16px] font-black text-slate-900 dark:text-white">No portfolios found</h4>
            <p className="mx-auto mb-6 max-w-md text-[13px] text-slate-500 dark:text-slate-400">{`Click the "Add Portfolio" button to start showcasing your work.`}</p>
          </div>
        ) : (
          <div className="space-y-8">
            {portfolios.map((portfolio, index) => (
              <section
                key={portfolio.id}
                id={`entry-${portfolio.id}`}
                className="group/card scroll-mt-24 overflow-hidden rounded-4xl border border-slate-200/50 bg-slate-50/50 shadow-sm transition-all hover:border-slate-200/80 hover:bg-slate-50 dark:border-white/5 dark:bg-white/2"
              >
                <div className="flex flex-col items-center justify-between gap-2 border-b border-slate-200/50 px-4 py-6 sm:px-8 md:flex-row dark:border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-teal-100 bg-teal-50 font-black text-teal-600 shadow-sm dark:border-teal-500/20 dark:bg-teal-500/10 dark:text-teal-400">
                      {portfolios.length - index}
                    </div>
                    <h4 className="text-[16px] font-black text-slate-900 dark:text-white">
                      {portfolio.title || 'New Portfolio Entry'}
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => removePortfolio(portfolio.id)}
                    className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 font-bold text-red-500 transition-all hover:bg-red-100 hover:text-red-600 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
                    title="Remove Portfolio"
                  >
                    <Trash2 className="h-4 w-4" /> Remove
                  </button>
                </div>

                <div className="p-4 sm:p-8">
                  <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="group flex flex-col space-y-1.5">
                      <label className="flex items-center gap-2 pl-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase transition-colors group-focus-within:text-slate-500 dark:text-slate-400">
                        <LayoutGrid className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" /> Portfolio Type
                      </label>
                      <div className="relative">
                        <select
                          value={portfolio.type}
                          onChange={(e) => updatePortfolio(portfolio.id, 'type', e.target.value)}
                          className={selectClasses}
                        >
                          <option value="Image">Image</option>
                          <option value="Video">Video</option>
                          <option value="Audio">Audio</option>
                          <option value="Link">Link</option>
                          <option value="Document">Document</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-5 flex items-center text-slate-500 dark:text-slate-400">
                          <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div className="group flex flex-col space-y-1.5">
                      <label className="flex items-center gap-2 pl-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase transition-colors group-focus-within:text-slate-500 dark:text-slate-400">
                        <FileText className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" /> Title
                      </label>
                      <input
                        type="text"
                        value={portfolio.title}
                        onChange={(e) => updatePortfolio(portfolio.id, 'title', e.target.value)}
                        placeholder="Enter portfolio title"
                        className={inputClasses}
                      />
                    </div>
                  </div>

                  <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
                    <MediaFileUploader
                      label="Featured media"
                      accent="teal"
                      profileId={cardId}
                      attachmentType="Portfolio Gallery"
                      value={portfolio.imageUrl}
                      fileName={portfolio.imageName}
                      accept={
                        portfolio.type === 'Video'
                          ? 'video/*,image/*'
                          : portfolio.type === 'Audio'
                            ? 'audio/*,image/*'
                            : portfolio.type === 'Document'
                              ? 'application/pdf,.pdf,.doc,.docx,image/*'
                              : 'image/*,video/*,audio/*,application/pdf'
                      }
                      hint="Upload image, video, audio, or a document — preview appears below"
                      onChange={(next) => {
                        if (!next) {
                          patchPortfolio(portfolio.id, { imageUrl: '', imageName: '' })
                          return
                        }
                        patchPortfolio(portfolio.id, {
                          imageUrl: next.url,
                          imageName: next.fileName,
                        })
                      }}
                    />
                    <MediaFileUploader
                      label="Attachments (Images/Video)"
                      accent="teal"
                      profileId={cardId}
                      attachmentType="Portfolio Attachment"
                      value={portfolio.attachments?.url || ''}
                      fileName={portfolio.attachments?.name || ''}
                      accept="image/*,video/*"
                      hint="Optional secondary image or video attachment"
                      onChange={(next) => {
                        if (!next) {
                          patchPortfolio(portfolio.id, { attachments: null })
                          return
                        }
                        patchPortfolio(portfolio.id, {
                          attachments: { url: next.url, name: next.fileName },
                        })
                      }}
                    />
                  </div>

                  <div className="group mb-8 flex flex-col space-y-1.5">
                    <label className="flex items-center gap-2 pl-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase transition-colors group-focus-within:text-slate-500 dark:text-slate-400">
                      {portfolio.type === 'Video' ? (
                        <Youtube className="h-3.5 w-3.5 text-red-500" />
                      ) : (
                        <LinkIcon className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                      )}
                      {portfolio.type === 'Video' ? 'YouTube / Video URL' : 'Project / Link URL'}
                    </label>
                    <input
                      type="text"
                      value={portfolio.url}
                      onChange={(e) => updatePortfolio(portfolio.id, 'url', e.target.value)}
                      placeholder={portfolio.type === 'Video' ? 'Enter YouTube video URL' : 'https://…'}
                      className={inputClasses}
                    />
                  </div>

                  <div className="mb-8 flex items-center gap-4 pt-2">
                    <label className="group flex cursor-pointer items-center gap-3">
                      <div className="relative flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={portfolio.active}
                          onChange={(e) => updatePortfolio(portfolio.id, 'active', e.target.checked)}
                          className="sr-only"
                        />
                        <div
                          className={`relative h-5.5 w-9.5 rounded-xl shadow-inner transition-colors ${
                            portfolio.active ? 'bg-green-500' : 'bg-slate-200 dark:bg-white/10'
                          }`}
                        >
                          <div
                            className={`absolute top-0.75 left-0.75 h-4 w-4 rounded-[10px] bg-white shadow transition-transform ${
                              portfolio.active ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </div>
                      </div>
                      <span className="text-[13px] font-bold text-slate-500 transition-colors group-hover:text-slate-700 dark:text-slate-400">
                        Active Status
                      </span>
                    </label>
                  </div>

                  <div className="group flex flex-col space-y-1.5">
                    <label className="pl-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase transition-colors group-focus-within:text-slate-500 dark:text-slate-400">
                      Description
                    </label>
                    <textarea
                      value={portfolio.description}
                      onChange={(e) => updatePortfolio(portfolio.id, 'description', e.target.value)}
                      placeholder="Write a description for your portfolio..."
                      rows={4}
                      className={inputClasses.replace('h-min', 'resize-y')}
                    ></textarea>
                  </div>
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
