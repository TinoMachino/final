// @ts-nocheck
import { AppContext } from '../../../../context'
import { Server } from '../../../../lexicon'
import { ids } from '../../../../lexicon/lexicons'
import { OutputSchema } from '../../../../lexicon/types/com/para/feed/getAuthorFeed'
import { com } from '../../../../lexicons/index.js'
import { computeProxyTo } from '../../../../pipethrough'
import {
  LocalRecords,
  LocalViewer,
  pipethroughReadAfterWrite,
} from '../../../../read-after-write'
import { insertLocalPostsInFeed, resolveLocalActorDid } from './util'

export default function (server: Server, ctx: AppContext) {
  if (!ctx.bskyAppView) return

  server.com.para.feed.getAuthorFeed({
    auth: ctx.authVerifier.authorization({
      authorize: (permissions, { req }) => {
        const lxm = ids.ComParaFeedGetAuthorFeed
        const aud = computeProxyTo(ctx, req, lxm)
        permissions.assertRpc({ aud, lxm })
      },
    }),
    handler: async (reqCtx) => {
      const actorDid = await resolveLocalActorDid(ctx, reqCtx.params.actor)

      return pipethroughReadAfterWrite(
        ctx,
        reqCtx,
        com.para.feed.getAuthorFeed.main,
        (localViewer, original, local, requester) =>
          getAuthorFeedMunge(localViewer, original, local, requester, actorDid),
      )
    },
  })
}

const getAuthorFeedMunge = async (
  _localViewer: LocalViewer,
  original: OutputSchema,
  local: LocalRecords,
  requester: string,
  actorDid?: string,
): Promise<OutputSchema> => {
  if (!actorDid || actorDid !== requester) {
    return original
  }

  const feed = insertLocalPostsInFeed([...original.feed], local.paraPosts)
  return {
    ...original,
    feed,
  }
}
