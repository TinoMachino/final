// @ts-nocheck
import { TID } from '@atproto/common'
import { InvalidRequestError } from '@atproto/xrpc-server'
import { AppContext } from '../../../../context'
import { Server } from '../../../../lexicon'
import { ids } from '../../../../lexicon/lexicons'
import { com } from '../../../../lexicons'
import {
  BadCommitSwapError,
  InvalidRecordError,
  prepareCreate,
} from '../../../../repo'

const VOTE_COLLECTION = 'com.para.civic.vote'
const VOTING_PHASE = 'voting'

export default function (server: Server, ctx: AppContext) {
  if (!ctx.bskyAppView) return

  server.com.para.civic.castVote({
    auth: ctx.authVerifier.authorization({
      authorize: (permissions) => {
        permissions.assertRepo({
          action: 'create',
          collection: VOTE_COLLECTION,
        })
      },
    }),
    handler: async ({ input, auth }) => {
      const did = auth.credentials.did
      const cabildeoUri = input.body.cabildeo
      const selectedOption = input.body.selectedOption
      const now = new Date()
      const createdAt = now.toISOString()

      const cabildeo = await getCabildeoForVote(ctx, did, cabildeoUri)
      assertVoteAllowed(cabildeo, selectedOption, now)
      await assertActiveCommunityMember(ctx, did, cabildeo.community)

      const record = {
        $type: VOTE_COLLECTION,
        subject: cabildeoUri,
        subjectType: 'cabildeo',
        cabildeo: cabildeoUri,
        selectedOption,
        isDirect: true,
        createdAt,
      }

      const write = await prepareCreate({
        did,
        collection: VOTE_COLLECTION,
        rkey: TID.nextStr(),
        record,
      })

      const commit = await ctx.actorStore.transact(did, async (actorTxn) => {
        const commit = await actorTxn.repo.processWrites([write]).catch((err) => {
          if (err instanceof BadCommitSwapError) {
            throw new InvalidRequestError(err.message, 'InvalidSwap')
          }
          if (err instanceof InvalidRecordError) {
            throw new InvalidRequestError(err.message)
          }
          throw err
        })
        await ctx.sequencer.sequenceCommit(did, commit)
        return commit
      })

      await ctx.accountManager
        .updateRepoRoot(did, commit.cid, commit.rev)
        .catch(() => {})

      return {
        encoding: 'application/json' as const,
        body: {
          uri: write.uri.toString(),
          cid: write.cid.toString(),
          commit: {
            cid: commit.cid.toString(),
            rev: commit.rev,
          },
        },
      }
    },
  })
}

const getCabildeoForVote = async (
  ctx: AppContext,
  did: string,
  cabildeoUri: string,
) => {
  const { headers } = await ctx.appviewAuthHeaders(
    did,
    ids.ComParaCivicGetCabildeo,
  )
  const res = await ctx.bskyAppView.client
    .call(com.para.civic.getCabildeo.main, { cabildeo: cabildeoUri }, { headers })
    .catch((err) => {
      throw new InvalidRequestError(
        err?.message || 'Cabildeo not found',
        'NotFound',
      )
    })

  if (!res?.cabildeo) {
    throw new InvalidRequestError('Cabildeo not found', 'NotFound')
  }
  return res.cabildeo
}

const assertVoteAllowed = (
  cabildeo: {
    phase?: string
    phaseDeadline?: string
    options?: unknown[]
  },
  selectedOption: number,
  now: Date,
) => {
  if (cabildeo.phase !== VOTING_PHASE) {
    throw new InvalidRequestError(
      'Cabildeo is not in voting phase',
      'InvalidPhase',
    )
  }
  if (cabildeo.phaseDeadline && new Date(cabildeo.phaseDeadline) <= now) {
    throw new InvalidRequestError('Voting deadline has passed', 'DeadlineExpired')
  }
  if (
    !Number.isInteger(selectedOption) ||
    selectedOption < 0 ||
    !Array.isArray(cabildeo.options) ||
    selectedOption >= cabildeo.options.length
  ) {
    throw new InvalidRequestError('Invalid vote option', 'InvalidOption')
  }
}

const assertActiveCommunityMember = async (
  ctx: AppContext,
  did: string,
  community: string,
) => {
  const communityId = normalizeCommunitySlug(community)
  const { headers } = await ctx.appviewAuthHeaders(
    did,
    ids.ComParaCommunityGetBoard,
  )
  const res = await ctx.bskyAppView.client
    .call(com.para.community.getBoard.main, { communityId }, { headers })
    .catch(() => null)

  if (res?.board?.viewerMembershipState !== 'active') {
    throw new InvalidRequestError(
      'Active community membership is required',
      'CommunityMembershipRequired',
    )
  }
}

const normalizeCommunitySlug = (value: string) =>
  value
    .replace(/^p\//, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
