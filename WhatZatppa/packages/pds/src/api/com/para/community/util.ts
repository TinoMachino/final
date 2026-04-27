// @ts-nocheck
import { AtUri } from '@atproto/syntax'
import { ActorStoreReader } from '../../../../actor-store/actor-store-reader'
import * as ComParaCommunityBoard from '../../../../lexicon/types/com/para/community/board'
import * as ComParaCommunityGetBoard from '../../../../lexicon/types/com/para/community/getBoard'
import * as ComParaCommunityGovernance from '../../../../lexicon/types/com/para/community/governance'
import * as ComParaCommunityMembership from '../../../../lexicon/types/com/para/community/membership'
import * as ComParaCommunityListBoards from '../../../../lexicon/types/com/para/community/listBoards'

export const BOARD_COLLECTION = 'com.para.community.board'
export const MEMBERSHIP_COLLECTION = 'com.para.community.membership'
export const GOVERNANCE_COLLECTION = 'com.para.community.governance'

export const LIST_COLLECTION = 'app.bsky.graph.list'
export const STARTERPACK_COLLECTION = 'app.bsky.graph.starterpack'
export const LIST_ITEM_COLLECTION = 'app.bsky.graph.listitem'

export const DEFAULT_MODERATOR_CAPABILITIES = [
  'appoint_deputies',
  'edit_role_descriptions',
  'review_applicants',
  'publish_governance_updates',
  'set_official_representatives',
]

export const COMMUNITY_MEMBER_CAPABILITIES = ['leave_community']
export const COMMUNITY_NON_MEMBER_CAPABILITIES = ['join_community']
export const COMMUNITY_MODERATOR_CAPABILITIES = [
  'manage_governance',
  'review_members',
  'remove_members',
  'edit_community',
]
export const GLOBAL_COMMUNITY_CAPABILITIES = ['create_community']

export type LocalBoard = {
  uri: string
  cid: string
  record: ComParaCommunityBoard.Record
}

export type LocalGovernanceRecord = ComParaCommunityGovernance.Record

export const normalizeCommunityName = (value: string) => value.trim()

export const normalizeQuadrant = (value: string) => value.trim()

export const normalizeSlug = (value: string) =>
  value
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export const deriveBoardSlug = (name: string, rkey: string) => {
  const base = normalizeSlug(name)
  return base ? `${base}-${rkey}` : `community-${rkey}`
}

export const buildDelegatesChatId = (boardRkey: string) =>
  `para://community/${boardRkey}/delegates`

export const buildSubdelegatesChatId = (boardRkey: string) =>
  `para://community/${boardRkey}/subdelegates`

export const buildSeedGovernanceRecord = ({
  did,
  name,
  slug,
  createdAt,
}: {
  did: string
  name: string
  slug: string
  createdAt: string
}): ComParaCommunityGovernance.Record => ({
  $type: GOVERNANCE_COLLECTION,
  community: `p/${name}`,
  communityId: slug,
  slug,
  createdAt,
  updatedAt: createdAt,
  moderators: [
    {
      did,
      role: 'Founding moderator',
      badge: 'Community Creator',
      capabilities: DEFAULT_MODERATOR_CAPABILITIES,
    },
  ],
  officials: [],
  deputies: [],
  metadata: {
    state: 'seeded',
    reviewCadence: 'Initial setup',
    lastPublishedAt: createdAt,
  },
  editHistory: [
    {
      id: 'seed-governance',
      action: 'publish_governance_updates',
      actorDid: did,
      createdAt,
      summary: 'Initial governance charter seeded during community creation.',
    },
  ],
})

export const listLocalBoards = async (
  store: ActorStoreReader,
  limit = 50,
): Promise<LocalBoard[]> => {
  const records = await store.record.listRecordsForCollection({
    collection: BOARD_COLLECTION,
    limit,
    reverse: false,
    includeSoftDeleted: true,
  })

  return records.flatMap((record) => {
    const validated = ComParaCommunityBoard.validateRecord(record.value)
    if (!validated.success) return []
    return [
      {
        uri: record.uri,
        cid: record.cid,
        record: validated.value,
      },
    ]
  })
}

