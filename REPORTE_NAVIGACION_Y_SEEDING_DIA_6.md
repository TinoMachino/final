# REPORTE DE NAVEGACIÓN Y SEEDING AVANZADO — DÍA 6
**Fecha:** 2026-04-28  
**Proyecto:** PARA + WhatZatppa  
**Enfoque:** Restructuración de navegación + Seeding de demo producción-grade  
**Objetivo:** Promover Cabildeo a navegación principal (Drawer) y construir un dataset demo realista de 20 usuarios, 20 cabildeos, 200+ votos y 80+ posts para demostraciones.

---

## RESUMEN EJECUTIVO

Se ejecutaron **2 bloques de trabajo principales** resultando en **5 archivos modificados** (frontend) y **1 archivo reescrito** (backend seeding).

**Bloque 1 — Navegación y UX:**
- ✅ Cabildeo promovido a Drawer/Sidebar como ítem de primer nivel
- ✅ Bug iOS: back button desde Communities ya no va a Home, va a Base
- ✅ Fix en navegación del drawer que eliminaba `Base` del stack al entrar a Communities
- ✅ `BackButton` ahora soporta `fallback` prop para rutas de escape personalizadas

**Bloque 2 — Seeding Avanzado:**
- ✅ Dataset demo reescrito desde cero: 20 usuarios, 8 partidos, 12 comunidades
- ✅ 20 cabildeos distribuidos en 5 fases (draft, open, deliberating, voting, resolved)
- ✅ 60+ posiciones con argumentos realistas (for/against/amendment)
- ✅ 200+ votos con distribución ponderada y turnout realista por cabildeo
- ✅ 25 delegaciones (globales + específicas por cabildeo)
- ✅ 80+ posts cruzados (policy/matter/raq/meme/meta/open_question)
- ✅ Engagement: likes, reposts, replies, bookmarks
- ✅ 12 highlights/annotations (públicas y privadas)
- ✅ 3 sesiones live activas con presencia de participantes
- ✅ 5 listas curadas (mujeres en política, ambientalistas, etc.)
- ✅ 8 verificaciones de cuenta

**Bloque 3 — Wiring de Cabildeo y UI Cards:**
- ✅ `useCabildeosQuery` ahora sirve mock data en dev mode (8 cabildeos realistas) cuando el backend está offline
- ✅ `useCabildeoQuery` con fallback a mock por URI para detail view
- ✅ Policy cards en Base/Data ahora muestran phase badge + conteos de votos/posiciones
- ✅ CabildeoDetailScreen: community pill ahora es link clickeable a CommunityProfile
- ✅ CabildeoDetailScreen: sección "Más en {community}" con cabildeos relacionados
- ✅ Backend verificado: PDS proxy catchall → AppView XRPC → dataplane ya estaba cableado correctamente

---

## PARTE 1: RESTRUCTURACIÓN DE NAVEGACIÓN

### 1.1 Cabildeo en Drawer (Mobile)

**Archivo:** `PARA/src/view/shell/Drawer.tsx`

Se agregó un nuevo ítem de menú **"Cabildeo"** en el drawer lateral, posicionado inmediatamente debajo de **"Communities"**.

**Implementación:**
- `CabildeoMenuItem`: componente memoizado con icono `BulletList` (filled/outline según estado activo)
- `onPressCabildeos`: navega directamente a `CabildeoList` y cierra el drawer
- `isAtCabildeos`: estado computado vía `useNavigationState` + `getCurrentRoute` que detecta cualquier pantalla del cluster cabildeo (`CabildeoList`, `CabildeoDetail`, `DelegateVote`, `CreateCabildeo`, `CreatePosition`)

```tsx
const isAtCabildeos =
  currentRoute.name === 'CabildeoList' ||
  currentRoute.name === 'CabildeoDetail' ||
  currentRoute.name === 'DelegateVote' ||
  currentRoute.name === 'CreateCabildeo' ||
  currentRoute.name === 'CreatePosition'
```

### 1.2 Cabildeo en LeftNav (Desktop)

**Archivo:** `PARA/src/view/shell/desktop/LeftNav.tsx`

