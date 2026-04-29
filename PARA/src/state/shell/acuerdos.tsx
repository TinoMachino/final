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
  type AcuerdoLockRecord,
  type AcuerdoRecord,
} from '#/lib/api/acuerdo-lexicon'

const STORAGE_KEY = 'para_acuerdos'
const LOCKS_KEY = 'para_acuerdo_locks'

export type AcuerdoPhase = 'forming' | 'active' | 'locked' | 'resolved' | 'cancelled'

export type AcuerdoView = AcuerdoRecord & {
  uri: string
  lockedCount: number
  signatoryCount: number
  isAdmin: boolean
  isLockedByViewer: boolean
}

export type AcuerdoLockView = AcuerdoLockRecord & {
  id: string
  acuerdoTitle?: string
  exitCooldownHours?: number
}

type AcuerdoContextValue = {
  acuerdos: AcuerdoView[]
  myLocks: AcuerdoLockView[]
  isLoading: boolean

  // Actions
  createAcuerdo: (data: Omit<AcuerdoRecord, 'createdAt' | 'uri'>) => Promise<AcuerdoView>
  joinAcuerdo: (acuerdoUri: string, commitment: 'follow-acuerdo' | 'delegate-to-rep') => Promise<void>
  requestExit: (lockId: string) => Promise<void>
  cancelAcuerdo: (acuerdoUri: string, reason: string) => Promise<void>
  updateVisibility: (acuerdoUri: string, visibility: 'public' | 'private') => Promise<void>

  // Queries
  getAcuerdoByUri: (uri: string) => AcuerdoView | undefined
  getLocksForSubject: (subjectUri: string) => AcuerdoLockView[]
  isSubjectLocked: (subjectUri: string) => boolean
}

const AcuerdoContext = createContext<AcuerdoContextValue | null>(null)

export function AcuerdoProvider({children}: {children: React.ReactNode}) {
  const [acuerdos, setAcuerdos] = useState<AcuerdoView[]>([])
  const [myLocks, setMyLocks] = useState<AcuerdoLockView[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load from storage
  useEffect(() => {
    async function load() {
      try {
        const [acuerdosJson, locksJson] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem(LOCKS_KEY),
        ])
        if (acuerdosJson) setAcuerdos(JSON.parse(acuerdosJson))
        if (locksJson) setMyLocks(JSON.parse(locksJson))
      } catch (e) {
        console.error('Failed to load acuerdos:', e)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  // Persist
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(acuerdos))
  }, [acuerdos])

  useEffect(() => {
    AsyncStorage.setItem(LOCKS_KEY, JSON.stringify(myLocks))
  }, [myLocks])

  const createAcuerdo = useCallback(
    async (data: Omit<AcuerdoRecord, 'createdAt'>): Promise<AcuerdoView> => {
      const now = new Date().toISOString()
      const uri = `at://${data.author}/com.para.civic.acuerdo/${Date.now()}`
      const acuerdo: AcuerdoView = {
        ...data,
        createdAt: now,
        uri,
        lockedCount: 0,
        signatoryCount: 0,
        isAdmin: true,
        isLockedByViewer: false,
      }
      setAcuerdos(prev => [acuerdo, ...prev])
      return acuerdo
    },
    [],
  )

  const joinAcuerdo = useCallback(
    async (
      acuerdoUri: string,
      commitment: 'follow-acuerdo' | 'delegate-to-rep',
    ) => {
      const lock: AcuerdoLockView = {
        id: `lock_${Date.now()}`,
        acuerdo: acuerdoUri,
        voter: 'did:plc:viewer', // TODO: use actual DID
        lockedAt: new Date().toISOString(),
        expiresAt: null,
        commitment: {type: commitment},
      }
      setMyLocks(prev => [...prev, lock])
      setAcuerdos(prev =>
        prev.map(a =>
          a.uri === acuerdoUri ? {...a, lockedCount: a.lockedCount + 1, isLockedByViewer: true} : a,
        ),
      )
    },
    [],
  )

  const requestExit = useCallback(async (lockId: string) => {
    const cooldownEnds = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
    setMyLocks(prev =>
      prev.map(lock =>
        lock.id === lockId
          ? {
              ...lock,
              exitRequestedAt: new Date().toISOString(),
              exitCooldownEndsAt: cooldownEnds,
            }
          : lock,
      ),
    )
  }, [])

  const cancelAcuerdo = useCallback(async (acuerdoUri: string, reason: string) => {
    setAcuerdos(prev =>
      prev.map(a =>
        a.uri === acuerdoUri
          ? {...a, phase: 'cancelled' as AcuerdoPhase, description: `${a.description}\n\n[Cancelled: ${reason}]`}
          : a,
      ),
    )
    // Release all locks
    setMyLocks(prev => prev.filter(lock => lock.acuerdo !== acuerdoUri))
  }, [])

  const updateVisibility = useCallback(
    async (acuerdoUri: string, visibility: 'public' | 'private') => {
      setAcuerdos(prev =>
        prev.map(a => (a.uri === acuerdoUri ? {...a, visibility} : a)),
      )
    },
    [],
  )

  const getAcuerdoByUri = useCallback(
    (uri: string) => acuerdos.find(a => a.uri === uri),
    [acuerdos],
  )

  const getLocksForSubject = useCallback(
    (subjectUri: string) => {
      const acuerdoUris = acuerdos
        .filter(a => a.scope.subjects.includes(subjectUri))
        .map(a => a.uri)
      return myLocks.filter(lock => acuerdoUris.includes(lock.acuerdo))
    },
    [acuerdos, myLocks],
  )

  const isSubjectLocked = useCallback(
    (subjectUri: string) => getLocksForSubject(subjectUri).length > 0,
    [getLocksForSubject],
  )

  const value = useMemo(
    () => ({
      acuerdos,
      myLocks,
      isLoading,
      createAcuerdo,
      joinAcuerdo,
      requestExit,
      cancelAcuerdo,
      updateVisibility,
      getAcuerdoByUri,
      getLocksForSubject,
      isSubjectLocked,
    }),
    [
      acuerdos,
      myLocks,
      isLoading,
      createAcuerdo,
      joinAcuerdo,
      requestExit,
      cancelAcuerdo,
      updateVisibility,
      getAcuerdoByUri,
      getLocksForSubject,
      isSubjectLocked,
    ],
  )

  return (
    <AcuerdoContext.Provider value={value}>{children}</AcuerdoContext.Provider>
  )
}

export function useAcuerdos() {
  const ctx = useContext(AcuerdoContext)
  if (!ctx) throw new Error('useAcuerdos must be inside AcuerdoProvider')
  return ctx
}
