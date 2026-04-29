# REPORTE DE REDISEÑO DE MY BASE — DÍA 7
**Fecha:** 2026-04-28
**Proyecto:** PARA + WhatZatppa
**Enfoque:** Rediseño completo de MyBaseScreen + Integración en navegación principal
**Objetivo:** Convertir MyBaseScreen de un scroll plano a un layout tabbed con PagerView (mismo patrón que ProfileScreen) y exponerlo en Drawer/LeftNav para acceso directo.

---

## RESUMEN EJECUTIVO

Se completó el **rediseño de MyBaseScreen** y su **promoción a navegación principal**.

**MyBaseScreen — Layout tabbed con PagerWithHeader:**
- ✅ Header enriquecido colapsable: avatar, métricas (Influence, Votos, Posts, Followers, Following), flair seleccionable, afiliación política con ColorStack, botón de settings
- ✅ 3 tabs: **Resumen** | **Votos** | **Comunidades**
- ✅ Tab Resumen: Próximas acciones (cabildeos en votación), votos recientes, highlights, followed items, CTAs (RAQ, Árbol de políticas)
- ✅ Tab Votos: Filtros por fase (Todos/En votación/Deliberando/Resueltos) + lista de cabildeos votados
- ✅ Tab Comunidades: Agrupado por comunidad con badge de activos + preview de cabildeos
- ✅ Sin errores de TypeScript

**Navegación — My Base ahora accesible desde:**
- ✅ Drawer lateral (mobile): ítem "My Base" con icono UserCircle, después de "Base"
- ✅ Desktop LeftNav (web/desktop): ítem "My Base" con href `/my-base`, después de "Base"
- ✅ Ruta web `/my-base` ya estaba registrada en `src/routes.ts`
- ✅ Ruta mobile `MyBase` ya estaba registrada en `BaseTabNavigator` y `FlatNavigator`

---

## PARTE 1: MYBASESCREEN REDISEÑADO

### 1.1 Arquitectura: PagerWithHeader

**Patrón:** Reutiliza el mismo componente `PagerWithHeader` que usa `ProfileScreen`, `StarterPackScreen` y `ProfileList`.

**Archivo:** `PARA/src/screens/Base/MyBaseScreen.tsx`

**Estructura:**
```
Layout.Screen
└── PagerWithHeader
    ├── renderHeader → MyBaseHeader (colapsable)
    │   ├── Avatar + display name + handle
    │   ├── Métricas row (5 métricas clickeables)
    │   ├── Flair seleccionable (badge + modal)
    │   └── Afiliación política (ColorStack)
    ├── Tab 0: Resumen
    ├── Tab 1: Votos
    └── Tab 2: Comunidades
```

**Tabs implementadas:**

| Tab | Contenido |
|-----|-----------|
| **Resumen** | Próximas acciones (cabildeos en votación sin voto del usuario), Votos recientes, Highlights (con "Ver todos"), Siguiendo (grid), CTAs (RAQ, Árbol de políticas), Link a perfil público |
| **Votos** | Filter pills: Todos / En votación / Deliberando / Resueltos. Lista de cabildeos donde el usuario ha votado, ordenados por fecha. Empty state cuando no hay votos en el filtro. |
| **Comunidades** | Agrupado por comunidad. Header con dot de color + nombre + badge "N activos". Hasta 3 cabildeos por comunidad con link "Ver N cabildeos →". Navega a CommunityProfile al tocar el header. |

### 1.2 Header: MyBaseHeader

**Props:**
- `profile` — datos del perfil ATProto
- `influenceScore` — calculado como `toClout(followers) + highlights.length + followedItems.length`
- `votedCount` — conteo de cabildeos con `viewerVoteOption`
- `affiliations` — array de `PoliticalAffiliation`
- `selectedFlair` — flair actual del usuario
- `onPressFlair`, `onPressMetric`, `onPressSettings`, `onPressAffiliation`

**Métricas row (5 items clickeables):**
| Métrica | Acción al tocar |
|---------|-----------------|
| Influence | Navega a `SeeInfluence` |
| Votos | Navega a `SeeVotes` |
| Posts | Navega a `SeePosts` |
| Followers | Push a `ProfileFollowers` |
| Following | Push a `ProfileFollows` |