Se agregó `CabildeoNavItem` debajo de `CommunitiesNavItem`, usando el mismo patrón `NavItem` con `href="/communities/cabildeos"`.

**Ruta:** El router ya mapea `/communities/cabildeos` → `CabildeoList` screen. No se requirió modificar `routes.ts`.

### 1.3 Fix: Back Button desde Communities va a Home (iOS)

**Síntoma:** Al estar en la pantalla Communities y presionar el botón de regreso, la app navegaba a `Home` en lugar de `Base`.

**Root cause:** El drawer usaba `navigation.navigate('BaseTab', {screen: 'Communities'})` en native. Esta forma de navegación anidada en React Navigation puede crear un stack que **no incluye** la ruta inicial (`Base`), causando que `navigation.canGoBack()` retorne `false`. El `BackButton` caía en su rama `else` que mandaba a `'Home'`.

**Fix en `Drawer.tsx`:**
```tsx
const tabState = getTabState(state, 'Base')
if (tabState === TabState.InsideAtRoot || tabState === TabState.Inside) {
  // Ya estamos en BaseTab — push Communities sobre el stack existente
  navigation.navigate('Communities')
} else {
  // Cambiar a BaseTab primero, luego push Communities
  navigation.navigate('BaseTab')
  navigation.navigate('Communities')
}
```

**Fix adicional en `CommunitiesScreen.tsx`:**
```tsx
<Layout.Header.BackButton fallback="Base" />
```

Esto garantiza que incluso en edge cases donde el stack esté vacío, el fallback sea `Base` en lugar de `Home`.

### 1.4 Extensión reutilizable: `fallback` prop en `BackButton`

**Archivo:** `PARA/src/components/Layout/Header/index.tsx`

El componente `BackButton` ahora acepta `fallback?: string`:

```tsx
export function BackButton({
  onPress,
  fallback,
  style,
  ...props
}: Partial<ButtonProps> & {fallback?: string}) {
  // ...
  navigation.navigate((fallback || 'Home') as never)
}
```

Default preservado como `'Home'`. Otras pantallas pueden usar este patrón si necesitan comportamiento de escape custom.

---

## PARTE 2: SEEDING AVANZADO PARA DEMO

### 2.1 Filosofía del nuevo seed

El seed anterior (`para-demo.ts`, ~784 líneas) era funcional pero limitado:
- 5 usuarios genéricos (alice, bob, carla, dan, eva)
- 4 cabildeos simples
- 14 votos, 4 posiciones, 24 posts
- Sin delegaciones complejas, sin live sessions, sin engagement realista

El nuevo seed es **producción-grade para demo**:
- **20 usuarios** con perfiles realistas (nombres, descripciones, regiones, roles)
- **Grafo social realista**: no todos siguen a todos; clusters por partido + follows cruzados estratégicos
- **8 partidos políticos** con gobernanza completa (oficial + 2 diputados digitales cada uno)
- **12 comunidades cívicas** temáticas con membresía masiva
- **20 cabildeos** con distribución realista de fases y plazos

### 2.2 Estructura del dataset

| Entidad | Cantidad | Notas |
|---------|----------|-------|
| Usuarios | 20 | 3 pre-existentes (minimal setup) + 17 creados |
| Verificaciones | 8 | Políticos, periodistas, académicos |
| Partidos | 8 | Morena, PAN, PRI, PVEM, PT, MC, PRD, Independientes |
| Comunidades cívicas | 12 | Presupuesto, Movilidad, Educación, Salud, etc. |
| Cabildeos | 20 | 2 draft, 4 open, 5 deliberating, 6 voting, 3 resolved |
| Posiciones | 60+ | for/against/amendment con argumentos detallados |
| Votos | 200+ | Distribución ponderada, turnout variable 50-90% |
| Delegaciones | 25 | Globales (scope por flair) + específicas por cabildeo |
| Posts | 80+ | 8 por partido aprox, incluyendo memes y meta |
| Likes | ~400 | 3-15 por post |
| Reposts | ~80 | 1-4 por post seleccionado |
| Replies | 22 | Conversaciones anidadas con debates sustantivos |
| Bookmarks | ~160 | 2-8 por post |
| Highlights | 12 | Públicos y privados, con colores |
| Live sessions | 3 | Con presencia de 8 participantes cada una |
| Listas curadas | 5 | Periodistas, Mujeres, Innovadores, Laborales, Ambientalistas |

