import {
  ArrowRight,
  ArrowUpRight,
  Award,
  BookOpen,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coffee,
  ExternalLink,
  Handshake,
  LayoutGrid,
  Linkedin,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Monitor,
  PlayCircle,
  Quote,
  Rocket,
  ShieldCheck,
  Sparkles,
  Star,
  UsersRound,
  Video,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import Image from 'next/image'
import { useState } from 'react'

export const MissionSection = () => (
  <div className="vbiz-bento-grid grid w-full grid-cols-1 gap-4 pb-20 md:grid-cols-3 lg:grid-cols-4">
    {/* Mission Card - Takes up 3 cols on desktop */}
    <div className="group relative flex min-h-[360px] flex-col justify-between overflow-hidden rounded-3xl border border-zinc-200 bg-white p-8 md:col-span-3 lg:col-span-3 lg:p-12 dark:border-zinc-800/80 dark:bg-zinc-900">
      {/* Background Video */}
      <div className="absolute inset-0 h-full w-full bg-zinc-100 dark:bg-zinc-950">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover opacity-20 mix-blend-multiply grayscale-70 transition-all duration-1000 group-hover:scale-105 group-hover:grayscale-20 dark:opacity-20 dark:mix-blend-screen"
        >
          <source src="https://app.vbizme.com/storage/ecard/profileimages/91/mc%20vbizme.mp4" type="video/mp4" />
        </video>
        <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-zinc-100 via-zinc-100/90 to-zinc-100/60 dark:from-zinc-950 dark:via-zinc-900/90 dark:to-zinc-900/60" />
        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-zinc-100/80 to-transparent dark:from-zinc-950/80" />
      </div>

      {/* Abstract Background Elements */}
      <div className="bg-yellow-primary/10 dark:bg-yellow-primary/5 pointer-events-none absolute top-0 right-0 -mt-32 -mr-32 rounded-full p-32 blur-3xl transition-transform duration-1000 group-hover:scale-110" />
      <div className="pointer-events-none absolute bottom-0 left-0 -mb-24 -ml-24 rounded-full bg-black/5 p-24 blur-3xl transition-transform delay-100 duration-1000 group-hover:scale-110 dark:bg-white/5" />

      <div className="relative z-10">
        <div className="mb-8 inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-100 px-3 py-1.5 text-[10px] font-bold tracking-wider text-zinc-600 uppercase shadow-sm backdrop-blur-sm transition-colors dark:border-zinc-700/50 dark:bg-zinc-800/80 dark:text-zinc-300">
          <BookOpen size={12} className="text-yellow-primary" /> Our Mission
        </div>

        <div className="relative">
          <Quote size={40} className="absolute -top-4 -left-4 -rotate-12 text-zinc-300 dark:text-zinc-800/50" />
          <h2 className="relative z-10 mb-6 max-w-3xl pl-2 text-3xl leading-[1.1] font-bold tracking-tight text-zinc-900 sm:text-4xl lg:text-5xl dark:text-zinc-100">
            Revolutionize professional networking by delivering{' '}
            <span className="text-yellow-primary font-medium italic">cutting-edge</span> digital business cards.
          </h2>
        </div>

        <div className="relative z-10 mt-6 lg:mt-8">
          <p className="mb-4 max-w-2xl text-base leading-relaxed font-medium text-zinc-600 lg:text-lg dark:text-zinc-400">
            We empower individuals and organizations to stand out, communicate their value instantly, and turn every
            introduction into a lasting opportunity.
          </p>
        </div>
      </div>
    </div>

    {/* Visual Identity Logo Square */}
    <div className="group hover:border-yellow-primary/30 relative flex min-h-[300px] flex-col items-center justify-center overflow-hidden rounded-3xl border border-zinc-200 bg-linear-to-br from-white to-zinc-50 p-6 transition-all duration-500 md:col-span-3 lg:col-span-1 dark:border-zinc-800/80 dark:from-zinc-900 dark:to-zinc-950">
      <div className="bg-yellow-primary/10 pointer-events-none absolute top-0 right-0 -mt-16 -mr-16 rounded-full p-12 blur-3xl transition-transform duration-700 group-hover:scale-150" />
      <div className="pointer-events-none absolute bottom-0 left-0 -mb-16 -ml-16 rounded-full bg-zinc-200/50 p-12 blur-2xl dark:bg-zinc-800/20" />

      <div className="group-hover:border-yellow-primary/50 relative z-10 flex h-40 w-40 flex-col items-center justify-center rounded-4xl border border-zinc-200 bg-white shadow-xl transition-all duration-500 group-hover:-translate-y-2 lg:h-48 lg:w-48 dark:border-zinc-800/80 dark:bg-zinc-950 dark:shadow-2xl">
        <span className="mt-2 mb-1 font-serif text-6xl font-bold tracking-tighter text-zinc-900 lg:text-7xl dark:text-zinc-100">
          V
        </span>
        <span className="text-yellow-primary text-[10px] font-bold tracking-widest uppercase lg:text-xs">Biz Me</span>
      </div>
    </div>

    {/* Vision block */}
    <div className="group relative flex flex-col justify-start overflow-hidden rounded-3xl border border-zinc-200 bg-white/50 p-8 backdrop-blur-xl transition-colors duration-500 hover:bg-white/80 md:col-span-1 lg:col-span-2 dark:border-zinc-800/80 dark:bg-zinc-900/50 dark:hover:bg-zinc-900/80">
      <div className="absolute top-0 right-0 h-48 w-48 rounded-full bg-blue-500/5 blur-3xl" />
      <div className="relative z-10">
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-100 text-zinc-900 shadow-sm transition-colors group-hover:bg-zinc-900 group-hover:text-white dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-100 dark:group-hover:bg-zinc-100 dark:group-hover:text-zinc-950">
          <Rocket size={20} />
        </div>
        <h3 className="mb-4 text-2xl font-bold tracking-tight text-zinc-900 lg:text-3xl dark:text-zinc-100">
          Our Vision
        </h3>
        <p className="leading-relaxed font-medium text-zinc-600 dark:text-zinc-400">
          To be the global standard for professional introductions. We envision a world where paper business cards are
          obsolete, replaced by intelligent, dynamic digital profiles that tell your complete professional story and
          foster genuine connections.
        </p>
      </div>
    </div>

    {/* Core Values block */}
    <div className="group relative flex flex-col justify-start overflow-hidden rounded-3xl border border-zinc-200 bg-white/50 p-8 backdrop-blur-xl transition-colors duration-500 hover:bg-white/80 md:col-span-2 lg:col-span-2 dark:border-zinc-800/80 dark:bg-zinc-900/50 dark:hover:bg-zinc-900/80">
      <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-emerald-500/5 blur-3xl" />
      <div className="relative z-10">
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-100 text-zinc-900 shadow-sm transition-colors group-hover:bg-zinc-900 group-hover:text-white dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-100 dark:group-hover:bg-zinc-100 dark:group-hover:text-zinc-950">
          <ShieldCheck size={20} />
        </div>
        <h3 className="mb-4 text-2xl font-bold tracking-tight text-zinc-900 lg:text-3xl dark:text-zinc-100">
          Core Values
        </h3>
        <ul className="space-y-3 leading-relaxed font-medium text-zinc-600 dark:text-zinc-400">
          <li className="flex items-start gap-3">
            <div className="bg-yellow-primary mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" />
            <div>
              <span className="font-semibold text-zinc-900 dark:text-zinc-200">Innovation:</span> Pushing the boundaries
              of digital connectivity.
            </div>
          </li>
          <li className="flex items-start gap-3">
            <div className="bg-yellow-primary mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" />
            <div>
              <span className="font-semibold text-zinc-900 dark:text-zinc-200">Impact:</span> Making every interaction
              memorable and meaningful.
            </div>
          </li>
          <li className="flex items-start gap-3">
            <div className="bg-yellow-primary mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" />
            <div>
              <span className="font-semibold text-zinc-900 dark:text-zinc-200">Integrity:</span> Secure, reliable, and
              authentic representation.
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
)

export const CertificatesSection = () => {
  const certificates = [
    {
      img: 'https://images.unsplash.com/photo-1589330694653-efa647532025?q=80&w=1200&fit=crop',
      title: 'Certificate of Excellence',
      issuer: 'National Business Academy',
      year: '2024',
      credentialId: 'CERT-2024-XQ',
      color: 'from-blue-500',
    },
    {
      img: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1200&fit=crop',
      title: 'Strategic Management',
      issuer: 'Executive Institute',
      year: '2023',
      credentialId: 'SM-789-23',
      color: 'from-yellow-primary',
    },
    {
      img: 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?q=80&w=1200&fit=crop',
      title: 'Digital Transformation',
      issuer: 'Tech Innovation Hub',
      year: '2022',
      credentialId: 'DT-004-9X',
      color: 'from-purple-500',
    },
  ]

  return (
    <div className="w-full pb-20">
      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-4">
        {/* Header Card */}
        <div className="group relative flex flex-col items-start justify-between gap-6 overflow-hidden rounded-3xl border border-zinc-200 bg-white/50 p-8 backdrop-blur-xl md:flex-row md:items-center md:gap-0 lg:col-span-4 lg:p-10 dark:border-zinc-800/80 dark:bg-zinc-900/50">
          <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-zinc-100/50 to-transparent dark:from-zinc-800/20" />

          <div className="bg-yellow-primary/10 dark:bg-yellow-primary/5 pointer-events-none absolute top-0 right-0 -mt-32 -mr-32 rounded-full p-32 blur-3xl transition-transform duration-1000 group-hover:scale-110" />
          <div className="pointer-events-none absolute bottom-0 left-0 -mb-24 -ml-24 rounded-full bg-black/5 p-24 blur-3xl transition-transform delay-100 duration-1000 group-hover:scale-110 dark:bg-white/5" />

          <div className="relative z-10 w-full md:w-auto">
            <div className="mb-6 inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-100 px-3 py-1.5 text-[10px] font-bold tracking-wider text-zinc-600 uppercase shadow-sm backdrop-blur-sm transition-colors dark:border-zinc-700/50 dark:bg-zinc-800/80 dark:text-zinc-300">
              <Award size={12} className="text-yellow-primary" /> Licenses & Certifications
            </div>

            <h2 className="mb-4 max-w-2xl text-3xl leading-[1.1] font-bold tracking-tight text-zinc-900 sm:text-4xl lg:text-5xl dark:text-zinc-100">
              Verifiable <span className="text-yellow-primary font-medium italic">Credentials</span>
            </h2>
            <p className="max-w-xl text-base leading-relaxed font-medium text-zinc-600 dark:text-zinc-400">
              Showcasing recognized licenses, certifications, and academic achievements.
            </p>
          </div>

          <div className="relative z-10">
            <button className="flex items-center justify-center gap-3 rounded-xl bg-zinc-900 px-6 py-3.5 font-bold text-white shadow-lg transition-all hover:bg-zinc-800 hover:shadow-[0_0_20px_rgba(0,0,0,0.1)] active:scale-95 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white dark:hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]">
              <span className="text-sm font-bold">Request Portfolio</span>
              <ExternalLink size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="vbiz-bento-grid relative z-20 mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {certificates.map((cert, idx) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.1 }}
            key={idx}
            className="group relative flex flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white/50 shadow-sm backdrop-blur-xl transition-colors duration-300 hover:bg-white/80 dark:border-zinc-800/80 dark:bg-zinc-900/50 dark:hover:bg-zinc-900/80"
          >
            {/* Image container */}
            <div className="relative h-48 overflow-hidden bg-zinc-100 sm:h-56 dark:bg-zinc-950">
              <div className="absolute inset-0 z-10 bg-linear-to-t from-white to-transparent dark:from-zinc-900" />
              <Image
                width={100}
                height={100}
                src={cert.img}
                alt={cert.title}
                className="h-full w-full object-cover opacity-70 grayscale-40 transition-all duration-700 group-hover:scale-105 group-hover:opacity-100 group-hover:grayscale-0"
              />

              {/* Credential Badge */}
              <div className="absolute top-4 right-4 z-20">
                <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white/80 px-3 py-1.5 font-mono text-[10px] tracking-wider text-zinc-600 shadow-sm backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80 dark:text-zinc-300">
                  <Award size={12} className="text-yellow-primary" />
                  {cert.credentialId}
                </div>
              </div>
            </div>

            {/* Content container */}
            <div className="relative z-20 -mt-6 flex flex-1 flex-col p-6 md:p-8">
              <h3 className="mb-2 text-xl leading-tight font-bold text-zinc-900 transition-colors group-hover:text-black dark:text-zinc-100 dark:group-hover:text-white">
                {cert.title}
              </h3>
              <p className="mb-6 text-sm font-medium text-zinc-600 dark:text-zinc-400">{cert.issuer}</p>

              <div className="mt-auto flex items-center justify-between border-t border-zinc-200 pt-5 dark:border-zinc-800/80">
                <div className="flex flex-col">
                  <span className="mb-0.5 text-[10px] font-bold tracking-wider text-zinc-500 uppercase">
                    Year Issued
                  </span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-300">{cert.year}</span>
                </div>

                <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-100 shadow-sm transition-colors duration-300 group-hover:bg-zinc-900 group-hover:text-white dark:border-zinc-700 dark:bg-zinc-800 dark:group-hover:bg-zinc-100 dark:group-hover:text-zinc-950">
                  <ExternalLink
                    size={16}
                    className="text-zinc-500 transition-colors group-hover:text-white dark:text-zinc-400 dark:group-hover:text-zinc-950"
                  />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export const ReviewsSection = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'slider'>('slider')
  const [activeIndex, setActiveIndex] = useState(1)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const reviews = [
    {
      name: 'James T.',
      title: 'Real Estate Agent',
      quote:
        'I love how easy it is to share my vCard. The scrolling navigation bar keeps everything in one place, and my clients can schedule appointments without ever needing to visit my website. No more lost business cards—this is the future!',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&fit=crop',
    },
    {
      name: 'Sarah M.',
      title: 'Marketing Director',
      quote:
        "vBiz Me completely transformed how I network at conferences. The analytics let me know exactly who's engaging with my content. A true game changer.",
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&fit=crop',
    },
    {
      name: 'Michael R.',
      title: 'Entrepreneur',
      quote:
        'The seamless integration of my intro video, booking link, and portfolio in one premium digital card has increased my lead conversion by 300%.',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&fit=crop',
    },
    {
      name: 'Emily P.',
      title: 'Freelance Designer',
      quote:
        'I used to carry around bulky portfolios, now everything fits in my pocket. The premium look of the gallery screen alone gets me clients.',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200&fit=crop',
    },
    {
      name: 'David K.',
      title: 'Financial Advisor',
      quote:
        'Trust is everything in my business. Handing someone a beautifully crafted digital card instantly elevates my perceived value and professionalism.',
      image: 'https://images.unsplash.com/photo-1456327102063-fb5054efe647?q=80&w=200&fit=crop',
    },
    {
      name: 'Alex J.',
      title: 'Startup Founder',
      quote:
        'Pitching investors has never been easier. I send my vBiz link and they immediately have my pitch deck, demo video, and calendar. Invaluable.',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&fit=crop',
    },
    {
      name: 'Olivia W.',
      title: 'Event Coordinator',
      quote:
        'With so many contacts to manage, having a dynamic digital card means everyone always has my most up-to-date information without me reprinting cards.',
      image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&fit=crop',
    },
    {
      name: 'Marcus B.',
      title: 'Sales Executive',
      quote:
        'The save contact feature works flawlessly. 90% of the people I meet actually save my contact now, compared to maybe 10% with paper cards.',
      image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=200&fit=crop',
    },
  ]

  const totalReviewsLabel =
    reviews.length >= 50 ? '50+' : reviews.length >= 20 ? '20+' : reviews.length >= 10 ? '10+' : reviews.length

  const nextReview = () => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setActiveIndex((prev) => Math.min(reviews.length - 1, prev + 1))
    setTimeout(() => setIsTransitioning(false), 500)
  }

  const prevReview = () => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setActiveIndex((prev) => Math.max(0, prev - 1))
    setTimeout(() => setIsTransitioning(false), 500)
  }

  return (
    <div className="w-full overflow-hidden pb-20">
      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-4">
        {/* Header Card */}
        <div className="group relative flex min-h-[320px] flex-col items-start justify-between gap-8 overflow-hidden rounded-3xl border border-zinc-200 bg-white p-8 md:flex-row md:items-center md:gap-0 lg:col-span-4 lg:p-12 dark:border-zinc-800/80 dark:bg-zinc-900">
          {/* Background Video */}
          <div className="absolute inset-0 h-full w-full bg-zinc-100 dark:bg-zinc-950">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 h-full w-full object-cover opacity-20 mix-blend-multiply grayscale-50 transition-all duration-1000 group-hover:scale-105 group-hover:grayscale-0 dark:opacity-30 dark:mix-blend-screen"
            >
              <source src="https://app.vbizme.com/storage/ecard/profileimages/91/mc%20vbizme.mp4" type="video/mp4" />
            </video>
            <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-zinc-100 via-zinc-100/90 to-zinc-100/40 dark:from-zinc-950 dark:via-zinc-900/80 dark:to-zinc-900/40" />
            <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-zinc-100 to-transparent dark:from-zinc-950" />
          </div>

          <div className="relative z-10 w-full md:w-auto">
            <div className="mb-6 inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-100 px-3 py-1.5 text-[10px] font-bold tracking-wider text-zinc-600 uppercase shadow-sm backdrop-blur-sm transition-colors dark:border-zinc-700/50 dark:bg-zinc-800/80 dark:text-zinc-300">
              <Star size={12} className="text-yellow-primary" /> Success Stories
            </div>

            <h2 className="mb-4 max-w-2xl text-4xl leading-[1.1] font-bold tracking-tight text-zinc-900 sm:text-5xl lg:text-6xl dark:text-zinc-100">
              Trusted by <span className="text-yellow-primary font-medium italic">Professionals</span>
            </h2>
            <p className="max-w-xl text-lg leading-relaxed font-medium text-zinc-600 dark:text-zinc-300">
              Join the professionals who have revolutionized their networking and lead generation with vBiz Me.
            </p>
          </div>

          <div className="relative z-10 flex w-full flex-col items-start md:w-auto md:items-end">
            {/* Toggle switch for grid/slider inside the header */}
            <div className="mb-6 flex shrink-0 self-start rounded-xl border border-zinc-200 bg-white/80 p-1.5 md:self-end dark:border-zinc-800/80 dark:bg-zinc-950/80">
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

            <div className="mb-3 flex gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50/80 p-2 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/80">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className="fill-yellow-primary text-yellow-primary h-5 w-5 drop-shadow-[0_0_8px_rgba(234,179,8,0.4)]"
                />
              ))}
            </div>
            <h3 className="mb-1 flex items-baseline gap-2 text-4xl font-bold tracking-tighter text-zinc-900 drop-shadow-md dark:text-zinc-100">
              5.0 <span className="text-lg text-zinc-500">/ 5.0</span>
            </h3>
            <span className="text-xs font-bold tracking-widest text-zinc-600 uppercase dark:text-zinc-400">
              {totalReviewsLabel} Verified Reviews
            </span>

            <button className="relative z-10 mt-8 flex w-full items-center justify-center gap-3 rounded-xl bg-zinc-900 px-8 py-4 font-bold text-white shadow-lg transition-all hover:bg-zinc-800 hover:shadow-[0_0_20px_rgba(0,0,0,0.1)] active:scale-95 md:w-auto dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white dark:hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]">
              <span className="text-sm font-bold">Leave a Review</span>
              <MessageCircle size={18} />
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'grid' ? (
        /* Premium Reviews Bento Grid */
        <div className="vbiz-bento-grid relative z-20 mt-4 grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {reviews.map((review, idx) => {
            // Create a bento layout pattern:
            // 1st item: large (2 cols, 2 rows) on lg screens if we had rows, or just 2 cols
            // The pattern will be: first item spans 2 cols, others span 1.
            const isFeatured = idx === 0 || idx === 3

            return (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                key={idx}
                className={`group relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border border-zinc-200 bg-white/50 p-6 shadow-sm backdrop-blur-xl transition-colors duration-300 hover:bg-white/80 sm:p-8 dark:border-zinc-800/80 dark:bg-zinc-900/50 dark:hover:bg-zinc-900/80 ${isFeatured ? 'bg-linear-to-br from-white to-zinc-50 md:col-span-2 lg:col-span-2 dark:from-zinc-900/80 dark:to-zinc-900/40' : 'col-span-1'}`}
              >
                <div className="bg-yellow-primary/10 dark:bg-yellow-primary/5 pointer-events-none absolute top-0 right-0 -mt-12 -mr-12 rounded-full p-24 opacity-0 blur-3xl transition-opacity duration-700 group-hover:opacity-100" />

                <div className="relative z-10 w-full">
                  <div className="mb-6 flex items-start justify-between">
                    <div className="flex gap-1.5 rounded-lg border border-zinc-200/50 bg-zinc-50/50 p-1.5 backdrop-blur-sm dark:border-zinc-800/50 dark:bg-zinc-950/50">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} className="fill-yellow-primary text-yellow-primary h-4 w-4" />
                      ))}
                    </div>
                    <Quote className="h-8 w-8 text-zinc-200 transition-colors group-hover:text-zinc-300 dark:text-zinc-800 dark:group-hover:text-zinc-700" />
                  </div>
                  <p
                    className={`mb-8 leading-relaxed font-medium text-zinc-700 italic transition-colors group-hover:text-zinc-900 dark:text-zinc-300 dark:group-hover:text-zinc-100 ${isFeatured ? 'text-xl leading-normal md:text-2xl' : 'text-base leading-relaxed'}`}
                  >
                    {`                   "${review.quote}"`}
                  </p>
                </div>

                <div className="relative z-10 mt-auto flex items-center gap-4 border-t border-zinc-200 pt-5 dark:border-zinc-800/80">
                  <div
                    className={`shrink-0 overflow-hidden rounded-full border-2 border-zinc-200 shadow-sm dark:border-zinc-700/50 ${isFeatured ? 'h-14 w-14' : 'h-10 w-10'}`}
                  >
                    <Image
                      width={100}
                      height={100}
                      src={review.image}
                      alt={review.name}
                      className="h-full w-full object-cover grayscale-30 transition-all duration-300 group-hover:grayscale-0"
                    />
                  </div>
                  <div>
                    <p
                      className={`font-bold tracking-tight text-zinc-900 dark:text-zinc-100 ${isFeatured ? 'text-base' : 'text-sm'}`}
                    >
                      {review.name}
                    </p>
                    <p className="text-yellow-primary mt-0.5 text-[10px] font-bold tracking-wider uppercase">
                      {review.title}
                    </p>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      ) : (
        /* Slider View Mode */
        <div className="relative z-20 mt-12 mb-8 flex min-h-[500px] flex-1 flex-col items-center justify-center perspective-[1600px]">
          {/* Navigation */}
          <div className="pointer-events-none absolute top-1/2 z-40 flex w-full max-w-[1200px] -translate-y-1/2 justify-between px-2 sm:px-4 md:px-8">
            <button
              onClick={prevReview}
              disabled={activeIndex === 0}
              className="group pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white/90 text-zinc-900 shadow-xl backdrop-blur-md transition-all hover:bg-zinc-100 hover:text-black active:scale-95 disabled:cursor-not-allowed disabled:opacity-20 sm:h-12 sm:w-12 dark:border-zinc-700 dark:bg-zinc-800/90 dark:text-zinc-100 dark:hover:bg-zinc-700 dark:hover:text-white"
            >
              <ChevronLeft size={20} className="transition-transform group-hover:-translate-x-0.5" />
            </button>
            <button
              onClick={nextReview}
              disabled={activeIndex === reviews.length - 1}
              className="group pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white/90 text-zinc-900 shadow-xl backdrop-blur-md transition-all hover:bg-zinc-100 hover:text-black active:scale-95 disabled:cursor-not-allowed disabled:opacity-20 sm:h-12 sm:w-12 dark:border-zinc-700 dark:bg-zinc-800/90 dark:text-zinc-100 dark:hover:bg-zinc-700 dark:hover:text-white"
            >
              <ChevronRight size={20} className="transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>

          <div className="transform-style-3d relative flex h-[460px] w-full max-w-[1000px] items-center justify-center px-4 md:px-0">
            <AnimatePresence initial={false}>
              {reviews.map((review, idx) => {
                const offset = idx - activeIndex
                const absOffset = Math.abs(offset)
                const direction = Math.sign(offset)

                if (absOffset > 3) return null // Only render cards within 3 slots

                // Depth
                const zTranslate = absOffset === 0 ? 80 : -absOffset * 100
                // Lateral position (x)
                const xTranslate = offset === 0 ? 0 : direction * (absOffset * 150 + 100)
                // Rotation
                const yRotate = offset === 0 ? 0 : direction * -15
                // Scale
                const scale = absOffset === 0 ? 1 : Math.max(0.75, 1 - absOffset * 0.1)

                const zIndex = 50 - absOffset
                const opacity = absOffset === 3 ? 0 : 1

                return (
                  <motion.div
                    key={idx}
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
                      duration: 0.6,
                      ease: [0.32, 0.72, 0, 1], // smoother transition
                    }}
                    onClick={() => {
                      if (!isTransitioning) {
                        setIsTransitioning(true)
                        setActiveIndex(idx)
                        setTimeout(() => setIsTransitioning(false), 500)
                      }
                    }}
                    className="transform-style-3d group/card absolute flex w-[300px] cursor-pointer flex-col justify-between overflow-hidden rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl transition-colors duration-300 sm:p-8 md:w-[400px] dark:border-zinc-800 dark:bg-zinc-900"
                    style={{ height: '440px' }}
                  >
                    {/* Loading overlay during transition or fetching */}
                    <AnimatePresence>
                      {isTransitioning && absOffset === 0 && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center bg-white/40 backdrop-blur-[2px] dark:bg-zinc-950/40"
                        >
                          <Loader2 size={32} className="text-yellow-primary animate-spin" />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Card Overlay to darken back cards */}
                    <motion.div
                      animate={{ backgroundColor: absOffset === 0 ? 'rgba(24,24,27,0)' : 'rgba(100,100,100,0.1)' }}
                      className="pointer-events-none absolute inset-0 z-40 rounded-3xl mix-blend-multiply transition-colors duration-500 dark:mix-blend-normal"
                    />
                    <motion.div
                      animate={{ backgroundColor: absOffset === 0 ? 'rgba(24,24,27,0)' : 'rgba(24,24,27,0.8)' }}
                      className="pointer-events-none absolute inset-0 z-40 hidden rounded-3xl transition-colors duration-500 dark:block"
                    />

                    <div className="bg-yellow-primary/10 dark:bg-yellow-primary/5 pointer-events-none absolute top-0 right-0 -mt-16 -mr-16 translate-x-(--mouse-x,0px) translate-y-(--mouse-y,0px) rounded-full p-32 blur-3xl transition-transform duration-700" />

                    <div className="relative z-10 w-full">
                      <div className="mb-6 flex items-start justify-between">
                        <div className="flex gap-1 rounded-lg border border-zinc-200 bg-zinc-50/80 p-1.5 dark:border-zinc-800 dark:bg-zinc-950/80">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <Star key={i} className="fill-yellow-primary text-yellow-primary h-4 w-4" />
                          ))}
                        </div>
                        <Quote className="h-8 w-8 text-zinc-200 transition-colors group-hover/card:text-zinc-300 dark:text-zinc-800 dark:group-hover/card:text-zinc-700" />
                      </div>
                      <p className="mb-8 text-lg leading-relaxed font-medium text-zinc-700 italic md:text-xl dark:text-zinc-300">
                        {`"${review.quote}"`}
                      </p>
                    </div>

                    <div className="relative z-10 -mx-8 mt-auto -mb-8 flex items-center gap-4 border-t border-zinc-200 bg-zinc-50/80 px-8 pt-6 pb-8 backdrop-blur-sm dark:border-zinc-800/80 dark:bg-zinc-900/80">
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-zinc-200 shadow-sm dark:border-zinc-700/50">
                        <Image
                          width={100}
                          height={100}
                          src={review.image}
                          alt={review.name}
                          className="h-full w-full object-cover grayscale-30 transition-all duration-300 group-hover/card:grayscale-0"
                        />
                      </div>
                      <div>
                        <p className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                          {review.name}
                        </p>
                        <p className="text-yellow-primary mt-0.5 text-[10px] font-bold tracking-wider uppercase">
                          {review.title}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        </div>
      )}

      <div className="relative z-20 mt-8 mb-8 flex w-full justify-center border-t border-zinc-200 pt-8 dark:border-zinc-800/50">
        <button className="group relative flex items-center justify-center gap-2 overflow-hidden rounded-xl border border-zinc-200 bg-white/50 px-8 py-3.5 text-sm font-bold text-zinc-900 shadow-sm backdrop-blur-md transition-all hover:bg-zinc-50 active:scale-95 dark:border-zinc-800/80 dark:bg-zinc-900/50 dark:text-zinc-100 dark:hover:bg-zinc-800">
          <div className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-black/5 to-transparent transition-transform duration-1000 group-hover:translate-x-full dark:via-white/5" />
          View All Reviews{' '}
          <ArrowRight
            size={16}
            className="text-zinc-500 transition-all group-hover:translate-x-1 group-hover:text-zinc-900 dark:group-hover:text-zinc-100"
          />
        </button>
      </div>
    </div>
  )
}

