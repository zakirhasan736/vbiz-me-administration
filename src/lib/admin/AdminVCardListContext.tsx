'use client'

import { useAppSelector } from '@/hooks/redux'
import { deleteMockCard, loadMockCards, saveMockCards, upsertMockCard } from '@/lib/mockStore'
import {
  mapApiProfileToVCardRecord,
  useCreateProfileMutation,
  useDeleteProfileMutation,
  useGetProfilesQuery,
} from '@/redux/features/profiles/profiles.api'
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
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
  const { data: profiles = [], isLoading, refetch } = useGetProfilesQuery()
  const [createProfile] = useCreateProfileMutation()
  const [deleteProfile] = useDeleteProfileMutation()
  const [mockCards, setMockCards] = useState<AdminCard[]>(() => loadMockCards() as unknown as AdminCard[])
  const [currentEditingCardId, setCurrentEditingCardIdState] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(EDITING_KEY)
  })

  useEffect(() => {
    const refresh = () => setMockCards(loadMockCards() as unknown as AdminCard[])
    window.addEventListener('vbiz_mock_cards_update', refresh)
    return () => window.removeEventListener('vbiz_mock_cards_update', refresh)
  }, [])

  const apiCards = useMemo(
    () => profiles.map((p) => toAdminCardShape(mapApiProfileToVCardRecord(p), user?.id)),
    [profiles, user?.id]
  )

  const vCardsList = useMemo(() => {
    const byId = new Map<string, AdminCard>()
    for (const c of [...mockCards, ...apiCards]) {
      if (c.id) byId.set(c.id, c)
    }
    return Array.from(byId.values())
  }, [mockCards, apiCards])

  const setCurrentEditingCardId = useCallback((id: string | null) => {
    setCurrentEditingCardIdState(id)
    if (typeof window !== 'undefined') {
      if (id) localStorage.setItem(EDITING_KEY, id)
      else localStorage.removeItem(EDITING_KEY)
    }
  }, [])

  const createCorporateCard = useCallback(
    async (card?: Partial<AdminCard>) => {
      const id = `admin_${Date.now()}`
      const slug = (card?.slug as string) || `admin-card-${Date.now().toString().slice(-4)}`
      const personal = (card?.personal as Record<string, string>) || {}
      const next: AdminCard = {
        id,
        slug,
        ownerId: user?.id,
        adminPortfolio: true,
        status: 'active',
        isPublic: true,
        personal: {
          fullName: personal.fullName || 'Admin Team Member',
          email: personal.email || user?.email || 'team@vbiz.me',
          company: personal.company || 'vBiz Admin',
          designation: personal.designation || 'Team Member',
          department: personal.department || 'Admin',
          ...personal,
        },
        socials: (card?.socials as Record<string, string>) || {},
        viewCount: 0,
        saveCount: 0,
        shareCount: 0,
        ...card,
      }

      try {
        await createProfile({
          name: String(next.personal?.fullName || 'Admin Team Member'),
          email: String(next.personal?.email || user?.email || ''),
          slug,
        }).unwrap()
        await refetch()
      } catch {
        upsertMockCard(next as never)
        setMockCards(loadMockCards() as unknown as AdminCard[])
      }
    },
    [createProfile, refetch, user]
  )

  const deleteCorporateCard = useCallback(
    async (id: string) => {
      // Pre-populated mock profiles are not API-backed
      if (!id.startsWith('vcard_')) {
        try {
          await deleteProfile(id).unwrap()
        } catch {
          // May already be deleted by the card UI mutation
        }
      }
      deleteMockCard(id)
      setMockCards(loadMockCards() as unknown as AdminCard[])
      await refetch()
    },
    [deleteProfile, refetch]
  )

  const updateCorporateCardControls = useCallback(
    async (id: string, updates: Partial<AdminCard>) => {
      const existing = vCardsList.find((c) => c.id === id)
      if (!existing) return
      const merged = { ...existing, ...updates }
      upsertMockCard(merged as never)
      setMockCards(loadMockCards() as unknown as AdminCard[])
    },
    [vCardsList]
  )

  const bulkUpdateCorporateCards = useCallback(
    async (ids: string[], updates: Partial<AdminCard>) => {
      const cards = loadMockCards() as unknown as AdminCard[]
      const next = cards.map((c) => (ids.includes(c.id) ? { ...c, ...updates } : c))
      saveMockCards(next as never)
      setMockCards(next)
      for (const id of ids) {
        const hit = vCardsList.find((c) => c.id === id)
        if (hit) await updateCorporateCardControls(id, updates)
      }
    },
    [updateCorporateCardControls, vCardsList]
  )

  const fetchCorporateCards = useCallback(async () => {
    await refetch()
    setMockCards(loadMockCards() as unknown as AdminCard[])
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
