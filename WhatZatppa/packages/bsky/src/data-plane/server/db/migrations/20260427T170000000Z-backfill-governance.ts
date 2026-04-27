import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    INSERT INTO para_community_governance (
      uri, cid, "communityUri", state, "matterFlairIds", "policyFlairIds", 
      "moderatorCount", "officialCount", "deputyRoleCount", "lastPublishedAt", "indexedAt"
    )
    SELECT 
      uri, 
      cid, 
      (json->>'community')::text as "communityUri",
      (json->'metadata'->>'state')::text as state,
      (json->'metadata'->'matterFlairIds')::jsonb as "matterFlairIds",
      (json->'metadata'->'policyFlairIds')::jsonb as "policyFlairIds",
      COALESCE(jsonb_array_length(json->'moderators'), 0) as "moderatorCount",
      COALESCE(jsonb_array_length(json->'officials'), 0) as "officialCount",
      COALESCE(jsonb_array_length(json->'deputies'), 0) as "deputyRoleCount",
      COALESCE((json->'metadata'->>'lastPublishedAt')::text, (json->>'updatedAt')::text) as "lastPublishedAt",
      "indexedAt"
    FROM record
    WHERE collection = 'com.para.community.governance'
    ON CONFLICT (uri) DO UPDATE SET
      cid = EXCLUDED.cid,
      "communityUri" = EXCLUDED."communityUri",
      state = EXCLUDED.state,
      "matterFlairIds" = EXCLUDED."matterFlairIds",
      "policyFlairIds" = EXCLUDED."policyFlairIds",
      "moderatorCount" = EXCLUDED."moderatorCount",
      "officialCount" = EXCLUDED."officialCount",
      "deputyRoleCount" = EXCLUDED."deputyRoleCount",
      "lastPublishedAt" = EXCLUDED."lastPublishedAt",
      "indexedAt" = EXCLUDED."indexedAt"
  `.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.deleteFrom('para_community_governance').execute()
}
