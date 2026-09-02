'use client'

/**
 * Shared Public Cards / Global Connections directory.
 * Used by v1, v2, and v3 profile shells — self-contained layout that fits any parent.
 */
import { mapPublicCardProfileUrl, type PublicCardListItem } from '@/lib/api/publicCards/mapPublicCards'
import { PUBLIC_CARDS_SEARCH_DEBOUNCE_MS, PUBLIC_CARDS_SEARCH_MIN_CHARS } from '@/lib/publicCards/publicCardsSearch'
import { usePublicCardsDirectory } from '@/profile-app/hooks/usePublicCardsDirectory'
import { useProfileDisplay } from '@/profile-app/lib/profileDisplayContext'
import { V3ErrorState, V3PreviewAwareText } from '@/profile-app/sections'
import type { PublicCardId, PublicCardsFilterOption } from '@interfaces/api/publicCards'
import {
  Briefcase,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Loader2,
  MapPin,
  Monitor,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

function findOptionName(options: PublicCardsFilterOption[] | undefined, id: PublicCardId | null): string | null {
  if (id == null || id === '') return null
  return options?.find((option) => String(option.id) === String(id))?.name ?? null
}

type DesktopFilterSelectProps = {
  value: PublicCardId | null
  onChange: (val: PublicCardId | null) => void
  options: PublicCardsFilterOption[]
  placeholder: string
  Icon: LucideIcon
  disabled?: boolean
  /** Editor phone preview: the field fills its grid cell instead of sharing a row. */
  compact?: boolean
  className?: string
}

function parseSelectId(raw: string): PublicCardId | null {
  if (!raw) return null
  const asNumber = Number(raw)
  if (Number.isFinite(asNumber) && String(asNumber) === raw) return asNumber
  return raw
}

function DesktopFilterSelect({
  value,
  onChange,
  options,
  placeholder,
  Icon,
  disabled,
  compact,
  className = '',
}: DesktopFilterSelectProps) {
  return (
    <div className={`group relative ${compact ? 'w-full min-w-0' : 'min-w-32.5 flex-1'} ${className}`}>
      <div
        className={`pointer-events-none absolute top-1/2 z-10 -translate-y-1/2 text-zinc-400 transition-colors group-focus-within:text-zinc-200 group-hover:text-zinc-200 ${compact ? 'left-2.5' : 'left-4'}`}
      >
        <Icon size={compact ? 14 : 16} />
      </div>
      <select
        value={value == null ? '' : String(value)}
        disabled={disabled}
        onChange={(e) => onChange(parseSelectId(e.target.value))}
        className={`h-full w-full min-w-0 cursor-pointer appearance-none truncate rounded-xl border border-zinc-300 bg-white font-semibold text-zinc-900 shadow-sm transition-all hover:border-zinc-400 hover:bg-zinc-50 focus:border-[#eab308] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-100 dark:hover:border-zinc-700 dark:hover:bg-zinc-900/80 ${
          compact ? 'py-2.5 pr-7 pl-8 text-[11px]' : 'py-3 pr-10 pl-11 text-xs lg:text-sm'
        }`}
      >
        <option value="" className="bg-white text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">
          {placeholder}
        </option>
        {options.map((opt) => (
          <option
            key={String(opt.id)}
            value={String(opt.id)}
            className="bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100"
          >
            {opt.name}
          </option>
        ))}
      </select>
      <div
        className={`pointer-events-none absolute inset-y-0 right-0 flex items-center text-zinc-400 transition-colors group-hover:text-zinc-600 dark:text-zinc-500 dark:group-hover:text-zinc-300 ${compact ? 'px-2' : 'px-4'}`}
      >
        <ChevronDown size={compact ? 12 : 14} />
      </div>
    </div>
  )
}

type MobileFilterSelectProps = DesktopFilterSelectProps & { label: string }

function MobileFilterSelect({ label, value, onChange, options, placeholder, Icon, disabled }: MobileFilterSelectProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[10px] font-black tracking-widest text-zinc-400 uppercase">{label}</label>
      <div className="group relative w-full">
        <div className="pointer-events-none absolute top-1/2 left-4 z-10 -translate-y-1/2 text-zinc-500 transition-colors group-focus-within:text-zinc-300">
          <Icon size={15} />
        </div>
        <select
          value={value == null ? '' : String(value)}
          disabled={disabled}
          onChange={(e) => onChange(parseSelectId(e.target.value))}
          className="w-full cursor-pointer appearance-none rounded-xl border border-zinc-800 bg-zinc-900/60 py-3 pr-10 pl-11 text-xs font-semibold text-zinc-100 shadow-sm transition-all focus:border-[#eab308] focus:outline-none disabled:cursor-not-allowed disabled:opacity-40"
        >
          <option value="" className="bg-zinc-950 text-zinc-400">
            {placeholder}
          </option>
          {options.map((opt) => (
            <option key={String(opt.id)} value={String(opt.id)} className="bg-zinc-950 text-zinc-100">
              {opt.name}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-zinc-500">
          <ChevronDown size={14} />
        </div>
      </div>
    </div>
  )
}

/** Shared card shell — mobile uses rounded-xl, larger screens use a softer rounded-3xl. */
const CONNECTION_CARD_SHELL =
  'group/card relative flex flex-col overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-900 shadow-xl transition-colors duration-300 md:rounded-3xl'

const CONNECTION_CARD_MEDIA_FIT = 'object-cover object-[center_20%]'

/** Photo area — real card image/video, or initials when the API returns the generic vBiz logo. */
function PublicCardPhoto({
  card,
  className = '',
  imageClassName = '',
}: {
  card: PublicCardListItem
  className?: string
  imageClassName?: string
}) {
  if (card.img && card.isVideo) {
    return (
      <video
        src={card.img}
        autoPlay
        loop
        muted
        playsInline
        className={`h-full w-full ${CONNECTION_CARD_MEDIA_FIT} ${imageClassName}`}
        aria-label={card.name}
      />
    )
  }

  if (card.img) {
    return (
      <Image
        src={card.img}
        alt={card.name}
        fill
        unoptimized
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        className={`${CONNECTION_CARD_MEDIA_FIT} ${imageClassName}`}
      />
    )
  }

  return (
    <div
      className={`flex h-full w-full items-center justify-center bg-linear-to-br from-zinc-800 via-zinc-900 to-zinc-950 ${className}`}
      aria-hidden
    >
      <span className="text-3xl font-black tracking-tight text-[#eab308] md:text-4xl">{card.initials}</span>
    </div>
  )
}

/** Single card design shared by both the grid and the 3D slider. */
function ConnectionCardInner({ card }: { card: PublicCardListItem }) {
  return (
    <>
      {/* Photo — taller flex share so faces/avatars read clearly */}
      <div className="relative min-h-[58%] flex-[1.45] overflow-hidden bg-zinc-950">
        <PublicCardPhoto card={card} imageClassName="transition-all duration-700 group-hover/card:scale-105" />
      </div>

      {/* Details */}
      <div className="relative z-20 flex shrink-0 flex-col items-center gap-2.5 bg-zinc-900 px-4 pt-3 pb-4 text-center md:gap-3 md:px-5 md:pb-5">
        <div className="w-full">
          <h3 className="w-full truncate text-base font-bold text-zinc-100 md:text-lg" title={card.name}>
            {card.name}
          </h3>
          <div
            className="mt-1.5 inline-flex max-w-full items-center gap-1.5 truncate rounded-md border border-zinc-800/80 bg-zinc-950/50 px-2.5 py-1 text-[10px] font-bold tracking-wider text-[#eab308] uppercase"
            title={card.roleLabel}
          >
            <Briefcase size={10} /> {card.roleLabel}
          </div>
        </div>
        <Link
          href={mapPublicCardProfileUrl(card.slug)}
          className="flex w-full items-center justify-center rounded-xl border border-zinc-700/80 bg-zinc-800 py-2.5 text-xs font-bold text-zinc-100 shadow-sm transition-all group-hover/card:bg-zinc-100 group-hover/card:text-zinc-950 hover:bg-zinc-700 active:scale-95"
        >
          View Profile
        </Link>
      </div>
    </>
  )
}

export const PublicCardsSection = () => {
  const {
    cards,
    dropdowns,
    draftFilters,
    hasActiveFilters,
    isLoading,
    isSearching,
    isLoadingMore,
    isPrefetchingAll,
    error,
    hasMore,
    setDraftFilter,
    applyFilters,
    updateAndApplyFilter,
    clearFilters,
    loadMore,
  } = usePublicCardsDirectory()

  /**
   * The editor phone preview is ~420px wide inside a desktop viewport, so `md:`/`lg:`
   * breakpoints would pick the wide layout. Drive layout off the frame instead.
   */
  const { embedded } = useProfileDisplay()
  const compact = embedded

  const [viewMode, setViewMode] = useState<'grid' | 'slider'>('slider')
  const [activeIndex, setActiveIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [mounted, setMounted] = useState(false)
  const serviceDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 0)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    const timer = window.setTimeout(handleResize, 0)
    window.addEventListener('resize', handleResize)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (serviceDebounceRef.current) clearTimeout(serviceDebounceRef.current)
    }
  }, [])

  const handleApplyFilters = useCallback(() => {
    setActiveIndex(0)
    applyFilters()
  }, [applyFilters])

  const handleClearFilters = useCallback(() => {
    setActiveIndex(0)
    clearFilters()
  }, [clearFilters])

  const handleDesktopServiceChange = useCallback(
    (value: string) => {
      setDraftFilter('service', value)
      if (serviceDebounceRef.current) clearTimeout(serviceDebounceRef.current)
      serviceDebounceRef.current = setTimeout(() => {
        const trimmed = value.trim()
        if (trimmed.length > 0 && trimmed.length < PUBLIC_CARDS_SEARCH_MIN_CHARS) return
        updateAndApplyFilter('service', value)
        setActiveIndex(0)
      }, PUBLIC_CARDS_SEARCH_DEBOUNCE_MS)
    },
    [setDraftFilter, updateAndApplyFilter]
  )

  const handleDesktopFilterChange = useCallback(
    <K extends 'stateId' | 'cityId' | 'professionId'>(key: K, value: PublicCardId | null) => {
      updateAndApplyFilter(key, value)
      setActiveIndex(0)
    },
    [updateAndApplyFilter]
  )

  const selectedStateName = findOptionName(dropdowns.states, draftFilters.stateId)
  const selectedCityName = findOptionName(dropdowns.cities, draftFilters.cityId)
  const selectedProfessionName = findOptionName(dropdowns.professions, draftFilters.professionId)

  /** Phone-sized layout: a real mobile viewport or the editor preview frame. */
  const isNarrow = compact || isMobile

  const sliderActiveIndex = cards.length === 0 ? 0 : Math.min(activeIndex, cards.length - 1)

  useEffect(() => {
    if (viewMode !== 'slider' || !hasMore || isLoadingMore || isPrefetchingAll) return
    if (sliderActiveIndex >= cards.length - 2) {
      void loadMore()
    }
  }, [cards.length, hasMore, isLoadingMore, isPrefetchingAll, loadMore, sliderActiveIndex, viewMode])

  const nextCard = () => {
    if (cards.length <= 1) return
    if (isTransitioning) return
    setIsTransitioning(true)
    setActiveIndex((prev) => (prev + 1) % cards.length)
    setTimeout(() => setIsTransitioning(false), 350)
  }

  const prevCard = () => {
    if (cards.length <= 1) return
    if (isTransitioning) return
    setIsTransitioning(true)
    setActiveIndex((prev) => (prev - 1 + cards.length) % cards.length)
    setTimeout(() => setIsTransitioning(false), 350)
  }

  const showInitialLoader = isLoading && cards.length === 0
  const showEmptyState = !isLoading && !isPrefetchingAll && !error && cards.length === 0

  const viewToggle = (
    <div
      className={`inline-flex items-center rounded-xl border border-zinc-200 bg-white/80 p-1 shadow-2xl backdrop-blur-xl dark:border-zinc-800/80 dark:bg-black/60 ${compact ? 'shadow-md' : ''}`}
    >
      <button
        onClick={() => setViewMode('slider')}
        className={`flex items-center gap-1.5 rounded-lg text-[10px] font-black transition-all duration-300 ${compact ? 'px-2.5 py-1.5' : 'px-3 py-1.5 md:px-4 md:py-2 md:text-xs'} ${viewMode === 'slider' ? 'bg-[#eab308] text-black shadow-sm' : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white'}`}
      >
        <Monitor size={12} className={compact ? '' : 'md:h-3.5 md:w-3.5'} />
        <span>Slider</span>
      </button>
      <button
        onClick={() => setViewMode('grid')}
        className={`flex items-center gap-1.5 rounded-lg text-[10px] font-black transition-all duration-300 ${compact ? 'px-2.5 py-1.5' : 'px-3 py-1.5 md:px-4 md:py-2 md:text-xs'} ${viewMode === 'grid' ? 'bg-[#eab308] text-black shadow-sm' : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white'}`}
      >
        <LayoutGrid size={12} className={compact ? '' : 'md:h-3.5 md:w-3.5'} />
        <span>Grid</span>
      </button>
    </div>
  )

  return (
    <div className="vbiz-public-cards-section isolate w-full max-w-full overflow-hidden pb-20">
      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-4">
        {/* Header Card / Banner — theme-aware solid background (no video) */}
        <div
          className={`vbiz-public-cards-banner group relative flex w-full flex-col overflow-hidden rounded-4xl border shadow-xl md:rounded-[2.5rem] lg:col-span-4 ${
            compact ? '' : 'min-h-[26vh] sm:min-h-[28vh] md:min-h-[24vh] lg:min-h-[24vh]'
          }`}
        >
          {/* Accessible background — follows card light/dark, not the admin dashboard */}
          <div className="absolute inset-0 z-0 h-full w-full">
            <div className="vbiz-public-cards-banner-wash absolute inset-0" />
            <div className="vbiz-public-cards-banner-accent absolute inset-0 hidden md:block md:w-2/3" />
          </div>

          {/* View Toggle — floats over the banner when there is room, in-flow inside the phone preview */}
          {compact ? null : (
            <div className="absolute top-4 right-4 z-20 md:top-8 md:right-8 lg:top-10 lg:right-10">{viewToggle}</div>
          )}

          {/* Content overlay */}
          <div
            className={`relative z-10 flex h-full w-full grow flex-col justify-end ${
              compact ? 'gap-2.5 p-2.5' : 'p-0 sm:p-7 md:p-8 lg:px-12 lg:py-9'
            }`}
          >
            {compact ? <div className="flex w-full justify-end">{viewToggle}</div> : null}
            <div className="mt-auto flex w-full max-w-7xl flex-col items-start justify-between gap-4 md:gap-5">
              <div className="flex max-w-2xl flex-col gap-2 md:gap-2.5">
                <div className="inline-flex items-center gap-1.5 self-start rounded-full border border-[#eab308]/30 bg-[#eab308]/15 px-3 py-1 text-[9px] font-bold tracking-wider text-[#eab308] uppercase shadow-md backdrop-blur-md md:text-xs">
                  <Users size={12} className="text-[#eab308]" /> Global Connections Directory
                </div>

                <h2
                  className={`leading-[1.05] font-black tracking-tight text-zinc-900 dark:text-white ${
                    compact ? 'text-2xl' : 'text-2xl sm:text-3xl md:text-4xl lg:text-4xl'
                  }`}
                >
                  Global{' '}
                  <span className="bg-linear-to-r from-[#eab308] to-yellow-500 bg-clip-text text-transparent italic">
                    Connections
                  </span>
                </h2>
                <p className="max-w-xl text-[12px] leading-normal font-medium text-zinc-600 sm:text-xs md:text-sm dark:text-zinc-300">
                  Discover and connect with top-tier verified professionals across the United States. Filter instantly
                  by state, city, and industry sector to find valuable prospects.
                </p>
                {hasMore ? (
                  <button
                    type="button"
                    onClick={() => void loadMore()}
                    disabled={isLoadingMore || isPrefetchingAll}
                    className="inline-flex items-center gap-1.5 self-start rounded-lg border border-[#eab308]/40 bg-[#eab308]/15 px-3 py-1.5 text-[10px] font-bold text-[#b8940f] transition-all hover:border-[#eab308]/60 hover:bg-[#eab308]/25 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 sm:text-xs dark:text-[#eab308]"
                  >
                    {isLoadingMore || isPrefetchingAll ? <Loader2 size={12} className="animate-spin" /> : null}
                    Load more
                  </button>
                ) : null}
              </div>

              {/* Filter bar — one row on wide screens, two-column stack inside the phone preview */}
              <div
                className={`w-full border-t border-zinc-200 pt-4 dark:border-zinc-800/80 ${
                  compact ? 'grid grid-cols-2 gap-2' : 'hidden items-center gap-3 md:flex'
                }`}
              >
                <DesktopFilterSelect
                  value={draftFilters.stateId}
                  onChange={(value) => handleDesktopFilterChange('stateId', value)}
                  options={dropdowns.states ?? []}
                  placeholder="All States"
                  Icon={MapPin}
                  compact={compact}
                />
                <DesktopFilterSelect
                  value={draftFilters.cityId}
                  onChange={(value) => handleDesktopFilterChange('cityId', value)}
                  options={dropdowns.cities ?? []}
                  placeholder="All Cities"
                  Icon={MapPin}
                  disabled={!draftFilters.stateId}
                  compact={compact}
                />
                <DesktopFilterSelect
                  value={draftFilters.professionId}
                  onChange={(value) => handleDesktopFilterChange('professionId', value)}
                  options={dropdowns.professions ?? []}
                  placeholder="All Professions"
                  Icon={Briefcase}
                  compact={compact}
                  className={compact ? 'col-span-2' : ''}
                />

                <div className={`group relative w-full ${compact ? 'col-span-2 min-w-0' : 'min-w-45 flex-[1.5]'}`}>
                  <div
                    className={`absolute top-1/2 z-10 -translate-y-1/2 text-zinc-400 transition-colors group-focus-within:text-zinc-600 dark:text-zinc-500 dark:group-focus-within:text-zinc-300 ${compact ? 'left-2.5' : 'left-4'}`}
                  >
                    <Search size={compact ? 14 : 16} />
                  </div>
                  <input
                    type="text"
                    value={draftFilters.service}
                    onChange={(e) => handleDesktopServiceChange(e.target.value)}
                    placeholder={
                      compact
                        ? 'Search name or profession…'
                        : `Search name or profession (${PUBLIC_CARDS_SEARCH_MIN_CHARS}+ letters)…`
                    }
                    className={`w-full min-w-0 rounded-xl border border-zinc-300 bg-white font-medium text-zinc-900 shadow-sm transition-all placeholder:text-zinc-400 hover:border-zinc-400 hover:bg-zinc-50 focus:border-[#eab308] focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:hover:border-zinc-700 dark:hover:bg-zinc-900/80 ${
                      compact ? 'py-2.5 pr-3 pl-8 text-[11px]' : 'py-3 pr-4 pl-11 text-xs lg:text-sm'
                    }`}
                  />
                </div>

                {(hasActiveFilters || isSearching) && (
                  <button
                    onClick={handleClearFilters}
                    disabled={isSearching}
                    className={`flex shrink-0 items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white font-bold text-zinc-600 transition-all hover:border-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 active:scale-95 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-white ${
                      compact ? 'col-span-2 w-full py-2.5 text-[11px]' : 'px-4 py-3.5 text-xs'
                    }`}
                    title="Reset All Filters"
                  >
                    {isSearching ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                    {compact ? <span>Reset filters</span> : null}
                  </button>
                )}
              </div>

              {/* Mobile Search & Filter trigger — real phones only; the preview shows the inline filters above */}
              <div
                className={`mt-1 w-full gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-800/50 ${
                  compact ? 'hidden' : 'flex md:hidden'
                }`}
              >
                <button
                  onClick={() => setIsFilterOpen(true)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-3 text-xs font-extrabold text-zinc-900 shadow-md backdrop-blur-md transition-all active:scale-95 dark:border-white/10 dark:bg-white/5 dark:text-white"
                >
                  <SlidersHorizontal size={14} className="text-[#eab308]" />
                  <span>Search & Filter Directory</span>
                  {hasActiveFilters && <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#eab308]" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile View Active Filters Bar (if filtered but popup is closed) */}
      {isMobile && hasActiveFilters && (
        <div className="mt-2 flex w-full items-center justify-between gap-2 rounded-xl border border-zinc-900 bg-zinc-950/40 p-3 md:hidden">
          <div className="flex max-w-[80%] flex-wrap gap-1.5">
            {selectedStateName && (
              <span className="rounded-md border border-[#eab308]/20 bg-[#eab308]/10 px-2 py-0.5 text-[10px] text-[#eab308]">
                {selectedStateName}
              </span>
            )}
            {selectedCityName && (
              <span className="rounded-md border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[10px] text-zinc-300">
                {selectedCityName}
              </span>
            )}
            {selectedProfessionName && (
              <span className="rounded-md border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[10px] text-zinc-300">
                {selectedProfessionName}
              </span>
            )}
            {draftFilters.service.trim() !== '' && (
              <span className="max-w-25 truncate rounded-md border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[10px] text-zinc-300">
                &ldquo;{draftFilters.service}&rdquo;
              </span>
            )}
          </div>
          <button
            onClick={handleClearFilters}
            className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 hover:text-white active:scale-95"
          >
            <RotateCcw size={10} /> Reset
          </button>
        </div>
      )}

      {/* Mobile Filter Overlay Modal - bottom sheet rendered at viewport level via portal */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {isFilterOpen && (
              <div className="fixed inset-0 z-9999 flex items-end justify-center p-0">
                {/* Backdrop Blur */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsFilterOpen(false)}
                  className="absolute inset-0 bg-black/85 backdrop-blur-md"
                />

                {/* Dialog container - bottom drawer that slides up like a mobile app sheet */}
                <motion.div
                  initial={{ opacity: 0, y: '100%' }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                  className="relative z-10 flex max-h-[85vh] w-full flex-col gap-4 overflow-hidden rounded-t-[2.5rem] border-t border-zinc-800 bg-zinc-950 p-6 shadow-2xl"
                >
                  {/* Drag indicator bar */}
                  <div className="mx-auto -mt-2 mb-2 h-1 w-12 shrink-0 rounded-full bg-zinc-800" />

                  {/* Top bar */}
                  <div className="flex shrink-0 items-center justify-between border-b border-zinc-900 pb-3">
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal size={16} className="text-[#eab308]" />
                      <h3 className="text-base font-black text-white">Filter Connections</h3>
                    </div>
                    <button
                      onClick={() => setIsFilterOpen(false)}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 text-zinc-400 transition-all hover:text-white active:scale-95"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Scrollable Filter Chips Area */}
                  <div className="flex-1 space-y-5 overflow-y-auto py-2 pr-1 select-none">
                    {/* Keyword Search */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black tracking-widest text-zinc-400 uppercase">
                        Keyword Search
                      </label>
                      <div className="group relative w-full">
                        <div className="absolute top-1/2 left-4 z-10 -translate-y-1/2 text-zinc-500 transition-colors group-focus-within:text-zinc-300">
                          <Search size={15} />
                        </div>
                        <input
                          type="text"
                          value={draftFilters.service}
                          onChange={(e) => setDraftFilter('service', e.target.value)}
                          placeholder={`Search name or profession (${PUBLIC_CARDS_SEARCH_MIN_CHARS}+ letters)…`}
                          className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 py-3 pr-4 pl-11 text-xs font-semibold text-zinc-100 shadow-sm transition-all placeholder:text-zinc-500 focus:border-[#eab308] focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* State Select */}
                    <MobileFilterSelect
                      label="Filter by State"
                      value={draftFilters.stateId}
                      onChange={(value) => setDraftFilter('stateId', value)}
                      options={dropdowns.states ?? []}
                      placeholder="All States"
                      Icon={MapPin}
                    />

                    {/* City Select */}
                    <MobileFilterSelect
                      label="Filter by City"
                      value={draftFilters.cityId}
                      onChange={(value) => setDraftFilter('cityId', value)}
                      options={dropdowns.cities ?? []}
                      placeholder="All Cities"
                      Icon={MapPin}
                      disabled={!draftFilters.stateId}
                    />

                    {/* Profession Select */}
                    <MobileFilterSelect
                      label="Filter by Profession"
                      value={draftFilters.professionId}
                      onChange={(value) => setDraftFilter('professionId', value)}
                      options={dropdowns.professions ?? []}
                      placeholder="All Professions"
                      Icon={Briefcase}
                    />
                  </div>

                  {/* Bottom action bar */}
                  <div className="flex shrink-0 gap-2 border-t border-zinc-900 pt-3">
                    <button
                      onClick={handleClearFilters}
                      className="hover:bg-zinc-850 flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 py-3.5 text-xs font-bold text-zinc-300 transition-all active:scale-95"
                    >
                      <RotateCcw size={13} /> Reset
                    </button>
                    <button
                      onClick={() => {
                        handleApplyFilters()
                        setIsFilterOpen(false)
                      }}
                      disabled={isSearching}
                      className="flex flex-2 items-center justify-center gap-1.5 rounded-xl bg-[#eab308] py-3.5 text-xs font-black text-zinc-950 shadow-lg shadow-yellow-500/10 transition-all hover:bg-yellow-500 active:scale-95 disabled:opacity-60"
                    >
                      {isSearching || isPrefetchingAll ? <Loader2 size={13} className="animate-spin" /> : 'Apply'}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}

      {error ? (
        embedded ? (
          <V3ErrorState sectionTitle="Public Cards" />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10 mt-6 flex w-full flex-col items-center justify-center rounded-4xl border border-red-900/40 bg-red-950/20 px-4 py-16 text-center"
          >
            <h3 className="text-lg font-bold text-white">Unable to Load Connections</h3>
            <p className="mt-1.5 max-w-sm text-xs text-red-300/80">
              Public profiles could not be loaded right now. Please try again in a moment.
            </p>
          </motion.div>
        )
      ) : showInitialLoader ? (
        <div className="relative z-20 mt-8 flex justify-center py-20">
          <Loader2 size={32} className="animate-spin text-[#eab308]" />
        </div>
      ) : showEmptyState ? (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 mt-6 flex w-full flex-col items-center justify-center rounded-4xl border border-zinc-900 bg-zinc-950/20 px-4 py-20 text-center"
        >
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 text-[#eab308]">
            <Users size={24} />
          </div>
          <h3 className="text-lg font-bold text-white">No Connections Match Your Filters</h3>
          <p className="mt-1.5 max-w-sm text-xs text-zinc-400">
            {hasActiveFilters ? (
              'Try resetting your selected search keyword, city, state, or profession filters to browse other top members.'
            ) : (
              <V3PreviewAwareText published="No public profiles are available right now." />
            )}
          </p>
          {hasActiveFilters ? (
            <button
              onClick={handleClearFilters}
              className="mt-6 flex items-center gap-1.5 rounded-xl bg-[#eab308] px-5 py-2.5 text-xs font-bold text-zinc-950 transition-all hover:bg-yellow-500 active:scale-95"
            >
              <RotateCcw size={12} /> Clear Filter Settings
            </button>
          ) : null}
        </motion.div>
      ) : viewMode === 'grid' ? (
        /* Grid of Connections */
        <div
          className={`relative z-20 mt-6 grid gap-4 ${
            compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
          }`}
        >
          {cards.map((card, idx) => (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6, delay: (idx % 8) * 0.08, ease: 'easeOut' }}
              key={card.id}
              className={`${CONNECTION_CARD_SHELL} h-[27rem] cursor-pointer hover:border-zinc-700 sm:h-[28.75rem]`}
            >
              <ConnectionCardInner card={card} />
            </motion.div>
          ))}
        </div>
      ) : (
        /* Cinematic Unified 3D Slider Area with swipe & drag on both mobile and desktop! */
        <div
          className={`relative z-20 mt-6 flex flex-1 flex-col items-center justify-center perspective-[1600px] ${
            compact ? 'min-h-[560px]' : 'min-h-[560px] md:min-h-[35rem]'
          }`}
        >
          {/* Navigation arrows (floating desktop layout — hidden on phone widths for a cleaner look) */}
          <div
            className={`pointer-events-none absolute top-1/2 z-40 w-full max-w-270 -translate-y-1/2 justify-between px-2 ${
              compact ? 'hidden' : 'hidden md:flex'
            }`}
          >
            <button
              onClick={prevCard}
              disabled={cards.length <= 1}
              className="group pointer-events-auto flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/90 text-zinc-100 shadow-lg backdrop-blur-md transition-all hover:bg-[#eab308] hover:text-zinc-950 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={20} className="transition-transform group-hover:-translate-x-0.5" />
            </button>
            <button
              onClick={nextCard}
              disabled={cards.length <= 1}
              className="group pointer-events-auto flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/90 text-zinc-100 shadow-lg backdrop-blur-md transition-all hover:bg-[#eab308] hover:text-zinc-950 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight size={20} className="transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>

          {/* Swipeable Draggable 3D Card Stack Container */}
          <motion.div
            drag={cards.length > 1 ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.4}
            onDragEnd={(e, info) => {
              const threshold = 55
              if (info.offset.x < -threshold) {
                nextCard()
              } else if (info.offset.x > threshold) {
                prevCard()
              }
            }}
            className="transform-style-3d relative flex w-full max-w-250 cursor-grab items-center justify-center overflow-hidden select-none active:cursor-grabbing"
            style={{ height: isNarrow ? '520px' : '500px' }}
          >
            <AnimatePresence initial={false}>
              {cards.map((card, idx) => {
                const offset = idx - sliderActiveIndex
                const absOffset = Math.abs(offset)
                const direction = Math.sign(offset)

                // Mobile: one card at a time. Desktop: keep a shallow 3D peek of neighbors.
                if (isNarrow ? absOffset > 0 : absOffset > 2) return null

                const cardWidth = isNarrow ? 300 : 304
                const cardHeight = isNarrow ? 500 : 480
                const mediaHeight = isNarrow ? 360 : 340
                const detailsHeight = isNarrow ? 140 : 140

                const xTranslate = isNarrow ? 0 : offset === 0 ? 0 : direction * (absOffset * 130 + 80)

                const zTranslate = isNarrow ? 0 : offset === 0 ? 80 : -absOffset * 110
                const yRotate = isNarrow ? 0 : offset === 0 ? 0 : direction * -22
                const scale = isNarrow ? 1 : absOffset === 0 ? 1 : Math.max(0.75, 1 - absOffset * 0.12)

                const zIndex = 50 - absOffset
                const opacity = absOffset === 2 ? 0.6 : 1

                return (
                  <motion.div
                    key={card.id}
                    onMouseMove={(e) => {
                      if (isNarrow) return
                      const rect = e.currentTarget.getBoundingClientRect()
                      const x = e.clientX - rect.left
                      const y = e.clientY - rect.top
                      e.currentTarget.style.setProperty('--mouse-x', `${(x / rect.width - 0.5) * -12}px`)
                      e.currentTarget.style.setProperty('--mouse-y', `${(y / rect.height - 0.5) * -12}px`)
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
                      type: 'spring',
                      damping: 24,
                      stiffness: 160,
                    }}
                    onClick={() => {
                      if (absOffset !== 0) {
                        setActiveIndex(idx)
                      }
                    }}
                    className="transform-style-3d group/card absolute cursor-pointer overflow-hidden rounded-4xl border border-zinc-800/80 bg-zinc-900 shadow-2xl transition-colors duration-300"
                    style={{
                      width: `${cardWidth}px`,
                      height: `${cardHeight}px`,
                    }}
                  >
                    {/* Loading overlay */}
                    <AnimatePresence>
                      {isTransitioning && absOffset === 0 && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center bg-zinc-950/45 backdrop-blur-[2px]"
                        >
                          <Loader2 size={isNarrow ? 24 : 32} className="animate-spin text-[#eab308]" />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Background Dimmer for unfocused cards */}
                    <motion.div
                      animate={{ backgroundColor: absOffset === 0 ? 'rgba(24,24,27,0)' : 'rgba(24,24,27,0.72)' }}
                      className="pointer-events-none absolute inset-0 z-20 transition-colors duration-500"
                    />

                    {/* Connection Photo */}
                    <div className="relative w-full overflow-hidden bg-zinc-950" style={{ height: `${mediaHeight}px` }}>
                      <motion.div
                        className="absolute inset-0 h-full w-full translate-x-(--mouse-x,0px) translate-y-(--mouse-y,0px) overflow-hidden"
                        animate={{ scale: absOffset === 0 ? 1 : 1.05 }}
                        transition={{ duration: 0.5 }}
                      >
                        <PublicCardPhoto
                          card={card}
                          imageClassName="transition-transform duration-300 ease-out group-hover/card:scale-105"
                        />
                      </motion.div>
                    </div>

                    {/* Connection Text Details */}
                    <div
                      className={`relative z-20 flex flex-col items-center justify-between border-t border-zinc-800/60 bg-zinc-900 ${compact ? 'p-4' : 'p-4 md:p-6'}`}
                      style={{ height: `${detailsHeight}px` }}
                    >
                      <div className="w-full text-center">
                        <h4
                          className={`w-full truncate px-1 text-sm font-extrabold text-zinc-100 ${compact ? '' : 'md:text-xl'}`}
                          title={card.name}
                        >
                          {card.name}
                        </h4>
                        <p
                          className={`mt-1 w-full truncate px-1 text-[9px] font-black tracking-wider text-[#eab308] uppercase ${compact ? '' : 'md:text-xs'}`}
                          title={card.roleLabel}
                        >
                          {card.roleLabel}
                        </p>
                      </div>

                      <Link
                        href={mapPublicCardProfileUrl(card.slug)}
                        className={`mt-2 flex w-full items-center justify-center rounded-xl border border-zinc-700/80 bg-zinc-800 py-2 text-[10px] font-black text-zinc-100 shadow-sm transition-all group-hover/card:bg-zinc-100 group-hover/card:text-zinc-950 hover:bg-zinc-700 active:scale-95 ${compact ? '' : 'md:py-3.5 md:text-xs'}`}
                      >
                        View Profile
                      </Link>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </motion.div>

          {/* Uniform Slider Controller (dots & responsive buttons) — above cards on phone widths, below on desktop */}
          <div
            className={`flex w-full max-w-105 shrink-0 items-center justify-between px-4 select-none ${
              compact ? 'order-first mb-4' : 'order-first mb-4 md:order-0 md:mt-6 md:mb-0'
            }`}
          >
            {/* Prev Button */}
            <button
              onClick={prevCard}
              disabled={cards.length <= 1}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition-all hover:bg-white/10 hover:text-white active:scale-90 disabled:cursor-not-allowed disabled:opacity-20"
            >
              <ChevronLeft size={18} />
            </button>

            {/* Centered Dots Indicator */}
            <div className="no-scrollbar flex max-w-[60%] items-center gap-1.5 overflow-x-auto scroll-smooth py-1.5">
              {cards.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    if (!isTransitioning) {
                      setIsTransitioning(true)
                      setActiveIndex(idx)
                      setTimeout(() => setIsTransitioning(false), 350)
                    }
                  }}
                  className={`h-1.5 shrink-0 rounded-full transition-all duration-300 ${idx === sliderActiveIndex ? 'w-5 bg-[#eab308]' : 'w-1.5 bg-zinc-700 hover:bg-zinc-600'}`}
                  title={`Navigate to connection ${idx + 1}`}
                />
              ))}
            </div>

            {/* Next Button */}
            <button
              onClick={nextCard}
              disabled={cards.length <= 1}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition-all hover:bg-white/10 hover:text-white active:scale-90 disabled:cursor-not-allowed disabled:opacity-20"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Custom CSS for 3D Perspective & Hidden Scrollbars */}
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
              .no-scrollbar::-webkit-scrollbar {
                 display: none;
              }
              .no-scrollbar {
                 -ms-overflow-style: none;
                 scrollbar-width: none;
              }
            `,
        }}
      />
    </div>
  )
}