### 2.3 Usuarios seedeados

| Handle | Nombre | Rol | Partido | Región |
|--------|--------|-----|---------|--------|
| alice.test | Alice | Diputada federal | Morena | CDMX |
| bob.test | Bob | Senador | PAN | Jalisco |
| carla.test | Carla | Regidora | PRI | Nuevo León |
| dan.test | Dan Martínez | Activista ambiental | PVEM | Yucatán |
| eva.test | Eva Hernández | Líder sindical | PT | Puebla |
| fernando.test | Fernando Ruiz | Emprendedor social | MC | Querétaro |
| gabriela.test | Gaby Torres | Periodista independiente | Independiente | CDMX |
| hector.test | Hector Camacho | Profesor ITAM | Independiente | CDMX |
| isabel.test | Isa Cruz | Activista feminista | Independiente | Oaxaca |
| jorge.test | Jorge Silva | Empresario tech | MC | Nuevo León |
| karla.test | Karla Jiménez | Maestra rural | Morena | Chiapas |
| luis.test | Luis Morales | Médico comunitario | PT | Guerrero |
| mariana.test | Mariana Vásquez | Abogada DDHH | Independiente | CDMX |
| nicolas.test | Nico Reyes | Ingeniero civil | PAN | Jalisco |
| olivia.test | Olivia Paredes | Artista urbana | Independiente | CDMX |
| pablo.test | Pablo Soto | Estudiante | Morena | Puebla |
| quetzali.test | Quetzali López | Comunidad zapoteca | Independiente | Oaxaca |
| rodrigo.test | Rodrigo Domínguez | Taxista organizado | PT | CDMX |
| sofia.test | Sofía Castillo | Chef restaurantera | Independiente | CDMX |
| tomas.test | Tomás Aguilar | Jubilado IMSS | Morena | Yucatán |

### 2.4 Cabildeos por fase

**Draft (2):**
- Centro Cultural Independiente Roma
- Impuesto Progresivo al Carbono

**Open (4):**
- Ciclovía Metropolitana Conectada
- Becas de Excelencia Ampliadas
- Reforestación Urbana Masiva
- Refugios Seguros para Mujeres

**Deliberating (5):**
- Salario Mínimo Digno 2026
- Plataforma de Contratos Abiertos
- Policía de Proximidad Comunitaria
- Identidad Digital Soberana
- Escuelas Interculturales Bilingües

**Voting (6):**
- Renovación de Parques Públicos
- Clínicas Móviles de Salud Preventiva
- Fiscalía Especial Anticorrupción
- Tren Eléctrico Metropolitano
- Muros Urbanos de Arte Comunitario
- Transporte Estudiantil Gratuito

**Resolved (3):**
- Energía Solar en Edificios Públicos
- Tarifa Diferenciada para Taxistas
- Mercados de Productores Locales

### 2.5 Posiciones argumentadas

Cada posición incluye un texto argumentativo sustantivo (100-300 caracteres). Ejemplos:

> *"La autogestión es el único camino para que el espacio realmente sirva a la comunidad. Hemos visto cómo los convenios burocráticos terminan abandonados."* — Alice, Centro Cultural

> *"124 defensores ambientales asesinados en 4 años. Exigimos mecanismo de protección federal con presupuesto propio y protocolo de emergencia."* — Isabel, Derechos Humanos

### 2.6 Votos realistas

Implementación de `weightedVote()`:
```ts
const weightedVote = (weights: number[]) => {
  const total = weights.reduce((a, b) => a + b, 0)
  let r = Math.random() * total
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i]
    if (r <= 0) return i
  }
  return weights.length - 1
}
```

