import {useCallback} from 'react'

import * as persisted from '#/state/persisted'
import {type CommunityBoardView} from '#/state/queries/community-boards'

export function useRecentCommunities() {
  return persisted.get('recentCommunities') || []
}

export function useAddRecentCommunity() {
  return useCallback((community: CommunityBoardView) => {
    const current = persisted.get('recentCommunities') || []
    const filtered = current.filter(c => c.uri !== community.uri)
    const next = [community, ...filtered].slice(0, 20)
    persisted.write('recentCommunities', next)
  }, [])
}

export function addRecentCommunity(community: CommunityBoardView) {
  const current = persisted.get('recentCommunities') || []
  const filtered = current.filter(c => c.uri !== community.uri)
  const next = [community, ...filtered].slice(0, 20)
  persisted.write('recentCommunities', next)
}
