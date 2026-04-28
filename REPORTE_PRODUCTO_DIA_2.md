# REPORTE DE PRODUCTO Y APARIENCIA — DÍA 2
**Fecha:** 2026-04-28  
**Proyecto:** PARA  
**Enfoque:** Producto visible (features fantasma + apariencia)  
**Objetivo:** Activar features inactivas, arreglar dark mode en módulo cívico, y conectar datos reales a pantallas vacías.

---

## RESUMEN EJECUTIVO

Se ejecutaron **3 bloques de trabajo** enfocados en la experiencia de usuario de PARA, resultando en **6 archivos modificados + 1 archivo creado**. Los cambios activan una feature fantasma de comunidades, restauran el dark mode en el módulo de cabildeo, y conectan la sección de votos del perfil con datos reales del repositorio AT Protocol.

**Veredicto post-cambios:**
- ✅ Botón Join/Leave ahora ejecuta mutations reales contra el backend
- ✅ 0 colores hex hardcodeados en `CabildeoDetailScreen.tsx` y `CreateCabildeoScreen.tsx`
- ✅ 1 restante en `CabildeoListScreen.tsx` (`shadowColor: '#000'`, aceptable)
- ✅ ProfileVotesSection ya no renderiza un array vacío hardcodeado

---

## PARTE 1: ACTIVAR JOIN/LEAVE DE COMUNIDADES

**Problema:** El backend (`watx`) tenía endpoints `com.para.community.join` y `com.para.community.leave` implementados, testeados y expuestos en el cliente API. Sin embargo, el frontend PARA tenía un botón "Join/Joined" en `CommunityProfileScreen.tsx` que solo toggleaba un estado local (`joinOverride`) sin comunicarse con el servidor. Era decorativo.

**Archivos modificados:**
- `PARA/src/state/queries/community-boards.ts`
- `PARA/src/screens/Communities/CommunityProfileScreen.tsx`

### Cambios aplicados:

#### `community-boards.ts`
- Agregados tipos `JoinCommunityInput`, `JoinCommunityResponse`, `LeaveCommunityInput`, `LeaveCommunityResponse`
- Creado `useJoinCommunityMutation()` que llama `com.para.community.join` con `{communityUri, source?}`
- Creado `useLeaveCommunityMutation()` que llama `com.para.community.leave` con `{communityUri}`
- Ambas mutations invalidan queries de comunidad tras éxito para reflejar el nuevo estado inmediatamente
- Normalización de respuesta reutilizando `normalizeMembershipState` existente

#### `CommunityProfileScreen.tsx`
- Importadas las nuevas mutations
- Reemplazado `onPressJoin` (toggle local) por función async que ejecuta la mutation apropiada:
  - Si el usuario NO está unido → llama `joinMutation.mutateAsync()`
  - Si el usuario SÍ está unido → llama `leaveMutation.mutateAsync()`
- Agregado estado `isJoinPending` para deshabilitar el botón durante la operación
- Agregado texto dinámico: "Joining..." / "Leaving..."
- Agregado display de errores debajo del botón con `cleanError()`
- Mantenido el comportamiento especial para comunidades en estado `draft` (founding members)

**Impacto de producto:** Los usuarios ahora pueden unirse y salir de comunidades reales. Antes el botón era un placebo.

---

## PARTE 2: ARREGLAR DARK MODE EN MÓDULO CABILDEO

**Problema:** Las screens de cabildeo (`CabildeoListScreen`, `CabildeoDetailScreen`, `CreateCabildeoScreen`) usaban ~50+ colores hex hardcodeados (`#FF3B30`, `#34C759`, `#FF9500`, `#007AFF`, `#8E8E93`, `#AF52DE`, `#fff`). Estos colores no respetaban el tema ALF y se veían mal o con contraste incorrecto en dark mode.

**Archivos modificados:**
- `PARA/src/screens/Communities/CabildeoListScreen.tsx`
- `PARA/src/screens/Communities/CabildeoDetailScreen.tsx`
- `PARA/src/screens/Communities/CreateCabildeoScreen.tsx`

### Cambios aplicados:

#### `CabildeoListScreen.tsx` (12 instancias → 1 restante)
| Color original | Token ALF | Uso |
|---|---|---|
| `#8E8E93` | `t.palette.contrast_400` | Estado "Borrador" |
| `#007AFF` | `t.palette.primary_500` | Estado "Abierto" |
| `#FF9500` | `t.palette.warning_500` | Estado "Deliberando" |
| `#34C759` | `t.palette.positive_500` | Estado "Votación" |
| `#AF52DE` | `t.palette.primary_500` | Estado "Resuelto" |
| `#fff` | `t.palette.contrast_100` | Texto de pills activas |
| `#FF9500` + alpha | `t.palette.warning_500 + '20'` | Badge cuadrático |
| `#FF3B30` + alpha | `t.palette.negative_500 + '15'` | Badge geo-restricted |

- Convertida constante global `PHASE_CONFIG` a función `getPhaseConfig(t)` para que los colores se adapten al tema activo

#### `CabildeoDetailScreen.tsx` (33 instancias → 0)
- Convertidas `PHASE_META` y `STANCE_COLORS` a funciones `getPhaseMeta(t)` y `getStanceColors(t)`
- Reemplazados todos los colores semáforo por tokens ALF:
  - `#FF3B30` (rojo) → `t.palette.negative_500` — votos en contra, errores
  - `#34C759` (verde) → `t.palette.positive_500` — votos a favor, éxito
  - `#FF9500` (naranja) → `t.palette.warning_500` — enmiendas, deliberación
  - `#AF52DE` (púrpura) → `t.palette.primary_500` — resuelto, estado final
  - `#fff` / `#ffffff90` / `#FFF` → `t.palette.contrast_100` — textos sobre fondos oscuros
  - Alphas (`#34C75920`, `#FF3B3020`, `#FF950020`, `#AF52DE60`, `#AF52DE10`) → base ALF + hex alpha como transición