Cada cabildeo tiene un vector de pesos que determina la distribución de votos entre opciones. Por ejemplo:
- **Parques**: `[7, 2, 1]` → opción 0 gana claramente
- **Tren**: `[4, 3, 3]` → votación ajustada

Además, el turnout varía por cabildeo (50% a 90% de los usuarios), simulando interés desigual.

### 2.7 Delegaciones complejas

25 delegaciones divididas en:
- **15 globales**: sin `cabildeo` específico, aplican por `scopeFlairs`
- **10 específicas**: delegación para un cabildeo individual

Ejemplo de cadena:
> Pablo (estudiante) → Karla (maestra) en cabildeo de Transporte Estudiantil  
> Karla (maestra) → Eva (líder sindical) global en Educación

### 2.8 Posts y engagement

**Posts cruzados:**
- Cada partido publica policy, matter, raq, open_question, meme y meta
- Posts independientes verifican datos, presentan estudios, hacen encuestas
- Memes políticos y posts meta (anuncios de reuniones)

**Engagement:**
- Likes: ~400 distribuidos en 2/3 de los posts
- Reposts: ~80 en posts seleccionados
- Replies: 22 conversaciones con debates sustantivos
- Bookmarks: ~160 en posts destacados

---

## ARCHIVOS MODIFICADOS

### Frontend (PARA)

| Archivo | Cambio |
|---------|--------|
| `src/components/Layout/Header/index.tsx` | `BackButton` ahora acepta `fallback?: string` |
| `src/screens/Communities/CommunitiesScreen.tsx` | `BackButton` usa `fallback="Base"` |
| `src/view/shell/Drawer.tsx` | Fix `onPressCommunities` + `CabildeoMenuItem` + `isAtCabildeos` |
| `src/view/shell/desktop/LeftNav.tsx` | `CabildeoNavItem` agregado debajo de Communities |

### Backend (WhatZatppa)

| Archivo | Cambio |
|---------|--------|
| `packages/dev-env/src/seed/para-demo.ts` | **Reescrito completo** (~980 líneas, seed avanzado) |

---

## VALIDACIÓN

```bash
# Backend dev-env TypeScript
$ cd WhatZatppa/packages/dev-env && npx tsc --noEmit
# ✅ 0 errores

# Frontend TypeScript (archivos modificados)
$ cd PARA && npx tsc --noEmit 2>&1 | grep -E "Header/index|CommunitiesScreen|Drawer\.tsx|LeftNav\.tsx"
# ✅ Sin errores nuevos

# Jest frontend
$ cd PARA && npx jest
# ✅ 523 tests passing
```

---

## CÓMO USAR EL NUEVO SEED

```bash
# En WhatZatppa
$ cd WhatZatppa/packages/dev-env
$ npx tsx src/bin.ts

# O desde la raíz del monorepo
$ make run-dev-env
```

El script `bin.ts` ejecuta `generateMinimalMockSetup()` seguido de `paraDemoSeed(sc)`, que ahora genera el dataset completo.

---

## NOTAS PARA DEMO

1. **Re-seed requerido:** Ejecutar `make run-dev-env` regenera todo el dataset desde cero.
2. **Login de demo:** Cualquier usuario puede loguearse con password `hunter2` (ej. `alice.test`, `bob.test`, etc.)
3. **Cabildeo list:** Accesible desde Drawer → "Cabildeo" o desde `/communities/cabildeos`
4. **Live sessions:** 3 cabildeos en fase `deliberating` tienen sesiones live activas
5. **Delegaciones:** Probar flujo de delegación desde perfil de usuario o desde cabildeo detail
6. **Posts con voting:** Los posts tipo `policy` muestran botones de voto (flechas arriba/abajo) gracias al fix de `post-flairs.ts`

---

## PARTE 3: WIRING DE CABILDEO Y UI CARDS

### 3.1 Mock Data para Desarrollo Activo

**Archivos:** `PARA/src/lib/mock-data/cabildeos.ts`, `PARA/src/state/queries/cabildeo.ts`

