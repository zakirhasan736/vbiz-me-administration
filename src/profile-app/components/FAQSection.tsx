'use client'

import { useProfileDisplay } from '@/profile-app/lib/profileDisplayContext'
import { V3EmptyState, V3ErrorState, V3LoadingSkeleton, V3SectionShell } from '@/profile-app/sections'
import { useGetDynamicSectionQuery } from '@/redux/api'
import { ChevronDown, HelpCircle, MessageCircle, RotateCcw, Search } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'

type FaqItem = {
  id: number
  question: string
  answer: string
}

type FAQSectionProps = {
  sectionName?: string
}

export const FAQSection = ({ sectionName = 'Faq' }: FAQSectionProps) => {
  const { cardOwnerId } = useProfileDisplay()
  const profileId = cardOwnerId?.trim() ?? ''
  const resolvedSectionName = sectionName.trim() || 'Faq'

  const { data, isLoading, isError } = useGetDynamicSectionQuery(
    { profileId, sectionName: resolvedSectionName },
    { skip: !profileId || !resolvedSectionName }
  )

  const faqs = useMemo<FaqItem[]>(() => {
    return [...(data?.posts ?? [])]
      .reverse()
      .filter((item) => item.title.trim().length > 0 && item.description.trim().length > 0)
      .map((item) => ({
        id: item.id,
        question: item.title,
        answer: item.description,
      }))
  }, [data?.posts])

  const [openIndex, setOpenIndex] = useState<number | null>(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const filteredFaqs = faqs.filter((faq) => faq.question.toLowerCase().includes(searchQuery.toLowerCase()))

  const sectionTitle = data?.sectionTitle ?? 'FAQ'
  const showInitialLoader = isLoading && faqs.length === 0
  const showEmptyState = !isLoading && !isError && faqs.length === 0

  if (!profileId) return null

  if (showInitialLoader) {
    return <V3LoadingSkeleton className="min-h-[280px]" />
  }

  if (isError) {
    return <V3ErrorState sectionTitle={sectionTitle} />
  }

  if (showEmptyState) {
    return (
      <V3EmptyState
        icon={HelpCircle}
        title={sectionTitle}
        message="Add questions and answers from the vCard editor FAQ tab to show them here."
      />
    )
  }

  const cardClass =
    'rounded-4xl border border-zinc-200 dark:border-zinc-800/80 bg-white/50 dark:bg-[#031327]/80 backdrop-blur-xl'

  return (
    <V3SectionShell className="overflow-hidden select-none">
      {isMobile ? (
        <div className="flex flex-col gap-3">
          <div className={`${cardClass} p-5 shadow-sm`}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-1.5 text-base font-black text-zinc-900 dark:text-zinc-100">
                <HelpCircle size={16} className="text-gold" /> {sectionTitle}
              </h3>
              <span className="text-gold bg-gold/10 rounded-full px-2 py-0.5 text-[9px] font-black tracking-widest uppercase">
                {filteredFaqs.length} Answers
              </span>
            </div>

            <div className="relative mb-3">
              <Search className="absolute top-1/2 left-3.5 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="focus:border-gold w-full rounded-xl border border-zinc-200/80 bg-zinc-100 py-2.5 pr-4 pl-9 text-xs font-semibold text-zinc-900 placeholder:text-zinc-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
              />
            </div>
          </div>

          {filteredFaqs.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-4xl border border-zinc-200 bg-white/40 p-8 text-center backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/20">
              <MessageCircle size={22} className="text-gold mb-3" />
              <h4 className="mb-1 text-sm font-bold text-zinc-900 dark:text-zinc-100">No matches found</h4>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('')
                  setOpenIndex(0)
                }}
                className="bg-gold mt-3 inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-[10px] font-bold text-zinc-950"
              >
                <RotateCcw size={12} /> Reset
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filteredFaqs.map((faq, index) => {
                const isOpen = openIndex === index
                return (
                  <motion.div
                    key={faq.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: index * 0.02 }}
                    className={`relative overflow-hidden rounded-2xl border transition-all duration-300 ${
                      isOpen
                        ? 'border-gold scale-[1.01] bg-zinc-50/80 shadow-md dark:bg-zinc-900/90'
                        : 'border-zinc-200 bg-white/40 opacity-80 dark:border-zinc-800 dark:bg-zinc-950/20'
                    }`}
                  >
                    {isOpen && <div className="bg-gold absolute top-0 bottom-0 left-0 w-1" />}
                    <button
                      type="button"
                      onClick={() => setOpenIndex(isOpen ? null : index)}
                      className="flex w-full items-center justify-between p-4 pr-5 text-left focus:outline-none"
                    >
                      <h4
                        className={`pr-3 text-xs leading-tight font-black ${isOpen ? 'text-zinc-950 dark:text-white' : 'text-zinc-700 dark:text-zinc-200'}`}
                      >
                        {faq.question}
                      </h4>
                      <div
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg transition-all ${isOpen ? 'rotate-180 bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950' : 'dark:bg-zinc-850 bg-zinc-100 text-zinc-500'}`}
                      >
                        <ChevronDown size={12} strokeWidth={2.5} />
                      </div>
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                        >
                          <div
                            className="prose prose-sm dark:prose-invert max-w-none border-t border-zinc-100 px-4 pt-1 pb-4 text-[11px] leading-relaxed font-medium text-zinc-700 sm:text-xs dark:border-zinc-800/40 dark:text-zinc-200 [&_*]:!text-[inherit]"
                            dangerouslySetInnerHTML={{ __html: faq.answer }}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col">
          <div className={`group relative mb-4 overflow-hidden p-5 md:mb-4 md:p-6 lg:p-8 ${cardClass}`}>
            <div className="bg-gold/10 pointer-events-none absolute top-0 right-0 -mt-32 -mr-32 rounded-full p-32 blur-3xl transition-transform duration-1000 group-hover:scale-110" />
            <div className="relative z-10">
              <div className="vbiz-eyebrow mb-2">
                <MessageCircle size={12} /> {sectionTitle}
              </div>
              <h2 className="mb-2 text-2xl leading-[1.1] font-black tracking-tight text-zinc-900 sm:text-4xl lg:text-4xl dark:text-zinc-100">
                Frequently Asked{' '}
                <span className="from-gold bg-linear-to-r to-yellow-500 bg-clip-text text-transparent italic">
                  Questions
                </span>
              </h2>
              <div className="relative max-w-md">
                <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search questions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="focus:border-gold w-full rounded-xl border border-zinc-200 bg-zinc-100 py-3 pr-4 pl-11 text-sm font-semibold text-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {filteredFaqs.map((faq, index) => {
              const isOpen = openIndex === index
              return (
                <motion.div
                  key={faq.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className={`group relative overflow-hidden shadow-sm transition-all duration-500 ${cardClass} ${
                    isOpen ? 'border-gold/40 bg-zinc-100/30 dark:bg-zinc-800/30' : 'hover:border-gold/20'
                  }`}
                >
                  {isOpen && <div className="bg-gold absolute top-0 left-0 h-full w-1.5" />}
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="relative z-10 flex w-full cursor-pointer items-center justify-between p-6 text-left focus:outline-none lg:p-8"
                  >
                    <h4
                      className={`pr-8 text-base font-bold transition-colors md:text-lg ${isOpen ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-600 dark:text-zinc-200'}`}
                    >
                      {faq.question}
                    </h4>
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${isOpen ? 'rotate-180 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950' : 'border border-zinc-200 bg-zinc-100 text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800'}`}
                    >
                      <ChevronDown size={18} strokeWidth={2.5} />
                    </div>
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <div
                          className="prose prose-sm dark:prose-invert max-w-none border-t border-zinc-200 px-6 pt-6 pb-8 text-sm leading-relaxed font-medium text-zinc-700 md:text-base lg:px-8 dark:border-zinc-800/50 dark:text-zinc-200 [&_*]:!text-[inherit]"
                          dangerouslySetInnerHTML={{ __html: faq.answer }}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}
    </V3SectionShell>
  )
}
