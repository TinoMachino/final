import { SeedClient, TestNetwork, usersSeed } from '@atproto/dev-env'
import { ids } from '../../src/lexicon/lexicons'

type ParaStrongRef = {
  uri: string
  cid: string
}

describe('para dataplane queries', () => {
  let network: TestNetwork
  let sc: SeedClient
  let alice: string
  let bob: string
  let carol: string

  beforeAll(async () => {
    network = await TestNetwork.create({
      dbPostgresSchema: 'bsky_data_plane_para_queries',
    })
    sc = network.getSeedClient()
    await usersSeed(sc)
    alice = sc.dids.alice
    bob = sc.dids.bob
    carol = sc.dids.carol
    await network.processAll()
  })

  afterAll(async () => {
    await network.close()
  })

  it('queries para timeline and author feed', async () => {
    await sc.follow(alice, bob)
    const alicePost = await createParaPost(sc, alice, 'alice timeline para post')
    const bobPost = await createParaPost(sc, bob, 'bob timeline para post')
    const carolPost = await createParaPost(sc, carol, 'carol timeline para post')
    await network.processAll()

    const timeline = await network.bsky.ctx.dataplane.getParaTimeline({
      actorDid: alice,
      limit: 50,
    })
    const timelineUris = timeline.items.map((item) => item.uri)
    expect(timelineUris).toContain(alicePost.uri)
    expect(timelineUris).toContain(bobPost.uri)
    expect(timelineUris).not.toContain(carolPost.uri)

    const authorFeed = await network.bsky.ctx.dataplane.getParaAuthorFeed({
      actorDid: bob,
      limit: 50,
    })
    expect(authorFeed.items.some((item) => item.uri === bobPost.uri)).toBe(true)
    expect(authorFeed.items.every((item) => item.author === bob)).toBe(true)
  })

  it('queries para posts by uri list order', async () => {
    const first = await createParaPost(sc, alice, 'first ordered para post')
    const second = await createParaPost(sc, bob, 'second ordered para post')
    await network.processAll()

    const missing = `at://did:example:missing/${ids.ComParaPost}/self`
    const got = await network.bsky.ctx.dataplane.getParaPosts({
      uris: [second.uri, missing, first.uri],
    })
    expect(got.items.map((item) => item.uri)).toEqual([second.uri, first.uri])
  })

  it('queries para thread with parents and replies', async () => {
    const root = await createParaPost(sc, alice, 'root para thread post')
    const reply = await createParaPost(sc, bob, 'reply para thread post', {
      root,
      parent: root,
    })
    const grandReply = await createParaPost(sc, carol, 'grand reply para post', {
      root,
      parent: reply,
    })
    await network.processAll()

    const onRoot = await network.bsky.ctx.dataplane.getParaThread({
      postUri: root.uri,
      above: 10,
      below: 10,
    })
    expect(onRoot.post?.uri).toEqual(root.uri)
    expect(onRoot.parents).toEqual([])
    const rootReplyUris = onRoot.replies.map((item) => item.uri)
    expect(rootReplyUris).toContain(reply.uri)
    expect(rootReplyUris).toContain(grandReply.uri)

    const onGrandReply = await network.bsky.ctx.dataplane.getParaThread({
      postUri: grandReply.uri,
      above: 10,
      below: 10,
    })
    expect(onGrandReply.post?.uri).toEqual(grandReply.uri)
    expect(onGrandReply.parents.map((item) => item.uri)).toEqual([
      root.uri,
      reply.uri,
    ])
  })

  it('queries para post meta fallback and explicit metadata', async () => {
    const post = await createParaPost(sc, alice, 'meta fallback para post', {
      postType: 'policy',
      tags: ['post-tag'],
      flairs: ['post-flair'],
    })
    await network.processAll()

    const fallback = await network.bsky.ctx.dataplane.getParaPostMeta({
      postUri: post.uri,
    })
    expect(fallback.post?.uri).toEqual(post.uri)
    expect(fallback.post?.postType).toEqual('policy')
    expect(fallback.post?.voteScore).toEqual(0)
    expect(fallback.post?.tags).toEqual(['post-tag'])
    expect(fallback.post?.flairs).toEqual(['post-flair'])
    expect(fallback.post?.interactionMode).toEqual('policy_ballot')

    await createParaPostMeta(sc, alice, post.uri, {
      postType: 'policy',
      voteScore: 9,
      official: true,
      party: 'Independent',
      community: 'mx-federal',
      category: 'governance',
      tags: ['meta-tag'],
      flairs: ['meta-flair'],
    })
    await network.processAll()

    const explicit = await network.bsky.ctx.dataplane.getParaPostMeta({
      postUri: post.uri,
    })
    expect(explicit.post?.postType).toEqual('policy')
    expect(explicit.post?.voteScore).toEqual(9)
    expect(explicit.post?.official).toBe(true)
    expect(explicit.post?.party).toEqual('Independent')
    expect(explicit.post?.community).toEqual('mx-federal')
    expect(explicit.post?.category).toEqual('governance')
    expect(explicit.post?.tags).toEqual(['meta-tag'])
    expect(explicit.post?.flairs).toEqual(['meta-flair'])
    expect(explicit.post?.interactionMode).toEqual('policy_ballot')
  })

  it('queries para profile stats and status', async () => {
    await createParaStatus(sc, alice, {
      status: 'Building cross-party policy drafts',
      party: 'Independent',
      community: 'mx-federal',
    })
    const post = await createParaPost(sc, alice, 'stats para post', {
      postType: 'policy',
    })
    await createParaPostMeta(sc, alice, post.uri, {
      postType: 'policy',
      voteScore: 11,
      community: 'mx-federal',
    })
    await network.processAll()

    const res = await network.bsky.ctx.dataplane.getParaProfileStats({
      actorDid: alice,
    })
    expect(res.actorDid).toEqual(alice)
    expect(res.stats?.influence).toEqual(res.stats?.votesReceivedAllTime)
    expect(res.stats?.votesReceivedAllTime).toBeGreaterThanOrEqual(11)
    expect(res.stats?.contributions?.policies).toBeGreaterThanOrEqual(1)
    expect(res.stats?.activeIn).toContain('mx-federal')
    expect(res.status?.status).toEqual('Building cross-party policy drafts')
    expect(res.status?.party).toEqual('Independent')
    expect(res.status?.community).toEqual('mx-federal')
  })
})

