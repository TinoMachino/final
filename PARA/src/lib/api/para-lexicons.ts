/**
 * Para Custom Lexicons
 *
 * These interfaces define the schema for our custom "off-protocol" records.
 *
 * com.para.post:
 * - A private-by-default post type.
 * - Not indexed by standard Bluesky AppViews.
 * - Visible only within the Para app context.
 *
 * com.para.identity:
 * - Tracks verification status for Public Figure capabilities.
 */

import {type AppBskyFeedPost} from '@atproto/api'

export const PARA_POST_COLLECTION = 'com.para.post'
export const PARA_IDENTITY_COLLECTION = 'com.para.identity'
export const PARA_POST_META_COLLECTION = 'com.para.social.postMeta'
export const PARA_COMMUNITY_GOVERNANCE_COLLECTION =
  'com.para.community.governance'
export const PARA_HIGHLIGHT_COLLECTION = 'com.para.highlight.annotation'

export interface ParaPostRecord {
  text: string
  createdAt: string
  /**
   * Reply context (root and parent).
   * Matches specific structure needed for threading.
   */
  reply?: {
    root: com_atproto_repo_strongRef
    parent: com_atproto_repo_strongRef
  }
  /**
   * Facets for rich text (mentions, links).
   * Reusing standard Bsky definition for compatibility.
   */
  facets?: unknown[] // Simplified for now to avoid deep type lookup issues
  /**
   * Embeds (images, external links, etc).
   * Reusing standard Bsky definition.
   */
  embed?: AppBskyFeedPost.Record['embed']
  /**
   * Languages.
   */
  langs?: string[]
  /**
   * Additional hashtags, beyond those in post text and facets.
   */
  tags?: string[]
  /**
   * Para-specific flairs associated with the post.
   */
  flairs?: string[]
  /**
   * Para-specific post type (policy, matter, meme, etc).
   */
  postType?: string
}

export interface ParaPostMetaRecord {
  post: string // at-uri referencing the com.para.post
  postType: 'policy' | 'matter' | 'meme'
  official?: boolean
  party?: string
  community?: string
  category?: string
  tags?: string[]
  flairs?: string[]
  voteScore: number
  createdAt: string
}

export interface ParaIdentityRecord {
  createdAt: string
  isVerifiedPublicFigure: boolean
  /**
   * Reference to the proof document (e.g. uploaded INE image blob).
   * Optional for mock MVP.
   */
  proofBlob?: string
  /**
   * Timestamp when verification was approved.
   */
  verifiedAt?: string
}

export interface ParaHighlightRecord {
  subjectUri: string
  subjectCid?: string
  text: string
  start: number
  end: number
  color: string
  tag?: string
  community?: string
  state?: string
  party?: string
  visibility: 'public' | 'private'
  createdAt: string
}

export type CommunityGovernanceCapability =
  | 'appoint_deputies'
  | 'edit_role_descriptions'
  | 'review_applicants'
  | 'publish_governance_updates'
  | 'set_official_representatives'

export interface CommunityGovernancePerson {
  did?: string
  handle?: string
  displayName?: string
  avatar?: string
}

export interface CommunityGovernanceModerator
  extends CommunityGovernancePerson {
  role: string
  badge: string
  capabilities: CommunityGovernanceCapability[]
}

export interface CommunityGovernanceOfficialRepresentative
  extends CommunityGovernancePerson {
  office: string
  mandate: string
}

export interface CommunityGovernanceApplicant
  extends CommunityGovernancePerson {
  appliedAt: string
  status: 'applied' | 'approved' | 'rejected'
  note?: string
}

export interface CommunityGovernanceDeputyRole {
  key: string
  tier: string
  role: string
  description: string
  capabilities: string[]
  activeHolder?: CommunityGovernancePerson
  activeSince?: string
  votes: number
  applicants: CommunityGovernanceApplicant[]
}

export interface CommunityGovernanceMetadata {
  termLengthDays?: number
  reviewCadence?: string
  escalationPath?: string
  publicContact?: string
  lastPublishedAt?: string
  state?: string
  matterFlairIds?: string[]
  policyFlairIds?: string[]
}

export interface CommunityGovernanceHistoryEntry {
  id: string
  action: string
  actorDid?: string
  actorHandle?: string
  createdAt: string
  summary: string
}

export interface CommunityGovernanceRecord {
  community: string
  communityId?: string
  slug: string
  createdAt: string
  updatedAt: string
  moderators: CommunityGovernanceModerator[]
  officials: CommunityGovernanceOfficialRepresentative[]
  deputies: CommunityGovernanceDeputyRole[]
  metadata?: CommunityGovernanceMetadata
  editHistory?: CommunityGovernanceHistoryEntry[]
}

