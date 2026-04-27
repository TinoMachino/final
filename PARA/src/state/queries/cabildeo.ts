import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'

import {
  castCabildeoVote,
  delegateCabildeoVote,
  fetchCabildeo,
  fetchCabildeoPositions,
  fetchCabildeos,
  fetchDelegationCandidates,
} from '#/lib/api/cabildeo'
import {
  type CabildeoView,
  mapCabildeoPositionsFromRead,
  mapCabildeoReadViewToView,
  mapCabildeosToView,
} from '#/lib/cabildeo-client'
import {STALE} from '#/state/queries'
import {useAgent} from '#/state/session'

const RQKEY_ROOT = 'cabildeo'

export const cabildeosQueryKey = [RQKEY_ROOT, 'list']
export const cabildeoDetailQueryKey = (cabildeoUri: string) => [
  RQKEY_ROOT,
  'detail',
  cabildeoUri,
]
export const delegationCandidatesQueryKey = ({
  cabildeoUri,
  communityId,
}: {
  cabildeoUri?: string
  communityId?: string
}) => [RQKEY_ROOT, 'delegation-candidates', cabildeoUri || '', communityId || '']

export function useCabildeosQuery() {
  const agent = useAgent()
  return useQuery<CabildeoView[]>({
    staleTime: STALE.MINUTES.ONE,
    queryKey: cabildeosQueryKey,
    placeholderData: previous => previous,
    queryFn: async () => {
      const records = await fetchCabildeos(agent)
      return mapCabildeosToView(records)
    },
  })
}

export function useCabildeoQuery(cabildeoUri: string | undefined) {
  const agent = useAgent()
  return useQuery<CabildeoView | null>({
    staleTime: STALE.SECONDS.THIRTY,
    queryKey: cabildeoDetailQueryKey(cabildeoUri || ''),
    enabled: Boolean(cabildeoUri),
    placeholderData: previous => previous,
    queryFn: async () => {
      if (!cabildeoUri) return null
      const cabildeo = await fetchCabildeo(agent, cabildeoUri)
      return cabildeo ? mapCabildeoReadViewToView(cabildeo) : null
    },
  })
}

export function useCabildeoPositionsQuery(cabildeoUri: string | undefined) {
  const agent = useAgent()
  return useQuery({
    staleTime: STALE.SECONDS.THIRTY,
    queryKey: [RQKEY_ROOT, 'positions', cabildeoUri || ''],
    enabled: Boolean(cabildeoUri),
    placeholderData: previous => previous,
    queryFn: async () => {
      if (!cabildeoUri) return []
      const positions = await fetchCabildeoPositions(agent, {cabildeoUri})
      return mapCabildeoPositionsFromRead(positions)
    },
  })
}

export function useDelegationCandidatesQuery({
  cabildeoUri,
  communityId,
}: {
  cabildeoUri?: string
  communityId?: string
}) {
  const agent = useAgent()
  return useQuery({
    staleTime: STALE.SECONDS.THIRTY,
    enabled: Boolean(cabildeoUri),
    queryKey: delegationCandidatesQueryKey({cabildeoUri, communityId}),
    queryFn: async () => {
      if (!cabildeoUri) return []
      const result = await fetchDelegationCandidates(agent, {
        cabildeoUri,
        communityId,
        limit: 50,
      })
      return result.candidates
    },
  })
}

export function useDelegateCabildeoVoteMutation() {
  const agent = useAgent()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      cabildeoUri,
      delegateTo,
      reason,
      scopeFlairs,
    }: {
      cabildeoUri: string
      delegateTo: string
      reason?: string
      scopeFlairs?: string[]
    }) =>
      delegateCabildeoVote(agent, {
        cabildeo: cabildeoUri,
        delegateTo,
        reason,
        scopeFlairs,
      }),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: cabildeoDetailQueryKey(variables.cabildeoUri),
      })
      void queryClient.invalidateQueries({
        queryKey: [RQKEY_ROOT, 'delegation-candidates', variables.cabildeoUri],
      })
      void queryClient.invalidateQueries({queryKey: cabildeosQueryKey})
    },
  })
}

export function useVoteMutation() {
  const agent = useAgent()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      cabildeoUri,
      selectedOption,
      isDirect,
    }: {
      cabildeoUri: string
      selectedOption: number
      isDirect: boolean
    }) => {
      await castCabildeoVote(agent, {
        cabildeo: cabildeoUri,
        subject: cabildeoUri,
        subjectType: 'cabildeo',
        selectedOption,
        isDirect,
      })
    },
    onSuccess: (_, {cabildeoUri}) => {
      // Invalidate the detail query so the UI fetches the updated optionSummary from backend
      void queryClient.invalidateQueries({
        queryKey: cabildeoDetailQueryKey(cabildeoUri),
      })
    },
  })
}
