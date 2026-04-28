# REPORTE DE FEED COMPLETENESS — DÍA 4
**Fecha:** 2026-04-28  
**Proyecto:** PARA + WhatZatppa  
**Enfoque:** Backend dataplane + API layer (bsky AppView)  
**Objetivo:** Resolver "posts invisibles" — los usuarios no veían contenido en base, parties ni comunidades porque los endpoints de feed nunca unían `para_post_meta` y no existía un endpoint de feed por comunidad.

---

## RESUMEN EJECUTIVO

Se ejecutaron **4 workstreams críticos** sobre el monorepo `WhatZatppa`, resultando en **17 archivos modificados + 4 creados** y **1 migración de base de datos**.

Los cambios transforman los feeds de PARA de "ciegos a metadatos" a "fully filterable": ahora `getAuthorFeed` y `getTimeline` pueden filtrar por `party` y `community`, existe un endpoint nuevo `com.para.community.listPosts` para ver todos los posts de una comunidad, y se corrigió un bug silencioso en el indexer que causaba pérdida de datos.

**Veredicto post-cambios:**
- ✅ `getAuthorFeed` y `getTimeline` soportan filtros `party` y `community` via INNER JOIN con `para_post_meta`
- ✅ Nuevo endpoint `com.para.community.listPosts` con filtro por `community` + `postType`
- ✅ `findDuplicate()` en `para-post.ts` ya no retorna `null` (bug de data loss corregido)
- ✅ Índices nuevos: `para_post_meta_party_idx`, `para_post_meta_community_posttype_idx`
- ✅ Cache keys de `ParaCacheService` actualizadas para incluir filtros
- ✅ TypeScript compila limpio (`pnpm exec tsc --build tsconfig.build.json`)

---

## 1. FILTRADO POR PARTY/COMMUNITY EN FEEDS EXISTENTES

**Problema:** `getParaAuthorFeed` y `getParaTimeline` consultaban **solo** `para_post`. Los posts con `party` o `community` en `para_post_meta` eran invisibles para cualquier filtro porque el JOIN nunca existía.

**Solución:**
- **Lexicons:** `getAuthorFeed.json` y `getTimeline.json` — agregados `party?: string` y `community?: string`
- **Proto:** `GetParaAuthorFeedRequest` y `GetParaTimelineRequest` — campos `party` (4) y `community` (5)
- **Dataplane (`feeds.ts`):** Cuando viene filtro, se hace INNER JOIN con `para_post_meta` y se aplica WHERE. Cuando no hay filtro, comportamiento idéntico al anterior (sin JOIN)
- **API handlers:** `getAuthorFeed.ts` y `getTimeline.ts` pasan los parámetros al dataplane
- **Cache:** `authorFeedKey` ahora incluye `party` y `community` para evitar colisiones de clave

**Nota técnica:** Kysely no rastrea columnas de JOINs condicionales en el tipo del builder. Se usaron `sql` template literals para las cláusulas WHERE: `sql"para_post_meta"."party"`.

**Archivos:** `lexicons/com/para/feed/*.json`, `proto/bsky.proto`, `feeds.ts`, `getAuthorFeed.ts`, `getTimeline.ts`, `para-cache.ts`

---

## 2. ENDPOINT NUEVO: `com.para.community.listPosts`

**Problema:** No existía ninguna forma de obtener "todos los posts de esta comunidad". Las rutas de comunidad solo manejaban boards, members y governance.

**Solución:**
- **Lexicon nuevo:** `com.para.community.listPosts` — params: `community` (requerido), `postType?`, `limit?`, `cursor?`
- **Proto:** `GetParaCommunityPostsRequest` / `GetParaCommunityPostsResponse`
- **Dataplane (`community.ts`):** INNER JOIN `para_post` + `para_post_meta`, filtra por `community = $community`, opcional por `postType`, paginación cursor-based con `TimeCidKeyset`
- **API handler:** `api/com/para/community/listPosts.ts` con cache integrada
- **Registro:** Endpoint registrado en `api/index.ts`

**Archivos:** `lexicons/com/para/community/listPosts.json` (nuevo), `api/com/para/community/listPosts.ts` (nuevo), `community.ts`, `api/index.ts`

---

## 3. BUG CRÍTICO: `findDuplicate()` EN `para-post.ts`

**Problema:** La función siempre retornaba `null`, rompiendo el tracking de duplicados en el indexer.