// Helper types matching ATProto common patterns
interface com_atproto_repo_strongRef {
  cid: string
  uri: string
}

/**
 * Type guard to check if a generic record looks like a Para Post.
 */
export function isParaPost(v: unknown): v is ParaPostRecord {
  return (
    typeof v === 'object' &&
    v !== null &&
    typeof (v as Record<string, unknown>).text === 'string' &&
    typeof (v as Record<string, unknown>).createdAt === 'string'
  )
}

// ─── Cabildeo: Civic Deliberation ────────────────────────────────────────────

export const PARA_CABILDEO_COLLECTION = 'com.para.civic.cabildeo'
export const PARA_CIVIC_POSITION_COLLECTION = 'com.para.civic.position'
export const PARA_CIVIC_VOTE_COLLECTION = 'com.para.civic.vote'
export const PARA_CIVIC_DELEGATION_COLLECTION = 'com.para.civic.delegation'

export type CabildeoPhase =
  | 'draft'
  | 'open'
  | 'deliberating'
  | 'voting'
  | 'resolved'

export interface CabildeoOption {
  label: string
  description?: string
  isConsensus?: boolean
}

export interface CabildeoOutcomeBreakdown {
  optionIndex: number
  label: string
  effectiveVotes: number
}

export interface CabildeoCommunityBreakdown {
  community: string
  dominantOption: number
  participation: string
}

export interface CabildeoOutcome {
  winningOption: number
  totalParticipants: number
  directVoters: number
  delegatedVoters: number
  effectiveTotalPower: number
  breakdown: CabildeoOutcomeBreakdown[]
  communityBreakdown?: CabildeoCommunityBreakdown[]
}

export interface CabildeoUserContext {
  viewerVoteOption?: number
  viewerVoteIsDirect?: boolean
  hasDelegatedTo?: string
  delegateVoteEvent?: {
    optionIndex: number
    votedAt: string
    isDismissed?: boolean // Mock locally if dismissed
  }
}

export interface CabildeoRecord {
  title: string
  description: string
  createdAt: string
  author: string // DID of proposer

  // Classification
  community: string // Primary community name
  communities?: string[] // Additional communities (triggers quadratic weighting)
  flairs?: string[] // Policy/matter tags
  region?: string // Geographic scope (state name)
  geoRestricted?: boolean // If true, only users in `region` can vote/delegate

  // Voting configuration
  options: CabildeoOption[]
  minQuorum?: number // Minimum number of participants required for outcome to be valid

  // Lifecycle
  phase: CabildeoPhase
  phaseDeadline?: string // ISO timestamp

  // Outcome (set when resolved)
  outcome?: CabildeoOutcome

  // Client-side context
  userContext?: CabildeoUserContext
}

export interface CabildeoPositionRecord {
  cabildeo: string // at-uri
  stance: 'for' | 'against' | 'amendment'
  optionIndex?: number
  text: string
  createdAt: string
  compassQuadrant?: string // e.g., 'lib-left', 'auth-center'
  constructivenessScore?: number // 0.0 to 1.0 score evaluated by WorldTensor
}

export interface CabildeoVoteRecord {
  subject?: string // at-uri for the voted record; defaults to cabildeo for cabildeo option votes
  subjectType?: 'cabildeo' | 'policy' | 'matter' | 'governance'
  cabildeo: string // at-uri
  createdAt: string
  selectedOption?: number
  signal?: -3 | -2 | -1 | 0 | 1 | 2 | 3
  reason?: string
  isDirect: boolean
  delegatedFrom: string[] // DIDs of delegators
  effectivePower: number // √N for delegated, 1.0 for direct
}

export interface CabildeoDelegationRecord {
  cabildeo: string // at-uri
  delegateTo: string // DID of representative
  createdAt: string
  reason?: string
  scopeFlairs?: string[] // Optional: Only delegate power for cabildeos matching these policy/matter flairs
}
// ─── Discourse Analysis ──────────────────────────────────────────────────────

export interface DiscourseSnapshot {
  community: string
  bucket: string // ISO timestamp
  postCount: number
  uniqueAuthors: number
  avgConstructiveness: number // 0-100
  semanticVolatility: number // 0-100
  lexicalDiversity: number // 0-100
  polarizationDelta: number // 0-100
  echoChamberIndex: number // 0-100
  topKeywords: string // JSON string
  sentimentDistribution: string // JSON string
}

export interface TopicCluster {
  clusterLabel: string
  keywords: string // JSON string array
  postCount: number
  authorCount: number
  avgSentiment: number // 0-100
}

export interface SentimentDistribution {
  anger: number // 0-100
  fear: number // 0-100
  trust: number // 0-100
  uncertainty: number // 0-100
  neutral: number // 0-100
}
