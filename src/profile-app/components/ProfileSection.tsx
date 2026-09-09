'use client'

import { encodeMediaUrl, isUsableImageSrc, isVideoUrl } from '@/lib/mediaUrl'
import { TruncatedClampText } from '@/profile-app/components/TruncatedClampText'
import { useProfileDisplay } from '@/profile-app/lib/profileDisplayContext'
import { cleanProfileFieldValue } from '@/profile-app/lib/profileHomeData'
import { useResolvedSectionTitle } from '@/profile-app/lib/sectionTitleContext'
import { resolveProfileAvatarSrc } from '@/profile-app/profilePublicProps'
import { useSectionAccent, V3EmptyState, V3SectionHeader, V3SectionShell } from '@/profile-app/sections'
import { Briefcase, IdCard, UserRound } from 'lucide-react'
import Image from 'next/image'

const FIXED_SECTION_TITLE = 'Profile'

export function ProfileSection() {
  const { personal, homeMedia, design, embedded } = useProfileDisplay()
  const sectionTitle = useResolvedSectionTitle(undefined, FIXED_SECTION_TITLE)
  const accent = useSectionAccent()
  const accentColor = design?.accentColor?.trim() || accent || '#eab308'
  /** Live phone preview uses the desktop viewport for `sm:` breakpoints — stack there. */
  const stackBelowImage = embedded

  const fullName = cleanProfileFieldValue(personal.fullName || '')
  const designation = cleanProfileFieldValue(personal.designation || '')
  const profession = cleanProfileFieldValue(personal.profession || '')
  const roleLine = profession || designation
  const secondaryRole =
    designation && profession && designation !== profession
      ? roleLine === profession
        ? { label: 'Designation', value: designation }
        : { label: 'Profession', value: profession }
      : null
  const about = personal.about?.trim() || ''

  const profileSrc = resolveProfileAvatarSrc(homeMedia.profileMedia, homeMedia.introVideo)
  const encodedProfile = encodeMediaUrl(profileSrc)
  const profileIsVideo = Boolean(profileSrc) && isVideoUrl(profileSrc)
  const showPhoto = Boolean(encodedProfile) && (profileIsVideo || isUsableImageSrc(encodedProfile))

  const hasIdentity = Boolean(fullName || roleLine || about || showPhoto)

  if (!hasIdentity) {
    return <V3EmptyState icon={IdCard} title={sectionTitle} message="No profile details have been published yet." />
  }

  return (
    <V3SectionShell>
      <div className="flex w-full flex-col gap-4 md:gap-6">
        <V3SectionHeader
          badge={sectionTitle}
          badgeIcon={IdCard}
          title={sectionTitle}
          subtitle="Public name, role, and bio from this vBiz card."
        />

        <div className="vbiz-page-header-surface relative overflow-hidden rounded-3xl border p-5 md:p-6 lg:p-8">
          <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-white/10 to-transparent" />
          <div
            className="pointer-events-none absolute top-0 right-0 -mt-24 -mr-24 rounded-full p-32 blur-3xl"
            style={{ backgroundColor: `${accentColor}18` }}
          />

          <div
            className={
              stackBelowImage
                ? 'relative z-10 flex flex-col items-center gap-4'
                : 'relative z-10 flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6'
            }
          >
            {showPhoto ? (
              <div
                className={
                  stackBelowImage
                    ? 'relative h-28 w-28 shrink-0 overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-100 shadow-sm dark:border-zinc-700 dark:bg-zinc-900'
                    : 'relative mx-auto h-28 w-28 shrink-0 overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-100 shadow-sm sm:mx-0 sm:h-32 sm:w-32 dark:border-zinc-700 dark:bg-zinc-900'
                }
              >
                {profileIsVideo ? (
                  <video
                    src={encodedProfile}
                    className="h-full w-full object-cover"
                    muted
                    playsInline
                    autoPlay
                    loop
                    aria-label={fullName || sectionTitle}
                  />
                ) : (
                  <Image
                    src={encodedProfile}
                    alt={fullName || sectionTitle}
                    fill
                    className="object-cover"
                    sizes="128px"
                  />
                )}
              </div>
            ) : (
              <div
                className={
                  stackBelowImage
                    ? 'flex h-28 w-28 shrink-0 items-center justify-center rounded-3xl border border-zinc-200 bg-zinc-100 text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-500'
                    : 'mx-auto flex h-28 w-28 shrink-0 items-center justify-center rounded-3xl border border-zinc-200 bg-zinc-100 text-zinc-400 sm:mx-0 sm:h-32 sm:w-32 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-500'
                }
              >
                <UserRound size={40} strokeWidth={1.75} />
              </div>
            )}

            <div className={stackBelowImage ? 'w-full min-w-0 text-center' : 'min-w-0 flex-1 text-center sm:text-left'}>
              {fullName ? (
                <h3
                  className={
                    stackBelowImage
                      ? 'text-xl leading-tight font-black tracking-tight text-zinc-900 dark:text-zinc-100'
                      : 'text-2xl leading-tight font-black tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-100'
                  }
                >
                  {fullName}
                </h3>
              ) : null}

              {roleLine ? (
                <p
                  className={
                    stackBelowImage
                      ? 'mt-1.5 inline-flex items-center justify-center gap-2 text-sm font-bold'
                      : 'mt-2 inline-flex items-center gap-2 text-sm font-bold sm:text-base'
                  }
                  style={{ color: accentColor }}
                >
                  <Briefcase size={16} strokeWidth={2.25} />
                  {roleLine}
                </p>
              ) : null}

              {secondaryRole ? (
                <div className={stackBelowImage ? 'mt-3' : 'mt-4'}>
                  <ProfileFieldRow label={secondaryRole.label} value={secondaryRole.value} />
                </div>
              ) : null}

              {about ? (
                <div
                  className={
                    stackBelowImage
                      ? 'mt-4 border-t border-zinc-200/80 pt-3 text-left dark:border-zinc-700/80'
                      : 'mt-5 border-t border-zinc-200/80 pt-4 text-left dark:border-zinc-700/80'
                  }
                >
                  <p className="mb-2 text-[11px] font-bold tracking-wider text-zinc-500 uppercase">Bio</p>
                  <TruncatedClampText
                    plain={about}
                    maxLines={5}
                    minLength={160}
                    accentColor={accentColor}
                    readMoreLabel="Read more"
                    readLessLabel="Read less"
                    textClassName="text-sm leading-relaxed font-medium text-zinc-600 md:text-base dark:text-zinc-300"
                  />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </V3SectionShell>
  )
}

function ProfileFieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white/60 px-4 py-3 text-left dark:border-zinc-700/70 dark:bg-zinc-900/40">
      <p className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-zinc-800 dark:text-zinc-100">{value}</p>
    </div>
  )
}
