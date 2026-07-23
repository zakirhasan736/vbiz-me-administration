import { ChevronRight, Clock, Film, Mic, Play, Sparkles, Video } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import Image from 'next/image'
import { useState } from 'react'
import { useDragScroll } from '../hooks/useDragScroll'

const videos = [
  {
    id: 1,
    title: 'Ohio College Podcast',
    subtitle: 'Guest Appearance',
    category: 'Podcasts',
    length: '45:20',
    image: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=80&w=800&fit=crop',
    description:
      'Discussing the future of digital networking and business identity in the modern collegiate landscape.',
  },
  {
    id: 2,
    title: 'vBiz Me Commercial 1',
    subtitle: 'Brand Story',
    category: 'Commercials',
    length: '1:30',
    image: 'https://images.unsplash.com/photo-1573164713988-8665fc963095?q=80&w=800&fit=crop',
    description:
      "A cinematic journey through the inspiration behind vBiz Me and how we're changing professional connections.",
  },
  {
    id: 3,
    title: 'Invisible Advantage',
    subtitle: 'Product Deep Dive',
    category: 'Features',
    length: '5:00',
    image: 'https://images.unsplash.com/photo-1616469829581-73993eb86b02?q=80&w=800&fit=crop',
    description:
      'An in-depth look at the advanced technology and security features that power our digital infrastructure.',
  },
  {
    id: 4,
    title: 'vBiz Me Phone Commercial',
    subtitle: 'Mobile Experience',
    category: 'Commercials',
    length: '0:45',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&fit=crop',
    description: 'Experience the seamless integration of digital business cards directly on your smartphone.',
  },
  {
    id: 5,
    title: 'Entrepreneur Insight',
    subtitle: 'Expert Interview',
    category: 'Podcasts',
    length: '28:15',
    image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=800&fit=crop',
    description:
      'Sharing the entrepreneurial journey and the pivot points that led to the creation of the vBiz Me ecosystem.',
  },
  {
    id: 6,
    title: 'Networking 2.0',
    subtitle: 'Strategy Session',
    category: 'Features',
    length: '12:40',
    image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=800&fit=crop',
    description: 'How to leverage digital cards to build a more impactful personal brand in a crowded market.',
  },
]

const categories = ['All', 'Commercials', 'Podcasts', 'Features']

