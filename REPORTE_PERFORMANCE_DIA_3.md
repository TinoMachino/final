# REPORTE DE PERFORMANCE Y ESCALABILIDAD — DÍA 3
**Fecha:** 2026-04-28  
**Proyecto:** PARA + WhatZatppa  
**Enfoque:** Backend dataplane (bsky AppView)  
**Objetivo:** Eliminar consultas O(n×m), reemplazar paginación offset por cursor-based, agregar índices faltantes en tablas hot, y activar caché Redis para endpoints PARA que bypassan la capa de hidratación.

---

## RESUMEN EJECUTIVO

Se ejecutaron **4 bloques de trabajo** sobre el monorepo `WhatZatppa/packages/bsky`, resultando en **11 archivos modificados + 2 archivos creados** y **2 migraciones de base de datos**.

Los cambios transforman la paginación de comunidades y miembros de offset a cursor-based (keyset), eliminan un subquery correlacionado que escalaba cuadráticamente en `selectMembers`, agregan 3 índices compuestos en tablas hot, y activan por primera vez la infraestructura de Redis existente (previamente dead code) para cachear respuestas de 4 endpoints PARA críticos.

**Veredicto post-cambios:**
- ✅ `selectMembers` con sort `participation` ahora usa hash join O(n+m) en lugar de correlated scan O(n×m)
- ✅ `selectBoards` y `selectMembers` usan cursor-based pagination para sorts temporales
- ✅ Deep-paging offset queda hard-capped a 1000 filas (protección contra denial-of-service)
- ✅ 3 índices nuevos en `para_post_meta`, `cabildeo_vote`, `para_community_membership`
- ✅ Redis activo en 4 endpoints PARA con TTL escalonado (15s–10min)
- ✅ TypeScript compila limpio (`tsc --noEmit`)

---

## 1. MIGRACIÓN DE ÍNDICES DE PERFORMANCE

**Migración:** `20260428T060000000Z-add-para-performance-indexes.ts`

Se identificaron 3 tablas sin índices adecuados para queries de agregación y filtrado frecuentes:

| Índice | Tabla | Columna(s) | Query beneficiado |
|--------|-------|-----------|-------------------|
| `para_post_meta_community_idx` | `para_post_meta` | `community` | `getCommunityPostCounts` filtra por comunidad antes de aplicar regex |
| `cabildeo_vote_creator_idx` | `cabildeo_vote` | `creator` | `getVoteCounts` hace `GROUP BY creator`; también usado por la subquery de votos en `selectMembers` |
| `para_community_membership_community_state_idx` | `para_community_membership` | `communityUri`, `membershipState` | `selectMembers` filtra membresías por comunidad + estado (composite index) |

Adicionalmente, la migración previa (`20260428T050000000Z-add-para-cursor-indexes`) agregó índices compuestos para cursor-based pagination:
- `para_community_board_createdat_cid_idx` (`createdAt`, `cid`)
- `para_community_board_indexedat_cid_idx` (`indexedAt`, `cid`)
- `para_community_membership_joinedat_cid_idx` (`joinedAt`, `cid`)

**Archivos:** `packages/bsky/src/data-plane/server/db/migrations/20260428T060000000Z-add-para-performance-indexes.ts`, `index.ts`

---

## 2. HARDENING DE PAGINACIÓN (CURSOR-BASED)

**Commits:** `9fc50f5` + `a3e5f07`

Se refactorizaron dos queries críticas para eliminar paginación por offset profundo, un vector conocido de degradación de performance en PostgreSQL.

### `selectBoards` (listBoards)
- **Sorts `createdAt` / `indexedAt`:** Reemplazo de `OFFSET/LIMIT` por `TimeCidKeyset` cursor-based. El cursor se construye a partir del par `(createdAt/indexedAt, cid)`.
- **Sort `size`:** Fallback a offset con capa dura de `MAX_OFFSET = 1000`.
- **Degradación graceful:** Cursores numéricos antiguos (offset) son detectados por `isOffsetCursor()` y redirigidos a primera página para evitar inconsistencias.

### `selectMembers` (listMembers)
- **Sort `joinedAt`:** Cursor-based via `TimeCidKeyset` sobre `(joinedAt, cid)`.
- **Sort `participation`:** Offset cappeado a 1000 (este sort requiere métricas agregadas que no indexan eficientemente con keyset).

### `getParaDelegationCandidates` (listDelegationCandidates)
- Carga total de candidatos cappeada a `MAX_DELEGATION_CANDIDATES = 1000` antes del sort en memoria. Evita OOM en comunidades grandes.

**Archivo:** `packages/bsky/src/data-plane/server/routes/community.ts`, `cabildeo.ts`

---

## 3. REFACTOR DE SUBQUERY CORRELACIONADO

**Problema:** El sort `participation` en `selectMembers` usaba un subquery correlacionado dentro de `ORDER BY`:

```sql
-- ANTES: O(n × m) — PostgreSQL ejecuta el subquery una vez por fila
ORDER BY (
  SELECT count(*) FROM cabildeo_vote
  WHERE creator = membership.creator  -- correlated
) DESC
```

**Solución:** Se reemplazó por un `LEFT JOIN` a una subquery pre-agregada:

```sql
-- DESPUÉS: O(n + m) — hash join sobre subquery materializada
LEFT JOIN (
  SELECT creator, count(*) as voteCount
  FROM cabildeo_vote
  GROUP BY creator
) AS vote_counts ON vote_counts.creator = membership.creator
ORDER BY coalesce(vote_counts.voteCount, 0) DESC, membership.cid DESC
```

