import { Redis } from '../redis'

const MINUTE = 60 * 1000

type CacheEntry<T> = {
  v: T
  t: number // timestamp
}

export class ParaCacheService {
  private redis: Redis
  private staleTTLs: Record<string, number>
  private maxTTLs: Record<string, number>

  constructor(redis: Redis) {
    this.redis = redis.withNamespace('para')
    this.staleTTLs = {
      boards: 30 * 1000,
      members: 30 * 1000,
      profileStats: 60 * 1000,
      authorFeed: 15 * 1000,
    }
    this.maxTTLs = {
      boards: 5 * MINUTE,
      members: 5 * MINUTE,
      profileStats: 10 * MINUTE,
      authorFeed: 2 * MINUTE,
    }
  }

  async get<T>(key: string, kind: 'boards' | 'members' | 'profileStats' | 'authorFeed'): Promise<T | undefined> {
    try {
      const raw = await this.redis.get(`${kind}:${key}`)
      if (!raw) return undefined
      const entry: CacheEntry<T> = JSON.parse(raw)
      const maxTTL = this.maxTTLs[kind]
      if (Date.now() > entry.t + maxTTL) {
        return undefined
      }
      return entry.v
    } catch {
      return undefined
    }
  }

  async set<T>(key: string, kind: 'boards' | 'members' | 'profileStats' | 'authorFeed', value: T): Promise<void> {
    try {
      const maxTTL = this.maxTTLs[kind]
      const entry: CacheEntry<T> = { v: value, t: Date.now() }
      await this.redis.set(`${kind}:${key}`, JSON.stringify(entry), maxTTL)
    } catch {
      // Cache write failures are non-fatal
    }
  }

  boardsKey(params: {
    viewerDid: string
    sort: string
    state: string
    participationKind: string
    flairId: string
    quadrant?: string
    query: string
    limit: number
    cursor: string
  }): string {
    return `${params.viewerDid}:${params.sort}:${params.state}:${params.participationKind}:${params.flairId}:${params.quadrant ?? ''}:${params.query}:${params.limit}:${params.cursor}`
  }

  membersKey(params: {
    communityId: string
    membershipState: string
    role: string
    sort: string
    limit: number
    cursor: string
    viewerDid: string
    viewerIsAdmin: boolean
  }): string {
    return `${params.communityId}:${params.membershipState}:${params.role}:${params.sort}:${params.limit}:${params.cursor}:${params.viewerDid}:${params.viewerIsAdmin}`
  }

  profileStatsKey(actorDid: string): string {
    return actorDid
  }

  authorFeedKey(params: {
    actorDid: string
    limit: number
    cursor: string
    party: string
    community: string
  }): string {
    return `${params.actorDid}:${params.limit}:${params.cursor}:${params.party}:${params.community}`
  }

  communityFeedKey(params: {
    community: string
    limit: number
    cursor: string
    postType: string
  }): string {
    return `${params.community}:${params.limit}:${params.cursor}:${params.postType}`
  }
}
