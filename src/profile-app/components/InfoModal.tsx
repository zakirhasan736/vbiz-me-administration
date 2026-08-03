'use client'

import { ProfileModalShell } from '@/profile-app/components/ProfileModalShell'
import { useProfileDisplay } from '@/profile-app/lib/profileDisplayContext'
import { buildFullContactItems, cleanProfileFieldValue } from '@/profile-app/lib/profileHomeData'
import { Info, X } from 'lucide-react'
import { useMemo } from 'react'

type InfoModalProps = {
  isOpen: boolean
  onClose: () => void
  theme?: string
}

/** Shared "My Info" contact popup — theme tokens for title, pin, description, icons. */
export function InfoModal({ isOpen, onClose }: InfoModalProps) {
  const { personal, isVisible, field, extraFields } = useProfileDisplay()

  const items = useMemo(
    () => buildFullContactItems(personal, isVisible, field, extraFields),
    [personal, isVisible, field, extraFields]
  )

  const name = (isVisible('MyInfo section Name') && personal.fullName?.trim()) || 'Contact Info'
  const title =
    (isVisible('MyInfo Designation') && personal.designation?.trim() && cleanProfileFieldValue(personal.designation)) ||
    (isVisible('MyInfo Profession') && personal.profession?.trim() && cleanProfileFieldValue(personal.profession)) ||
    (isVisible('MyInfo Company') && personal.company?.trim()) ||
    ''

  return (
    <ProfileModalShell isOpen={isOpen} onClose={onClose} panelClassName="max-w-[400px] sm:max-w-[400px]">
      <div className="vbiz-modal-header flex items-center justify-between border-b p-6 pb-4">
        <div className="flex items-center gap-2">
          <div className="vbiz-modal-icon-chip rounded-xl p-2">
            <Info size={18} />
          </div>
          <div>
            <h3 className="vbiz-title notranslate text-lg font-bold tracking-tight">{name}</h3>
            {title ? (
              <p className="vbiz-pin notranslate text-xs font-semibold tracking-wide uppercase opacity-90">{title}</p>
            ) : null}
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="vbiz-modal-close rounded-full border p-1.5 transition-all"
          aria-label="Close modal"
        >
          <X size={16} />
        </button>
      </div>

      <div className="no-scrollbar max-h-[70vh] space-y-3.5 overflow-y-auto p-6">
        {items.length === 0 ? (
          <p className="vbiz-description py-6 text-center text-sm">No contact details available.</p>
        ) : (
          items.map((item, idx) => {
            const Icon = item.icon
            const blockContent = (
              <div className="vbiz-modal-row flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all">
                <div className="vbiz-pill-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border">
                  <Icon size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="vbiz-pin mb-0.5 text-[10px] font-bold tracking-wider uppercase">{item.label}</p>
                  <p className="vbiz-title truncate text-sm font-semibold">{item.value}</p>
                </div>
              </div>
            )

            if (item.href) {
              return (
                <a key={idx} href={item.href} className="block">
                  {blockContent}
                </a>
              )
            }

            return <div key={idx}>{blockContent}</div>
          })
        )}
      </div>
    </ProfileModalShell>
  )
}
