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
const id = 'com.para.community.createBoard'

export type QueryParams = {}

export interface InputSchema {
  name: string
  quadrant: string
  description?: string
  /** User-provided name for the internal starter pack tracking founding members. If absent, a default name will be generated. */
  founderStarterPackName?: string
}

export interface OutputSchema {
  uri: string
  cid: string
  delegatesChatId: string
  subdelegatesChatId: string
  /** Reference to the newly created founder starter pack. Present if status is draft. */
  founderStarterPackUri?: string
}

export interface CallOptions {
  signal?: AbortSignal
  headers?: HeadersMap
  qp?: QueryParams
  encoding?: 'application/json'
}

export interface Response {
  success: boolean
  headers: HeadersMap
  data: OutputSchema
}

export function toKnownErr(e: any) {
  return e
}
