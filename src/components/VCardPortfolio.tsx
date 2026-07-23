'use client'

import {
  FileText,
  FolderOpen,
  Image as ImageIcon,
  LayoutGrid,
  Link as LinkIcon,
  Plus,
  Trash2,
  Youtube,
} from 'lucide-react'
import { useRef, useState } from 'react'

interface PortfolioItem {
  id: number
  type: string
  title: string
  featuredImage: { url: string; name: string } | null
  attachments: { url: string; name: string } | null
  youtubeUrl: string
  active: boolean
  description: string
}

const inputClasses =
  'w-full bg-white dark:bg-[#0b0f19] border border-slate-200/80 dark:border-white/10 rounded-[16px] px-5 py-4 text-[13px] font-medium text-slate-900 dark:text-white transition-all outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 shadow-sm'
const selectClasses =
  'appearance-none bg-white dark:bg-[#0b0f19] border border-slate-200/80 dark:border-white/10 rounded-[16px] px-5 py-4 w-full text-[13px] font-medium text-slate-900 dark:text-white outline-none cursor-pointer focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all shadow-sm'

export function TabPortfolio() {
  const [portfolios, setPortfolios] = useState<PortfolioItem[]>([])

  const addPortfolio = () => {
    setPortfolios([
      {
        id: Date.now(),
        type: 'Image',
        title: '',
        featuredImage: null,
        attachments: null,
        youtubeUrl: '',
        active: true,
        description: '',
      },
      ...portfolios,
    ])
  }

  const removePortfolio = (id: number) => {
    setPortfolios(portfolios.filter((p) => p.id !== id))
  }

  const updatePortfolio = (id: number, field: keyof PortfolioItem, value: PortfolioItem[keyof PortfolioItem]) => {
    setPortfolios((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)))
  }

  const FeatureImageInput = ({ portfolio }: { portfolio: PortfolioItem }) => {
    const fileRef = useRef<HTMLInputElement>(null)
    return (
      <div className="group flex flex-col space-y-1.5">
        <label className="flex items-center gap-2 pl-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase transition-colors group-focus-within:text-slate-500 dark:text-slate-400">
          <ImageIcon className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" /> Featured Image
        </label>
        <div className="group/input relative flex overflow-hidden rounded-[16px] border border-slate-200/80 shadow-sm transition-colors focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500 dark:border-white/10">
          <input
            type="file"
            className="hidden"
            ref={fileRef}
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) {
                updatePortfolio(portfolio.id, 'featuredImage', { url: URL.createObjectURL(file), name: file.name })
              }
            }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="cursor-pointer border-r border-slate-200/50 bg-slate-50 px-5 py-4 text-[13px] font-bold whitespace-nowrap text-slate-700 transition-colors group-hover/input:text-teal-600 hover:bg-slate-100 dark:border-white/5 dark:bg-white/2 dark:text-slate-200 dark:group-hover/input:text-teal-400 dark:hover:bg-white/5"
          >
            Choose File
          </button>
          <span className="flex w-full items-center truncate bg-white px-5 py-4 text-[13px] font-medium text-slate-500 dark:bg-[#0b0f19] dark:text-slate-400">
            {portfolio.featuredImage ? portfolio.featuredImage.name : 'No file chosen'}
          </span>
        </div>
      </div>
    )
  }

  const AttachmentsInput = ({ portfolio }: { portfolio: PortfolioItem }) => {
    const fileRef = useRef<HTMLInputElement>(null)
    return (
      <div className="group flex flex-col space-y-1.5">
        <label className="flex items-center gap-2 pl-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase transition-colors group-focus-within:text-slate-500 dark:text-slate-400">
          <LinkIcon className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" /> Attachments (Images/Video)
        </label>
        <div className="group/input relative flex overflow-hidden rounded-[16px] border border-slate-200/80 shadow-sm transition-colors focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500 dark:border-white/10">
          <input
            type="file"
            className="hidden"
            ref={fileRef}
            accept="image/*,video/*"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) {
                updatePortfolio(portfolio.id, 'attachments', { url: URL.createObjectURL(file), name: file.name })
              }
            }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="cursor-pointer border-r border-slate-200/50 bg-slate-50 px-5 py-4 text-[13px] font-bold whitespace-nowrap text-slate-700 transition-colors group-hover/input:text-teal-600 hover:bg-slate-100 dark:border-white/5 dark:bg-white/2 dark:text-slate-200 dark:group-hover/input:text-teal-400 dark:hover:bg-white/5"
          >
            Choose Files
          </button>
          <span className="flex w-full items-center truncate bg-white px-5 py-4 text-[13px] font-medium text-slate-500 dark:bg-[#0b0f19] dark:text-slate-400">
            {portfolio.attachments ? portfolio.attachments.name : 'No file chosen'}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-in fade-in mx-auto flex h-full w-full max-w-7xl flex-col pb-12 duration-500">
      <div className="mb-8 rounded-[24px] border border-teal-100 bg-teal-50/50 p-6 dark:border-teal-500/10 dark:bg-teal-500/2">
        <div className="mb-2 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-teal-100 bg-teal-50 dark:border-teal-500/20 dark:bg-teal-500/10">
              <LayoutGrid className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            </div>
            <h3 className="text-lg font-black text-teal-600 dark:text-teal-400">Portfolio Collection</h3>
          </div>
          <button
            onClick={addPortfolio}
            className="hidden items-center justify-center gap-2 rounded-[12px] bg-teal-600 px-5 py-2.5 text-sm font-bold whitespace-nowrap text-white shadow-sm transition-all hover:bg-teal-700 active:scale-95 sm:flex"
          >
            <Plus className="h-4 w-4" /> Add Portfolio
          </button>
        </div>
        <p className="mb-0 text-[14px] leading-relaxed font-medium text-slate-500 dark:text-slate-400">
          Showcase your best work and projects.
        </p>
        <button
          onClick={addPortfolio}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-[12px] bg-teal-600 px-5 py-3.5 text-[13px] font-bold text-white shadow-sm transition-all hover:bg-teal-700 active:scale-95 sm:hidden"
        >
          <Plus className="h-4 w-4" /> Add Portfolio
        </button>
      </div>

      <div className="flex flex-1 flex-col">
        {portfolios.length === 0 ? (
          <div className="rounded-[32px] border border-slate-200/50 bg-slate-50/50 p-12 text-center shadow-sm dark:border-white/5 dark:bg-white/2">
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
                className="group/card overflow-hidden rounded-[32px] border border-slate-200/50 bg-slate-50/50 shadow-sm transition-all hover:border-slate-200/80 hover:bg-slate-50 dark:border-white/5 dark:bg-white/2"
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
                    onClick={() => removePortfolio(portfolio.id)}
                    className="flex items-center gap-2 rounded-[12px] bg-red-50 px-4 py-2.5 font-bold text-red-500 transition-all hover:bg-red-100 hover:text-red-600 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
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
                    <FeatureImageInput portfolio={portfolio} />
                    <AttachmentsInput portfolio={portfolio} />
                  </div>

                  <div className="group mb-8 flex flex-col space-y-1.5">
                    <label className="flex items-center gap-2 pl-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase transition-colors group-focus-within:text-slate-500 dark:text-slate-400">
                      <Youtube className="h-3.5 w-3.5 text-red-500" /> YouTube Video URL
                    </label>
                    <input
                      type="text"
                      value={portfolio.youtubeUrl}
                      onChange={(e) => updatePortfolio(portfolio.id, 'youtubeUrl', e.target.value)}
                      placeholder="Enter YouTube video URL"
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
                          className={`relative h-[22px] w-[38px] rounded-[12px] shadow-inner transition-colors ${
                            portfolio.active ? 'bg-green-500' : 'bg-slate-200 dark:bg-white/10'
                          }`}
                        >
                          <div
                            className={`absolute top-[3px] left-[3px] h-4 w-4 rounded-[10px] bg-white shadow transition-transform ${
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
