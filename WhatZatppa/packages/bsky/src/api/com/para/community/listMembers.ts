// @ts-nocheck
import { InvalidRequestError } from '@atproto/xrpc-server'
import { AppContext } from '../../../../context'
import { Code, isDataplaneError } from '../../../../data-plane'
import { parseString } from '../../../../hydration/util'
import { Server } from '../../../../lexicon'
import { QueryParams } from '../../../../lexicon/types/com/para/community/listMembers'
import { resHeaders } from '../../../util'

export default function (server: Server, ctx: AppContext) {
  server.com.para.community.listMembers({
    auth: ctx.authVerifier.standardOrRole,
    handler: async ({ params, auth, req }) => {
      const { viewer } = ctx.authVerifier.parseCreds(auth)
      const labelers = ctx.reqLabelers(req)
      const result = await listMembers({
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

const listMembers = async ({
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
    .getParaCommunityMembers({
      communityId: params.communityId,
      membershipState: params.membershipState ?? '',
      role: params.role ?? '',
      sort: params.sort ?? '',
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
    members: res.members.map((member) => ({
      did: member.did,
      handle: parseString(member.handle),
      displayName: parseString(member.displayName),
      avatar: parseString(member.avatar),
      membershipState: member.membershipState,
      roles: member.roles.length ? member.roles : undefined,
      joinedAt: member.joinedAt,
      votesCast: member.votesCast,
      delegationsReceived: member.delegationsReceived,
      policyPosts: member.policyPosts,
      matterPosts: member.matterPosts,
    })),
    cursor: parseString(res.cursor),
  }
}

const normalizeLimit = (limit: number | undefined) => {
  if (!limit || Number.isNaN(limit)) return 50
  return Math.max(1, Math.min(limit, 100))
}