export const CalendarSection = () => (
  <div className="w-full pb-20">
    <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-4">
      {/* Header Card */}
      <div className="group relative flex flex-col items-start justify-between gap-6 overflow-hidden rounded-3xl border border-zinc-200 bg-white/50 p-8 backdrop-blur-xl md:flex-row md:items-center md:gap-0 lg:col-span-4 lg:p-10 dark:border-zinc-800/80 dark:bg-zinc-900/50">
        <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-zinc-100/50 to-transparent dark:from-zinc-800/20" />

        <div className="bg-yellow-primary/10 dark:bg-yellow-primary/5 pointer-events-none absolute top-0 right-0 -mt-32 -mr-32 rounded-full p-32 blur-3xl transition-transform duration-1000 group-hover:scale-110" />
        <div className="pointer-events-none absolute bottom-0 left-0 -mb-24 -ml-24 rounded-full bg-black/5 p-24 blur-3xl transition-transform delay-100 duration-1000 group-hover:scale-110 dark:bg-white/5" />

        <div className="relative z-10 w-full md:w-auto">
          <div className="mb-6 inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-100 px-3 py-1.5 text-[10px] font-bold tracking-wider text-zinc-600 uppercase shadow-sm backdrop-blur-sm transition-colors dark:border-zinc-700/50 dark:bg-zinc-800/80 dark:text-zinc-300">
            <Calendar size={12} className="text-yellow-primary" /> Scheduling
          </div>

          <h2 className="mb-4 max-w-2xl text-3xl leading-[1.1] font-bold tracking-tight text-zinc-900 sm:text-4xl lg:text-5xl dark:text-zinc-100">
            Book a <span className="text-yellow-primary font-medium italic">Session</span>
          </h2>
          <p className="max-w-xl text-base leading-relaxed font-medium text-zinc-600 dark:text-zinc-400">
            Find a time that works for you. {`Let's connect and discuss how I can help you achieve your goals.`}
          </p>
        </div>

        <div className="relative z-10">
          <button className="flex items-center justify-center gap-3 rounded-xl bg-zinc-900 px-6 py-3.5 font-bold text-white shadow-lg transition-all hover:bg-zinc-800 hover:shadow-[0_0_20px_rgba(0,0,0,0.1)] active:scale-95 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white dark:hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]">
            <span className="text-sm font-bold">Schedule Meeting</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>

    <div className="vbiz-bento-grid relative z-20 mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
      {[
        {
          icon: Video,
          title: 'Virtual Consultation',
          desc: 'Online meeting via Zoom or Google Meet',
          time: '30-60 min',
          color: 'text-blue-500 dark:text-blue-400',
          bg: 'bg-blue-500/10 dark:bg-blue-400/10',
        },
        {
          icon: Coffee,
          title: 'Coffee Meetup',
          desc: 'In-person casual discussion and networking',
          time: '45 min',
          color: 'text-yellow-primary',
          bg: 'bg-yellow-primary/10',
        },
        {
          icon: MapPin,
          title: 'Office Visit',
          desc: 'Strategy connection session at my location',
          time: '90 min',
          color: 'text-emerald-500 dark:text-emerald-400',
          bg: 'bg-emerald-500/10 dark:bg-emerald-400/10',
        },
      ].map((item, idx) => (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: idx * 0.1 }}
          key={idx}
          className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white/50 p-6 shadow-sm backdrop-blur-xl transition-colors duration-300 hover:bg-white/80 lg:p-8 dark:border-zinc-800/80 dark:bg-zinc-900/50 dark:hover:bg-zinc-900/80"
        >
          <div className="pointer-events-none absolute top-0 right-0 -mt-8 -mr-8 rounded-full bg-black/5 p-16 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100 dark:bg-white/5" />

          <div className={`mb-6 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${item.bg}`}>
            <item.icon className={item.color} size={24} />
          </div>

          <h3 className="mb-2 text-xl leading-tight font-bold text-zinc-900 transition-colors group-hover:text-black dark:text-zinc-100 dark:group-hover:text-white">
            {item.title}
          </h3>
          <p className="mb-8 text-sm leading-relaxed font-medium text-zinc-600 dark:text-zinc-400">{item.desc}</p>

          <div className="relative z-10 mt-auto flex items-center justify-between border-t border-zinc-200 pt-5 dark:border-zinc-800/80">
            <div className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              <Clock size={14} className="text-zinc-500" />
              {item.time}
            </div>

            <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-100 shadow-sm transition-colors duration-300 group-hover:bg-zinc-900 group-hover:text-white dark:border-zinc-700 dark:bg-zinc-800 dark:group-hover:bg-zinc-100 dark:group-hover:text-zinc-950">
              <ArrowUpRight
                size={16}
                className="text-zinc-500 transition-colors group-hover:text-white dark:text-zinc-400 dark:group-hover:text-zinc-950"
              />
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  </div>
)

export const AdditionalServicesSection = () => (
  <div className="vbiz-bento-grid grid w-full grid-cols-1 gap-4 pb-20 md:grid-cols-3 lg:grid-cols-4">
    {/* Main Title Card - Takes up 3 cols */}
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-zinc-200 bg-white/50 p-8 backdrop-blur-xl md:col-span-3 lg:col-span-3 lg:p-10 dark:border-zinc-800/80 dark:bg-zinc-900/50">
      <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-zinc-100/50 to-transparent dark:from-zinc-800/20" />

      {/* Background Orbs */}
      <div className="bg-yellow-primary/10 dark:bg-yellow-primary/5 pointer-events-none absolute top-0 right-0 -mt-32 -mr-32 rounded-full p-32 blur-3xl transition-transform duration-1000 group-hover:scale-110" />
      <div className="pointer-events-none absolute bottom-0 left-0 -mb-24 -ml-24 rounded-full bg-black/5 p-24 blur-3xl transition-transform delay-100 duration-1000 group-hover:scale-110 dark:bg-white/5" />

      <div className="relative z-10 flex w-full flex-col items-start">
        <div className="mb-8 inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-100 px-3 py-1.5 text-[10px] font-bold tracking-wider text-zinc-600 uppercase shadow-sm backdrop-blur-sm transition-colors dark:border-zinc-700/50 dark:bg-zinc-800/80 dark:text-zinc-300">
          <ShieldCheck size={12} className="text-yellow-primary" /> Trusted Partner
        </div>

        <h2 className="mb-6 max-w-2xl text-3xl leading-[1.1] font-bold tracking-tight text-zinc-900 sm:text-4xl lg:text-5xl dark:text-zinc-100">
          Join My Fica Tips
          <br />
          <span className="font-medium text-zinc-500 italic">Tax Credit Team</span>
        </h2>

        <p className="mb-10 max-w-xl text-base leading-relaxed font-medium text-zinc-600 lg:text-lg dark:text-zinc-400">
          Unlock expert guidance and maximize your tax credits with our specialized team of financial resolution
          professionals.
        </p>
      </div>

      <div className="relative z-10 mt-auto">
        <a
          href="#"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-8 py-4 text-sm font-bold text-white shadow-lg transition-all hover:shadow-[0_0_20px_rgba(0,0,0,0.1)] hover:focus:bg-zinc-800 active:scale-95 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white dark:hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]"
        >
          Explore Services <ArrowUpRight size={18} />
        </a>
      </div>
    </div>

    {/* Identity / Partner logo block */}
    <div className="group hover:border-yellow-primary/30 relative flex min-h-[300px] flex-col items-center justify-center overflow-hidden rounded-3xl border border-zinc-200 bg-linear-to-br from-white to-zinc-50 p-6 transition-all duration-500 md:col-span-3 lg:col-span-1 lg:p-8 dark:border-zinc-800/80 dark:from-zinc-900 dark:to-zinc-950">
      <div className="bg-yellow-primary/10 pointer-events-none absolute top-0 right-0 -mt-16 -mr-16 rounded-full p-12 blur-3xl transition-transform duration-700 group-hover:scale-150" />

      <div className="relative z-10 flex flex-col items-center rounded-2xl border-4 border-zinc-200 bg-zinc-100 px-6 py-4 shadow-xl transition-all duration-500 group-hover:-translate-y-2 group-hover:scale-110 dark:border-zinc-900">
        <div className="flex items-center font-serif text-2xl tracking-tight text-zinc-900">
          <span className="font-bold">Legacy</span>
          <span className="ml-1 font-bold text-zinc-500">Tax</span>
        </div>
        <div className="mt-1.5 text-center text-[9px] font-bold tracking-widest text-zinc-500 uppercase">
          Resolution Services
        </div>
      </div>

      <div className="relative z-10 mt-10">
        <p className="text-center text-xs font-bold tracking-wider text-zinc-500 uppercase">Featured Asssociate</p>
      </div>
    </div>
  </div>
)

