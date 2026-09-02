'use client'

import { DocumentUploadArea } from '@/components/DocumentUploadArea'
import { ReorderList } from '@/components/ReorderList'
import { SectionJumpPills } from '@/components/SectionJumpPills'
import {
  ExpandableEntryBody,
  ExpandableEntryHeader,
  bottomAddButtonClass,
  expandableCardClassName,
} from '@/components/vcard/ExpandableEntryChrome'
import { useExpandableEntryList } from '@/hooks/useExpandableEntryList'
import {
  CERTIFICATES_POST_TYPE,
  certItemsToSectionPosts,
  createEmptyCert,
  sectionPostsToCertItems,
  type CertItem,
} from '@/lib/vcardCertificates'
import { useVCard } from '@/lib/VCardContext'
import { useResolvedSectionTitle } from '@/profile-app/lib/sectionTitleContext'
import { cn } from '@/utils/cn'
import { Award, Plus } from 'lucide-react'
import { useEffect, useRef } from 'react'

const inputClasses =
  'w-full bg-white dark:bg-[#0b0f19] border border-slate-200/80 dark:border-white/10 rounded-[16px] px-5 py-4 text-[13px] font-medium text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm'

const textareaClasses =
  'w-full min-h-[96px] resize-y bg-white dark:bg-[#0b0f19] border border-slate-200/80 dark:border-white/10 rounded-[16px] px-5 py-4 text-[13px] font-medium text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm'

const accent = {
  border: 'border-indigo-100 dark:border-indigo-500/20',
  bg: 'bg-indigo-50 dark:bg-indigo-500/10',
  text: 'text-indigo-600 dark:text-indigo-400',
  chevronOpen: 'text-indigo-500',
  cardExpandedBorder: 'border-indigo-200/60 dark:border-indigo-500/20',
}

