/**
 * MVP community estandarte color mappings.
 * Each community can define 1–3 colors for its heraldic banner.
 *
 * Post-MVP: these should come from the community record in the database
 * (e.g. `para_community_board.estandarteColors`).
 */

export type EstandarteColors = string[]

const DEFAULT_ESTANDARTE: EstandarteColors = ['#888888']

/**
 * Demo community color assignments.
 * Parties get their official color + a secondary accent.
 * Local communities get thematic colors.
 */
const COMMUNITY_ESTANDARTES: Record<string, EstandarteColors> = {
  // National parties
  morena: ['#610200', '#8B0000', '#B01021'],
  pan: ['#004990', '#005595', '#005EB8'],
  pri: ['#CE1126', '#CC0000', '#9B1B30'],
  pt: ['#D92027', '#B91C22'],
  mc: ['#FF8300', '#FF8200', '#FF6600'],
  pvem: ['#50B747', '#00AA00'],
  prd: ['#FFCD00', '#FFD700'],

  // Demo local communities
  'presupuesto participativo centro': ['#005EB8', '#00A3E0'],
  'movilidad sostenible norte': ['#34C759', '#007AFF'],
  'educación y cultura sur': ['#AF52DE', '#FF9500'],
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/**
 * Get estandarte colors for a community by name.
 * Falls back to a single grey color if unknown.
 */
export function getCommunityEstandarte(name: string): EstandarteColors {
  const slug = slugify(name)
  const direct = COMMUNITY_ESTANDARTES[slug]
  if (direct) return direct

  // Try partial match
  for (const [key, colors] of Object.entries(COMMUNITY_ESTANDARTES)) {
    if (slug.includes(key) || key.includes(slug)) {
      return colors
    }
  }

  return DEFAULT_ESTANDARTE
}

/**
 * Derive a simple estandarte from a single hex color.
 * Creates a 2-color estandarte with the color + a darkened variant.
 */
export function estandarteFromColor(baseColor: string): EstandarteColors {
  return [baseColor, darkenColor(baseColor, 20)]
}

function darkenColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.max((num >> 16) - amount, 0)
  const g = Math.max(((num >> 8) & 0x00ff) - amount, 0)
  const b = Math.max((num & 0x0000ff) - amount, 0)
  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`
}