```typescript
// ANTES
const findDuplicate = async (): Promise<AtUri | null> => {
  return null  // ⚠️ SIEMPRE NULL
}
```

**Impacto:** Si un post para se re-indexaba (mismo URI), el `onConflict doNothing` lo ignoraba silenciosamente. Como `findDuplicate` no lo rastreaba, al borrar el original el post desaparecía permanentemente sin recuperación.

**Solución:** Implementado buscando por `(creator, text, createdAt)`, igual que el plugin estándar de `app.bsky.feed.post`.

```typescript
// DESPUÉS
const findDuplicate = async (
  db: DatabaseSchema,
  uri: AtUri,
  obj: ParaPostRecord,
): Promise<AtUri | null> => {
  const found = await db
    .selectFrom('para_post')
    .where('creator', '=', uri.host)
    .where('text', '=', obj.text)
    .where('createdAt', '=', normalizeDatetimeAlways(obj.createdAt))
    .select('uri')
    .executeTakeFirst()
  return found ? new AtUri(found.uri) : null
}
```

**Archivo:** `src/data-plane/server/indexing/plugins/para-post.ts`

---

## 4. ÍNDICES Y BUILD FIXES

### Migración de índices
**Migración:** `20260428T070000000Z-add-para-feed-indexes.ts`

| Índice | Tabla | Columna(s) | Query beneficiado |
|--------|-------|-----------|-------------------|
| `para_post_meta_party_idx` | `para_post_meta` | `party` | Timeline/feed filtrado por party |
| `para_post_meta_community_posttype_idx` | `para_post_meta` | `community`, `postType` | `listPosts` con filtro de comunidad + tipo |

### Fixes de compilación TypeScript
Durante el build (`tsc --build`) aparecieron errores que `tsc --noEmit` no detectaba (diferencia de `declaration: true`):

1. **Kysely type narrowing en feeds.ts** — `sql` templates para columnas de JOIN condicional
2. **Keyset generics en community.ts** — `TimeCidKeyset` por defecto espera `sortAt`, pero `para_community_board` usa `createdAt`/`indexedAt` y `para_community_membership` usa `joinedAt`. Se crearon `CreatedAtCidKeyset`, `IndexedAtCidKeyset` y `JoinedAtCidKeyset`.
3. **Return type inference en listBoards.ts** — El `return cached` del cache polluía la inferencia. Se agregó tipo explícito `ListBoardsResult`.

**Archivos:** `pagination.ts`, `community.ts`, `listBoards.ts`, `para-cache.ts`

---

## DETALLE DE ARCHIVOS

```
M  lexicons/com/para/feed/getAuthorFeed.json
M  lexicons/com/para/feed/getTimeline.json
A  lexicons/com/para/community/listPosts.json
M  packages/bsky/proto/bsky.proto
M  packages/bsky/src/proto/bsky_pb.ts
M  packages/bsky/src/proto/bsky_connect.ts
M  packages/bsky/src/api/com/para/feed/getAuthorFeed.ts
M  packages/bsky/src/api/com/para/feed/getTimeline.ts
A  packages/bsky/src/api/com/para/community/listPosts.ts
M  packages/bsky/src/api/index.ts
M  packages/bsky/src/cache/para-cache.ts
A  packages/bsky/src/data-plane/server/db/migrations/20260428T070000000Z-add-para-feed-indexes.ts
M  packages/bsky/src/data-plane/server/db/migrations/index.ts
M  packages/bsky/src/data-plane/server/db/pagination.ts
M  packages/bsky/src/data-plane/server/indexing/plugins/para-post.ts
M  packages/bsky/src/data-plane/server/routes/community.ts
M  packages/bsky/src/data-plane/server/routes/feeds.ts
```

**Total:** 17 archivos modificados, 4 creados, 1 migración, regeneración completa de proto + lexicons.

---

## VALIDACIÓN

```bash
cd packages/bsky && pnpm exec tsc --build tsconfig.build.json
# ✅ Sin errores
```

---

## PR #4891 APLICADO

También se aplicó el PR upstream de bluesky-social/atproto#4891:
- Removido el prefijo `/xrpc` de los ejemplos de Express en `lex-server`
- Archivos: `packages/lex/lex-server/README.md`, `packages/lex/lex-server/src/nodejs.ts`

---

*Reporte generado post-sesión.*