export const ExplainerSection = () => (
  <div className="vbiz-bento-grid grid w-full grid-cols-1 gap-4 pb-20 md:grid-cols-3 lg:grid-cols-4">
    {/* Main Video Card - Takes up 3 cols */}
    <div className="group relative flex flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white/50 p-4 backdrop-blur-xl md:col-span-3 lg:col-span-3 dark:border-zinc-800/80 dark:bg-zinc-900/50">
      <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-zinc-100/50 to-transparent dark:from-zinc-800/20" />

      {/* Background Orbs */}
      <div className="bg-yellow-primary/10 dark:bg-yellow-primary/5 pointer-events-none absolute top-0 right-0 -mt-32 -mr-32 rounded-full p-32 blur-3xl transition-transform duration-1000 group-hover:scale-110" />

      <div className="relative z-10 mb-6 h-[300px] w-full overflow-hidden rounded-2xl border border-zinc-200 bg-black md:h-[450px] lg:h-[500px] dark:border-zinc-800/80">
        <video
          className="h-full w-full object-cover opacity-90 dark:opacity-80"
          poster="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&fit=crop"
          controls
        >
          <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4" />
        </video>
      </div>

      <div className="relative z-10 flex flex-col items-start justify-between gap-6 px-2 pb-2 md:flex-row md:items-center lg:px-4">
        <div>
          <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-100 px-3 py-1.5 text-[10px] font-bold tracking-wider text-zinc-600 uppercase shadow-sm backdrop-blur-sm transition-colors dark:border-zinc-700/50 dark:bg-zinc-800/80 dark:text-zinc-300">
            <PlayCircle size={12} className="text-yellow-primary" /> Featured Explainer
          </div>

          <h2 className="mb-2 text-2xl leading-tight font-bold tracking-tight text-zinc-900 md:text-3xl dark:text-zinc-100">
            See How <span className="text-yellow-primary font-medium italic">vBiz Me</span> Works
          </h2>
        </div>

        <div className="flex w-full shrink-0 flex-col gap-3 sm:flex-row md:w-auto">
          <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-6 py-3.5 text-sm font-bold text-white shadow-lg transition-colors hover:bg-zinc-800 hover:shadow-[0_0_20px_rgba(0,0,0,0.1)] active:scale-95 sm:w-auto dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white dark:hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]">
            <PlayCircle size={18} /> Play Video
          </button>

          <button className="flex w-full items-center justify-center rounded-xl border border-zinc-200 bg-zinc-100 px-6 py-3.5 text-sm font-bold text-zinc-900 transition-colors hover:bg-zinc-200 active:scale-95 sm:w-auto dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700">
            Read Transcript
          </button>
        </div>
      </div>
    </div>

    {/* Small Sidebar Info Card */}
    <div className="group hover:border-yellow-primary/30 relative flex flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-linear-to-br from-white to-zinc-50 p-6 transition-all duration-500 md:col-span-3 lg:col-span-1 lg:p-8 dark:border-zinc-800/80 dark:from-zinc-900 dark:to-zinc-950">
      <div className="bg-yellow-primary/10 pointer-events-none absolute top-0 right-0 -mt-16 -mr-16 rounded-full p-12 blur-3xl transition-transform duration-700 group-hover:scale-150" />

      <div className="text-yellow-primary mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-100 shadow-sm transition-transform duration-500 group-hover:scale-110 dark:border-zinc-700 dark:bg-zinc-800/80">
        <Sparkles size={20} />
      </div>

      <h3 className="mb-3 text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Quick Guide</h3>
      <p className="mb-6 text-sm leading-relaxed font-medium text-zinc-600 dark:text-zinc-400">
        A quick, animated guide to building your first video-centric digital business card. Learn how to capture
        attention and track analytics.
      </p>

      <ul className="relative z-10 mt-auto space-y-4 border-t border-zinc-200 pt-6 dark:border-zinc-800/80">
        <li className="flex items-start gap-3">
          <div className="group-hover:bg-yellow-primary mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-400 transition-colors dark:bg-zinc-500" />
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Capture Attention</span>
        </li>
        <li className="flex items-start gap-3">
          <div className="group-hover:bg-yellow-primary mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-400 transition-colors dark:bg-zinc-500" />
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Track Analytics</span>
        </li>
        <li className="flex items-start gap-3">
          <div className="group-hover:bg-yellow-primary mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-400 transition-colors dark:bg-zinc-500" />
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Generate Leads</span>
        </li>
      </ul>
    </div>
  </div>
)

