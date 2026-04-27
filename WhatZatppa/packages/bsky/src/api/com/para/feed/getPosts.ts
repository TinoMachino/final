// @ts-nocheck
import { dedupeStrs } from '@atproto/common'
import { AppContext } from '../../../../context'
import { DataPlaneClient } from '../../../../data-plane'
import { HydrateCtx, Hydrator } from '../../../../hydration/hydrator'
import { parseString } from '../../../../hydration/util'
import { Server } from '../../../../lexicon'
import { QueryParams } from '../../../../lexicon/types/com/para/feed/getPosts'
import { Views } from '../../../../views'
import { resHeaders } from '../../../util'

export default function (server: Server, ctx: AppContext) {
  server.com.para.feed.getPosts({
    auth: ctx.authVerifier.standardOptional,
    handler: async ({ params, auth, req }) => {
      const viewer = auth.credentials.iss
      const labelers = ctx.reqLabelers(req)
      const hydrateCtx = await ctx.hydrator.createContext({ labelers, viewer })

      const result = await getPosts({
        ctx,
        params: { ...params, hydrateCtx },
      })
      const repoRev = await ctx.hydrator.actor.getRepoRevSafe(viewer)

      return {
        encoding: 'application/json' as const,
        body: result,
        headers: resHeaders({ labelers: hydrateCtx.labelers, repoRev }),
      }
    },
  })
}

const getPosts = async (inputs: { ctx: Context; params: Params }) => {
  const { ctx, params } = inputs
  const uris = dedupeStrs(params.uris)
  const res = await ctx.dataplane.getParaPosts({ uris })
  const authors = [...new Set(res.items.map((item) => item.author))]
  const hydration = await ctx.hydrator.hydrateProfileViewers(
    authors,
    params.hydrateCtx,
  )

  return {
    posts: res.items
      .filter((item) => !shouldHide(item.author, ctx.views, hydration))
      .map((item) => ({
        uri: item.uri,
        cid: item.cid,
        author: item.author,
        text: item.text,
        createdAt: item.createdAt,
        replyRoot: parseString(item.replyRoot),
        replyParent: parseString(item.replyParent),
        langs: item.langs.length ? item.langs : undefined,
        tags: item.tags.length ? item.tags : undefined,
        flairs: item.flairs.length ? item.flairs : undefined,
        postType: parseString(item.postType),
      })),
  }
}

const shouldHide = (
  authorDid: string,
  views: Views,
  hydration: Awaited<ReturnType<Hydrator['hydrateProfileViewers']>>,
) => {
  return (
    views.viewerBlockExists(authorDid, hydration) ||
    views.viewerMuteExists(authorDid, hydration)
  )
}

type Context = {
  hydrator: Hydrator
  views: Views
  dataplane: DataPlaneClient
}

type Params = QueryParams & { hydrateCtx: HydrateCtx }
