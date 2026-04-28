import { AppContext } from '../../../../context'
import { parseString } from '../../../../hydration/util'
import { Server } from '../../../../lexicon'
import { QueryParams } from '../../../../lexicon/types/com/para/community/listBoards'
import { resHeaders } from '../../../util'

export default function (server: Server, ctx: AppContext) {
  server.com.para.community.listBoards({
    auth: ctx.authVerifier.optionalStandardOrRole,
    handler: async ({ params, auth, req }) => {
      const { viewer } = ctx.authVerifier.parseCreds(auth)
      const labelers = ctx.reqLabelers(req)
      const result = await listBoards({
        ctx,
        params,
        viewer: viewer ?? undefined,
      })
      const repoRev = await ctx.hydrator.actor.getRepoRevSafe(viewer)

      return {
        encoding: 'application/json' as const,
        body: result,
        headers: resHeaders({ repoRev, labelers }),
      }
    },
  })
}

const listBoards = async ({
  ctx,
  params,
  viewer,
}: {
  ctx: AppContext
  params: QueryParams
  viewer?: string
}) => {
  const cache = ctx.paraCache
  const cacheKey = cache?.boardsKey({
    viewerDid: viewer ?? '',
    sort: params.sort ?? '',
    state: params.state ?? '',
    participationKind: params.participationKind ?? '',
    flairId: params.flairId ?? '',
    quadrant: params.quadrant,
    query: params.query ?? '',
    limit: normalizeLimit(params.limit),
    cursor: params.cursor ?? '',
  })
  if (cache && cacheKey) {
    const cached = await cache.get(cacheKey, 'boards')
    if (cached) return cached
  }

  const res = await ctx.dataplane.getParaCommunityBoards({
    viewerDid: viewer ?? '',
    limit: normalizeLimit(params.limit),
    cursor: params.cursor ?? '',
    query: params.query ?? '',
    state: params.state ?? '',
    participationKind: params.participationKind ?? '',
    flairId: params.flairId ?? '',
    sort: params.sort ?? '',
    quadrant: params.quadrant,
  })

  const result = {
    boards: res.boards.map((board) => ({
      uri: board.uri,
      cid: board.cid,
      creatorDid: board.creatorDid,
      creatorHandle: parseString(board.creatorHandle),
      creatorDisplayName: parseString(board.creatorDisplayName),
      communityId: board.communityId,
      slug: board.slug,
      name: board.name,
      description: parseString(board.description),
      quadrant: board.quadrant,
      delegatesChatId: board.delegatesChatId,
      subdelegatesChatId: board.subdelegatesChatId,
      memberCount: board.memberCount,
      viewerMembershipState: (parseString(board.viewerMembershipState) ??
        'none') as
        | 'none'
        | 'pending'
        | 'active'
        | 'left'
        | 'removed'
        | 'blocked',
      viewerRoles: board.viewerRoles.length ? board.viewerRoles : undefined,
      status: parseString((board as {status?: string}).status) as
        | 'draft'
        | 'active'
        | undefined,
      founderStarterPackUri: parseString(
        (board as {founderStarterPackUri?: string}).founderStarterPackUri,
      ),
      createdAt: board.createdAt,
      governanceSummary: board.governanceSummary
        ? {
            moderatorCount: board.governanceSummary.moderatorCount,
            officialCount: board.governanceSummary.officialCount,
            deputyRoleCount: board.governanceSummary.deputyRoleCount,
            lastPublishedAt: parseString(
              board.governanceSummary.lastPublishedAt,
            ),
          }
        : undefined,
    })),
    canCreateCommunity: true,
    cursor: parseString(res.cursor),
  }

  if (cache && cacheKey) {
    await cache.set(cacheKey, 'boards', result)
  }
  return result
}

const normalizeLimit = (limit: number | undefined) => {
  if (!limit || Number.isNaN(limit)) return 50
  return Math.max(1, Math.min(limit, 100))
}
