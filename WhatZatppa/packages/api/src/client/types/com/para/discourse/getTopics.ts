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
const id = 'com.para.discourse.getTopics'

export type QueryParams = {
  community?: string
  timeframe: '1h' | '24h' | '7d' | '30d'
}
export type InputSchema = undefined

export interface OutputSchema {
  topics: Topic[]
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

export interface Topic {
  $type?: 'com.para.discourse.getTopics#topic'
  clusterLabel: string
  keywords?: string
  postCount: number
  authorCount: number
  /** Scaled 0-100 */
  avgSentiment?: number
}

const hashTopic = 'topic'

export function isTopic<V>(v: V) {
  return is$typed(v, id, hashTopic)
}

export function validateTopic<V>(v: V) {
  return validate<Topic & V>(v, id, hashTopic)
}