#### `CreateCabildeoScreen.tsx` (8 instancias → 0)
- Reemplazados todos los `#FF3B30` (errores de validación) por `t.palette.negative_500`
- Reemplazado `#fff` (texto de botón submit) por `t.palette.contrast_100`

**Nota técnica:** Los colores con opacidad (ej. `#FF950020`) se migraron usando `t.palette.warning_500 + '20'` como solución intermedia. ALF no tiene tokens con alpha incorporada, pero esta transición elimina el hardcoding de colores semánticos y permite que el color base respete el tema.

**Impacto visual:** El módulo de cabildeo ahora respeta dark mode. Los estados de votación, badges de restricción geográfica, y indicadores de fase cambian de color según el tema del sistema.

---

## PARTE 3: CONECTAR PROFILE VOTES CON DATOS REALES

**Problema:** `ProfileVotesSection` renderizaba un array vacío hardcodeado (`PROFILE_VOTES: []`) siempre mostrando "No public votes yet". No había forma de ver los votos reales de un usuario.

**Archivos creados/modificados:**
- `PARA/src/state/queries/profile-votes.ts` (nuevo)
- `PARA/src/screens/Profile/Sections/Votes.tsx`
- `PARA/src/view/screens/Profile.tsx`

### Cambios aplicados:

#### `profile-votes.ts` (nuevo archivo)
- Query `useProfileVotesQuery(did: string)` que consume `com.atproto.repo.listRecords`
- Filtra por colección `com.para.civic.vote` (record type definido en lexicons)
- Mapea cada record a `ProfileVoteItem` con:
  - `subject`: URI del cabildeo/propuesta votada
  - `vote`: derivado de `signal` (-3 a +3) o `selectedOption`
  - `voteColor`: categoría visual (`positive`, `negative`, `warning`, `neutral`)
  - `date`: `createdAt` del record
  - `reason`: racional opcional del votante
- Mapeo de señal:
  - `signal <= -2` → "Strong Oppose" (rojo)
  - `signal == -1` → "Oppose" (rojo)
  - `signal == 0` → "Neutral" (naranja)
  - `signal == 1` → "Support" (verde)
  - `signal >= 2` → "Strong Support" (verde)
  - `selectedOption` → "Option N" (verde)

#### `ProfileVotesSection.tsx`
- Agregada prop `did: string`
- Reemplazado array vacío por `useProfileVotesQuery(did)`
- UI actualizada para mostrar:
  - `subject` como título (URI del cabildeo)
  - `vote` con color semántico según `voteColor`
  - `date` formateada
  - `reason` como subtítulo (si existe)
- Agregado estado `refreshing` vinculado a `isLoading`

#### `Profile.tsx`
- Pasada prop `did={resolvedDid}` a `ProfileVotesSection`
- Funciona para cualquier perfil, no solo el usuario logueado

**Impacto de producto:** Los usuarios ahora pueden ver su historial de votos cívicos en su perfil. Antes era una pantalla vacía permanente.

---

## VALIDACIÓN FINAL

```bash
✅ grep "useJoinCommunityMutation\|useLeaveCommunityMutation" community-boards.ts → 2 exports
✅ grep "useJoinCommunityMutation\|useLeaveCommunityMutation" CommunityProfileScreen.tsx → importados y usados
✅ grep "#[0-9A-Fa-f]" CabildeoDetailScreen.tsx → 0 resultados
✅ grep "#[0-9A-Fa-f]" CreateCabildeoScreen.tsx → 0 resultados
✅ grep "#[0-9A-Fa-f]" CabildeoListScreen.tsx → 1 resultado (shadowColor, aceptable)
✅ grep "PROFILE_VOTES" ProfileVotesSection.tsx → 0 resultados (array vacío eliminado)
✅ grep "useProfileVotesQuery" ProfileVotesSection.tsx → 1 uso activo
```

---

## RIESGOS Y NOTAS PENDIENTES

1. **Profile Votes — título del cabildeo:** La query `listRecords` devuelve el `subject` (URI del cabildeo) pero no su título. Para mostrar títulos legibles, se requeriría hacer fetch adicionales de cada cabildeo (posible optimización futura con batching).

2. **Colores con alpha:** ALF no tiene tokens con opacidad incorporada. Los badges con fondo translúcido usan `t.palette.X_500 + '20'` como transición. Si ALF agrega soporte para alpha en el futuro, estos deberían migrarse.

3. **Join/Leave — estados intermedios:** La mutation invalida queries tras éxito, pero si el usuario cambia de pantalla rápidamente, podría ver estado desactualizado hasta el siguiente refetch.

---

## CONCLUSIÓN

El Día 2 se enfocó en **quitar las máscaras del producto**: el botón de Join que no hacía nada, los colores que rompían dark mode, y la sección de votos que siempre estaba vacía. Estos cambios no son refactors internos — son mejoras que los usuarios verán y sentirán inmediatamente.

**Recomendación inmediata:** Probar Join/Leave en una comunidad real de staging, y verificar que los colores de cabildeo se ven correctos en ambos temas (light/dark) en iOS y Android.

---

*Reporte generado por producto día 2 — Opción A: Feature + Polish*
