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
const id = 'com.para.community.defs'

export interface Summary {
  $type?: 'com.para.community.defs#summary'
  members: number
  visiblePosters: number
  policyPosts: number
  matterPosts: number
  badgeHolders: number
}

const hashSummary = 'summary'

export function isSummary<V>(v: V) {
  return is$typed(v, id, hashSummary)
}

export function validateSummary<V>(v: V) {
  return validate<Summary & V>(v, id, hashSummary)
}

export interface Person {
  $type?: 'com.para.community.defs#person'
  did?: string
  handle?: string
  displayName?: string
  avatar?: string
}

const hashPerson = 'person'

export function isPerson<V>(v: V) {
  return is$typed(v, id, hashPerson)
}

export function validatePerson<V>(v: V) {
  return validate<Person & V>(v, id, hashPerson)
}

export interface ModeratorView {
  $type?: 'com.para.community.defs#moderatorView'
  did?: string
  handle?: string
  displayName?: string
  avatar?: string
  role: string
  badge: string
  capabilities: string[]
}

const hashModeratorView = 'moderatorView'

export function isModeratorView<V>(v: V) {
  return is$typed(v, id, hashModeratorView)
}

export function validateModeratorView<V>(v: V) {
  return validate<ModeratorView & V>(v, id, hashModeratorView)
}

export interface OfficialView {
  $type?: 'com.para.community.defs#officialView'
  did?: string
  handle?: string
  displayName?: string
  avatar?: string
  office: string
  mandate: string
}

const hashOfficialView = 'officialView'

export function isOfficialView<V>(v: V) {
  return is$typed(v, id, hashOfficialView)
}

export function validateOfficialView<V>(v: V) {
  return validate<OfficialView & V>(v, id, hashOfficialView)
}

export interface Applicant {
  $type?: 'com.para.community.defs#applicant'
  did?: string
  handle?: string
  displayName?: string
  avatar?: string
  appliedAt: string
  status: 'applied' | 'approved' | 'rejected' | (string & {})
  note?: string
}

const hashApplicant = 'applicant'

export function isApplicant<V>(v: V) {
  return is$typed(v, id, hashApplicant)
}

export function validateApplicant<V>(v: V) {
  return validate<Applicant & V>(v, id, hashApplicant)
}

export interface DeputyRoleView {
  $type?: 'com.para.community.defs#deputyRoleView'
  key: string
  tier: string
  role: string
  description: string
  capabilities: string[]
  activeHolder?: Person
  activeSince?: string
  votes: number
  applicants: Applicant[]
}

const hashDeputyRoleView = 'deputyRoleView'

export function isDeputyRoleView<V>(v: V) {
  return is$typed(v, id, hashDeputyRoleView)
}

export function validateDeputyRoleView<V>(v: V) {
  return validate<DeputyRoleView & V>(v, id, hashDeputyRoleView)
}

export interface Metadata {
  $type?: 'com.para.community.defs#metadata'
  termLengthDays?: number
  reviewCadence?: string
  escalationPath?: string
  publicContact?: string
  lastPublishedAt?: string
  state?: string
  matterFlairIds?: string[]
  policyFlairIds?: string[]
}

const hashMetadata = 'metadata'

export function isMetadata<V>(v: V) {
  return is$typed(v, id, hashMetadata)
}

export function validateMetadata<V>(v: V) {
  return validate<Metadata & V>(v, id, hashMetadata)
}

export interface HistoryEntry {
  $type?: 'com.para.community.defs#historyEntry'
  id: string
  action: string
  actorDid?: string
  actorHandle?: string
  createdAt: string
  summary: string
}

const hashHistoryEntry = 'historyEntry'

export function isHistoryEntry<V>(v: V) {
  return is$typed(v, id, hashHistoryEntry)
}

export function validateHistoryEntry<V>(v: V) {
  return validate<HistoryEntry & V>(v, id, hashHistoryEntry)
}
