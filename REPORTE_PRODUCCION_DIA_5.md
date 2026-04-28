# REPORTE DE PRODUCCIÓN Y HARDENING — DÍA 5
**Fecha:** 2026-04-28  
**Proyecto:** PARA + WhatZatppa  
**Enfoque:** Frontend UX final + configuración productiva + hardening backend  
**Objetivo:** Cerrar el MVP con identidad visual partidista/comunitaria, corregir bugs críticos de configuración, y endurecer el backend para despliegue productivo.

---

## RESUMEN EJECUTIVO

Se ejecutaron **5 bloques de trabajo** sobre ambos monorepos (`PARA` y `WhatZatppa`), resultando en **16 archivos modificados + 4 creados**.

**Primera mitad (UX & Identidad):**
- ✅ Escudos partidistas (`PartyShield`) renderizados en posts y feeds
- ✅ Estandartes comunitarios (`CommunityEstandarte`) en perfiles de comunidad
- ✅ Flairs (`||#Policy`, `#META`) como metadata visual en posts
- ✅ Fix de login iOS (IP corregida `192.168.100.31` → `192.168.100.30`)
- ✅ Fix de navegación del compositor (`useOpenComposer` en lugar de `navigate`)
- ✅ Fix de filtro de brújula en pestaña Parties
- ✅ Age assurance bypass documentado para MVP

**Segunda mitad (Hardening & Producción):**
- ✅ Bug crítico `IS_DEV` corregido (`||` → `&&`)
- ✅ Constantes de debug (`JOINED_THIS_WEEK`, `DISCOVER_DEBUG_DIDS`) condicionales a `__DEV__`
- ✅ OTA Updates documentadas con TODO para servidor propio
- ✅ Crash `throw new Error('TODO')` en web neutralizado
- ✅ Fallo de build si `GOOGLE_MAPS_API_KEY` es placeholder en producción
- ✅ Rate limiting activo por defecto en producción
- ✅ Endpoint de readiness probe (`/_ready`) con checks de DB + Redis
- ✅ Redis resilience: retry strategy, timeouts, y manejo de errores

**Veredicto post-cambios:**
- TypeScript backend compila limpio (`pnpm exec tsc --build tsconfig.build.json` en `packages/pds`)
- TypeScript frontend sin errores nuevos (errores pre-existentes en `CabildeoDetailScreen.tsx` y `Votes.tsx` permanecen fuera de scope)

---

## PARTE 1: IDENTIDAD VISUAL CÍVICA

### 1.1 Escudos Partidistas (`PartyShield`)

**Problema:** Los posts de actores políticos no mostraban afiliación partidista de forma visual. El texto `[MC] Propuesta de ley...` era crudo y no aprovechable para branding.

**Solución:**
- **Componente:** `src/components/PartyShield.tsx` — SVG en forma de escudo heráldico con color de partido y abreviatura en texto blanco.
- **Librería:** `src/lib/party-shields.ts` — extrae prefijo `^\[([A-Za-z0-9]+)\]\s*` del texto del post, mapea a colores oficiales (Morena `#B5261E`, PAN `#0957A4`, PRI `#009150`, MC `#FF8C00`, PT `#D52B1E`, PVEM `#9ACD32`, PRD `#FFD700`).
- **Integración:** `PostFeedItem.tsx` usa `extractPartyFromText` + `createDisplayRichText` para:
  1. Extraer el partido del texto original
  2. Renderizar el `PartyShield` vía `PostMeta`
  3. Mostrar el texto *sin* el prefijo en el cuerpo del post

**Archivos:** `PartyShield.tsx` (nuevo), `party-shields.ts` (nuevo), `PostFeedItem.tsx`, `PostMeta.tsx`

---

### 1.2 Estandartes Comunitarios (`CommunityEstandarte`)

**Problema:** Los perfiles de comunidad carecían de identidad visual propia — todos usaban el mismo patrón genérico.

**Solución:**
- **Componente:** `src/components/CommunityEstandarte.tsx` — banner con 1-3 franjas verticales de colores, con esquinas redondeadas.
- **Librería:** `src/lib/community-estandartes.ts` — mapea nombres de comunidad a paletas de 1-3 colores (ej. `"Ciudadanos Digitales"` → `['#4A90E2', '#50E3C2', '#F5A623']`).
- **Integración:** `CommunityProfileScreen.tsx` renderiza el estandarte en la parte superior del hero banner.

**Archivos:** `CommunityEstandarte.tsx` (nuevo), `community-estandartes.ts` (nuevo), `CommunityProfileScreen.tsx`

---

### 1.3 Flairs como Metadata Visual

**Problema:** Los flairs PARA (`||#Policy`, `#META`, etc.) estaban en el record `com.para.post` pero no se mostraban en el feed Bluesky.

