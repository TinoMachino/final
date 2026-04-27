// @ts-nocheck
import { Selectable, sql } from 'kysely'
import { CID } from 'multiformats/cid'
import { AtUri, normalizeDatetimeAlways } from '@atproto/syntax'
import { BackgroundQueue } from '../../background'
import { Database } from '../../db'
import { DatabaseSchema, DatabaseSchemaType } from '../../db/database-schema'
import { RecordProcessor } from '../processor'
import { recomputeCabildeoAggregates } from './recompute-cabildeo-aggregates'

interface DelegationRecord {
  cabildeo?: string
  delegateTo: string
  scopeFlairs?: string[]
  reason?: string
  createdAt: string
}

type CabildeoDelegation = Selectable<DatabaseSchemaType['cabildeo_delegation']>
type IndexedDelegation = {
  record: CabildeoDelegation
}

const lexId = 'com.para.civic.delegation'

const insertFn = async (
  db: DatabaseSchema,
  uri: AtUri,
  cid: CID,
  obj: DelegationRecord,
  timestamp: string,
): Promise<IndexedDelegation | null> => {
  const record = {
    uri: uri.toString(),
    cid: cid.toString(),
    creator: uri.host,
    cabildeo: obj.cabildeo || null,
    delegateTo: obj.delegateTo,
    scopeFlairs: obj.scopeFlairs?.length
      ? sql<string[]>`${JSON.stringify(obj.scopeFlairs)}`
      : null,
    reason: obj.reason || null,
    createdAt: normalizeDatetimeAlways(obj.createdAt),
    indexedAt: timestamp,
  }

  const inserted = await db
    .insertInto('cabildeo_delegation')
    .values(record)
    .onConflict((oc) => oc.doNothing())
    .returningAll()
    .executeTakeFirst()

  if (!inserted) {
    return null
  }

  return { record: inserted }
}

const findDuplicate = async (): Promise<AtUri | null> => {
  return null
}

const notifsForInsert = () => {
  return []
}

const deleteFn = async (
  db: DatabaseSchema,
  uri: AtUri,
): Promise<IndexedDelegation | null> => {
  const deleted = await db
    .deleteFrom('cabildeo_delegation')
    .where('uri', '=', uri.toString())
    .returningAll()
    .executeTakeFirst()

  return deleted ? { record: deleted } : null
}

const notifsForDelete = (
  deleted: IndexedDelegation,
  _replacedBy: IndexedDelegation | null,
) => {
  return { notifs: [], toDelete: [deleted.record.uri] }
}

const updateAggregates = async (
  db: DatabaseSchema,
  indexed: IndexedDelegation,
) => {
  const cabildeoUri = indexed.record.cabildeo
  if (!cabildeoUri) return
  await recomputeCabildeoAggregates(db, cabildeoUri)
}

export type PluginType = RecordProcessor<DelegationRecord, IndexedDelegation>

export const makePlugin = (
  db: Database,
  background: BackgroundQueue,
): PluginType => {
  return new RecordProcessor(db, background, {
    lexId,
    insertFn,
    findDuplicate,
    deleteFn,
    notifsForInsert,
    notifsForDelete,
    updateAggregates,
  })
}

export default makePlugin