export const VideoLinksSection = () => {
  const [activeTab, setActiveTab] = useState('All')
  const scrollRef = useDragScroll<HTMLDivElement>()

  const filteredVideos = activeTab === 'All' ? videos : videos.filter((v) => v.category === activeTab)

  return (
    <div className="w-full pb-20">
      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-4">
        {/* Header Card */}
        <div className="group relative flex flex-col items-start justify-between gap-6 overflow-hidden rounded-3xl border border-zinc-200 bg-white/50 p-8 backdrop-blur-xl md:flex-row md:items-end md:gap-0 lg:col-span-4 lg:p-10 dark:border-zinc-800/80 dark:bg-zinc-900/50">
          <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-zinc-100/50 to-transparent dark:from-zinc-800/20" />

          <div className="pointer-events-none absolute top-0 right-0 -mt-32 -mr-32 rounded-full bg-[#eab308]/10 p-32 blur-3xl transition-transform duration-1000 group-hover:scale-110 dark:bg-[#eab308]/5" />
          <div className="pointer-events-none absolute bottom-0 left-0 -mb-24 -ml-24 rounded-full bg-black/5 p-24 blur-3xl transition-transform delay-100 duration-1000 group-hover:scale-110 dark:bg-white/5" />

          <div className="relative z-10 w-full md:w-auto">
            <div className="mb-6 inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-100 px-3 py-1.5 text-[10px] font-bold tracking-wider text-zinc-600 uppercase shadow-sm backdrop-blur-sm transition-colors dark:border-zinc-700/50 dark:bg-zinc-800/80 dark:text-zinc-300">
              <Video size={12} className="text-[#eab308]" /> Video Showcase
            </div>

            <h2 className="mb-4 max-w-2xl text-3xl leading-[1.1] font-bold tracking-tight text-zinc-900 sm:text-4xl lg:text-5xl dark:text-zinc-100">
              Our <span className="font-medium text-[#eab308] italic">Media</span> Library
            </h2>
            <p className="max-w-xl text-base leading-relaxed font-medium text-zinc-600 dark:text-zinc-400">
              Explore podcasts, commercials, and feature deep dives about vBiz Me.
            </p>
          </div>

          {/* Modern Filter Tabs inside the header card */}
          <div className="relative z-10 flex w-full shrink-0 md:w-auto">
            <div
              ref={scrollRef}
              className="no-scrollbar mask-edges inline-flex max-w-full cursor-grab items-center gap-1.5 overflow-x-auto rounded-2xl border border-zinc-200 bg-zinc-50 p-1.5 shadow-inner active:cursor-grabbing dark:border-zinc-800/80 dark:bg-zinc-950/50"
            >
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveTab(category)}
                  className={`relative z-10 flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all duration-300 ${activeTab === category ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-100 dark:text-zinc-950' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-200'}`}
                >
                  {category === 'Podcasts' && (
                    <Mic
                      size={14}
                      className={activeTab === category ? 'text-zinc-900 dark:text-zinc-950' : 'text-zinc-500'}
                    />
                  )}
                  {category === 'Commercials' && (
                    <Film
                      size={14}
                      className={activeTab === category ? 'text-zinc-900 dark:text-zinc-950' : 'text-zinc-500'}
                    />
                  )}
                  {category === 'Features' && (
                    <Sparkles
                      size={14}
                      className={activeTab === category ? 'text-zinc-900 dark:text-zinc-950' : 'text-zinc-500'}
                    />
                  )}
                  <span className="relative z-10">{category}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Video Grid */}
      <motion.div
        layout
        className="vbiz-bento-grid relative z-20 grid min-h-0 grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
      >
        <AnimatePresence mode="popLayout">
          {filteredVideos.map((vid) => (
            <motion.div
              layout
              key={vid.id}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
              transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
              className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white/50 shadow-sm backdrop-blur-xl transition-colors duration-300 hover:bg-white/80 dark:border-zinc-800/80 dark:bg-zinc-900/50 dark:hover:bg-zinc-900/80"
            >
              {/* Thumbnail Area */}
              <div className="relative m-2 aspect-video shrink-0 overflow-hidden rounded-t-[1.25rem] rounded-b-xl border border-zinc-800/50 bg-black">
                <div className="absolute inset-0 z-10 bg-linear-to-t from-zinc-900 via-transparent to-transparent" />

                {/* Category Chip */}
                <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-950/80 px-2.5 py-1 shadow-sm backdrop-blur-md">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#eab308]" />
                  <span className="text-[10px] font-bold tracking-wider text-zinc-100 uppercase">{vid.category}</span>
                </div>

                {/* Play Button */}
                <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
                  <div className="pointer-events-auto flex h-16 w-16 transform cursor-pointer items-center justify-center rounded-2xl bg-zinc-100/90 text-zinc-950 shadow-lg backdrop-blur-md transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-110">
                    <Play size={24} fill="currentColor" className="ml-1" />
                  </div>
                </div>

                <Image
                  width={100}
                  height={100}
                  src={vid.image}
                  alt={vid.title}
                  className="absolute inset-0 h-full w-full object-cover opacity-60 grayscale-30 transition-all duration-700 group-hover:scale-105 group-hover:opacity-80 group-hover:grayscale-0"
                />

                {/* Duration Pill */}
                <div className="absolute right-4 bottom-4 z-20 flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-950/80 px-2.5 py-1 shadow-sm backdrop-blur-md">
                  <Clock size={12} className="text-zinc-400" />
                  <p className="font-mono text-[10px] font-medium text-zinc-100 md:text-xs">{vid.length}</p>
                </div>
              </div>

              {/* Content Area */}
              <div className="relative z-10 flex flex-1 flex-col bg-transparent p-6">
                <h4 className="mb-2 line-clamp-1 text-lg leading-tight font-bold tracking-tight text-zinc-900 transition-colors group-hover:text-black md:text-xl dark:text-zinc-100 dark:group-hover:text-white">
                  {vid.title}
                </h4>
                <p className="mb-6 line-clamp-2 text-sm leading-relaxed font-medium text-zinc-600 transition-colors group-hover:text-zinc-900 md:line-clamp-3 dark:text-zinc-400 dark:group-hover:text-zinc-300">
                  {vid.description}
                </p>

                <div className="mt-auto flex items-center justify-between border-t border-zinc-200 pt-5 dark:border-zinc-800/80">
                  <div className="flex flex-col">
                    <span className="mb-0.5 text-[10px] font-bold tracking-wider text-zinc-500 uppercase">
                      Session Type
                    </span>
                    <span className="text-xs font-bold text-[#eab308]">{vid.subtitle}</span>
                  </div>

                  <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-100 shadow-sm transition-colors duration-300 group-hover:bg-zinc-900 group-hover:text-white dark:border-zinc-700 dark:bg-zinc-800 dark:group-hover:bg-zinc-100 dark:group-hover:text-zinc-950">
                    <ChevronRight
                      size={18}
                      className="text-zinc-500 transition-colors group-hover:text-white dark:text-zinc-400 dark:group-hover:text-zinc-950"
                    />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