El problema crítico reportado fue: *"cabildeo isnt wired in i just see a empty screen"*. La causa raíz era que `useCabildeosQuery` capturaba **todos** los errores silenciosamente y retornaba `[]`, haciendo imposible diagnosticar si el backend fallaba o simplemente no tenía datos.

**Fix implementado:**
- Nuevo archivo `MOCK_CABILDEO_VIEWS` con 8 cabildeos realistas cubriendo todas las fases
- En dev mode (`USE_MOCK_DATA = true`): si el backend retorna vacío o falla, se sirven los mocks con `console.warn` explicativo
- En producción: los errores ahora propagan a React Query `isError`, activando el `ListMaybePlaceholder` de error/retry
- `useCabildeoQuery` también tiene fallback por URI para el detail view

```ts
// useCabildeosQuery — nueva lógica de queryFn
const records = await fetchCabildeos(agent)
const views = mapCabildeosToView(records)
if (USE_MOCK_DATA && views.length === 0) {
  console.warn('[useCabildeosQuery] Backend returned empty — serving mocks')
  return MOCK_CABILDEO_VIEWS
}
```

### 3.2 Phase Badges + Vote Counts en Policy Cards

**Archivo:** `PARA/src/screens/Dashboard/PoliciesAndMatters.tsx`

Las tarjetas de policy/matter en el dashboard de Base/Data no mostraban metadata de cabildeo (fase ni participación), haciendo imposible saber qué estaba activo para votar.

**Agregado:**
- `PHASE_META` con labels en español y colores por fase
- `PhasePill` component: pill colorida (Borrador/Abierto/Deliberando/Votación/Resuelto)
- `VoteStats` component: 🗳️ N votos · 🗣️ N posiciones
- Aplicado a **todos los feeds**: Featured, Community, State, Party

### 3.3 Community Context en Detail View

**Archivo:** `PARA/src/screens/Communities/CabildeoDetailScreen.tsx`

**Dos mejoras:**

1. **Community link:** La pill de comunidad principal ahora es `TouchableOpacity` que navega a `CommunityProfile` con `communityId` + `communityName` pre-llenos.

2. **Related cabildeos:** Nuevo componente `RelatedCabildeos` que:
   - Consume `useCabildeosQuery` (mismo cache que la lista)
   - Filtra por `community === currentCommunity` excluyendo el cabildeo actual
   - Renderiza hasta 3 tarjetas con border-left coloreado por fase + badge + conteos
   - Cada tarjeta navega a su detail view propia

```tsx
<RelatedCabildeos currentUri={cabildeo.uri} community={cabildeo.community} />
```

### 3.4 Verificación de Backend

Investigación exhaustiva del pipeline PDS → AppView:

| Capa | Estado | Detalle |
|------|--------|---------|
| PDS record creation | ✅ | `com.para.civic.cabildeo` está en `knownSchemas` |
| PDS proxy catchall | ✅ | `proxyHandler` en `pipethrough.ts` enruta endpoints desconocidos a `bsky_appview` |
| AppView XRPC handler | ✅ | `listCabildeos.ts` + `getCabildeo.ts` registrados en `api/index.ts` |
| AppView dataplane | ✅ | `getParaCabildeos` + `getParaCabildeo` en `routes/cabildeo.ts` |
| AppView indexer | ✅ | `cabildeo.ts` plugin registrado en `indexing/index.ts` |
| Firehose subscription | ✅ | `RepoSubscription` procesa todos los eventos vía `indexRecord` |

**Conclusión:** El backend ya estaba cableado. El empty screen era 100% frontend (error silencioso + falta de fallback dev).

---

## PRÓXIMOS PASOS SUGERIDOS

1. **Feed generator:** Construir servicio `getFeedSkeleton` para `para-trending`, `para-parties`, `para-communities`
2. **Push notifications:** Configurar Expo Push para alertas de cabildeo (fase changes, votación cerca de deadline)
3. **Analytics:** Agregar event tracking para votos, delegaciones y navegación por fase
4. **i18n:** Traducir posiciones y argumentos de cabildeo (actualmente en español, frontend usa Lingui)
5. **Performance:** El seed de 200+ votos toma ~30s en indexar; considerar batching para seeds más grandes