**Impacto:** En una comunidad con 10k miembros y 100k votos, la diferencia teórica es entre ~1B operaciones (correlacionado) vs ~110k (hash join). El índice nuevo `cabildeo_vote_creator_idx` acelera la construcción de la subquery agregada.

**Archivo:** `packages/bsky/src/data-plane/server/routes/community.ts` (líneas 528–582)

---

## 4. CAPA DE CACHÉ REDIS PARA ENDPOINTS PARA

**Contexto:** Los endpoints PARA (`com.para.*`) bypassan completamente la capa de hidratación de Actors/Records del bsky AppView. Cada request hace llamadas gRPC directas al dataplane, incluso para datos altamente cacheables como listados de comunidades o feeds de autor.

**Problema:** `redis.ts` y `cache/read-through.ts` existían en el codebase desde hacía meses pero **nunca fueron instanciados**. No había variables de entorno `BSKY_REDIS_*` ni wiring en `AppContext`.

### Wiring de infraestructura
- **`config.ts`:** Nuevas env vars `BSKY_REDIS_HOST` / `BSKY_REDIS_PASSWORD`. Getter `config.redis`.
- **`context.ts`:** Campo `paraCache?: ParaCacheService` en `AppContext` constructor + getter.
- **`index.ts`:** En `BskyAppView.create()`, si `config.redis` está definido, se instancia `new Redis({ host, password })` y `new ParaCacheService(redis)`.

### ParaCacheService (`cache/para-cache.ts`)
Servicio nuevo con 4 particiones de caché, cada una con namespace `para:` en Redis y TTL escalonado según volatilidad del dato:

| Partición | TTL stale | TTL máx | Endpoints |
|-----------|-----------|---------|-----------|
| `boards` | 30s | 5 min | `listBoards` |
| `members` | 30s | 5 min | `listMembers` |
| `profileStats` | 60s | 10 min | `getProfileStats` |
| `authorFeed` | 15s | 2 min | `getAuthorFeed` |

**Estrategia de claves:**
- `boards`: `${viewerDid}:${sort}:${state}:${participationKind}:${flairId}:${quadrant}:${query}:${limit}:${cursor}`
- `members`: `${communityId}:${membershipState}:${role}:${sort}:${limit}:${cursor}:${viewerDid}:${viewerIsAdmin}`
- `profileStats`: `${actorDid}` (independiente de viewer; blocking check se ejecuta antes)
- `authorFeed`: `${actorDid}:${limit}:${cursor}` (independiente de viewer; blocking check antes)

**Patrón de integración en handlers:**
```typescript
// 1. Construir cache key
// 2. Cache hit → retornar inmediatamente
// 3. Cache miss → dataplane → computar resultado → cache.set() → retornar
// 4. Fallas de escritura en Redis son no-fatales (try/catch silencioso)
```

**Archivos modificados:**
- `packages/bsky/src/cache/para-cache.ts` (nuevo)
- `packages/bsky/src/api/com/para/community/listBoards.ts`
- `packages/bsky/src/api/com/para/community/listMembers.ts`
- `packages/bsky/src/api/com/para/actor/getProfileStats.ts`
- `packages/bsky/src/api/com/para/feed/getAuthorFeed.ts`
- `packages/bsky/src/config.ts`
- `packages/bsky/src/context.ts`
- `packages/bsky/src/index.ts`

---

## DETALLE DE ARCHIVOS

```
M  packages/bsky/src/api/com/para/actor/getProfileStats.ts
M  packages/bsky/src/api/com/para/community/listBoards.ts
M  packages/bsky/src/api/com/para/community/listMembers.ts
M  packages/bsky/src/api/com/para/feed/getAuthorFeed.ts
A  packages/bsky/src/cache/para-cache.ts
M  packages/bsky/src/config.ts
M  packages/bsky/src/context.ts
A  packages/bsky/src/data-plane/server/db/migrations/20260428T060000000Z-add-para-performance-indexes.ts
M  packages/bsky/src/data-plane/server/db/migrations/index.ts
M  packages/bsky/src/data-plane/server/routes/community.ts
M  packages/bsky/src/index.ts
```

**Total:** 11 archivos modificados, 2 creados, 2 migraciones.

---

## VALIDACIÓN

```bash
# Compilación TypeScript limpia
cd packages/bsky && npx tsc --noEmit --project tsconfig.json
# ✅ Sin errores

# Estado del repo limpio
cd /Users/mlv/Desktop/MASTER/mvp && git status
# ✅ Working tree limpio, commits en main
```

---

## PRÓXIMOS PASOS (PHASE 2)

1. **Refactor SQL de `getParaDelegationCandidates`:** Reemplazar sort en memoria por `ORDER BY` con índice compuesto `(delegationCount, cid)`.
2. **Cache invalidation por eventos:** Suscribir `ParaCacheService` a eventos de `cabildeo_vote`, `para_community_membership`, y `para_post_meta` para invalidar claves afectadas en tiempo real.
3. **Distributed rate limiting:** Mover rate limiting del PDS a Redis compartido para consistencia en deployments multi-replica.
4. **Monitoría:** Agregar métricas de cache hit/miss ratio por partición (Prometheus counters).

---

*Reporte generado automáticamente post-sesión.*