const createParaPost = async (
  sc: SeedClient,
  by: string,
  text: string,
  opts: {
    root?: ParaStrongRef
    parent?: ParaStrongRef
    postType?: 'policy' | 'matter' | 'meme'
    tags?: string[]
    flairs?: string[]
  } = {},
): Promise<ParaStrongRef> => {
  const { data } = await sc.agent.api.com.atproto.repo.createRecord(
    {
      repo: by,
      collection: ids.ComParaPost,
      record: {
        $type: ids.ComParaPost,
        text,
        createdAt: new Date().toISOString(),
        ...(opts.root && opts.parent
          ? {
              reply: {
                root: opts.root,
                parent: opts.parent,
              },
            }
          : {}),
        ...(opts.postType ? { postType: opts.postType } : {}),
        ...(opts.tags?.length ? { tags: opts.tags } : {}),
        ...(opts.flairs?.length ? { flairs: opts.flairs } : {}),
      },
    },
    {
      encoding: 'application/json',
      headers: sc.getHeaders(by),
    },
  )

  return {
    uri: data.uri,
    cid: data.cid,
  }
}

const createParaPostMeta = async (
  sc: SeedClient,
  by: string,
  postUri: string,
  opts: {
    postType: 'policy' | 'matter' | 'meme'
    voteScore: number
    official?: boolean
    party?: string
    community?: string
    category?: string
    tags?: string[]
    flairs?: string[]
  },
): Promise<ParaStrongRef> => {
  const { data } = await sc.agent.api.com.atproto.repo.createRecord(
    {
      repo: by,
      collection: ids.ComParaSocialPostMeta,
      record: {
        $type: ids.ComParaSocialPostMeta,
        post: postUri,
        postType: opts.postType,
        voteScore: opts.voteScore,
        official: opts.official,
        party: opts.party,
        community: opts.community,
        category: opts.category,
        tags: opts.tags,
        flairs: opts.flairs,
        createdAt: new Date().toISOString(),
      },
    },
    {
      encoding: 'application/json',
      headers: sc.getHeaders(by),
    },
  )

  return {
    uri: data.uri,
    cid: data.cid,
  }
}

const createParaStatus = async (
  sc: SeedClient,
  by: string,
  opts: {
    status: string
    party?: string
    community?: string
  },
): Promise<ParaStrongRef> => {
  const { data } = await sc.agent.api.com.atproto.repo.createRecord(
    {
      repo: by,
      collection: ids.ComParaStatus,
      rkey: 'self',
      record: {
        $type: ids.ComParaStatus,
        status: opts.status,
        party: opts.party,
        community: opts.community,
        createdAt: new Date().toISOString(),
      },
    },
    {
      encoding: 'application/json',
      headers: sc.getHeaders(by),
    },
  )

  return {
    uri: data.uri,
    cid: data.cid,
  }
}
