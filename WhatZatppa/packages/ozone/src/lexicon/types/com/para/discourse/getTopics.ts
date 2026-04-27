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
const id = 'com.para.discourse.getTopics'

export type QueryParams = {
  community?: string
  timeframe: '1h' | '24h' | '7d' | '30d'
}
export type InputSchema = undefined

export interface OutputSchema {
  topics: Topic[]
}

export type HandlerInput = void

export interface HandlerSuccess {
  encoding: 'application/json'
  body: OutputSchema
  headers?: { [key: string]: string }
}

export interface HandlerError {
  status: number
  message?: string
}

export type HandlerOutput = HandlerError | HandlerSuccess

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
