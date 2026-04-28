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
      try {
        const records = await fetchCabildeos(agent)
        return mapCabildeosToView(records)
      } catch (err: any) {
        // Graceful fallback: if the civic endpoint is unavailable (e.g. dev
        // env without para dataplane), return empty instead of crashing UI.
        console.warn('Cabildeos fetch failed, returning empty:', err?.message)
        return []
      }
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
    onMutate: async ({cabildeoUri, selectedOption, isDirect}) => {
      const queryKey = cabildeoDetailQueryKey(cabildeoUri)
      await queryClient.cancelQueries({queryKey})
      const previous = queryClient.getQueryData<CabildeoView>(queryKey)

      if (previous) {
        const nextOptionSummary = previous.optionSummary.map(s =>
          s.optionIndex === selectedOption
            ? {...s, votes: s.votes + 1}
            : s,
        )
        // Add entry if this option hasn't been voted on yet
        if (!nextOptionSummary.find(s => s.optionIndex === selectedOption)) {
          const optionLabel =
            previous.options[selectedOption]?.label || `Opción ${selectedOption + 1}`
          nextOptionSummary.push({
            optionIndex: selectedOption,
            label: optionLabel,
            votes: 1,
            positions: 0,
          })
        }

        queryClient.setQueryData(queryKey, {
          ...previous,
          userContext: {
            ...previous.userContext,
            viewerVoteOption: selectedOption,
            viewerVoteIsDirect: isDirect,
          },
          optionSummary: nextOptionSummary,
          voteTotals: {
            ...previous.voteTotals,
            total: previous.voteTotals.total + 1,
            direct: previous.voteTotals.direct + (isDirect ? 1 : 0),
          },
        })
      }

      return {previous}
    },
    onError: (_err, {cabildeoUri}, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          cabildeoDetailQueryKey(cabildeoUri),
          context.previous,
        )
      }
    },
    onSettled: (_data, _err, {cabildeoUri}) => {
      // Revalidate detail, positions list, and master list
      void queryClient.invalidateQueries({
        queryKey: cabildeoDetailQueryKey(cabildeoUri),
      })
      void queryClient.invalidateQueries({
        queryKey: [RQKEY_ROOT, 'positions', cabildeoUri],
      })
      void queryClient.invalidateQueries({queryKey: cabildeosQueryKey})
    },
  })
}
