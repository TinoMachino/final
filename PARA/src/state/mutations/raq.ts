import {useMutation, useQueryClient} from '@tanstack/react-query'

import {
  submitOpenQuestion,
  submitProposedQuestion,
  voteOnCommunityAxis,
  voteOnProposedQuestion,
} from '#/lib/services/raq'

export function useSubmitOpenQuestionMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: submitOpenQuestion,
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['raq_open_questions']})
    },
  })
}

export function useSubmitProposedQuestionMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: submitProposedQuestion,
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['raq_proposed_questions']})
    },
  })
}

export function useVoteOnProposedQuestionMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({id, direction}: {id: string; direction: 'up' | 'down'}) =>
      voteOnProposedQuestion(id, direction),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['raq_proposed_questions']})
    },
  })
}

export function useVoteOnCommunityAxisMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: voteOnCommunityAxis,
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['raq_community_axes']})
    },
  })
}
