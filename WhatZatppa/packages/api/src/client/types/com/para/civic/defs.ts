/**
 * GENERATED CODE - DO NOT MODIFY
 */
import { type ValidationResult, BlobRef } from '@atproto/lexicon'
import { CID } from 'multiformats/cid'
import { validate as _validate } from '../../../../lexicons'
import {
  type $Typed,
  is$typed as _is$typed,
  type OmitKey,
} from '../../../../util'

const is$typed = _is$typed,
  validate = _validate
const id = 'com.para.civic.defs'

export interface CabildeoOption {
  $type?: 'com.para.civic.defs#cabildeoOption'
  label: string
  description?: string
  isConsensus?: boolean
}

const hashCabildeoOption = 'cabildeoOption'

export function isCabildeoOption<V>(v: V) {
  return is$typed(v, id, hashCabildeoOption)
}

export function validateCabildeoOption<V>(v: V) {
  return validate<CabildeoOption & V>(v, id, hashCabildeoOption)
}

export interface OptionSummary {
  $type?: 'com.para.civic.defs#optionSummary'
  optionIndex: number
  label: string
  votes: number
  positions: number
}

const hashOptionSummary = 'optionSummary'

export function isOptionSummary<V>(v: V) {
  return is$typed(v, id, hashOptionSummary)
}

export function validateOptionSummary<V>(v: V) {
  return validate<OptionSummary & V>(v, id, hashOptionSummary)
}

export interface PositionCounts {
  $type?: 'com.para.civic.defs#positionCounts'
  total: number
  for: number
  against: number
  amendment: number
  byOption: OptionSummary[]
}

const hashPositionCounts = 'positionCounts'

export function isPositionCounts<V>(v: V) {
  return is$typed(v, id, hashPositionCounts)
}

export function validatePositionCounts<V>(v: V) {
  return validate<PositionCounts & V>(v, id, hashPositionCounts)
}

export interface VoteTotals {
  $type?: 'com.para.civic.defs#voteTotals'
  total: number
  direct: number
  delegated: number
}

const hashVoteTotals = 'voteTotals'

export function isVoteTotals<V>(v: V) {
  return is$typed(v, id, hashVoteTotals)
}

export function validateVoteTotals<V>(v: V) {
  return validate<VoteTotals & V>(v, id, hashVoteTotals)
}

export interface OutcomeSummary {
  $type?: 'com.para.civic.defs#outcomeSummary'
  winningOption?: number
  totalParticipants: number
  effectiveTotalPower: number
  tie: boolean
  breakdown: OptionSummary[]
}

const hashOutcomeSummary = 'outcomeSummary'

export function isOutcomeSummary<V>(v: V) {
  return is$typed(v, id, hashOutcomeSummary)
}

export function validateOutcomeSummary<V>(v: V) {
  return validate<OutcomeSummary & V>(v, id, hashOutcomeSummary)
}

export interface ViewerContext {
  $type?: 'com.para.civic.defs#viewerContext'
  currentVoteOption?: number
  currentVoteIsDirect?: boolean
  activeDelegation?: string
  delegateHasVoted?: boolean
  delegatedVoteOption?: number
  delegatedVotedAt?: string
  gracePeriodEndsAt?: string
  delegateVoteDismissed?: boolean
}

const hashViewerContext = 'viewerContext'

export function isViewerContext<V>(v: V) {
  return is$typed(v, id, hashViewerContext)
}

export function validateViewerContext<V>(v: V) {
  return validate<ViewerContext & V>(v, id, hashViewerContext)
}

export interface LiveSessionView {
  $type?: 'com.para.civic.defs#liveSessionView'
  isLive: boolean
  hostDid: string
  activeParticipantCount: number
  startedAt: string
  participantPreviewDids: string[]
}

const hashLiveSessionView = 'liveSessionView'

export function isLiveSessionView<V>(v: V) {
  return is$typed(v, id, hashLiveSessionView)
}