export const BlogSection = () => (
  <div className="vbiz-bento-grid grid w-full grid-cols-1 gap-4 pb-20 md:grid-cols-3 lg:grid-cols-4">
    {/* Featured Article - Takes up 3 cols */}
    <div className="group relative flex min-h-[400px] cursor-pointer flex-col justify-end overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-100 md:col-span-3 lg:col-span-3 dark:border-zinc-800/80 dark:bg-zinc-900">
      {/* Background Image */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1555529733-0e67056058e1?q=80&w=1200&fit=crop')] bg-cover bg-center opacity-30 mix-blend-multiply grayscale transition-transform duration-1000 group-hover:scale-105 dark:opacity-40 dark:mix-blend-overlay" />

      <div className="absolute inset-0 bg-linear-to-t from-zinc-50 via-zinc-100/90 to-transparent dark:from-zinc-950 dark:via-zinc-900/80" />

      <div className="relative z-10 w-full p-8 lg:p-10">
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <span className="rounded-md bg-zinc-900 px-3 py-1.5 text-[10px] font-bold tracking-wider text-white uppercase sm:text-xs dark:bg-zinc-100 dark:text-zinc-950">
            Latest Article
          </span>
          <span className="flex items-center gap-2 text-xs font-medium text-zinc-600 sm:text-sm dark:text-zinc-400">
            <Calendar size={14} /> Sep 22, 2026
          </span>
          <span className="hidden text-zinc-400 sm:block dark:text-zinc-600">•</span>
          <span className="text-xs font-medium text-zinc-600 sm:text-sm dark:text-zinc-400">5 min read</span>
        </div>

        <h2 className="mb-6 max-w-2xl text-3xl leading-[1.1] font-bold tracking-tight text-zinc-900 transition-colors group-hover:text-black sm:text-4xl lg:text-5xl dark:text-zinc-100 dark:group-hover:text-white">
          Impressions That Last —<br className="hidden lg:block" />
          <span className="text-yellow-primary font-medium italic">Connections That Matter.</span>
        </h2>

        <p className="mb-8 max-w-xl text-base leading-relaxed font-medium text-zinc-600 lg:text-lg dark:text-zinc-400">
          Explore actionable insights into building a magnetic digital presence. Learn how to maximize first impressions
          and turn passive networking into active, thriving business relationships.
        </p>

        <div className="mt-auto flex w-full items-center justify-between border-t border-zinc-200 pt-6 md:max-w-xl dark:border-zinc-800/80">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800">
              <span className="font-serif text-lg font-bold text-zinc-900 dark:text-zinc-100">V</span>
            </div>
            <div>
              <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Editorial Team</div>
              <div className="text-yellow-primary mt-0.5 text-[10px] font-bold tracking-wider uppercase">
                vBiz Me insights
              </div>
            </div>
          </div>

          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-lg transition-transform duration-300 group-hover:scale-110 dark:bg-zinc-100 dark:text-zinc-950">
            <ArrowUpRight
              size={20}
              strokeWidth={2.5}
              className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </div>
        </div>
      </div>
    </div>

    {/* Small Sidebar Card */}
    <div className="group relative flex min-h-[300px] flex-col items-center justify-center overflow-hidden rounded-3xl border border-zinc-200 bg-white/50 p-6 backdrop-blur-xl transition-all duration-500 hover:border-zinc-300 md:col-span-3 lg:col-span-1 lg:p-8 dark:border-zinc-800/80 dark:bg-zinc-900/50 dark:hover:border-zinc-700">
      <div className="group-hover:text-yellow-primary mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-100 text-center text-zinc-900 shadow-sm backdrop-blur-md transition-all duration-500 group-hover:-translate-y-1 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-100">
        <BookOpen size={24} />
      </div>

      <h3 className="mb-2 text-center text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
        Stay Updated
      </h3>
      <p className="mb-6 max-w-[200px] text-center text-sm leading-relaxed font-medium text-zinc-600 dark:text-zinc-400">
        Get the latest strategies delivered straight to your inbox.
      </p>

      <button className="flex w-full items-center justify-center rounded-xl border border-zinc-200 bg-zinc-100 py-3.5 text-sm font-bold text-zinc-900 transition-colors hover:bg-zinc-200 active:scale-95 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700">
        Subscribe
      </button>
    </div>
  </div>
)

export const ClientsSection = () => {
  const clients = [
    {
      name: 'Northwind Capital',
      industry: 'Financial Services',
      logo: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=400&fit=crop',
      since: '2019',
    },
    {
      name: 'Summit Health Group',
      industry: 'Healthcare',
      logo: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=400&fit=crop',
      since: '2020',
    },
    {
      name: 'Atlas Logistics',
      industry: 'Supply Chain',
      logo: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=400&fit=crop',
      since: '2021',
    },
    {
      name: 'Brightline Media',
      industry: 'Marketing',
      logo: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=400&fit=crop',
      since: '2018',
    },
    {
      name: 'Vertex Technologies',
      industry: 'Software',
      logo: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?q=80&w=400&fit=crop',
      since: '2022',
    },
    {
      name: 'Harbor Realty',
      industry: 'Real Estate',
      logo: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=400&fit=crop',
      since: '2017',
    },
  ]

  return (
    <div className="w-full pb-20">
      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="group relative flex flex-col items-start justify-between gap-6 overflow-hidden rounded-3xl border border-zinc-200 bg-white/50 p-8 backdrop-blur-xl md:flex-row md:items-center md:gap-0 lg:col-span-4 lg:p-10 dark:border-zinc-800/80 dark:bg-zinc-900/50">
          <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-zinc-100/50 to-transparent dark:from-zinc-800/20" />

          <div className="bg-yellow-primary/10 dark:bg-yellow-primary/5 pointer-events-none absolute top-0 right-0 -mt-32 -mr-32 rounded-full p-32 blur-3xl transition-transform duration-1000 group-hover:scale-110" />
          <div className="pointer-events-none absolute bottom-0 left-0 -mb-24 -ml-24 rounded-full bg-black/5 p-24 blur-3xl transition-transform delay-100 duration-1000 group-hover:scale-110 dark:bg-white/5" />

          <div className="relative z-10 w-full md:w-auto">
            <div className="mb-6 inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-100 px-3 py-1.5 text-[10px] font-bold tracking-wider text-zinc-600 uppercase shadow-sm backdrop-blur-sm transition-colors dark:border-zinc-700/50 dark:bg-zinc-800/80 dark:text-zinc-300">
              <Handshake size={12} className="text-yellow-primary" /> Trusted Partners
            </div>

            <h2 className="mb-4 max-w-2xl text-3xl leading-[1.1] font-bold tracking-tight text-zinc-900 sm:text-4xl lg:text-5xl dark:text-zinc-100">
              Organizations We <span className="text-yellow-primary font-medium italic">Serve</span>
            </h2>
            <p className="max-w-xl text-base leading-relaxed font-medium text-zinc-600 dark:text-zinc-400">
              Proud to partner with forward-thinking companies across industries who trust us to elevate their
              professional presence.
            </p>
          </div>

          <div className="relative z-10 flex flex-col items-start gap-3 md:items-end">
            <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 py-2 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/80">
              <Building2 size={16} className="text-yellow-primary" />
              <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {clients.length}+ Active Clients
              </span>
            </div>
            <button className="flex items-center justify-center gap-3 rounded-xl bg-zinc-900 px-6 py-3.5 font-bold text-white shadow-lg transition-all hover:bg-zinc-800 hover:shadow-[0_0_20px_rgba(0,0,0,0.1)] active:scale-95 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white dark:hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]">
              <span className="text-sm font-bold">Become a Client</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="vbiz-bento-grid relative z-20 mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {clients.map((client, idx) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.08 }}
            key={client.name}
            className="group relative flex flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white/50 shadow-sm backdrop-blur-xl transition-colors duration-300 hover:bg-white/80 dark:border-zinc-800/80 dark:bg-zinc-900/50 dark:hover:bg-zinc-900/80"
          >
            <div className="relative h-36 overflow-hidden bg-zinc-100 dark:bg-zinc-950">
              <div className="absolute inset-0 z-10 bg-linear-to-t from-white to-transparent dark:from-zinc-900" />
              <Image
                width={400}
                height={200}
                src={client.logo}
                alt={client.name}
                className="h-full w-full object-cover opacity-60 grayscale-50 transition-all duration-700 group-hover:scale-105 group-hover:opacity-90 group-hover:grayscale-0"
              />
            </div>

            <div className="relative z-20 -mt-4 flex flex-1 flex-col p-6">
              <h3 className="mb-1 text-lg font-bold text-zinc-900 transition-colors group-hover:text-black dark:text-zinc-100 dark:group-hover:text-white">
                {client.name}
              </h3>
              <p className="text-yellow-primary mb-4 text-[10px] font-bold tracking-wider uppercase">
                {client.industry}
              </p>

              <div className="mt-auto flex items-center justify-between border-t border-zinc-200 pt-4 dark:border-zinc-800/80">
                <div className="flex flex-col">
                  <span className="mb-0.5 text-[10px] font-bold tracking-wider text-zinc-500 uppercase">
                    Partner Since
                  </span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-300">{client.since}</span>
                </div>
                <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-100 shadow-sm transition-colors duration-300 group-hover:bg-zinc-900 group-hover:text-white dark:border-zinc-700 dark:bg-zinc-800 dark:group-hover:bg-zinc-100 dark:group-hover:text-zinc-950">
                  <ExternalLink
                    size={16}
                    className="text-zinc-500 transition-colors group-hover:text-white dark:text-zinc-400 dark:group-hover:text-zinc-950"
                  />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export const MeetOurTeamSection = () => {
  const team = [
    {
      name: 'Sarah Chen',
      role: 'Founder & CEO',
      bio: '15 years building digital products for professionals. Passionate about making every introduction count.',
      img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400&fit=crop',
    },
    {
      name: 'Marcus Rivera',
      role: 'Head of Design',
      bio: 'Crafts premium visual experiences that help brands stand out in crowded markets.',
      img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&fit=crop',
    },
    {
      name: 'Emily Nakamura',
      role: 'Client Success Lead',
      bio: 'Ensures every client gets maximum value from their digital presence and networking tools.',
      img: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=400&fit=crop',
    },
    {
      name: 'David Okonkwo',
      role: 'Engineering Director',
      bio: 'Leads platform development with a focus on performance, security, and seamless user experience.',
      img: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=400&fit=crop',
    },
    {
      name: 'Lisa Park',
      role: 'Marketing Strategist',
      bio: 'Helps professionals tell compelling stories that convert connections into lasting business relationships.',
      img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=400&fit=crop',
    },
    {
      name: 'James Whitfield',
      role: 'Partnerships Manager',
      bio: 'Builds strategic alliances that expand our reach and deliver value to clients worldwide.',
      img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&fit=crop',
    },
  ]

  return (
    <div className="w-full pb-20">
      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="group relative flex flex-col items-start justify-between gap-6 overflow-hidden rounded-3xl border border-zinc-200 bg-white/50 p-8 backdrop-blur-xl md:flex-row md:items-center md:gap-0 lg:col-span-4 lg:p-10 dark:border-zinc-800/80 dark:bg-zinc-900/50">
          <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-zinc-100/50 to-transparent dark:from-zinc-800/20" />

          <div className="bg-yellow-primary/10 dark:bg-yellow-primary/5 pointer-events-none absolute top-0 right-0 -mt-32 -mr-32 rounded-full p-32 blur-3xl transition-transform duration-1000 group-hover:scale-110" />
          <div className="pointer-events-none absolute bottom-0 left-0 -mb-24 -ml-24 rounded-full bg-black/5 p-24 blur-3xl transition-transform delay-100 duration-1000 group-hover:scale-110 dark:bg-white/5" />

          <div className="relative z-10 w-full md:w-auto">
            <div className="mb-6 inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-100 px-3 py-1.5 text-[10px] font-bold tracking-wider text-zinc-600 uppercase shadow-sm backdrop-blur-sm transition-colors dark:border-zinc-700/50 dark:bg-zinc-800/80 dark:text-zinc-300">
              <UsersRound size={12} className="text-yellow-primary" /> Our People
            </div>

            <h2 className="mb-4 max-w-2xl text-3xl leading-[1.1] font-bold tracking-tight text-zinc-900 sm:text-4xl lg:text-5xl dark:text-zinc-100">
              Meet Our <span className="text-yellow-primary font-medium italic">Team</span>
            </h2>
            <p className="max-w-xl text-base leading-relaxed font-medium text-zinc-600 dark:text-zinc-400">
              The dedicated professionals behind your success — experts in design, technology, and client experience.
            </p>
          </div>

          <div className="relative z-10">
            <button className="flex items-center justify-center gap-3 rounded-xl bg-zinc-900 px-6 py-3.5 font-bold text-white shadow-lg transition-all hover:bg-zinc-800 hover:shadow-[0_0_20px_rgba(0,0,0,0.1)] active:scale-95 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white dark:hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]">
              <span className="text-sm font-bold">Join Our Team</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="vbiz-bento-grid relative z-20 mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {team.map((member, idx) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.08 }}
            key={member.name}
            className="group relative flex flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white/50 shadow-sm backdrop-blur-xl transition-colors duration-300 hover:bg-white/80 dark:border-zinc-800/80 dark:bg-zinc-900/50 dark:hover:bg-zinc-900/80"
          >
            <div className="relative h-56 overflow-hidden bg-zinc-100 dark:bg-zinc-950">
              <div className="absolute inset-0 z-10 bg-linear-to-t from-white to-transparent dark:from-zinc-900" />
              <Image
                width={400}
                height={300}
                src={member.img}
                alt={member.name}
                className="h-full w-full object-cover object-top opacity-80 grayscale-30 transition-all duration-700 group-hover:scale-105 group-hover:opacity-100 group-hover:grayscale-0"
              />
            </div>

            <div className="relative z-20 -mt-6 flex flex-1 flex-col p-6">
              <h3 className="mb-1 text-xl font-bold text-zinc-900 transition-colors group-hover:text-black dark:text-zinc-100 dark:group-hover:text-white">
                {member.name}
              </h3>
              <p className="text-yellow-primary mb-3 text-[10px] font-bold tracking-wider uppercase">{member.role}</p>
              <p className="mb-6 text-sm leading-relaxed font-medium text-zinc-600 dark:text-zinc-400">{member.bio}</p>

              <div className="mt-auto flex items-center gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-800/80">
                <button
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-100 text-zinc-600 transition-colors hover:bg-zinc-900 hover:text-white dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-100 dark:hover:text-zinc-950"
                  title="LinkedIn"
                >
                  <Linkedin size={14} />
                </button>
                <button
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-100 text-zinc-600 transition-colors hover:bg-zinc-900 hover:text-white dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-100 dark:hover:text-zinc-950"
                  title="Email"
                >
                  <Mail size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