export function TabCertificates() {
  const sectionTitle = useResolvedSectionTitle(undefined, 'Certificates/Licenses')
  const { cardId, vCardData, updateData } = useVCard()
  const items = sectionPostsToCertItems(vCardData.sectionPosts?.[CERTIFICATES_POST_TYPE])
  const itemsRef = useRef(items)
  const { isExpanded, toggleExpanded, expandNew, recoverExpandedAfterRemove, setCardRef, setExpandedId } =
    useExpandableEntryList(items)

  useEffect(() => {
    itemsRef.current = items
  }, [items])

  const persist = (next: CertItem[]) => {
    itemsRef.current = next
    updateData('sectionPosts', {
      ...(vCardData.sectionPosts ?? {}),
      [CERTIFICATES_POST_TYPE]: certItemsToSectionPosts(next),
    })
  }

  const addCert = () => {
    const next = createEmptyCert()
    persist([...itemsRef.current, next])
    expandNew(next.id)
  }

  const removeCert = (id: string) => {
    const next = itemsRef.current.filter((c) => c.id !== id)
    persist(next)
    recoverExpandedAfterRemove(id, next)
  }

  return (
    <div className="animate-in fade-in mx-auto flex h-full w-full max-w-7xl flex-col space-y-6 pb-12 duration-500">
      <div className="rounded-3xl border border-indigo-100 bg-indigo-50/50 p-6 dark:border-indigo-500/10 dark:bg-indigo-500/2">
        <div className="mb-2 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-indigo-100 bg-indigo-50 dark:border-indigo-500/20 dark:bg-indigo-500/10">
              <Award className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="text-lg font-black text-indigo-600 dark:text-indigo-400">{sectionTitle}</h3>
              <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">
                Upload certificate images, PDF, or text documents for each credential.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={addCert}
            className="hidden items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 sm:flex"
          >
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>
        <button
          type="button"
          onClick={addCert}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white sm:hidden"
        >
          <Plus className="h-4 w-4" /> Add certificate
        </button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-[28px] border border-slate-200/60 bg-slate-50/50 p-10 text-center dark:border-white/5 dark:bg-white/2">
          <p className="mb-1 text-[15px] font-black text-slate-900 dark:text-white">No certificates yet</p>
          <p className="mb-5 text-[13px] text-slate-500">
            Add a credential and upload its document (image, PDF, or TXT).
          </p>
          <button
            type="button"
            onClick={addCert}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white"
          >
            <Plus className="h-4 w-4" /> Add certificate
          </button>
        </div>
      ) : (
        <>
          <SectionJumpPills
            accent="indigo"
            label="Quick find"
            onJump={setExpandedId}
            items={items.map((c) => ({
              id: c.id,
              title: c.name || 'Untitled',
              detail: c.issuer || c.year || undefined,
            }))}
          />
          <ReorderList
            items={items}
            getKey={(c) => c.id}
            onReorder={persist}
            renderItem={(item, idx) => {
              const open = isExpanded(item.id)
              return (
                <section
                  id={`entry-${item.id}`}
                  ref={(el) => setCardRef(item.id, el)}
                  className={cn(expandableCardClassName(open, accent), 'scroll-mt-24')}
                >
                  <ExpandableEntryHeader
                    indexLabel={idx + 1}
                    title={item.name || 'New Certificate'}
                    subtitle={item.issuer || item.year || null}
                    isExpanded={open}
                    onToggle={() => toggleExpanded(item.id)}
                    showRemove
                    onRemove={() => removeCert(item.id)}
                    accent={accent}
                  />

                  <ExpandableEntryBody isExpanded={open} className="space-y-4 p-6">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <label className="block space-y-1.5 sm:col-span-2">
                        <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                          Certificate name
                        </span>
                        <input
                          value={item.name}
                          onChange={(e) =>
                            persist(
                              itemsRef.current.map((c) => (c.id === item.id ? { ...c, name: e.target.value } : c))
                            )
                          }
                          placeholder="e.g. AWS Solutions Architect"
                          className={inputClasses}
                        />
                      </label>
                      <label className="block space-y-1.5 sm:col-span-2">
                        <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                          Description
                        </span>
                        <textarea
                          value={item.description}
                          onChange={(e) =>
                            persist(
                              itemsRef.current.map((c) =>
                                c.id === item.id ? { ...c, description: e.target.value } : c
                              )
                            )
                          }
                          placeholder="Short summary of this credential"
                          className={textareaClasses}
                        />
                      </label>
                      <label className="block space-y-1.5">
                        <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">Issuer</span>
                        <input
                          value={item.issuer}
                          onChange={(e) =>
                            persist(
                              itemsRef.current.map((c) => (c.id === item.id ? { ...c, issuer: e.target.value } : c))
                            )
                          }
                          placeholder="Organization"
                          className={inputClasses}
                        />
                      </label>
                      <label className="block space-y-1.5">
                        <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">Year</span>
                        <input
                          value={item.year}
                          onChange={(e) =>
                            persist(
                              itemsRef.current.map((c) => (c.id === item.id ? { ...c, year: e.target.value } : c))
                            )
                          }
                          placeholder="2024"
                          className={inputClasses}
                        />
                      </label>
                    </div>

                    <DocumentUploadArea
                      files={item.documents}
                      onChange={(documents) =>
                        persist(itemsRef.current.map((c) => (c.id === item.id ? { ...c, documents } : c)))
                      }
                      multiple
                      label="Certificate document"
                      hint="Upload image, PDF, TXT, or DOC"
                      accent="indigo"
                      mediaAssist={false}
                      profileId={cardId}
                    />
                  </ExpandableEntryBody>
                </section>
              )
            }}
          />

          <div className="mt-8 flex flex-col items-center gap-4 pt-6">
            <button
              type="button"
              onClick={addCert}
              className={cn(bottomAddButtonClass, 'text-indigo-600 hover:border-indigo-500/30 dark:text-indigo-400')}
            >
              <Plus className="h-4 w-4" /> Add Another Certificate
            </button>
          </div>
        </>
      )}
    </div>
  )
}