### 1.3 Type Safety

- Todos los children de `PagerWithHeader` retornan `JSX.Element` (nunca `null` directamente)
- Cuando una tab no está enfocada, retorna `<View />` en lugar de `null`
- Import de `SettingsGear2_Stroke2_Corner0_Rounded` corregido (no `SettingsGearGear2`)

---

## PARTE 2: NAVEGACIÓN — MY BASE EN DRAWER + LEFTNAV

### 2.1 Drawer (Mobile)

**Archivo:** `PARA/src/view/shell/Drawer.tsx`

**Cambios:**
- `isAtMyBase`: detección de estado activo vía `currentRoute.name === 'MyBase'`
- `onPressMyBase`: callback que navega a `'MyBase'` y cierra el drawer
- `MyBaseMenuItem`: componente memoizado con icono `UserCircle` (filled/outline según activo)
- Renderizado después de `BaseMenuItem` y antes de `CommunitiesMenuItem`

**Orden del drawer con sesión:**
1. Explore
2. Home
3. Chat
4. Notifications
5. Feeds
6. **Base**
7. **My Base** ← nuevo
8. Communities
9. Cabildeo
10. Lists
11. Bookmarks
12. Profile
13. Settings

### 2.2 Desktop LeftNav (Web/Desktop)

**Archivo:** `PARA/src/view/shell/desktop/LeftNav.tsx`

**Cambios:**
- `MyBaseNavItem`: componente con `href="/my-base"`, icono `UserCircle`/`UserCircleFilled`
- Renderizado después de `BaseNavItem`

**Orden del LeftNav:**
1. Home
2. Explore
3. Notifications
4. **Base**
5. **My Base** ← nuevo
6. Messages
7. Communities
8. Cabildeo
9. Feeds
10. Lists
11. Bookmarks
12. Profile

### 2.3 Rutas

La ruta web `/my-base` ya estaba registrada en `src/routes.ts`:
```ts
MyBase: '/my-base',
```

La pantalla `MyBase` ya estaba registrada en ambos navigators:
- `BaseTabNavigator` (mobile native stack dentro del Base tab)
- `FlatNavigator` (web flat stack)

---

## PARTE 3: ARCHIVOS MODIFICADOS

| Archivo | Líneas cambiadas | Descripción |
|---------|-----------------|-------------|
| `PARA/src/screens/Base/MyBaseScreen.tsx` | ~1577 (reescrito) | Layout tabbed con PagerWithHeader, 3 tabs completas, header enriquecido |
| `PARA/src/view/shell/Drawer.tsx` | +36 líneas | `MyBaseMenuItem`, `onPressMyBase`, `isAtMyBase` |
| `PARA/src/view/shell/desktop/LeftNav.tsx` | +22 líneas | `MyBaseNavItem` con href `/my-base` |

---

## DECISIONES Y NOTAS

1. **Icono elegido:** `UserCircle` para My Base (distingue de `Book` usado para Base). En el futuro podría usarse un icono más específico (e.g. una casa/persona combinada).

2. **Posición en navegación:** My Base va después de Base porque es una subvista personal del ecosistema Base. Mantiene la jerarquía mental: Base (explorar) → My Base (mi actividad personal).

3. **Acceso desde BaseScreen:** El avatar en `BaseScreen` (esquina superior derecha) sigue navegando a `MyBase`. Ahora hay dos caminos al mismo destino, lo cual es intencional para descubribilidad.

4. **Requiere sesión:** My Base solo aparece en el drawer cuando `hasSession === true`. Esto es consistente con Profile, Bookmarks, etc.

---

## PRÓXIMAS TAREAS (DÍA 8+)

- [ ] Seeding quality: remover nombres de partido del texto de posts en `para-demo.ts` (dejar solo en metadata)
- [ ] MyBaseScreen: agregar sección de "Delegaciones activas" cuando el sistema de delegación tenga datos reales
- [ ] MyBaseScreen: agregar timeline de actividad reciente (votos, posiciones, highlights) con timestamps
- [ ] Tab Comunidades: mostrar comunidades que el usuario sigue explícitamente (no solo inferidas de cabildeos)