export const findMatchingBoardByIdentity = async ({
  store,
  name,
  quadrant,
}: {
  store: ActorStoreReader
  name: string
  quadrant: string
}): Promise<LocalBoard | null> => {
  const normalizedName = normalizeSlug(name)
  const normalizedQuadrant = normalizeSlug(quadrant)
  const boards = await listLocalBoards(store, 100)

  return (
    boards.find((board) => {
      return (
        normalizeSlug(board.record.name) === normalizedName &&
        normalizeSlug(board.record.quadrant) === normalizedQuadrant
      )
    }) ?? null
  )
}

export const findLocalBoard = async ({
  store,
  uri,
  communityId,
}: {
  store: ActorStoreReader
  uri?: string
  communityId?: string
}): Promise<LocalBoard | null> => {
  if (uri) {
    let parsed: AtUri
    try {
      parsed = new AtUri(uri)
    } catch {
      return null
    }
    const record = await store.record.getRecord(parsed, null, true)
    if (!record) return null
    const validated = ComParaCommunityBoard.validateRecord(record.value)
    if (!validated.success) return null
    return {
      uri: parsed.toString(),
      cid: record.cid,
      record: validated.value,
    }
  }

  if (!communityId) return null
  const boards = await listLocalBoards(store, 100)
  return (
    boards.find((board) => {
      const boardUri = new AtUri(board.uri)
      return deriveBoardSlug(board.record.name, boardUri.rkey) === communityId
    }) ?? null
  )
}

export const getLocalMembership = async ({
  store,
  viewerDid,
  boardUri,
}: {
  store: ActorStoreReader
  viewerDid: string
  boardUri: string
}): Promise<ComParaCommunityMembership.Record | null> => {
  const board = new AtUri(boardUri)
  const membershipUri = AtUri.make(viewerDid, MEMBERSHIP_COLLECTION, board.rkey)
  const membership = await store.record.getRecord(membershipUri, null, true)
  if (!membership) return null
  const validated = ComParaCommunityMembership.validateRecord(membership.value)
  return validated.success ? validated.value : null
}

export const getMembershipUriForBoard = ({
  viewerDid,
  boardUri,
}: {
  viewerDid: string
  boardUri: string
}) => {
  const board = new AtUri(boardUri)
  return AtUri.make(viewerDid, MEMBERSHIP_COLLECTION, board.rkey)
}

export const getViewerCapabilities = (
  membership?: Pick<
    ComParaCommunityMembership.Record,
    'membershipState' | 'roles'
  > | null,
) => {
  const capabilities = new Set<string>(GLOBAL_COMMUNITY_CAPABILITIES)
  const state = membership?.membershipState ?? 'none'
  const roles = membership?.roles ?? []

  if (state === 'active') {
    COMMUNITY_MEMBER_CAPABILITIES.forEach((capability) =>
      capabilities.add(capability),
    )
  } else if (state === 'none' || state === 'left') {
    COMMUNITY_NON_MEMBER_CAPABILITIES.forEach((capability) =>
      capabilities.add(capability),
    )
  }

  if (
    state === 'active' &&
    (roles.includes('owner') || roles.includes('moderator'))
  ) {
    COMMUNITY_MODERATOR_CAPABILITIES.forEach((capability) =>
      capabilities.add(capability),
    )
  }

  return Array.from(capabilities)
}

