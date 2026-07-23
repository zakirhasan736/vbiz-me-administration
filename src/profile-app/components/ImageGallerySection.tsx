import { Briefcase, Camera, Image as ImageIcon, Link as LinkIcon, Phone, Save, Share2 } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import Image from 'next/image'
import { useState } from 'react'
import { useDragScroll } from '../hooks/useDragScroll'

const ImageWithPlaceholder = ({ src, alt, className }: { src: string; alt: string; className?: string }) => {
  const [isLoaded, setIsLoaded] = useState(false)

  return (
    <div className={`relative ${className} overflow-hidden`}>
      <AnimatePresence>
        {!isLoaded && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 z-10 flex items-center justify-center overflow-hidden bg-white/5 backdrop-blur-xl"
          >
            <div className="absolute inset-0 animate-pulse bg-linear-to-tr from-white/5 to-transparent" />
            <ImageIcon size={32} className="text-white/20" />
          </motion.div>
        )}
      </AnimatePresence>
      <Image
        width={100}
        height={100}
        src={src}
        alt={alt}
        onLoad={() => setIsLoaded(true)}
        className={`h-full w-full object-cover transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  )
}

const galleryItems = [
  {
    name: 'Wil Jacques',
    title: 'Patent Attorney',
    category: 'Legal',
    image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=400&fit=crop',
    brand: 'emanus',
    theme: 'bg-zinc-950',
    textClass: 'text-zinc-100',
    socials: 'white',
    btnColor: 'bg-zinc-100 text-zinc-950 hover:bg-white',
  },
  {
    name: 'Chago Vargas',
    title: 'Electrician (E1)',
    subtitle: 'Making Power Moves Electric',
    category: 'Trades',
    image: 'https://images.unsplash.com/photo-1618077360395-f3068be8e001?q=80&w=400&fit=crop',
    brand: 'mpm',
    theme: 'bg-zinc-900 border border-zinc-800',
    textClass: 'text-zinc-100',
    socials: 'white',
    btnColor: 'bg-zinc-100 text-zinc-950 hover:bg-white',
  },
  {
    name: 'PIOTR CHUDZ',
    title: 'Travel Agent',
    subtitle: 'Travel You Will Love',
    category: 'Travel',
    image: 'https://images.unsplash.com/photo-1553313264-d6263f350c38?q=80&w=400&fit=crop',
    brand: 'VELX',
    theme: 'bg-zinc-900 border border-zinc-800',
    textClass: 'text-zinc-100',
    socials: 'white',
    btnColor: 'bg-zinc-100 text-zinc-950 hover:bg-white',
  },
  {
    name: 'Timothy Hennessey',
    title: 'Owner',
    category: 'Business',
    image: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=400&fit=crop',
    brand: 'XMAS',
    theme: 'bg-zinc-950 relative overflow-hidden',
    textClass: 'text-zinc-100',
    socials: 'white',
    btnColor: 'bg-zinc-100 text-zinc-950 hover:bg-white',
  },
  {
    name: 'Kedar Ismail',
    title: 'You Call We Fight',
    category: 'Legal',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&fit=crop',
    brand: 'LAW',
    theme: 'bg-zinc-950',
    textClass: 'text-zinc-100',
    socials: 'white',
    btnColor: 'bg-zinc-100 text-zinc-950 hover:bg-white',
  },
  {
    name: 'Nadine Nicola Green',
    title: 'LCSW',
    category: 'Health',
    image: 'https://images.unsplash.com/photo-1531123897727-8f129e1bf98c?q=80&w=400&fit=crop',
    brand: 'Nadine',
    theme: 'bg-zinc-900 border border-zinc-800',
    textClass: 'text-zinc-100',
    socials: 'white',
    btnColor: 'bg-zinc-100 text-zinc-950 hover:bg-white',
  },
]

export const ImageGallerySection = () => {
  const [activeTab, setActiveTab] = useState('All')
  const scrollRef = useDragScroll<HTMLDivElement>()
  const categories = ['All', 'Legal', 'Trades', 'Business', 'Travel', 'Health']

  const filteredItems = activeTab === 'All' ? galleryItems : galleryItems.filter((item) => item.category === activeTab)

  return (
    <div className="w-full pb-20">
      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-4">
        {/* Header Card */}
        <div className="group relative flex flex-col items-start justify-between gap-6 overflow-hidden rounded-3xl border border-zinc-200 bg-white/50 p-8 backdrop-blur-xl md:flex-row md:items-end md:gap-0 lg:col-span-4 lg:p-10 dark:border-zinc-800/80 dark:bg-zinc-900/50">
          <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-zinc-100/50 to-transparent dark:from-zinc-800/20" />

          <div className="bg-yellow-primary/10 dark:bg-yellow-primary/5 pointer-events-none absolute top-0 right-0 -mt-32 -mr-32 rounded-full p-32 blur-3xl transition-transform duration-1000 group-hover:scale-110" />
          <div className="pointer-events-none absolute bottom-0 left-0 -mb-24 -ml-24 rounded-full bg-black/5 p-24 blur-3xl transition-transform delay-100 duration-1000 group-hover:scale-110 dark:bg-white/5" />

          <div className="relative z-10 w-full md:w-auto">
            <div className="mb-6 inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-100 px-3 py-1.5 text-[10px] font-bold tracking-wider text-zinc-600 uppercase shadow-sm backdrop-blur-sm transition-colors dark:border-zinc-700/50 dark:bg-zinc-800/80 dark:text-zinc-300">
              <Camera size={12} className="text-yellow-primary" /> Image Vault
            </div>

            <h2 className="mb-4 max-w-2xl text-3xl leading-[1.1] font-bold tracking-tight text-zinc-900 sm:text-4xl lg:text-5xl dark:text-zinc-100">
              Featured <span className="text-yellow-primary font-medium italic">Designs</span>
            </h2>
            <p className="max-w-xl text-base leading-relaxed font-medium text-zinc-600 dark:text-zinc-400">
              Browse our curated selection of premium digital business cards, meticulously tailored for industry
              leaders.
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
                  <span className="relative z-10">{category}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <motion.div
        layout
        className="vbiz-bento-grid relative z-20 grid w-full grid-cols-1 justify-items-center gap-6 pt-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        <AnimatePresence mode="popLayout">
          {filteredItems.map((item) => (
            <motion.div
              layout
              key={item.name}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
              transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
              className="flex w-full items-center justify-center"
            >
              <div className="group relative flex aspect-9/19.5 w-full max-w-[300px] transform flex-col items-center rounded-4xl border border-zinc-800/80 bg-zinc-900 p-2 shadow-sm transition-transform duration-500 hover:-translate-y-2">
                {/* Phone screen container */}
                <div className={`relative h-full w-full overflow-hidden rounded-3xl ${item.theme}`}>
                  {/* Dynamic Island */}
                  <div className="absolute top-2.5 left-1/2 z-50 h-5 w-20 -translate-x-1/2 rounded-full border border-zinc-800/50 bg-black shadow-sm" />

                  {/* Content */}
                  <div className="relative z-10 flex h-full flex-col bg-black/20 px-5 pt-14 pb-6">
                    {/* Avatar */}
                    <div className="relative mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 shadow-sm transition-transform duration-500 group-hover:scale-105">
                      <ImageWithPlaceholder
                        src={item.image}
                        alt={item.name}
                        className="h-[96%] w-[96%] rounded-full object-cover"
                      />

                      {/* Status dot */}
                      <div className="absolute right-1 bottom-1 h-3.5 w-3.5 rounded-full border-2 border-zinc-900 bg-zinc-400" />
                    </div>

                    {/* Info */}
                    <div className="mb-6 text-center">
                      <h4 className="text-lg leading-tight font-bold tracking-tight text-zinc-100">{item.name}</h4>
                      <p className={`mt-1 text-[10px] font-bold uppercase ${item.textClass} tracking-wider`}>
                        {item.title}
                      </p>
                      {item.subtitle && (
                        <p className="mx-auto mt-1.5 max-w-[200px] text-[10px] leading-relaxed text-zinc-400">
                          {item.subtitle}
                        </p>
                      )}
                    </div>

                    {/* Socials / Actions Row */}
                    <div className="mb-8 flex justify-center gap-2.5">
                      {[Briefcase, Phone, LinkIcon, Share2].map((Icon, i) => (
                        <div
                          key={i}
                          className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 text-zinc-300"
                        >
                          <Icon size={14} strokeWidth={2} />
                        </div>
                      ))}
                    </div>

                    {/* Brand Logo / Accent */}
                    <div className="flex flex-1 items-center justify-center opacity-50">
                      {item.brand === 'emanus' && (
                        <div className="text-2xl font-bold tracking-tight text-zinc-300">emanus</div>
                      )}
                      {item.brand === 'mpm' && (
                        <div className="text-2xl font-bold tracking-tight text-zinc-300">mpm</div>
                      )}
                      {item.brand === 'VELX' && (
                        <div className="text-2xl font-bold tracking-tight text-zinc-300">VELX</div>
                      )}
                      {['XMAS', 'LAW', 'Nadine'].includes(item.brand) && (
                        <div className="text-xl font-bold tracking-wider text-zinc-400 uppercase">{item.brand}</div>
                      )}
                    </div>

                    {/* Main Action Button */}
                    <button
                      className={`mt-auto mb-1 w-full ${item.btnColor} flex items-center justify-center gap-2 rounded-xl border border-zinc-200 py-3 text-xs font-bold shadow-sm transition-all active:scale-95`}
                    >
                      <Save size={14} />
                      Save Contact
                    </button>
                  </div>

                  {/* Bottom Dock / Navigation Pill */}
                  <div className="absolute bottom-1.5 left-1/2 z-20 h-1 w-[35%] -translate-x-1/2 rounded-full bg-zinc-700" />
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
