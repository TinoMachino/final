import {useCallback, useEffect, useState} from 'react'

import * as persisted from '#/state/persisted'
import {type CommunityBoardView} from '#/state/queries/community-boards'

export function useRecentCommunities() {
  const [recents, setRecents] = useState(() => persisted.get('recentCommunities') || [])

  useEffect(() => {
    return persisted.onUpdate('recentCommunities', next => {
      setRecents(next || [])
    })
  }, [])

  return recents
}

export function useAddRecentCommunity() {
  return useCallback((community: CommunityBoardView) => {
    addRecentCommunity(community)
  }, [])
}

export function addRecentCommunity(community: CommunityBoardView) {
  const current = persisted.get('recentCommunities') || []
  const filtered = current.filter(c => c.uri !== community.uri)
  const next = [community, ...filtered].slice(0, 20)
  persisted.write('recentCommunities', next)
}

export function clearRecentCommunities() {
  persisted.write('recentCommunities', [])
}