export function validateLiveSessionView<V>(v: V) {
  return validate<LiveSessionView & V>(v, id, hashLiveSessionView)
}

export interface CabildeoLive {
  $type?: 'com.para.civic.defs#cabildeoLive'
  cabildeoUri: string
  community: string
  phase:
    | 'draft'
    | 'open'
    | 'deliberating'
    | 'voting'
    | 'resolved'
    | (string & {})
  expiresAt: string
}

const hashCabildeoLive = 'cabildeoLive'

export function isCabildeoLive<V>(v: V) {
  return is$typed(v, id, hashCabildeoLive)
}

export function validateCabildeoLive<V>(v: V) {
  return validate<CabildeoLive & V>(v, id, hashCabildeoLive)
}

export interface CabildeoView {
  $type?: 'com.para.civic.defs#cabildeoView'
  uri: string
  cid: CID
  creator: string
  indexedAt: string
  title: string
  description: string
  community: string
  communities?: string[]
  flairs?: string[]
  region?: string
  geoRestricted?: boolean
  options: CabildeoOption[]
  minQuorum?: number
  phase:
    | 'draft'
    | 'open'
    | 'deliberating'
    | 'voting'
    | 'resolved'
    | (string & {})
  phaseDeadline?: string
  createdAt: string
  optionSummary: OptionSummary[]
  positionCounts: PositionCounts
  voteTotals: VoteTotals
  outcomeSummary?: OutcomeSummary
  viewerContext?: ViewerContext
  liveSession?: LiveSessionView
}

const hashCabildeoView = 'cabildeoView'

export function isCabildeoView<V>(v: V) {
  return is$typed(v, id, hashCabildeoView)
}

export function validateCabildeoView<V>(v: V) {
  return validate<CabildeoView & V>(v, id, hashCabildeoView)
}

export interface PositionView {
  $type?: 'com.para.civic.defs#positionView'
  uri: string
  cid: CID
  creator: string
  indexedAt: string
  cabildeo: string
  stance: 'for' | 'against' | 'amendment' | (string & {})
  optionIndex?: number
  text: string
  compassQuadrant?: string
  createdAt: string
}

const hashPositionView = 'positionView'

export function isPositionView<V>(v: V) {
  return is$typed(v, id, hashPositionView)
}

export function validatePositionView<V>(v: V) {
  return validate<PositionView & V>(v, id, hashPositionView)
}

export interface PolicySignalBucket {
  $type?: 'com.para.civic.defs#policySignalBucket'
  signal: number
  count: number
}

const hashPolicySignalBucket = 'policySignalBucket'

export function isPolicySignalBucket<V>(v: V) {
  return is$typed(v, id, hashPolicySignalBucket)
}

export function validatePolicySignalBucket<V>(v: V) {
  return validate<PolicySignalBucket & V>(v, id, hashPolicySignalBucket)
}

export interface PolicyTally {
  $type?: 'com.para.civic.defs#policyTally'
  subject: string
  subjectType: 'policy' | (string & {})
  community: string
  voteCount: number
  directVoteCount: number
  delegatedVoteCount: number
  signalSum: number
  signalAverage: string
  eligibleVoterCount: number
  quorumTarget: number
  quorumMet: boolean
  official: boolean
  certified: boolean
  outcome:
    | 'insufficient_quorum'
    | 'contested'
    | 'passed'
    | 'strong_passed'
    | 'failed'
    | (string & {})
  state:
    | 'draft'
    | 'deliberation'
    | 'voting'
    | 'passed'
    | 'failed'
    | 'official'
    | (string & {})
  breakdown: PolicySignalBucket[]
  computedAt: string
}

const hashPolicyTally = 'policyTally'

export function isPolicyTally<V>(v: V) {
  return is$typed(v, id, hashPolicyTally)
}

export function validatePolicyTally<V>(v: V) {
  return validate<PolicyTally & V>(v, id, hashPolicyTally)
}
