'use client'

import { useAppDispatch, useAppSelector } from '@/hooks/redux'
import { mapMyCardToVCardRecord } from '@/lib/api/myCard/mapMyCard'
import { DEFAULT_PROFILE_SLUG } from '@/lib/constants/profile'
import { myCardApi, useGetMyCardBySlugQuery } from '@/redux/api/myCardApi'
import type { MyCardData } from '@interfaces/api/myCard'
import { useLayoutEffect, useMemo } from 'react'
import {
  selectMyCardRawBySlug,
  selectMyCardRecordBySlug,
  selectProfileActionButtonsBySlug,
  selectProfileFeaturesBySlug,
  selectProfileIdentityBySlug,
  selectProfileMediaBySlug,
} from './myCard.selectors'
import { hydrateMyCard, setActiveProfileSlug } from './myCard.slice'

type UseProfileOptions = {
  /** Skip the network request (read Redux cache only). */
  skip?: boolean
  /** Server-prefetched payload — available on first client render. */
  initialMyCard?: MyCardData | null
}

/**
 * Single entry point for profile data.
 * RTK Query caches the API response; the myCard slice stores mapped data for fast selector reads.
 */
export function useProfile(slug: string = DEFAULT_PROFILE_SLUG, options?: UseProfileOptions) {
  const dispatch = useAppDispatch()
  const trimmed = slug.trim()
  const skip = options?.skip || !trimmed
  const initialMyCard = options?.initialMyCard ?? null
  const hasPrefetched = Boolean(initialMyCard)

  useLayoutEffect(() => {
    if (!initialMyCard || !trimmed) return
    dispatch(myCardApi.util.upsertQueryData('getMyCardBySlug', trimmed, initialMyCard))
    dispatch(hydrateMyCard({ slug: trimmed, raw: initialMyCard }))
  }, [dispatch, trimmed, initialMyCard])

  const query = useGetMyCardBySlugQuery(trimmed, { skip: skip || hasPrefetched })

  useLayoutEffect(() => {
    if (!trimmed || skip) return
    dispatch(setActiveProfileSlug(trimmed))
  }, [dispatch, trimmed, skip])

  const cachedRaw = useAppSelector((state) => selectMyCardRawBySlug(state, trimmed))
  const cachedRecord = useAppSelector((state) => selectMyCardRecordBySlug(state, trimmed))
  const identity = useAppSelector((state) => selectProfileIdentityBySlug(state, trimmed))
  const media = useAppSelector((state) => selectProfileMediaBySlug(state, trimmed))
  const features = useAppSelector((state) => selectProfileFeaturesBySlug(state, trimmed))
  const actionButtons = useAppSelector((state) => selectProfileActionButtonsBySlug(state, trimmed))

  const myCard = query.data ?? cachedRaw ?? initialMyCard
  const record = useMemo(() => {
    if (cachedRecord) return cachedRecord
    if (myCard) return mapMyCardToVCardRecord(myCard)
    return null
  }, [cachedRecord, myCard])

  return {
    slug: trimmed,
    myCard,
    record,
    identity,
    media,
    features,
    actionButtons,
    isLoading: !skip && !hasPrefetched && query.isLoading && !myCard,
    isFetching: query.isFetching,
    isError: hasPrefetched ? false : query.isError,
    isSuccess: Boolean(myCard),
    error: query.error,
  }
}
