'use client'

import { useVCard } from '@/lib/VCardContext'
import { cn } from '@/utils/cn'
import { Briefcase, CheckCircle, Link2, Phone, Save, Share2 } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'

export default function VCardPublicView() {
  const { vCardData } = useVCard()
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleShare = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSaveContact = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-start bg-slate-50 pb-24 dark:bg-[#070a13]">
      {/* Header Banner Background */}
      <div className="from-primary-500/20 dark:from-primary-500/10 pointer-events-none absolute inset-x-0 top-0 h-48 bg-linear-to-b to-transparent"></div>

      {/* Profile Image */}
      <div className="relative z-10 mx-auto mt-20 mb-6 flex w-full max-w-md justify-center px-8">
        <div className="relative h-40 w-40">
          <div className="bg-primary-500/20 dark:bg-primary-500/10 absolute inset-0 scale-125 rounded-full blur-2xl"></div>
          <Image
            src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80"
            alt="Profile"
            className="relative z-10 h-full w-full rotate-3 rounded-[38px] border-[6px] border-white object-cover shadow-xl transition-transform duration-500 hover:rotate-0 dark:border-[#0b0f19]"
            width={100}
            height={100}
          />
          <div className="absolute -right-1 -bottom-1 z-20 h-7 w-7 rounded-full border-[3px] border-white bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)] dark:border-[#0b0f19]"></div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-md flex-col items-center px-6">
        {/* Info */}
        <div className="z-10 mb-8 flex w-full flex-col items-center text-center">
          <h1 className="mb-2 text-[32px] leading-tight font-black tracking-tight text-slate-900 dark:text-white">
            {vCardData.personal.fullName || 'Your Name'}
          </h1>
          <p className="text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-500/10 border-primary-100 dark:border-primary-500/20 mb-4 inline-flex rounded-full border px-5 py-2 text-[13px] font-bold tracking-[0.2em] uppercase shadow-sm">
            {vCardData.personal.designation || 'Designation'}
          </p>
          <p className="max-w-sm text-[16px] leading-relaxed font-medium text-slate-600 dark:text-slate-400">
            {vCardData.personal.about || 'Making Power Moves Electric'}
          </p>
        </div>

        {/* Contact Details Cards */}
        <div className="z-10 mb-10 w-full space-y-4">
          <div className="flex items-center gap-5 rounded-[24px] border border-slate-200/60 bg-white p-5 shadow-sm dark:border-white/5 dark:bg-[#0b0f19]">
            <div className="bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px]">
              <Phone className="h-6 w-6" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="mb-1 text-[12px] font-bold tracking-wider text-slate-400 uppercase">Mobile Phone</p>
              <p className="truncate text-[17px] font-bold text-slate-900 dark:text-white">
                {vCardData.personal.phone || '+1 (555) 000-0000'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-5 rounded-[24px] border border-slate-200/60 bg-white p-5 shadow-sm dark:border-white/5 dark:bg-[#0b0f19]">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400">
              <Briefcase className="h-6 w-6" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="mb-1 text-[12px] font-bold tracking-wider text-slate-400 uppercase">Company</p>
              <p className="truncate text-[17px] font-bold text-slate-900 dark:text-white">
                {vCardData.personal.company || 'Power Moves Inc.'}
              </p>
            </div>
          </div>
        </div>

        {/* Floating Action Buttons Grid */}
        <div className="z-10 mb-10 grid w-full grid-cols-4 gap-4">
          <button onClick={() => {}} className="flex flex-col items-center justify-center gap-3">
            <div className="group relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-[24px] border border-slate-200/60 bg-white text-slate-700 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:scale-110 hover:shadow-[0_8px_20px_rgba(0,0,0,0.08)] dark:border-white/5 dark:bg-[#0b0f19] dark:text-slate-300">
              <div className="bg-primary-500/10 absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"></div>
              <Briefcase className="z-10 h-7 w-7" strokeWidth={1.5} />
            </div>
            <span className="text-[11px] font-bold tracking-wide text-slate-500 uppercase">Portfolio</span>
          </button>
          <button onClick={() => {}} className="flex flex-col items-center justify-center gap-3">
            <div className="group relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-[24px] border border-slate-200/60 bg-white text-slate-700 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:scale-110 hover:shadow-[0_8px_20px_rgba(0,0,0,0.08)] dark:border-white/5 dark:bg-[#0b0f19] dark:text-slate-300">
              <div className="bg-primary-500/10 absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"></div>
              <Phone className="z-10 h-7 w-7" strokeWidth={1.5} />
            </div>
            <span className="text-[11px] font-bold tracking-wide text-slate-500 uppercase">Call</span>
          </button>
          <button onClick={() => {}} className="flex flex-col items-center justify-center gap-3">
            <div className="group relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-[24px] border border-slate-200/60 bg-white text-slate-700 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:scale-110 hover:shadow-[0_8px_20px_rgba(0,0,0,0.08)] dark:border-white/5 dark:bg-[#0b0f19] dark:text-slate-300">
              <div className="bg-primary-500/10 absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"></div>
              <Link2 className="z-10 h-7 w-7" strokeWidth={1.5} />
            </div>
            <span className="text-[11px] font-bold tracking-wide text-slate-500 uppercase">Links</span>
          </button>
          <button onClick={handleShare} className="flex flex-col items-center justify-center gap-3">
            <div
              className={cn(
                'group relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-[24px] border shadow-sm transition-all duration-300 hover:-translate-y-1 hover:scale-110',
                copied
                  ? 'border-emerald-500 bg-emerald-500 text-white shadow-[0_8px_20px_rgba(16,185,129,0.3)]'
                  : 'bg-primary-600 border-primary-500 text-white shadow-[0_8px_20px_rgba(var(--primary-600),0.3)]'
              )}
            >
              <div className="absolute inset-0 bg-white/20 opacity-0 transition-opacity group-hover:opacity-100"></div>
              {copied ? (
                <CheckCircle className="z-10 h-7 w-7" strokeWidth={2} />
              ) : (
                <Share2 className="z-10 h-7 w-7" strokeWidth={1.5} />
              )}
            </div>
            <span
              className={cn(
                'text-[11px] font-bold tracking-wide uppercase',
                copied ? 'text-emerald-500' : 'text-primary-600 dark:text-primary-400'
              )}
            >
              {copied ? 'Copied!' : 'Share'}
            </span>
          </button>
        </div>
      </div>

      {/* Fixed Bottom Action */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-md items-end justify-center bg-linear-to-t from-white via-white/95 to-transparent p-6 dark:from-[#070a13] dark:via-[#070a13]/95">
        <button
          onClick={handleSaveContact}
          className={cn(
            'group pointer-events-auto relative flex w-full max-w-[360px] items-center justify-center gap-3 overflow-hidden rounded-[24px] border py-5 text-[16px] font-bold shadow-xl transition-all duration-300 active:scale-95',
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
          {saved ? <CheckCircle className="relative z-10 h-6 w-6" /> : <Save className="relative z-10 h-6 w-6" />}
          <span className="relative z-10 tracking-wide">{saved ? 'CONTACT SAVED' : 'SAVE TO CONTACTS'}</span>
        </button>
      </div>
    </div>
  )
}
