// @ts-nocheck
import { InvalidRequestError } from '@atproto/xrpc-server'
import { AppContext } from '../../../../context'
import { Code, isDataplaneError } from '../../../../data-plane'
import { parseString } from '../../../../hydration/util'
import { Server } from '../../../../lexicon'
import { QueryParams } from '../../../../lexicon/types/com/para/civic/listDelegationCandidates'
import { resHeaders } from '../../../util'

export default function (server: Server, ctx: AppContext) {
  server.com.para.civic.listDelegationCandidates({
    auth: ctx.authVerifier.standardOrRole,
    handler: async ({ params, auth, req }) => {
      const { viewer } = ctx.authVerifier.parseCreds(auth)
      const labelers = ctx.reqLabelers(req)
      const result = await listDelegationCandidates({
        ctx,
        params,
        viewer: viewer ?? '',
        viewerIsAdmin: auth.credentials.type === 'role' && auth.credentials.admin,
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

const listDelegationCandidates = async ({
  ctx,
  params,
  viewer,
  viewerIsAdmin,
}: {
  ctx: AppContext
  params: QueryParams
  viewer: string
  viewerIsAdmin: boolean
}) => {
  const res = await ctx.dataplane
    .getParaDelegationCandidates({
      cabildeoUri: params.cabildeo,
      communityId: params.communityId ?? '',
      limit: normalizeLimit(params.limit),
      cursor: params.cursor ?? '',
      viewerDid: viewer,
      viewerIsAdmin,
    })
    .catch((err) => {
      if (isDataplaneError(err, Code.PermissionDenied)) {
        throw new InvalidRequestError(
          'Active community membership is required',
          'CommunityMembershipRequired',
        )
      }
      throw err
    })

  return {
    candidates: res.candidates.map((candidate) => ({
      did: candidate.did,
      handle: parseString(candidate.handle),
      displayName: parseString(candidate.displayName),
      avatar: parseString(candidate.avatar),
      description: parseString(candidate.description),
      roles: candidate.roles.length ? candidate.roles : undefined,
      activeDelegationCount: candidate.activeDelegationCount,
      hasVoted: candidate.hasVoted,
      votedAt: parseString(candidate.votedAt),
      selectedOption: candidate.selectedOption,
    })),
    cursor: parseString(res.cursor),
  }
}

const normalizeLimit = (limit: number | undefined) => {
  if (!limit || Number.isNaN(limit)) return 50
  return Math.max(1, Math.min(limit, 100))
}
