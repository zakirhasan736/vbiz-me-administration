'use client'

import { createContext, useContext } from 'react'

export type CardScopeMode = 'edit' | 'create'

type CardScopeValue = {
  cardId: string | null
  mode: CardScopeMode
}

const CardScopeContext = createContext<CardScopeValue>({
  cardId: null,
  mode: 'edit',
})

export function CardScopeProvider({
  cardId,
  mode = 'edit',
  children,
}: {
  cardId: string | null
  mode?: CardScopeMode
  children: React.ReactNode
}) {
  return <CardScopeContext.Provider value={{ cardId, mode }}>{children}</CardScopeContext.Provider>
}

export function useCardScopeId(): string | null {
  return useContext(CardScopeContext).cardId
}

export function useCardScopeMode(): CardScopeMode {
  return useContext(CardScopeContext).mode
}
