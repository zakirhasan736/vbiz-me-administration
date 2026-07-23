'use client'

import { DEFAULT_DEMO_FAQS, getPublishedFaqs } from '@/lib/vcardFaq'
import { useProfileDisplay } from '@/profile-app/lib/profileDisplayContext'
import { ChevronDown, Lightbulb, MessageCircle, Search } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useState } from 'react'

type FAQSectionProps = {
  template?: 'v1' | 'v2'
}

export const FAQSection = ({ template: templateProp }: FAQSectionProps = {}) => {
  const { faqs, isVisible, design } = useProfileDisplay()
  const template = templateProp ?? (design?.profileTemplate === 'v1' ? 'v1' : 'v2')
  const accent = design?.accentColor ?? (template === 'v1' ? '#dcc969' : '#eab308')

  const published = useMemo(() => {
    const saved = getPublishedFaqs(faqs)
    return saved.length > 0 ? saved : DEFAULT_DEMO_FAQS
  }, [faqs])

  const [openIndex, setOpenIndex] = useState<number | null>(0)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredFaqs = published.filter((faq) => faq.question.toLowerCase().includes(searchQuery.toLowerCase()))

  if (!isVisible('Faq')) {
    return null
  }

  const isV1 = template === 'v1'
  const cardClass = isV1
    ? 'rounded-[2rem] border border-black/5 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-black/40'
    : 'rounded-[1.5rem] border border-zinc-200 bg-white/50 backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-900/50'

  return (
    <div className="w-full pb-20">
      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className={`group relative flex flex-col overflow-hidden p-8 lg:col-span-4 lg:p-10 ${cardClass}`}
        >
          <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-zinc-100/50 to-transparent dark:from-zinc-800/20" />
          <div
            className="pointer-events-none absolute top-0 right-0 -mt-32 -mr-32 rounded-full p-32 blur-3xl transition-transform duration-1000 group-hover:scale-110"
            style={{ backgroundColor: `${accent}18` }}
          />

          <div className="relative z-10 mb-8 w-full">
            <div className="mb-6 inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-100 px-3 py-1.5 text-[10px] font-bold tracking-wider text-zinc-600 uppercase shadow-sm backdrop-blur-sm dark:border-zinc-700/50 dark:bg-zinc-800/80 dark:text-zinc-300">
              <MessageCircle size={12} style={{ color: accent }} /> Support & Knowledge Base
            </div>

            <h2
              className={`mb-4 max-w-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 ${isV1 ? 'text-3xl sm:text-4xl lg:text-[2.75rem]' : 'text-3xl sm:text-4xl lg:text-5xl'} leading-[1.1]`}
            >
              Frequently Asked{' '}
              <span className="font-medium italic" style={{ color: accent }}>
                Questions
              </span>
            </h2>
            <p className="max-w-xl text-base leading-relaxed font-medium text-zinc-600 dark:text-zinc-400">
              {faqs.length > 0
                ? 'Answers to common questions about working with us.'
                : 'Everything you need to know about vBiz Me and how our digital business cards can transform your networking.'}
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative z-10 w-full border-t border-zinc-200 pt-6 md:w-1/2 dark:border-zinc-800/80"
          >
            <div className="group relative">
              <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-zinc-400 transition-colors group-focus-within:text-zinc-900 dark:text-zinc-500 dark:group-focus-within:text-zinc-300" />
              <input
                type="text"
                placeholder="Search FAQ's..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-3 pr-4 pl-11 text-xs font-medium text-zinc-900 shadow-sm transition-all placeholder:text-zinc-500 hover:border-zinc-300 hover:bg-zinc-100 focus:border-zinc-300 focus:bg-white focus:outline-none lg:text-sm dark:border-zinc-800/80 dark:bg-zinc-950/50 dark:text-zinc-100 dark:hover:border-zinc-700/80 dark:hover:bg-zinc-800/50 dark:focus:border-zinc-700 dark:focus:bg-zinc-800/50"
              />
            </div>
          </motion.div>
        </motion.div>
      </div>

      <div className="relative z-20 mt-4 flex flex-col gap-4">
        {filteredFaqs.length > 0 ? (
          <AnimatePresence>
            {filteredFaqs.map((faq, index) => {
              const originalIndex = published.findIndex((f) => f.id === faq.id)
              const isOpen = openIndex === originalIndex
              return (
                <motion.div
                  key={faq.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className={`group relative overflow-hidden shadow-sm transition-all duration-500 ${cardClass} ${isOpen ? 'border-zinc-300/80 bg-zinc-100/30 dark:border-zinc-700/80 dark:bg-zinc-800/30' : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/80'}`}
                >
                  {isOpen && <div className="absolute top-0 left-0 h-full w-1.5" style={{ backgroundColor: accent }} />}
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : originalIndex)}
                    className="relative z-10 flex w-full cursor-pointer items-center justify-between p-6 text-left focus:outline-none lg:p-8"
                  >
                    <h4
                      className={`pr-8 text-base font-bold transition-colors duration-300 md:text-lg ${isOpen ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-600 group-hover:text-zinc-900 dark:text-zinc-300 dark:group-hover:text-zinc-100'}`}
                    >
                      {faq.question}
                    </h4>
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${isOpen ? 'rotate-180 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950' : 'border border-zinc-200 bg-zinc-100 text-zinc-500 group-hover:bg-white group-hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:group-hover:bg-zinc-100 dark:group-hover:text-zinc-950'}`}
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
                        className="relative z-10"
                      >
                        <div className="mt-2 border-t border-zinc-200 px-6 pt-0 pb-8 text-sm leading-relaxed font-medium text-zinc-600 md:text-base lg:px-8 dark:border-zinc-800/50 dark:text-zinc-400">
                          <div className="pt-6 whitespace-pre-wrap">{faq.answer}</div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </AnimatePresence>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`col-span-full flex flex-col items-center justify-center p-12 text-center ${cardClass}`}
          >
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 dark:bg-zinc-800">
              <Lightbulb size={28} style={{ color: accent }} />
            </div>
            <h4 className="mb-2 text-xl font-bold text-zinc-900 dark:text-zinc-100">No answers found</h4>
            <p className="max-w-sm font-medium text-zinc-500">
              {`We couldn't find any FAQs matching your search term. Try another word or contact support.`}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
