import {
  type AppBskyActorDefs,
  type AppBskyFeedDefs,
  type BskyAgent,
  type ComAtprotoRepoListRecords,
} from '@atproto/api'

import {PARA_POST_COLLECTION} from '../para-lexicons'
import {type FeedAPI, type FeedAPIResponse} from './types'

export class ParaFeedAPI implements FeedAPI {
  agent: BskyAgent
  actor: string
  authorProfile: AppBskyActorDefs.ProfileViewDetailed | null = null

  constructor({
    agent,
    feedParams,
  }: {
    agent: BskyAgent
    feedParams: {actor: string}
  }) {
    this.agent = agent
    this.actor = feedParams.actor
  }

  async peekLatest(): Promise<AppBskyFeedDefs.FeedViewPost> {
    const res = await this.fetch({limit: 1, cursor: undefined})
    return res.feed[0]
  }

  async fetch({
    cursor,
    limit,
  }: {
    cursor: string | undefined
    limit: number
  }): Promise<FeedAPIResponse> {
    // 1. Fetch Author Profile if needed (for PostView)
    console.error('ParaFeedAPI: fetch called for', this.actor)
    if (!this.authorProfile) {
      try {
        const profileRes = await this.agent.getProfile({actor: this.actor})
        this.authorProfile = profileRes.data
      } catch (e) {
        console.error('Failed to fetch author profile for Para feed', e)
        return {feed: []}
      }
    }

    // 2. List Records from com.para.post
    try {
      const res = await this.agent.api.com.atproto.repo.listRecords({
        repo: this.actor,
        collection: PARA_POST_COLLECTION,
        limit,
        cursor,
        reverse: true, // Newest first
      })

      if (!res.success) {
        throw new Error('Failed to list Para posts')
      }

      const records = res.data.records
      const feed: AppBskyFeedDefs.FeedViewPost[] = []
      for (const record of records) {
        try {
          feed.push(this.hydrateRecord(record, this.authorProfile))
        } catch (e) {
          console.error('Failed to hydrate Para record', record.uri, e)
        }
      }

      return {
        cursor: res.data.cursor,
        feed,
      }
    } catch (e) {
      console.error('Error fetching Para posts', e)
      return {feed: []}
    }
  }

  hydrateRecord(
    record: ComAtprotoRepoListRecords.Record,
    author: AppBskyActorDefs.ProfileViewDetailed,
  ): AppBskyFeedDefs.FeedViewPost {
    const val = JSON.parse(JSON.stringify(record.value))
    // HACK: Alias com.para.post to app.bsky.feed.post to pass client-side validation
    // The UI handles rendering, but the feed slicer enforces strict types.
    if (val.$type === PARA_POST_COLLECTION) {
      val.$type = 'app.bsky.feed.post'
    }

    // Hydrate Images (Basic)
    let embed: any = undefined
    if (val.embed && val.embed.$type === 'app.bsky.embed.images') {
      const images = (val.embed.images || []).map((img: any) => {
        // Construct Link to Blob
        // format: <service>/xrpc/com.atproto.sync.getBlob?did=<did>&cid=<cid>
        // Use agent.service (PDS)
        // Ensure serviceUrl does not have trailing slash?
        const serviceUrl = this.agent.service.toString().replace(/\/$/, '')
        const thumb = `${serviceUrl}/xrpc/com.atproto.sync.getBlob?did=${this.actor}&cid=${img.image.ref.toString()}`
        return {
          thumb,
          fullsize: thumb,
          alt: img.alt || '',
        }
      })
      embed = {
        $type: 'app.bsky.embed.images#view',
        images,
      }
    }
    // TODO: Support other embeds if needed.

    // Ensure langs exists for validation/filtering
    if (!val.langs || !Array.isArray(val.langs)) {
      val.langs = ['en'] // Default to English for now
    }

    // Preserve Para-specific fields through hydration
    const paraFlairs: string[] = val.flairs || []
    const paraPostType: string | undefined = val.postType
    const paraTags: string[] = val.tags || []

    const postView: AppBskyFeedDefs.PostView = {
      uri: record.uri,
      cid: record.cid,
      author: {
        did: author.did,
        handle: author.handle,
        displayName: author.displayName,
        avatar: author.avatar,
        viewer: author.viewer,
        labels: author.labels,
      },
      record: {
        ...val,
        // Ensure Para fields are always present for downstream consumers
        flairs: paraFlairs,
        postType: paraPostType,
        tags: paraTags,
      },
      indexedAt: val.createdAt,
      likeCount: 0, // MVP: No counts
      replyCount: 0,
      repostCount: 0,
      viewer: {}, // MVP: No interaction state
      embed,
      labels: [],
    }

    // DEBUG: Log the type to verify the hack
    // console.log('Hydrated Para Record Type:', (postView.record as any).$type)

    return {
      post: postView,
      // MVP: No thread context/replies in feed yet
    }
  }
}
