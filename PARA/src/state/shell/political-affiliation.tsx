import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

import {
  getPrimaryPoliticalAffiliation,
  inferPoliticalAffiliation,
  normalizePoliticalAffiliation,
  normalizePoliticalAffiliations,
  type PoliticalAffiliation,
  upsertPoliticalAffiliation,
} from '#/lib/political-affiliations'

const STORAGE_KEY = 'para_political_affiliation'

type PoliticalAffiliationContextValue = {
  affiliations: PoliticalAffiliation[]
  affiliation: string | null
  setAffiliations: (items: PoliticalAffiliation[]) => Promise<void>
  setAffiliation: (name: string | null) => Promise<void>
  isPublic: boolean
  setIsPublic: (isPublic: boolean) => Promise<void>
  isLoading: boolean
}

const PoliticalAffiliationContext =
  createContext<PoliticalAffiliationContextValue | null>(null)

export function PoliticalAffiliationProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [storedAffiliations, setStoredAffiliations] = useState<
    PoliticalAffiliation[]
  >([])
  const [storedIsPublic, setStoredIsPublic] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadAffiliation = async () => {
      try {
        const [storedAffiliation, storedIsPublic] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem(STORAGE_KEY + '_is_public'),
        ])
        const nextAffiliations = (() => {
          if (!storedAffiliation) return []

          try {
            const parsed = JSON.parse(storedAffiliation) as unknown
            if (Array.isArray(parsed)) {
              return normalizePoliticalAffiliations(parsed)
            }
            const normalized = normalizePoliticalAffiliation(parsed)
            return normalized ? [normalized] : []
          } catch {
            const inferred = inferPoliticalAffiliation(storedAffiliation)
            return inferred ? [inferred] : []
          }
        })()

        setStoredAffiliations(nextAffiliations)
        setStoredIsPublic(storedIsPublic === 'true')
      } catch (e) {
        console.error('Failed to load political affiliation', e)
      } finally {
        setIsLoading(false)
      }
    }
    void loadAffiliation()
  }, [])

  const setAffiliations = useCallback(async (items: PoliticalAffiliation[]) => {
    try {
      const normalized = normalizePoliticalAffiliations(items)
      if (normalized.length === 0) {
        await AsyncStorage.removeItem(STORAGE_KEY)
      } else {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
      }
      setStoredAffiliations(normalized)
    } catch (e) {
      console.error('Failed to save political affiliation', e)
    }
  }, [])

  const setAffiliation = useCallback(
    async (name: string | null) => {
      if (name === null) {
        await setAffiliations([])
        return
      }

      const inferred = inferPoliticalAffiliation(name)
      if (!inferred) return

      await setAffiliations(
        upsertPoliticalAffiliation(storedAffiliations, inferred),
      )
    },
    [setAffiliations, storedAffiliations],
  )

  const setIsPublic = useCallback(async (val: boolean) => {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEY + '_is_public',
        val ? 'true' : 'false',
      )
      setStoredIsPublic(val)
    } catch (e) {
      console.error('Failed to save public status', e)
    }
  }, [])

  const affiliations = storedAffiliations
  const isPublic = storedIsPublic
  const affiliation = getPrimaryPoliticalAffiliation(affiliations)?.name ?? null

  const value = useMemo(
    () => ({
      affiliations,
      affiliation,
      setAffiliations,
      setAffiliation,
      isPublic,
      setIsPublic,
      isLoading,
    }),
    [
      affiliations,
      affiliation,
      isLoading,
      isPublic,
      setAffiliation,
      setAffiliations,
      setIsPublic,
    ],
  )

  return (
    <PoliticalAffiliationContext.Provider value={value}>
      {children}
    </PoliticalAffiliationContext.Provider>
  )
}

export function usePoliticalAffiliation() {
  const ctx = useContext(PoliticalAffiliationContext)
  if (!ctx) {
    throw new Error(
      'usePoliticalAffiliation must be used within a PoliticalAffiliationProvider',
    )
  }
  return ctx
}
