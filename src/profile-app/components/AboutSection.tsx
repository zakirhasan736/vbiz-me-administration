import { ArrowRight, Award, BookOpen, LifeBuoy, Quote, Rocket, Target } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import Image from 'next/image'
import { useState } from 'react'

export const AboutSection = () => {
  const [showConfirmation, setShowConfirmation] = useState(false)

  const handleContactSupport = () => {
    setShowConfirmation(true)
    setTimeout(() => {
      setShowConfirmation(false)
    }, 3000)
  }

  return (
    <div className="vbiz-bento-grid grid w-full grid-cols-1 gap-4 pb-20 md:grid-cols-3 lg:grid-cols-4">
      {/* Bio / Intro Card - Takes up 3 cols on desktop */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-zinc-200 bg-white/50 p-8 backdrop-blur-xl md:col-span-3 lg:col-span-3 lg:p-10 dark:border-zinc-800/80 dark:bg-zinc-900/50"
      >
        <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-zinc-100/50 to-transparent dark:from-zinc-800/20" />

        {/* Abstract Background Elements */}
        <div className="pointer-events-none absolute top-0 right-0 -mt-32 -mr-32 rounded-full bg-[#eab308]/10 p-32 blur-3xl transition-transform duration-1000 group-hover:scale-110 dark:bg-[#eab308]/5" />
        <div className="pointer-events-none absolute bottom-0 left-0 -mb-24 -ml-24 rounded-full bg-black/5 p-24 blur-3xl transition-transform delay-100 duration-1000 group-hover:scale-110 dark:bg-white/5" />

        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-8 inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white/80 px-3 py-1.5 text-[10px] font-bold tracking-wider text-zinc-600 uppercase shadow-sm backdrop-blur-sm transition-colors dark:border-zinc-700/50 dark:bg-zinc-800/80 dark:text-zinc-300"
          >
            <BookOpen size={12} className="text-[#eab308]" /> Origin Story
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-6 max-w-2xl text-3xl leading-[1.1] font-bold tracking-tight text-zinc-900 sm:text-4xl lg:text-5xl dark:text-zinc-100"
          >
            Innovator.<span className="mx-2 font-medium text-zinc-400 italic dark:text-zinc-500">—</span>Builder.
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="relative"
          >
            <Quote size={40} className="absolute -top-4 -left-4 -rotate-12 text-zinc-200 dark:text-zinc-800/50" />
            <p className="relative z-10 mb-4 max-w-2xl px-4 text-base leading-relaxed font-medium text-zinc-600 lg:text-lg dark:text-zinc-400">
              I turned obstacles into tools. Now, I build machines that make lasting impressions in seconds.{' '}
              <span className="text-zinc-900 dark:text-zinc-200">vBiz Me is more than a digital card.</span>{' '}
              {`It's a first-impression machine and a powerful conversion tool.`}
            </p>
            <p className="relative z-10 mb-10 max-w-2xl px-4 text-sm leading-relaxed font-medium text-zinc-500 lg:text-base">
              {`I wasn't handed anything—I built myself through hardship, and I use those lessons to help others break the mold and get remembered.`}
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="relative z-10 mt-auto flex w-full flex-wrap items-center gap-4"
        >
          <div className="relative inline-flex w-full items-center sm:w-auto">
            <button
              onClick={handleContactSupport}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-8 py-4 text-sm font-bold text-white shadow-lg transition-all hover:bg-zinc-800 hover:shadow-[0_0_20px_rgba(0,0,0,0.1)] active:scale-95 sm:w-auto dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white dark:hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]"
            >
              <LifeBuoy size={18} /> Contact Support
            </button>
            <AnimatePresence>
              {showConfirmation && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute left-full ml-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5 text-xs font-bold whitespace-nowrap text-emerald-600 dark:text-emerald-500"
                >
                  Message Sent!
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>

      {/* Primary Image / Highlight Square */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
        className="group relative flex min-h-[300px] flex-col justify-end overflow-hidden rounded-3xl border border-zinc-200 bg-white p-4 transition-all duration-500 hover:border-zinc-300 md:col-span-3 lg:col-span-1 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
      >
        <div className="pointer-events-none absolute inset-0 z-10 bg-linear-to-t from-white via-white/40 to-transparent dark:from-zinc-950 dark:via-zinc-900/40" />
        <Image
          src="https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=800&fit=crop"
          alt="Michaelangelo"
          className="absolute inset-0 h-full w-full object-cover opacity-60 transition-all duration-[2s] group-hover:scale-105 group-hover:opacity-80"
          width={800}
          height={800}
        />

        <div className="relative z-20 mt-auto mb-2 w-full px-2">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#eab308]/30 bg-[#eab308]/20 text-[#eab308] shadow-lg backdrop-blur-md transition-transform duration-300 group-hover:-translate-y-1">
              <Award size={20} />
            </div>
            <div>
              <p className="text-base leading-tight font-bold text-zinc-900 dark:text-zinc-100">Professional</p>
              <p className="text-xs font-semibold tracking-wide text-[#eab308] uppercase">Journey</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Bottom Grid: Stats / Key Pillars */}
      {[
        { icon: Target, title: 'Visionary', desc: 'Solutions that break the mold', accent: 'from-[#eab308]/20' },
        {
          icon: Award,
          title: 'Strategist',
          desc: 'Turning attention into action',
          accent: 'from-zinc-900/10 dark:from-zinc-100/20',
        },
        { icon: Rocket, title: 'Coach', desc: 'Helping people level up fast', accent: 'from-blue-500/20' },
      ].map((item, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6, delay: 0.2 + idx * 0.1, ease: 'easeOut' }}
          className="group relative flex flex-col gap-4 overflow-hidden rounded-[1.5rem] border border-zinc-200 bg-white/50 p-6 backdrop-blur-xl transition-colors duration-500 hover:bg-white/80 md:col-span-1 lg:col-span-1 dark:border-zinc-800/80 dark:bg-zinc-900/50 dark:hover:bg-zinc-900/80"
        >
          <div
            className={`absolute top-0 left-0 h-full w-full bg-gradient-to-br ${item.accent} pointer-events-none to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-10 dark:group-hover:opacity-10`}
          />
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-100 text-zinc-600 shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:bg-zinc-900 group-hover:text-white group-hover:shadow-lg dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-100 dark:group-hover:bg-zinc-100 dark:group-hover:text-zinc-950">
            <item.icon size={20} />
          </div>
          <div>
            <h4 className="mb-1 text-lg font-bold text-zinc-900 dark:text-zinc-100">{item.title}</h4>
            <p className="text-sm leading-relaxed font-medium text-zinc-600 transition-colors group-hover:text-zinc-900 dark:text-zinc-400 dark:group-hover:text-zinc-300">
              {item.desc}
            </p>
          </div>
        </motion.div>
      ))}

      {/* Empty spacer / filler for 4th col to keep layout even if needed */}
      <div className="group relative hidden cursor-default flex-col items-center justify-center overflow-hidden rounded-[1.5rem] border border-dashed border-zinc-200 bg-zinc-100/50 p-6 text-center opacity-50 backdrop-blur-xl transition-all duration-500 hover:border-[#eab308]/50 hover:opacity-100 lg:col-span-1 lg:flex dark:border-zinc-800/50 dark:bg-zinc-900/30">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-200 text-zinc-500 transition-all duration-500 group-hover:rotate-12 group-hover:bg-[#eab308]/10 group-hover:text-[#eab308] dark:bg-zinc-800/50">
          <ArrowRight size={20} />
        </div>
        <p className="text-xs font-bold tracking-widest text-zinc-500 uppercase group-hover:text-[#eab308]">
          Explore More
        </p>
      </div>
    </div>
  )
}