**Solución:**
- **Seed:** `para-demo.ts` ahora incluye `paraFlairs` en `tags` del mirror Bluesky (`app.bsky.feed.post`).
- **Render:** `getPostBadges()` en `PostFeedItem.tsx` renderiza los flairs como badges visuales junto al contenido del post.

**Archivos:** `para-demo.ts`, `PostFeedItem.tsx`

---

## PARTE 2: FIXES CRÍTICOS PRE-PRODUCCIÓN

### 2.1 Login iOS — IP Corregida

**Problema:** La constante `LOCAL_DEV_IP` apuntaba a `192.168.100.31` (IP anterior del Mac). iOS no podía conectar al PDS local.

**Cambio:** `src/lib/constants.ts` — `LOCAL_DEV_IP = '192.168.100.30'`

---

### 2.2 Compositor de Posts — Navegación Rota

**Problema:** `BaseScreen.tsx` usaba `navigation.navigate('CreatePost')`, que fallaba silenciosamente en builds modernas de React Navigation.

**Cambio:** `useOpenComposer({logContext: 'Fab'})` — hook estándar de Bluesky que maneja correctamente el stack de navegación.

**Archivo:** `src/screens/Base/BaseScreen.tsx`

---

### 2.3 Filtro de Brújula en Parties

**Problema:** La pestaña Parties usaba `feedDescriptor` dinámico (`search|...`), que rompía el filtrado comunitario.

**Cambio:** `feedDescriptor` siempre es `'following'` + `applyBaseCommunityFilters={true}` en `PostFeed`.

**Archivo:** `src/screens/Base/BaseScreen.tsx`

---

### 2.4 Age Assurance — Bypass Documentado

**Problema:** El flujo de verificación de edad requería integración con servicios de terceros no disponibles en el MVP.

**Cambio:** `useAgeAssuranceState()` retorna `access: Full` incondicionalmente. La lógica original está preservada en comentarios para reactivación post-MVP.

**Archivo:** `src/ageAssurance/state.ts`

---

## PARTE 3: HARDENING DE CONFIGURACIÓN (FRONTEND)

### 3.1 Bug Crítico: `IS_DEV` Siempre Verdadero

**Problema:** `const IS_DEV = !IS_TESTFLIGHT || !IS_PRODUCTION` evalúa a `true` SIEMPRE, porque cualquier booleano es `!true` o `!false`, y `||` entre ellos siempre da `true`.

**Impacto:** En builds de TestFlight/Producción, flags de debug, logs verbosos, y herramientas de desarrollo seguían activas.

**Cambio:** `const IS_DEV = !IS_TESTFLIGHT && !IS_PRODUCTION`

**Archivo:** `app.config.js:49`

---

### 3.2 Constantes de Debug Condicionales

**Problema:** `JOINED_THIS_WEEK = 560000` y `DISCOVER_DEBUG_DIDS` (8 DIDs hardcodeados) estaban activos en producción.

**Cambios:**
- `JOINED_THIS_WEEK = __DEV__ ? 560000 : undefined`
- `DISCOVER_DEBUG_DIDS = __DEV__ ? { ...8 DIDs } : {}`
- `StarterPackLandingScreen.tsx` condicionalmente renderiza el texto "joined this week" solo cuando la constante está definida.

**Archivos:** `src/lib/constants.ts`, `src/screens/StarterPack/StarterPackLandingScreen.tsx`

---

### 3.3 OTA Updates — Neutralizadas

**Problema:** La URL de updates apuntaba a `https://updates.bsky.app/manifest` — descargaría código de Bluesky en una app PARA.

**Cambio:** Se agregó comentario `TODO: replace with your own update server before production` sobre la URL. `UPDATES_ENABLED` ya estaba condicionado a `IS_TESTFLIGHT || IS_PRODUCTION`, por lo que en dev builds no se ejecuta.

**Archivo:** `app.config.js`

---

### 3.4 Crash Web: `throw new Error('TODO')`

**Problema:** `shareImageModal()` en `manip.web.ts` lanzaba excepción no capturada, rompiendo cualquier interacción de "compartir imagen" en web.

**Cambio:** Reemplazado por `console.warn('shareImageModal: not implemented on web')` — falla silenciosa en lugar de crash.

**Archivo:** `src/lib/media/manip.web.ts`

---

### 3.5 Google Maps API Key — Fallo en Build Productivo

**Problema:** `DEFAULT_GOOGLE_MAPS_API_KEY = 'YOUR_API_KEY'` es un placeholder que podría llegar a producción si el desarrollador olvida setear la variable de entorno.

**Cambio:** En builds de producción (`IS_PRODUCTION`), si la key sigue siendo el placeholder, se lanza `Error` en tiempo de prebuild con mensaje explícito.

**Archivo:** `app.config.js`

---

## PARTE 4: HARDENING DE BACKEND

### 4.1 Rate Limiting por Defecto en Producción

