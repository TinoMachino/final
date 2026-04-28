import { ServiceImpl } from '@connectrpc/connect'
import { Service } from '../../../proto/bsky_connect'
import {
  FeedType,
  ParaAuthorFeedItem,
} from '../../../proto/bsky_pb'
import { Database } from '../db'
import { TimeCidKeyset, paginate } from '../db/pagination'

export default (db: Database): Partial<ServiceImpl<typeof Service>> => ({
  async getParaAuthorFeed(req) {
    const { ref } = db.db.dynamic
    let builder = db.db
      .selectFrom('para_post')
      .selectAll('para_post')
      .where('creator', '=', req.actorDid)

    if (req.party || req.community) {
      builder = builder.innerJoin(
        'para_post_meta',
        'para_post_meta.postUri',
        'para_post.uri',
      )
      if (req.party) {
        builder = builder.where('para_post_meta.party', '=', req.party)
      }
      if (req.community) {
        builder = builder.where('para_post_meta.community', '=', req.community)
      }
    }

    const keyset = new TimeCidKeyset(
      ref('para_post.sortAt'),
      ref('para_post.cid'),
    )

    builder = paginate(builder, {
      limit: req.limit,
      cursor: req.cursor,
      keyset,
      tryIndex: true,
    })

    const posts = await builder.execute()

    return {
      items: posts.map(paraFeedItemFromRow),
      cursor: keyset.packFromResult(posts),
    }
  },

  async getParaTimeline(req) {
    const { actorDid, limit, cursor } = req
    const { ref } = db.db.dynamic
    const hasMetaFilter = !!(req.party || req.community)

    const keyset = new TimeCidKeyset(
      ref('para_post.sortAt'),
      ref('para_post.cid'),
    )

    let followQb = db.db
      .selectFrom('para_post')
      .innerJoin('follow', 'follow.subjectDid', 'para_post.creator')
      .where('follow.creator', '=', actorDid)
      .selectAll('para_post')

    if (hasMetaFilter) {
      followQb = followQb.innerJoin(
        'para_post_meta',
        'para_post_meta.postUri',
        'para_post.uri',
      )
      if (req.party) {
        followQb = followQb.where('para_post_meta.party', '=', req.party)
      }
      if (req.community) {
        followQb = followQb.where('para_post_meta.community', '=', req.community)
      }
    }

    followQb = paginate(followQb, {
      limit,
      cursor,
      keyset,
      tryIndex: true,
    })

    let selfQb = db.db
      .selectFrom('para_post')
      .where('para_post.creator', '=', actorDid)
      .selectAll('para_post')

    if (hasMetaFilter) {
      selfQb = selfQb.innerJoin(
        'para_post_meta',
        'para_post_meta.postUri',
        'para_post.uri',
      )
      if (req.party) {
        selfQb = selfQb.where('para_post_meta.party', '=', req.party)
      }
      if (req.community) {
        selfQb = selfQb.where('para_post_meta.community', '=', req.community)
      }
    }

    selfQb = paginate(selfQb, {
      limit: Math.min(limit, 10),
      cursor,
      keyset,
      tryIndex: true,
    })

    const [followRes, selfRes] = await Promise.all([
      followQb.execute(),
      selfQb.execute(),
    ])

    const posts = [...followRes, ...selfRes]
      .sort((a, b) => {
        if (a.sortAt > b.sortAt) return -1
        if (a.sortAt < b.sortAt) return 1
        return a.cid > b.cid ? -1 : 1
      })
      .slice(0, limit)

    return {
      items: posts.map(paraFeedItemFromRow),
      cursor: keyset.packFromResult(posts),
    }
  },

  async getParaPosts(req) {
    if (!req.uris.length) {
      return { items: [] }
    }

    const posts = await db.db
      .selectFrom('para_post')
      .selectAll('para_post')
      .where('uri', 'in', req.uris)
      .execute()

    const byUri = new Map(posts.map((post) => [post.uri, post]))

    return {
      items: req.uris
        .map((uri) => byUri.get(uri))
        .filter((post): post is NonNullable<typeof post> => !!post)
        .map(paraFeedItemFromRow),
    }
  },

  async getParaThread(req) {
    const post = await db.db
      .selectFrom('para_post')
      .selectAll('para_post')
      .where('uri', '=', req.postUri)
      .executeTakeFirst()

    if (!post) {
      return {}
    }

    const [parents, replies] = await Promise.all([
      post.replyRoot || post.replyParent
        ? db.db
            .selectFrom('para_post')
            .selectAll('para_post')
            .where('uri', 'in', [post.replyRoot, post.replyParent].filter(
              (uri): uri is string => !!uri,
            ))
            .orderBy('sortAt', 'asc')
            .limit(req.above || 80)
            .execute()
        : [],
      db.db
        .selectFrom('para_post')
        .selectAll('para_post')
        .where((qb) =>
          qb
            .where('replyRoot', '=', post.uri)
            .orWhere('replyParent', '=', post.uri),
        )
        .orderBy('sortAt', 'asc')
        .limit(req.below || 6)
        .execute(),
    ])

    return {
      post: paraFeedItemFromRow(post),
      parents: parents.map(paraFeedItemFromRow),
      replies: replies.map(paraFeedItemFromRow),
    }
  },

  async getAuthorFeed(req) {
    const { actorDid, limit, cursor, feedType } = req
    const { ref } = db.db.dynamic

    // defaults to posts, reposts, and replies
    let builder = db.db
      .selectFrom('feed_item')
      .innerJoin('post', 'post.uri', 'feed_item.postUri')
      .selectAll('feed_item')
      .where('originatorDid', '=', actorDid)

    if (feedType === FeedType.POSTS_WITH_MEDIA) {
      builder = builder
        // only your own posts
        .where('type', '=', 'post')
        // only posts with media
        .whereExists((qb) =>
          qb
            .selectFrom('post_embed_image')
            .select('post_embed_image.postUri')
            .whereRef('post_embed_image.postUri', '=', 'feed_item.postUri'),
        )
    } else if (feedType === FeedType.POSTS_WITH_VIDEO) {
      builder = builder
        // only your own posts
        .where('type', '=', 'post')
        // only posts with video
        .whereExists((qb) =>
          qb
            .selectFrom('post_embed_video')
            .select('post_embed_video.postUri')
            .whereRef('post_embed_video.postUri', '=', 'feed_item.postUri'),
        )
    } else if (feedType === FeedType.POSTS_NO_REPLIES) {
      builder = builder.where((qb) =>
        qb.where('post.replyParent', 'is', null).orWhere('type', '=', 'repost'),
      )
    } else if (feedType === FeedType.POSTS_AND_AUTHOR_THREADS) {
      builder = builder.where((qb) =>
        qb
          .where('type', '=', 'repost')
          .orWhere('post.replyParent', 'is', null)
          .orWhere('post.replyRoot', 'like', `at://${actorDid}/%`),
      )
    }

    const keyset = new TimeCidKeyset(
      ref('feed_item.sortAt'),
      ref('feed_item.cid'),
    )

    builder = paginate(builder, {
      limit,
      cursor,
      keyset,
    })

    const feedItems = await builder.execute()

    return {
      items: feedItems.map(feedItemFromRow),
      cursor: keyset.packFromResult(feedItems),
    }
  },

  async getTimeline(req) {
    const { actorDid, limit, cursor } = req
    const { ref } = db.db.dynamic

    const keyset = new TimeCidKeyset(
      ref('feed_item.sortAt'),
      ref('feed_item.cid'),
    )

    let followQb = db.db
      .selectFrom('feed_item')
      .innerJoin('follow', 'follow.subjectDid', 'feed_item.originatorDid')
      .where('follow.creator', '=', actorDid)
      .selectAll('feed_item')

    followQb = paginate(followQb, {
      limit,
      cursor,
      keyset,
      tryIndex: true,
    })

    let selfQb = db.db
      .selectFrom('feed_item')
      .where('feed_item.originatorDid', '=', actorDid)
      .selectAll('feed_item')

    selfQb = paginate(selfQb, {
      limit: Math.min(limit, 10),
      cursor,
      keyset,
      tryIndex: true,
    })

    const [followRes, selfRes] = await Promise.all([
      followQb.execute(),
      selfQb.execute(),
    ])

    const feedItems = [...followRes, ...selfRes]
      .sort((a, b) => {
        if (a.sortAt > b.sortAt) return -1
        if (a.sortAt < b.sortAt) return 1
        return a.cid > b.cid ? -1 : 1
      })
      .slice(0, limit)

    return {
      items: feedItems.map(feedItemFromRow),
      cursor: keyset.packFromResult(feedItems),
    }
  },

  async getListFeed(req) {
    const { listUri, cursor, limit } = req
    const { ref } = db.db.dynamic

    let builder = db.db
      .selectFrom('post')
      .selectAll('post')
      .innerJoin('list_item', 'list_item.subjectDid', 'post.creator')
      .where('list_item.listUri', '=', listUri)

    const keyset = new TimeCidKeyset(ref('post.sortAt'), ref('post.cid'))
    builder = paginate(builder, {
      limit,
      cursor,
      keyset,
      tryIndex: true,
    })
    const feedItems = await builder.execute()

    return {
      items: feedItems.map((item) => ({ uri: item.uri, cid: item.cid })),
      cursor: keyset.packFromResult(feedItems),
    }
  },
})

// @NOTE does not support additional fields in the protos specific to author feeds
// and timelines. at the time of writing, hydration/view implementations do not rely on them.
const feedItemFromRow = (row: { postUri: string; uri: string }) => {
  return {
    uri: row.postUri,
    repost: row.uri === row.postUri ? undefined : row.uri,
  }
}

const paraFeedItemFromRow = (row: {
  uri: string
  cid: string
  creator: string
  text: string
  createdAt: string
  replyRoot: string | null
  replyParent: string | null
  langs: string[] | null
  tags: string[] | null
  flairs: string[] | null
  postType: string | null
}): ParaAuthorFeedItem => {
  return new ParaAuthorFeedItem({
    uri: row.uri,
    cid: row.cid,
    author: row.creator,
    text: row.text,
    createdAt: row.createdAt,
    replyRoot: row.replyRoot ?? undefined,
    replyParent: row.replyParent ?? undefined,
    langs: row.langs ?? [],
    tags: row.tags ?? [],
    flairs: row.flairs ?? [],
    postType: row.postType ?? undefined,
  })
}
