import {
  Briefcase,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Loader2,
  MapPin,
  Monitor,
  Search,
  Share2,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import Image from 'next/image'
import { useState } from 'react'

const INITIAL_CARDS = [
  {
    id: 1,
    name: 'Michaelangelo Casale',
    profession: 'Life Coach and Mentor',
    img: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=400&fit=crop',
  },
  {
    id: 2,
    name: 'Jim Quinn',
    profession: 'Business Analyst',
    img: 'https://images.unsplash.com/photo-1556761175-5973dc0f32b7?q=80&w=400&fit=crop',
  },
  {
    id: 3,
    name: 'Stephan H. Brewer',
    profession: 'Consultant',
    img: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=400&fit=crop',
  },
  {
    id: 4,
    name: 'M Autobody Support',
    profession: 'Auto Services',
    img: 'https://images.unsplash.com/photo-1621213437500-1111666dd934?q=80&w=400&fit=crop',
  },
  {
    id: 5,
    name: 'Thomas J Desjardin',
    profession: 'Finance',
    img: 'https://images.unsplash.com/photo-1579227114347-15d08fc37cae?q=80&w=400&fit=crop',
  },
  {
    id: 6,
    name: 'Julia Roso',
    profession: 'Marketing',
    img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400&fit=crop',
  },
  {
    id: 7,
    name: 'John Doe',
    profession: 'Real Estate',
    img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&fit=crop',
  },
  {
    id: 8,
    name: 'Jane Doe',
    profession: 'Designer',
    img: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=400&fit=crop',
  },
]

const MORE_CARDS = [
  {
    id: 9,
    name: 'Alice Smith',
    profession: 'Developer',
    img: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=400&fit=crop',
  },
  {
    id: 10,
    name: 'Bob Johnson',
    profession: 'Architect',
    img: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=400&fit=crop',
  },
  {
    id: 11,
    name: 'Carol White',
    profession: 'Producer',
    img: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?q=80&w=400&fit=crop',
  },
  {
    id: 12,
    name: 'David Brown',
    profession: 'Designer',
    img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&fit=crop',
  },
]

function FilterSelect({ placeholder, Icon, tooltip }: { placeholder: string; Icon: LucideIcon; tooltip: string }) {
  return (
    <div className="group relative flex-1 md:min-w-[140px]" title={tooltip}>
      <div className="pointer-events-none absolute top-1/2 left-4 z-10 -translate-y-1/2 text-zinc-500 transition-colors group-focus-within:text-zinc-300 group-hover:text-zinc-300">
        <Icon size={16} />
      </div>
      <select className="h-full w-full cursor-pointer appearance-none rounded-xl border border-zinc-800/80 bg-zinc-950/50 py-3 pr-10 pl-11 text-xs font-medium text-zinc-100 shadow-sm transition-all outline-none hover:border-zinc-700/80 hover:bg-zinc-800/50 focus:border-zinc-700 focus:bg-zinc-800/50 focus:outline-none lg:text-sm">
        <option value="" className="bg-zinc-900 text-zinc-500">
          {placeholder}
        </option>
        <option value="1" className="bg-zinc-900 text-zinc-100">
          Option 1
        </option>
        <option value="2" className="bg-zinc-900 text-zinc-100">
          Option 2
        </option>
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-zinc-500 transition-colors group-hover:text-zinc-300">
        <ChevronDown size={14} />
      </div>
    </div>
  )
}

export const PublicCardsSection = () => {
  const [cards, setCards] = useState(INITIAL_CARDS)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'slider'>('slider')
  const [activeIndex, setActiveIndex] = useState(2)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const nextCard = () => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setActiveIndex((prev) => Math.min(cards.length - 1, prev + 1))
    setTimeout(() => setIsTransitioning(false), 500)
  }

  const prevCard = () => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setActiveIndex((prev) => Math.max(0, prev - 1))
    setTimeout(() => setIsTransitioning(false), 500)
  }

  const loadMoreCards = () => {
    setIsLoadingMore(true)
    // Simulate API call
    setTimeout(() => {
      setCards((prev) => [...prev, ...MORE_CARDS.map((c) => ({ ...c, id: c.id + prev.length }))])
      setIsLoadingMore(false)
    }, 1200)
  }

  return (
    <div className="w-full overflow-hidden pb-20">
      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-4">
        {/* Header Card */}
        <div className="group relative flex flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white/50 p-8 backdrop-blur-xl lg:col-span-4 lg:p-10 dark:border-zinc-800/80 dark:bg-zinc-900/50">
          <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-zinc-100/50 to-transparent dark:from-zinc-800/20" />

          <div className="bg-yellow-primary/10 dark:bg-yellow-primary/5 pointer-events-none absolute top-0 right-0 -mt-32 -mr-32 rounded-full p-32 blur-3xl transition-transform duration-1000 group-hover:scale-110" />
          <div className="pointer-events-none absolute bottom-0 left-0 -mb-24 -ml-24 rounded-full bg-black/5 p-24 blur-3xl transition-transform delay-100 duration-1000 group-hover:scale-110 dark:bg-white/5" />

          <div className="relative z-10 mb-8 flex w-full flex-col gap-6 pt-2 md:flex-row md:items-start md:justify-between">
            <div className="flex-1">
              <div className="mb-6 inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-100 px-3 py-1.5 text-[10px] font-bold tracking-wider text-zinc-600 uppercase shadow-sm backdrop-blur-sm transition-colors dark:border-zinc-700/50 dark:bg-zinc-800/80 dark:text-zinc-300">
                <Users size={12} className="text-yellow-primary" /> Professional Network
              </div>

              <h2 className="mb-4 max-w-2xl text-3xl leading-[1.1] font-bold tracking-tight text-zinc-900 sm:text-4xl lg:text-5xl dark:text-zinc-100">
                Global <span className="text-yellow-primary font-medium italic">Connections</span>
              </h2>
              <p className="max-w-xl text-base leading-relaxed font-medium text-zinc-600 dark:text-zinc-400">
                Discover and connect with top professionals across various industries worldwide. Build your network
                today.
              </p>
            </div>

            {/* View Toggle */}
            <div className="flex shrink-0 self-start rounded-xl border border-zinc-200 bg-white/80 p-1.5 dark:border-zinc-800/80 dark:bg-zinc-950/80">
              <button
                onClick={() => setViewMode('slider')}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${viewMode === 'slider' ? 'bg-zinc-100 text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
              >
                <Monitor size={14} /> Slider
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${viewMode === 'grid' ? 'bg-zinc-100 text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
              >
                <LayoutGrid size={14} /> Grid
              </button>
            </div>
          </div>

          {/* Modern Filter Bar inside the header */}
          <div className="relative z-10 flex w-full flex-col gap-3 border-t border-zinc-800/80 pt-6 md:flex-row">
            <FilterSelect placeholder="State" Icon={MapPin} tooltip="Filter by US State" />
            <FilterSelect placeholder="City" Icon={MapPin} tooltip="Filter by City Region" />
            <FilterSelect placeholder="Profession" Icon={Briefcase} tooltip="Find specific expertise" />

            <div className="group relative w-full min-w-[200px] flex-[1.5]">
              <div className="absolute top-1/2 left-4 z-10 -translate-y-1/2 text-zinc-500 transition-colors group-focus-within:text-zinc-300">
                <Search size={16} />
              </div>
              <input
                type="text"
                placeholder="Search directory..."
                className="h-full w-full rounded-xl border border-zinc-800/80 bg-zinc-950/50 py-3 pr-4 pl-11 text-xs font-medium text-zinc-100 shadow-sm transition-all placeholder:text-zinc-500 hover:border-zinc-700/80 hover:bg-zinc-800/50 focus:border-zinc-700 focus:bg-zinc-800/50 focus:outline-none lg:text-sm"
              />
            </div>

            <button className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-zinc-100 px-6 py-3 text-xs font-bold text-zinc-950 shadow-sm transition-all hover:bg-white active:scale-95 lg:text-sm">
              Search
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'grid' ? (
        /* Grid of Connections */
        <div className="vbiz-bento-grid relative z-20 mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {cards.map((card, idx) => (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6, delay: (idx % 8) * 0.1, ease: 'easeOut' }}
              key={card.id}
              className="group relative flex cursor-pointer flex-col overflow-hidden rounded-3xl border border-white/5 bg-zinc-950/30 shadow-sm backdrop-blur-3xl transition-colors duration-300 hover:bg-zinc-950/40"
            >
              <div className="relative h-56 overflow-hidden bg-zinc-950">
                <div className="absolute inset-0 z-10 bg-linear-to-t from-zinc-900 to-transparent" />
                <Image
                  width={300}
                  height={300}
                  src={card.img}
                  alt={card.name}
                  className="h-full w-full object-cover opacity-80 grayscale-30 transition-all duration-700 group-hover:scale-105 group-hover:opacity-100 group-hover:grayscale-0"
                />
              </div>

              <div className="relative z-20 -mt-6 flex flex-1 flex-col p-6">
                <div className="flex flex-col items-center text-center">
                  <h3 className="mb-1 w-full truncate text-lg leading-tight font-bold text-zinc-100 transition-colors group-hover:text-white md:text-xl">
                    {card.name}
                  </h3>
                  <div className="text-yellow-primary inline-flex max-w-full items-center gap-1.5 truncate rounded-md border border-zinc-800/80 bg-zinc-950/50 px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase">
                    <Briefcase size={10} /> {card.profession}
                  </div>
                </div>

                <div className="mt-8 flex w-full items-center justify-center gap-2">
                  <button className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 text-xs font-bold text-zinc-100 shadow-sm transition-colors duration-300 group-hover:bg-zinc-100 group-hover:text-zinc-950">
                    View Profile
                  </button>
                  <button
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-800 text-zinc-300 transition-colors hover:bg-zinc-700"
                    title="Share Profile"
                  >
                    <Share2 size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        /* Carousel Area */
        <div className="relative z-20 mt-8 flex min-h-[480px] flex-1 flex-col items-center justify-center perspective-[1600px]">
          {/* Navigation */}
          <div className="pointer-events-none absolute top-1/2 z-40 flex w-full max-w-[1100px] -translate-y-1/2 justify-between px-4 md:px-8">
            <button
              onClick={prevCard}
              disabled={activeIndex === 0}
              className="group pointer-events-auto hidden h-12 w-12 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-800/80 text-zinc-100 shadow-sm backdrop-blur-md transition-all hover:bg-zinc-700 hover:text-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-20 md:flex"
            >
              <ChevronLeft size={20} className="transition-transform group-hover:-translate-x-0.5" />
            </button>
            <button
              onClick={nextCard}
              disabled={activeIndex === cards.length - 1}
              className="group pointer-events-auto hidden h-12 w-12 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-800/80 text-zinc-100 shadow-sm backdrop-blur-md transition-all hover:bg-zinc-700 hover:text-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-20 md:flex"
            >
              <ChevronRight size={20} className="transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>

          <div className="transform-style-3d relative flex h-[440px] w-full max-w-[1000px] items-center justify-center px-4 md:px-0">
            <AnimatePresence initial={false}>
              {cards.map((card, idx) => {
                const offset = idx - activeIndex
                const absOffset = Math.abs(offset)
                const direction = Math.sign(offset)

                if (absOffset > 3) return null // Only render cards within 3 slots

                // Depth
                const zTranslate = absOffset === 0 ? 80 : -absOffset * 100
                // Lateral position (x)
                const xTranslate = offset === 0 ? 0 : direction * (absOffset * 130 + 80)
                // Rotation
                const yRotate = offset === 0 ? 0 : direction * -20
                // Scale
                const scale = absOffset === 0 ? 1 : Math.max(0.75, 1 - absOffset * 0.1)

                const zIndex = 50 - absOffset
                const opacity = absOffset === 3 ? 0 : 1

                return (
                  <motion.div
                    key={card.id}
                    onMouseMove={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect()
                      const x = e.clientX - rect.left
                      const y = e.clientY - rect.top
                      e.currentTarget.style.setProperty('--mouse-x', `${(x / rect.width - 0.5) * -15}px`)
                      e.currentTarget.style.setProperty('--mouse-y', `${(y / rect.height - 0.5) * -15}px`)
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.setProperty('--mouse-x', '0px')
                      e.currentTarget.style.setProperty('--mouse-y', '0px')
                    }}
                    initial={false}
                    animate={{
                      x: xTranslate,
                      z: zTranslate,
                      rotateY: yRotate,
                      scale: scale,
                      zIndex: zIndex,
                      opacity: opacity,
                    }}
                    transition={{
                      duration: 0.5,
                      ease: [0.32, 0.72, 0, 1], // smoother transition
                    }}
                    onClick={() => {
                      if (!isTransitioning) {
                        setIsTransitioning(true)
                        setActiveIndex(idx)
                        setTimeout(() => setIsTransitioning(false), 500)
                      }
                    }}
                    className="transform-style-3d group/card absolute w-[260px] cursor-pointer overflow-hidden rounded-3xl border border-zinc-800/80 bg-zinc-900 shadow-sm transition-colors duration-300 md:w-[300px]"
                    style={{ height: '420px' }}
                  >
                    {/* Loading overlay during transition or fetching */}
                    <AnimatePresence>
                      {isTransitioning && absOffset === 0 && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center bg-zinc-950/40 backdrop-blur-[2px]"
                        >
                          <Loader2 size={32} className="animate-spin text-zinc-400" />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Card Overlay to darken back cards */}
                    <motion.div
                      animate={{ backgroundColor: absOffset === 0 ? 'rgba(24,24,27,0)' : 'rgba(24,24,27,0.7)' }}
                      className="pointer-events-none absolute inset-0 z-20 transition-colors duration-500"
                    />

                    <div className="relative h-[260px] w-full overflow-hidden bg-zinc-950">
                      <div className="absolute inset-0 z-10 bg-linear-to-t from-zinc-900 via-zinc-900/40 to-transparent" />
                      {/* Subtle Parallax on Hover */}
                      <motion.div
                        className="absolute inset-0 h-full w-full overflow-hidden"
                        animate={{ scale: absOffset === 0 ? 1 : 1.05 }}
                        transition={{ duration: 0.5 }}
                      >
                        <div
                          className="absolute top-[-5%] left-[-5%] h-[110%] w-[110%] translate-x-(--mouse-x,0px) translate-y-(--mouse-y,0px) bg-cover bg-center grayscale-20 transition-transform duration-300 ease-out group-hover/card:scale-105"
                          style={{ backgroundImage: `url(${card.img})` }}
                        />
                      </motion.div>
                    </div>

                    <div className="relative z-20 -mt-4 flex h-[160px] flex-col items-center justify-between border-t border-zinc-800/80 bg-zinc-900 p-6">
                      <div className="w-full text-center">
                        <h4
                          className="w-full truncate px-2 text-lg font-bold text-zinc-100 md:text-xl"
                          title={card.name}
                        >
                          {card.name}
                        </h4>
                        <p
                          className="text-yellow-primary mt-1.5 w-full truncate px-2 text-[10px] font-bold tracking-wider uppercase md:text-xs"
                          title={card.profession}
                        >
                          {card.profession}
                        </p>
                      </div>

                      <button className="mt-4 flex w-full items-center justify-center rounded-xl border border-zinc-700 bg-zinc-800 py-3.5 text-xs font-bold text-zinc-100 shadow-sm transition-all group-hover/card:bg-zinc-100 group-hover/card:text-zinc-950 hover:bg-zinc-700 active:scale-95">
                        View Profile
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        </div>
      )}

      {cards.length < INITIAL_CARDS.length + MORE_CARDS.length && (
        <div className="relative z-20 mt-10 flex w-full justify-center border-t border-zinc-800/50 pt-8 pb-8 md:mt-16">
          <button
            onClick={loadMoreCards}
            disabled={isLoadingMore}
            className="group flex min-w-[160px] items-center justify-center gap-2 rounded-xl border border-zinc-800/80 bg-zinc-900/50 px-6 py-3.5 text-sm font-bold text-zinc-100 shadow-sm backdrop-blur-md transition-all hover:bg-zinc-800 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoadingMore ? <Loader2 size={16} className="animate-spin" /> : 'Load More Connections'}
          </button>
        </div>
      )}

      {/* Custom CSS for 3D Perspective */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
              .perspective-[1600px] {
                 perspective: 1600px;
                 transform-style: preserve-3d;
              }
              .transform-style-3d {
                 transform-style: preserve-3d;
              }
            `,
        }}
      />
    </div>
  )
}