export const getLocalGovernance = async ({
  store,
  creatorDid,
  board,
}: {
  store: ActorStoreReader
  creatorDid: string
  board: LocalBoard
}): Promise<LocalGovernanceRecord | null> => {
  const boardUri = new AtUri(board.uri)
  const governanceUri = AtUri.make(
    creatorDid,
    GOVERNANCE_COLLECTION,
    deriveBoardSlug(board.record.name, boardUri.rkey),
  )
  const governance = await store.record.getRecord(governanceUri, null, true)
  if (!governance) return null
  const validated = ComParaCommunityGovernance.validateRecord(governance.value)
  return validated.success ? validated.value : null
}

export const getFoundingMemberCount = async ({
  store,
  board,
}: {
  store: ActorStoreReader
  board: LocalBoard
}): Promise<number> => {
  const founderStarterPackUri = board.record.founderStarterPackUri
  if (!founderStarterPackUri) {
    return 0
  }

  let starterPackUri: AtUri
  try {
    starterPackUri = new AtUri(founderStarterPackUri)
  } catch {
    return 0
  }

  const starterPack = await store.record.getRecord(starterPackUri, null, true)
  if (!starterPack) {
    return 0
  }

  const listUri =
    starterPack.value &&
    typeof starterPack.value === 'object' &&
    'list' in starterPack.value &&
    typeof starterPack.value.list === 'string'
      ? starterPack.value.list
      : undefined
  if (!listUri) {
    return 0
  }
  const listItems = await store.record.listRecordsForCollection({
    collection: LIST_ITEM_COLLECTION,
    limit: 100,
    reverse: false,
    includeSoftDeleted: true,
  })

  return listItems.filter((item) => {
    return item.value && (item.value as {list?: string}).list === listUri
  }).length
}

const buildBoardViewShape = ({
  board,
  creatorDid,
  creatorHandle,
  creatorDisplayName,
  viewerMembershipState,
  viewerRoles,
  memberCount,
}: {
  board: LocalBoard
  creatorDid: string
  creatorHandle?: string
  creatorDisplayName?: string
  viewerMembershipState?: string
  viewerRoles?: string[]
  memberCount?: number
}) => {
  const boardUri = new AtUri(board.uri)
  const slug = deriveBoardSlug(board.record.name, boardUri.rkey)

  return {
    uri: board.uri,
    cid: board.cid,
    creatorDid,
    creatorHandle,
    creatorDisplayName,
    communityId: slug,
    slug,
    name: board.record.name,
    description: board.record.description,
    quadrant: board.record.quadrant,
    delegatesChatId: board.record.delegatesChatId,
    subdelegatesChatId: board.record.subdelegatesChatId,
    memberCount: memberCount ?? 0,
    viewerMembershipState:
      (viewerMembershipState as
        | 'none'
        | 'pending'
        | 'active'
        | 'left'
        | 'removed'
        | 'blocked') ?? 'none',
    viewerRoles,
    status: board.record.status,
    founderStarterPackUri: board.record.founderStarterPackUri,
    createdAt: board.record.createdAt,
  }
}

export const toGetBoardView = (args: {
  board: LocalBoard
  creatorDid: string
  creatorHandle?: string
  creatorDisplayName?: string
  viewerMembershipState?: string
  viewerRoles?: string[]
  memberCount?: number
}): ComParaCommunityGetBoard.BoardView => buildBoardViewShape(args)

export const toListBoardView = (args: {
  board: LocalBoard
  creatorDid: string
  creatorHandle?: string
  creatorDisplayName?: string
  viewerMembershipState?: string
  viewerRoles?: string[]
  memberCount?: number
}): ComParaCommunityListBoards.BoardView => buildBoardViewShape(args)

export const toGovernanceSummary = (
  governance: LocalGovernanceRecord | null,
): ComParaCommunityGetBoard.GovernanceSummary | undefined => {
  if (!governance) return undefined
  return {
    moderatorCount: governance.moderators.length,
    officialCount: governance.officials.length,
    deputyRoleCount: governance.deputies.length,
    lastPublishedAt:
      governance.metadata?.lastPublishedAt ||
      governance.updatedAt ||
      governance.createdAt,
  }
}
