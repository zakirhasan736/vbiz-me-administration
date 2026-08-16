'use client'

import { useVCard } from '@/lib/VCardContext'
import { resolveGlobalProfession } from '@/profile-app/lib/profileHomeData'
import { cn } from '@/utils/cn'
import { Briefcase, CheckCircle, Link2, Phone, Save, Share2, X } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useState } from 'react'

export function VCardPreview({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { vCardData } = useVCard()
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)

  // Prevent background scroll when modal open on mobile
  useEffect(() => {
    if (isOpen && window.innerWidth < 640) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'auto'
    }
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleShare = () => {
    const url = `vbiz.me/${vCardData.slug || vCardData.personal.fullName.toLowerCase().replace(/\\s+/g, '-') || 'my-vcard'}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSaveContact = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000) // Increased timeout a bit for the toast
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-0">
      {/* Backdrop */}
      <div
        className="pointer-events-auto absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity sm:hidden dark:bg-black/60"
        onClick={onClose}
      />

      {/* Preview Device Wrapper */}
      <div className="animate-in slide-in-from-bottom-10 sm:slide-in-from-right-10 pointer-events-auto relative z-100 flex h-full max-h-[90vh] w-full max-w-90 flex-col overflow-hidden rounded-[48px] border-slate-200/80 bg-white shadow-[0_30px_60px_-12px_rgba(0,0,0,0.25)] duration-500 ease-[0.23,1,0.32,1] sm:fixed sm:right-8 sm:bottom-24 sm:h-180 sm:border-10 dark:border-[#1e2333] dark:bg-[#0b0f19]">
        {/* Success Toast Overlay */}
        <div
          className={cn(
            'pointer-events-none absolute top-16 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center transition-all duration-300',
            saved ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
          )}
        >
          <div className="flex items-center gap-2 rounded-2xl bg-emerald-500 px-4 py-2.5 text-white shadow-[0_8px_30px_rgba(16,185,129,0.3)] backdrop-blur-md">
            <CheckCircle className="h-4 w-4" />
            <span className="text-[13px] font-bold tracking-wide">Contact Saved Successfully!</span>
          </div>
        </div>

        {/* Phone notch (modern dynamic island) */}
        <div className="pointer-events-none absolute inset-x-0 top-2 z-30 hidden h-7 justify-center sm:flex">
          <div className="flex h-full w-30 items-center justify-between rounded-full bg-slate-800 px-3 shadow-sm dark:bg-black">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 opacity-60"></div>
            <div className="flex h-2.5 w-2.5 items-center justify-center rounded-full bg-slate-700/50 dark:bg-white/10">
              <div className="h-1 w-1 rounded-full bg-slate-900 dark:bg-black"></div>
            </div>
          </div>
        </div>

        {/* Header / Actions */}
        <div className="absolute top-6 right-6 z-30 sm:hidden">
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-black/5 bg-white/50 text-slate-900 shadow-sm backdrop-blur-xl transition-all hover:bg-white/80 dark:border-white/10 dark:bg-black/50 dark:text-white dark:hover:bg-black/80"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Preview Content */}
        <div className="no-scrollbar relative flex flex-1 flex-col items-center overflow-y-auto scroll-smooth bg-slate-50 dark:bg-[#070a13]">
          {/* Header Banner Background */}
          <div className="from-primary-500/20 dark:from-primary-500/10 pointer-events-none absolute inset-x-0 top-0 h-48 bg-linear-to-b to-transparent"></div>

          {/* Profile Image */}
          <div className="relative z-10 mt-24 mb-6 flex w-full justify-center px-8">
            <div className="relative h-36 w-36">
              <div className="bg-primary-500/20 dark:bg-primary-500/10 absolute inset-0 scale-125 rounded-full blur-2xl"></div>
              <Image
                src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80"
                alt="Profile"
                className="relative z-10 h-full w-full rotate-3 rounded-[38px] border-[6px] border-white object-cover shadow-xl transition-transform duration-500 hover:rotate-0 dark:border-[#0b0f19]"
                width={200}
                height={200}
              />
              <div className="absolute -right-1 -bottom-1 z-20 h-6 w-6 rounded-full border-[3px] border-white bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)] dark:border-[#0b0f19]"></div>
            </div>
          </div>

          {/* Info */}
          <div className="z-10 flex w-full flex-col items-center px-8 text-center">
            <h2 className="mb-2 text-[28px] leading-tight font-black tracking-tight text-slate-900 dark:text-white">
              {vCardData.personal.fullName || 'Your Name'}
            </h2>
            <p className="text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-500/10 border-primary-100 dark:border-primary-500/20 mb-4 inline-flex rounded-full border px-4 py-1.5 text-[12px] font-bold tracking-[0.2em] uppercase shadow-sm">
              {resolveGlobalProfession(vCardData.personal) || 'Profession'}
            </p>
            <p className="mb-6 text-[15px] leading-relaxed font-medium text-slate-600 dark:text-slate-400">
              {vCardData.personal.about || 'Making Power Moves Electric'}
            </p>
          </div>

          {/* Contact Details Cards */}
          <div className="z-10 mb-8 w-full space-y-3 px-6">
            <div className="flex items-center gap-4 rounded-3xl border border-slate-200/60 bg-white p-4 shadow-sm dark:border-white/5 dark:bg-[#0b0f19]">
              <div className="bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl">
                <Phone className="h-5 w-5" />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="mb-0.5 text-[11px] font-bold tracking-wider text-slate-400 uppercase">Mobile Phone</p>
                <p className="truncate text-[15px] font-bold text-slate-900 dark:text-white">
                  {vCardData.personal.phone || '+1 (555) 000-0000'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-3xl border border-slate-200/60 bg-white p-4 shadow-sm dark:border-white/5 dark:bg-[#0b0f19]">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400">
                <Briefcase className="h-5 w-5" />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="mb-0.5 text-[11px] font-bold tracking-wider text-slate-400 uppercase">Company</p>
                <p className="truncate text-[15px] font-bold text-slate-900 dark:text-white">
                  {vCardData.personal.company || 'Power Moves Inc.'}
                </p>
              </div>
            </div>
          </div>

          {/* Floating Action Buttons Grid */}
          <div className="z-10 mb-8 grid w-full grid-cols-4 gap-3 px-6">
            <button onClick={() => {}} className="flex flex-col items-center justify-center gap-2">
              <div className="group relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-[20px] border border-slate-200/60 bg-white text-slate-700 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:scale-110 hover:shadow-[0_8px_20px_rgba(0,0,0,0.08)] dark:border-white/5 dark:bg-[#0b0f19] dark:text-slate-300">
                <div className="bg-primary-500/10 absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"></div>
                <Briefcase className="z-10 h-6 w-6" strokeWidth={1.5} />
              </div>
              <span className="text-[10px] font-bold tracking-wide text-slate-500 uppercase">Portfolio</span>
            </button>
            <button onClick={() => {}} className="flex flex-col items-center justify-center gap-2">
              <div className="group relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-[20px] border border-slate-200/60 bg-white text-slate-700 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:scale-110 hover:shadow-[0_8px_20px_rgba(0,0,0,0.08)] dark:border-white/5 dark:bg-[#0b0f19] dark:text-slate-300">
                <div className="bg-primary-500/10 absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"></div>
                <Phone className="z-10 h-6 w-6" strokeWidth={1.5} />
              </div>
              <span className="text-[10px] font-bold tracking-wide text-slate-500 uppercase">Call</span>
            </button>
            <button onClick={() => {}} className="flex flex-col items-center justify-center gap-2">
              <div className="group relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-[20px] border border-slate-200/60 bg-white text-slate-700 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:scale-110 hover:shadow-[0_8px_20px_rgba(0,0,0,0.08)] dark:border-white/5 dark:bg-[#0b0f19] dark:text-slate-300">
                <div className="bg-primary-500/10 absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"></div>
                <Link2 className="z-10 h-6 w-6" strokeWidth={1.5} />
              </div>
              <span className="text-[10px] font-bold tracking-wide text-slate-500 uppercase">Links</span>
            </button>
            <button onClick={handleShare} className="flex flex-col items-center justify-center gap-2">
              <div
                className={cn(
                  'group relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-[20px] border shadow-sm transition-all duration-300 hover:-translate-y-1 hover:scale-110',
                  copied
                    ? 'border-emerald-500 bg-emerald-500 text-white shadow-[0_8px_20px_rgba(16,185,129,0.3)]'
                    : 'bg-primary-600 border-primary-500 text-white shadow-[0_8px_20px_rgba(var(--primary-600),0.3)]'
                )}
              >
                <div className="absolute inset-0 bg-white/20 opacity-0 transition-opacity group-hover:opacity-100"></div>
                {copied ? (
                  <CheckCircle className="z-10 h-6 w-6" strokeWidth={2} />
                ) : (
                  <Share2 className="z-10 h-6 w-6" strokeWidth={1.5} />
                )}
              </div>
              <span
                className={cn(
                  'text-[10px] font-bold tracking-wide uppercase',
                  copied ? 'text-emerald-500' : 'text-primary-600 dark:text-primary-400'
                )}
              >
                {copied ? 'Copied!' : 'Share'}
              </span>
            </button>
          </div>

          {/* Spacer for bottom fixed button */}
          <div className="h-32"></div>
        </div>

        {/* Fixed Bottom Layout */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40 bg-linear-to-t from-white via-white/95 to-transparent p-6 dark:from-[#070a13] dark:via-[#070a13]/95">
          <button
            onClick={handleSaveContact}
            className={cn(
              'group pointer-events-auto relative flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-[20px] border py-4.5 text-[15px] font-bold shadow-xl transition-all duration-300 active:scale-95',
              saved
                ? 'border-emerald-500/20 bg-emerald-500 text-white shadow-emerald-500/20 hover:bg-emerald-600'
                : 'hover:shadow-primary-500/25 border-transparent bg-slate-900 text-white dark:bg-white dark:text-slate-900'
            )}
          >
            <div
              className={cn(
                'absolute inset-0 opacity-0 transition-opacity group-hover:opacity-10',
                saved ? 'bg-black' : 'bg-primary-500'
              )}
            ></div>
            {saved ? <CheckCircle className="relative z-10 h-5 w-5" /> : <Save className="relative z-10 h-5 w-5" />}
            <span className="relative z-10 tracking-wide">{saved ? 'CONTACT SAVED' : 'SAVE CONTACT'}</span>
          </button>
          <div className="pointer-events-auto mx-auto mt-6 h-1 w-1/3 rounded-full bg-slate-300 sm:hidden dark:bg-slate-700"></div>
        </div>
      </div>
    </div>
  )
}
