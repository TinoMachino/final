/**
 * Electoral Districts Data for Mexico
 * All 300 federal electoral districts (distritos electorales federales).
 *
 * This is static seed/reference data. Each district includes placeholder
 * demographic and political data for demo purposes.
 */

import {normalizeMexicoStateName} from '#/lib/constants/mexico'

// ─── Types ───────────────────────────────────────────────────────

export interface ElectoralDistrict {
  /** Global sequential ID, 1–300 */
  id: number
  /** Stable join key for future boundary/centroid data */
  districtKey: string
  /** District number within the state (e.g. 3) */
  districtNumber: number
  /** Parent state name, matching GeoJSON state_name */
  stateName: string
  /** e.g. "Distrito 3, Jalisco" */
  displayName: string
  /** Registered voters (seed placeholder) */
  registeredVoters: number
  /** Turnout percentage from last election */
  turnout: number
  /** Dominant party from last election */
  dominantParty: string
  /** Current federal deputy name (seed placeholder) */
  currentDeputy: string
  /** Deputy's party */
  deputyParty: string
  /** Accent color derived from dominant party */
  accent: string
  /** Optional future-ready visual metadata */
  centroid?: {latitude: number; longitude: number}
  boundaryId?: string
}

export function districtKeyFor(stateName: string, districtNumber: number) {
  return `${normalizeMexicoStateName(stateName)}:${districtNumber}`
}

// ─── Party helpers ───────────────────────────────────────────────

const PARTY_PALETTE: Record<string, string> = {
  Morena: '#8B1538',
  PAN: '#003087',
  PRI: '#00923F',
  MC: '#FF6B00',
  PVEM: '#228B22',
  PT: '#FF0000',
  PRD: '#FFD700',
}

function partyAccent(party: string): string {
  return PARTY_PALETTE[party] || '#6B7280'
}

// Simple seeded pseudo-random for consistent data across renders
function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return s / 2147483647
  }
}

// ─── State → district count mapping ─────────────────────────────

const STATE_DISTRICT_COUNTS: [string, number][] = [
  ['Aguascalientes', 3],
  ['Baja California', 9],
  ['Baja California Sur', 2],
  ['Campeche', 2],
  ['Chiapas', 12],
  ['Chihuahua', 9],
  ['Ciudad de México', 24],
  ['Coahuila', 7],
  ['Colima', 2],
  ['Durango', 4],
  ['Guanajuato', 14],
  ['Guerrero', 8],
  ['Hidalgo', 7],
  ['Jalisco', 19],
  ['Estado de México', 41],
  ['Michoacán', 12],
  ['Morelos', 5],
  ['Nayarit', 3],
  ['Nuevo León', 14],
  ['Oaxaca', 9],
  ['Puebla', 16],
  ['Querétaro', 5],
  ['Quintana Roo', 4],
  ['San Luis Potosí', 7],
  ['Sinaloa', 8],
  ['Sonora', 7],
  ['Tabasco', 6],
  ['Tamaulipas', 9],
  ['Tlaxcala', 3],
  ['Veracruz', 20],
  ['Yucatán', 5],
  ['Zacatecas', 4],
]

// State-level party leanings for realistic distribution
const STATE_PARTY_LEAN: Record<string, string[]> = {
  Aguascalientes: ['PAN', 'Morena', 'PRI'],
  'Baja California': ['Morena', 'PAN', 'MC'],
  'Baja California Sur': ['Morena', 'PAN'],
  Campeche: ['Morena', 'PRI'],
  Chiapas: ['Morena', 'PVEM', 'PRI'],
  Chihuahua: ['PAN', 'Morena', 'PRI'],
  'Ciudad de México': ['Morena', 'PAN', 'MC', 'PRD'],
  Coahuila: ['PRI', 'Morena', 'PAN'],
  Colima: ['Morena', 'PAN'],
  Durango: ['PAN', 'PRI', 'Morena'],
  Guanajuato: ['PAN', 'Morena', 'PRI'],
  Guerrero: ['Morena', 'PRI', 'PRD'],
  Hidalgo: ['Morena', 'PRI', 'PAN'],
  Jalisco: ['MC', 'Morena', 'PAN'],
  'Estado de México': ['Morena', 'PAN', 'PRI', 'MC'],
  Michoacán: ['Morena', 'PRI', 'PRD'],
  Morelos: ['Morena', 'PAN', 'MC'],
  Nayarit: ['Morena', 'PAN'],
  'Nuevo León': ['MC', 'PAN', 'Morena', 'PRI'],
  Oaxaca: ['Morena', 'PRI', 'PRD'],
  Puebla: ['Morena', 'PAN', 'PRI'],
  Querétaro: ['PAN', 'Morena', 'PRI'],
  'Quintana Roo': ['Morena', 'PAN', 'PRI'],
  'San Luis Potosí': ['Morena', 'PAN', 'PRI'],
  Sinaloa: ['Morena', 'PAN', 'PRI'],
  Sonora: ['Morena', 'PAN', 'PRI'],
  Tabasco: ['Morena', 'PT', 'PRI'],
  Tamaulipas: ['PAN', 'Morena', 'PRI'],
  Tlaxcala: ['Morena', 'PAN', 'PRI'],
  Veracruz: ['Morena', 'PAN', 'PRI', 'PVEM'],
  Yucatán: ['PAN', 'Morena', 'PRI'],
  Zacatecas: ['Morena', 'PAN', 'PRI'],
}