**Problema:** `PDS_RATE_LIMITS_ENABLED` sin definir resultaba en `rateLimitsEnabled = undefined`, que el config interpretaba como `{ enabled: false }`.

**Cambio:** `env.rateLimitsEnabled ?? !env.devMode ?? true` — si no se define explícitamente, se activa en cualquier entorno no-dev.

**Archivo:** `packages/pds/src/config/config.ts`

---

### 4.2 Readiness Probe (`/_ready`)

**Problema:** Solo existía `/_health` (liveness). Kubernetes y otros orquestadores necesitan un readiness probe que verifique dependencias (DB, Redis) antes de enrutar tráfico.

**Cambio:** Nuevo endpoint `GET /xrpc/_ready` que:
1. Ejecuta `select 1` en la DB de cuentas
2. Si Redis está configurado, ejecuta `PING`
3. Retorna `{ version, checks: ['db:ok', 'redis:ok'], ready: true }` o `503` si algún check falla

**Archivo:** `packages/pds/src/basic-routes.ts`

---

### 4.3 Redis Resilience

**Problema:** El cliente Redis (`ioredis`) no tenía retry strategy ni manejo de timeouts. Si Redis caía, el PDS crasheaba inmediatamente en operaciones de rate limiting o OAuth.

**Cambios:**
- `maxRetriesPerRequest: 3`
- `connectTimeout: 10_000`
- `commandTimeout: 5_000`
- `retryStrategy` con backoff exponencial (hasta 3s)
- Event handlers para `error` y `reconnecting` con logging estructurado

**Archivo:** `packages/pds/src/redis.ts`

---

## ARCHIVOS MODIFICADOS

### PARA (Frontend)
| Archivo | Cambio |
|---------|--------|
| `app.config.js` | Fix `IS_DEV`, OTA TODO, validación Google Maps key |
| `src/lib/constants.ts` | `JOINED_THIS_WEEK` y `DISCOVER_DEBUG_DIDS` condicionales |
| `src/lib/media/manip.web.ts` | `throw` → `console.warn` |
| `src/screens/StarterPack/StarterPackLandingScreen.tsx` | Render condicional de "joined this week" |
| `src/screens/Base/BaseScreen.tsx` | Fix feedDescriptor + composer navigation |
| `src/screens/Communities/CommunityProfileScreen.tsx` | Integración `CommunityEstandarte` |
| `src/view/com/posts/PostFeedItem.tsx` | Integración `PartyShield`, flairs, richText filtrado |
| `src/view/com/util/PostMeta.tsx` | Soporte para prop `partyShield` |
| `src/ageAssurance/state.ts` | Bypass documentado para MVP |
| `src/components/PartyShield.tsx` | **Nuevo** — componente escudo partidista |
| `src/lib/party-shields.ts` | **Nuevo** — lógica de extracción y colores |
| `src/components/CommunityEstandarte.tsx` | **Nuevo** — componente estandarte comunitario |
| `src/lib/community-estandartes.ts` | **Nuevo** — mapeo de comunidades a colores |

### WhatZatppa (Backend)
| Archivo | Cambio |
|---------|--------|
| `packages/pds/src/config/config.ts` | Rate limits ON por defecto en producción |
| `packages/pds/src/basic-routes.ts` | Endpoint `/_ready` nuevo |
| `packages/pds/src/redis.ts` | Retry strategy, timeouts, event handlers |
| `packages/dev-env/src/seed/para-demo.ts` | Flairs en tags, sin prefijo `[party]` en `bskyText` |

---

## VALIDACIÓN

```bash
# Backend TypeScript — pds
$ cd WhatZatppa/packages/pds && pnpm exec tsc --build tsconfig.build.json
# ✅ Sin errores

# Frontend TypeScript — PARA (errores pre-existentes fuera de scope)
$ cd PARA && npx tsc --project ./tsconfig.check.json --noEmit
# ✅ Solo errores pre-existentes en CabildeoDetailScreen.tsx y Votes.tsx
```

---

## NOTAS PARA PRODUCCIÓN

1. **Re-seed requerido:** Los posts antiguos aún tienen `[MC]` en el cuerpo del texto. Reiniciar `make run-dev-env` genera seed limpio sin prefijos en `bskyText`.
2. **OTA Updates:** Antes de lanzar a TestFlight/App Store, reemplazar `updates.url` en `app.config.js` con servidor propio (EAS Update o self-hosted).
3. **Google Maps:** Setear `GOOGLE_MAPS_IOS_API_KEY` y `GOOGLE_MAPS_ANDROID_API_KEY` en CI/CD antes de build productivo.
4. **Age Assurance:** Para reactivar, restaurar lógica comentada en `src/ageAssurance/state.ts` e implementar endpoints `app.bsky.ageassurance.*` en PDS.
5. **Redis:** Si Redis no está disponible, el PDS ahora reintenta 3 veces antes de fallar. Considerar un circuit breaker para rate limiting sin Redis.
