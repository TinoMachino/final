import {useQuery} from '@tanstack/react-query'

import {getOpenQuestionSearchQuery} from '#/lib/tags'
import {useAgent} from '#/state/session'

export const OPEN_QUESTIONS_QUERY_KEY = ['open-questions']

/**
 * Query hook to fetch Open Question posts from the network
 * Uses the |#?OpenQuestion tag to identify posts
 */
export function useOpenQuestions() {
  const agent = useAgent()

  return useQuery({
    queryKey: OPEN_QUESTIONS_QUERY_KEY,
    queryFn: async () => {
      const searchQuery = getOpenQuestionSearchQuery()

      try {
        const result = await agent.api.app.bsky.feed.searchPosts({
          q: searchQuery,
          limit: 50,
          sort: 'latest',
        })

        return result.data.posts || []
      } catch (error) {
        console.warn('Failed to search for Open Questions:', error)
        throw error
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
  })
}
