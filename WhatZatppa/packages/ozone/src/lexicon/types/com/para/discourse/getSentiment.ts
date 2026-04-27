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
const id = 'com.para.discourse.getSentiment'

export type QueryParams = {
  community?: string
  timeframe: '1h' | '24h' | '7d' | '30d'
}
export type InputSchema = undefined

export interface OutputSchema {
  sentiment: SentimentDistribution
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

export interface SentimentDistribution {
  $type?: 'com.para.discourse.getSentiment#sentimentDistribution'
  /** Scaled 0-100 */
  anger: number
  /** Scaled 0-100 */
  fear: number
  /** Scaled 0-100 */
  trust: number
  /** Scaled 0-100 */
  uncertainty: number
  /** Scaled 0-100 */
  neutral: number
}

const hashSentimentDistribution = 'sentimentDistribution'

export function isSentimentDistribution<V>(v: V) {
  return is$typed(v, id, hashSentimentDistribution)
}

export function validateSentimentDistribution<V>(v: V) {
  return validate<SentimentDistribution & V>(v, id, hashSentimentDistribution)
}