// Seed deputy names pool (generic Mexican names for demo)
const FIRST_NAMES = [
  'Alejandro', 'María', 'Carlos', 'Ana', 'José', 'Laura', 'Miguel',
  'Gabriela', 'Roberto', 'Patricia', 'Fernando', 'Claudia', 'Ricardo',
  'Mónica', 'Luis', 'Verónica', 'Juan', 'Sofía', 'Pedro', 'Carmen',
  'Diego', 'Elena', 'Andrés', 'Isabel', 'Marco', 'Teresa', 'Arturo',
  'Leticia', 'Enrique', 'Diana', 'Raúl', 'Mariana', 'Óscar', 'Adriana',
  'Rafael', 'Silvia', 'Sergio', 'Lucía', 'Pablo', 'Regina',
]

const LAST_NAMES = [
  'García', 'López', 'Hernández', 'Martínez', 'González', 'Pérez',
  'Rodríguez', 'Sánchez', 'Ramírez', 'Torres', 'Flores', 'Rivera',
  'Gómez', 'Díaz', 'Cruz', 'Morales', 'Reyes', 'Gutiérrez', 'Ortiz',
  'Ruiz', 'Jiménez', 'Mendoza', 'Aguilar', 'Castillo', 'Vargas',
  'Romero', 'Vázquez', 'Herrera', 'Medina', 'Castro', 'Delgado',
  'Ríos', 'Fuentes', 'Cervantes', 'Salazar', 'Contreras', 'Ibarra',
  'Navarro', 'Estrada', 'Campos',
]

// ─── Generate all 300 districts ─────────────────────────────────

function generateDistricts(): ElectoralDistrict[] {
  const districts: ElectoralDistrict[] = []
  let globalId = 1
  const rng = seededRandom(42)

  for (const [stateName, count] of STATE_DISTRICT_COUNTS) {
    const parties = STATE_PARTY_LEAN[stateName] || ['Morena', 'PAN', 'PRI']

    for (let d = 1; d <= count; d++) {
      const partyIdx = Math.floor(rng() * parties.length)
      const dominantParty = parties[partyIdx]

      // Deputy may be same party or occasionally different
      const deputyPartyIdx = rng() > 0.2 ? partyIdx : Math.floor(rng() * parties.length)
      const deputyParty = parties[deputyPartyIdx]

      const firstIdx = Math.floor(rng() * FIRST_NAMES.length)
      const lastIdx1 = Math.floor(rng() * LAST_NAMES.length)
      const lastIdx2 = Math.floor(rng() * LAST_NAMES.length)
      const deputyName = `${FIRST_NAMES[firstIdx]} ${LAST_NAMES[lastIdx1]} ${LAST_NAMES[lastIdx2]}`

      const registeredVoters = Math.floor(180_000 + rng() * 320_000)
      const turnout = Math.round((40 + rng() * 30) * 10) / 10

      districts.push({
        id: globalId,
        districtKey: districtKeyFor(stateName, d),
        districtNumber: d,
        stateName,
        displayName: `Distrito ${d}, ${stateName}`,
        registeredVoters,
        turnout,
        dominantParty,
        currentDeputy: deputyName,
        deputyParty,
        accent: partyAccent(dominantParty),
      })

      globalId++
    }
  }

  return districts
}

export const ELECTORAL_DISTRICTS: ElectoralDistrict[] = generateDistricts()

// ─── Lookup helpers ─────────────────────────────────────────────

const _byState = new Map<string, ElectoralDistrict[]>()
const _byId = new Map<number, ElectoralDistrict>()
const _byKey = new Map<string, ElectoralDistrict>()

for (const d of ELECTORAL_DISTRICTS) {
  _byId.set(d.id, d)
  _byKey.set(d.districtKey, d)
  const stateKey = normalizeMexicoStateName(d.stateName)
  const arr = _byState.get(stateKey)
  if (arr) {
    arr.push(d)
  } else {
    _byState.set(stateKey, [d])
  }
}

export function getDistrictsByState(stateName: string): ElectoralDistrict[] {
  return _byState.get(normalizeMexicoStateName(stateName)) || []
}

export function getDistrictById(id: number): ElectoralDistrict | undefined {
  return _byId.get(id)
}

export function getDistrictByKey(
  districtKey: string,
): ElectoralDistrict | undefined {
  return _byKey.get(districtKey)
}

/**
 * Returns all unique state names that have districts, in order.
 */
export function getDistrictStateNames(): string[] {
  return STATE_DISTRICT_COUNTS.map(([name]) => name)
}
