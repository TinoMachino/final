/**
 * GENERATED CODE - DO NOT MODIFY
 */
import { HeadersMap, XRPCError } from '@atproto/xrpc'
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
const id = 'com.para.discourse.getSnapshot'

export type QueryParams = {
  community?: string
  timeframe: '1h' | '24h' | '7d' | '30d'
}
export type InputSchema = undefined

export interface OutputSchema {
  snapshots: Snapshot[]
}

export interface CallOptions {
  signal?: AbortSignal
  headers?: HeadersMap
}

export interface Response {
  success: boolean
  headers: HeadersMap
  data: OutputSchema
}

export function toKnownErr(e: any) {
  return e
}

export interface Snapshot {
  $type?: 'com.para.discourse.getSnapshot#snapshot'
  community: string
  bucket: string
  postCount: number
  uniqueAuthors: number
  /** Scaled 0-100 */
  avgConstructiveness?: number
  /** Scaled 0-100 */
  semanticVolatility?: number
  /** Scaled 0-100 */
  lexicalDiversity?: number
  /** Scaled 0-100 */
  polarizationDelta?: number
  /** Scaled 0-100 */
  echoChamberIndex?: number
  topKeywords?: string
  sentimentDistribution?: string
}

const hashSnapshot = 'snapshot'

export function isSnapshot<V>(v: V) {
  return is$typed(v, id, hashSnapshot)
}

export function validateSnapshot<V>(v: V) {
  return validate<Snapshot & V>(v, id, hashSnapshot)
}
