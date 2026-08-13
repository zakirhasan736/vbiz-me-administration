'use client'

import { useAppSelector } from '@/hooks/redux'
import {
  mapApiProfileToVCardRecord,
  useCreateProfileMutation,
  useDeleteProfileMutation,
  useGetProfilesQuery,
  useUpdateProfileCardMutation,
} from '@/redux/features/profiles/profiles.api'
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { type AdminCard, toAdminCardShape } from './adminCardShape'

type AdminVCardListContextType = {
  vCardsList: AdminCard[]
  loadingList: boolean
  userRole: 'single' | 'corporate' | 'admin'
  currentEditingCardId: string | null
  setCurrentEditingCardId: (id: string | null) => void
  createCorporateCard: (card?: Partial<AdminCard>) => Promise<void>
  deleteCorporateCard: (id: string) => Promise<void>
  updateCorporateCardControls: (id: string, updates: Partial<AdminCard>) => Promise<void>
  bulkUpdateCorporateCards: (ids: string[], updates: Partial<AdminCard>) => Promise<void>
  fetchCorporateCards: () => Promise<void>
}

const AdminVCardListContext = createContext<AdminVCardListContextType | undefined>(undefined)

const EDITING_KEY = 'admin_editing_card_id'

export function AdminVCardListProvider({ children }: { children: React.ReactNode }) {
  const user = useAppSelector((s) => s.user.user)
  const { data: profilesResult, isLoading, refetch } = useGetProfilesQuery({ limit: 100 })
  const [createProfile] = useCreateProfileMutation()
  const [deleteProfile] = useDeleteProfileMutation()
  const [updateProfile] = useUpdateProfileCardMutation()
  const [currentEditingCardId, setCurrentEditingCardIdState] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(EDITING_KEY)
  })

  const profiles = useMemo(() => profilesResult?.items ?? [], [profilesResult?.items])

  const vCardsList = useMemo(
    () =>
      profiles.map((p) =>
        toAdminCardShape(mapApiProfileToVCardRecord(p), user?.id, {
          profileUserId: p.userId || user?.id,
          companyUserId: p.companyUserId || null,
          companyUserRole: p.companyUser?.role || null,
          createdById: p.createdById || p.createdBy?.id || null,
          createdByRole: p.createdBy?.role || null,
          ownerRole: p.user?.role || null,
        })
      ),
    [profiles, user?.id]
  )

  const setCurrentEditingCardId = useCallback((id: string | null) => {
    setCurrentEditingCardIdState(id)
    if (typeof window !== 'undefined') {
      if (id) localStorage.setItem(EDITING_KEY, id)
      else localStorage.removeItem(EDITING_KEY)
    }
  }, [])

  const createCorporateCard = useCallback(
    async (card?: Partial<AdminCard>) => {
      const personal = (card?.personal as Record<string, string>) || {}
      const slug = (card?.slug as string) || `admin-card-${Date.now().toString().slice(-4)}`
      await createProfile({
        name: String(personal.fullName || 'Admin Team Member'),
        email: String(personal.email || user?.email || ''),
        slug,
      }).unwrap()
      await refetch()
    },
    [createProfile, refetch, user]
  )

  const deleteCorporateCard = useCallback(
    async (id: string) => {
      await deleteProfile(id).unwrap()
      await refetch()
    },
    [deleteProfile, refetch]
  )

  const updateCorporateCardControls = useCallback(
    async (id: string, updates: Partial<AdminCard>) => {
      const personal = (updates.personal as Record<string, string> | undefined) || undefined
      await updateProfile({
        id,
        body: {
          ...(typeof updates.isPublic === 'boolean' ? { isPublic: updates.isPublic } : {}),
          ...(typeof updates.status === 'string' ? { status: updates.status } : {}),
          ...(typeof updates.slug === 'string' ? { slug: updates.slug } : {}),
          ...(personal?.fullName ? { name: personal.fullName } : {}),
          ...(personal?.email ? { email: personal.email } : {}),
          ...(personal?.company ? { companyName: personal.company } : {}),
          ...(personal?.designation ? { designation: personal.designation } : {}),
          ...(personal?.phone ? { phone: personal.phone } : {}),
          ...(personal?.whatsapp ? { whatsapp: personal.whatsapp } : {}),
        },
      }).unwrap()
      await refetch()
    },
    [refetch, updateProfile]
  )

  const bulkUpdateCorporateCards = useCallback(
    async (ids: string[], updates: Partial<AdminCard>) => {
      for (const id of ids) {
        await updateCorporateCardControls(id, updates)
      }
    },
    [updateCorporateCardControls]
  )

  const fetchCorporateCards = useCallback(async () => {
    await refetch()
  }, [refetch])

  const value: AdminVCardListContextType = {
    vCardsList,
    loadingList: isLoading,
    userRole: 'admin',
    currentEditingCardId,
    setCurrentEditingCardId,
    createCorporateCard,
    deleteCorporateCard,
    updateCorporateCardControls,
    bulkUpdateCorporateCards,
    fetchCorporateCards,
  }

  return <AdminVCardListContext.Provider value={value}>{children}</AdminVCardListContext.Provider>
}

export function useVCard() {
  const ctx = useContext(AdminVCardListContext)
  if (!ctx) throw new Error('useVCard must be used within AdminVCardListProvider')
  return ctx
}
