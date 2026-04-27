import {type CabildeoReadView} from '#/lib/api/cabildeo'
import {COMMUNITY_DATA} from '#/lib/constants/mockData'
import {
  formatCommunityName,
  normalizeCommunityPlainName,
  normalizeCommunitySlug,
} from '#/lib/strings/community-names'
import {POST_FLAIRS} from '#/lib/tags'

const DEFAULT_ENTITIES = ['p/Jalisco', 'p/CDMX'] as const

const ENTITY_ALIASES: Record<string, string> = {
  PRI: 'p/PRI',
  PAN: 'p/PAN',
  MORENA: 'p/Morena',
  MC: 'p/MC',
  PVEM: 'p/PVEM',
  DERECHA: 'p/PAN',
  IZQUIERDA: 'p/Morena',
}

const PHASE_LABELS: Record<string, string> = {
  draft: 'Borrador',
  open: 'Abierto',
  deliberating: 'Deliberando',
  voting: 'Votacion',
  resolved: 'Resuelto',
}

export type VsTopicFilter = {
  key: string
  label: string
}

export type VsEntitySummary = {
  name: string
  plainName: string
  initials: string
  color: string
  accent: string
  subtitle: string
  description: string
  debateCount: number
  activeCount: number
  sharedCount: number
  participationTotal: number
  consensusRate: number
  participationShare: number
}

export type VsDebateCard = {
  uri: string
  title: string
  description: string
  community: string
  communityColor: string
  phase: string
  phaseLabel: string
  createdAt: string
  createdLabel: string
  flairs: string[]
  topics: string[]
  relevantEntities: string[]
  totalVotes: number
  totalPositions: number
  participationTotal: number
  consensusRate: number
  consensusLabel: string
  leadingLabel: string
  leadingMetricLabel: string
}

export type VsScreenViewModel = {
  entities: [VsEntitySummary, VsEntitySummary]
  topics: VsTopicFilter[]
  selectedTopic: string
  recent: VsDebateCard[]
  popular: VsDebateCard[]
  totalRelevant: number
}

export function resolveVsEntities(
  input: string[] | undefined,
): [string, string] {
  const normalized = (input || [])
    .map(value => normalizeVsEntity(value))
    .filter((value): value is string => Boolean(value))

  if (normalized.length >= 2) {
    return [normalized[0], normalized[1]]
  }

  if (normalized.length === 1) {
    const fallback = DEFAULT_ENTITIES.find(item => item !== normalized[0])
    return [normalized[0], fallback || DEFAULT_ENTITIES[1]]
  }

  return [DEFAULT_ENTITIES[0], DEFAULT_ENTITIES[1]]
}

export function resolveInitialVsTopic(value: string | undefined) {
  if (!value) return 'all'
  return classifyTopicKey(value)
}

export function buildVsScreenViewModel({
  cabildeos,
  entities,
  selectedTopic,
}: {
  cabildeos: CabildeoReadView[]
  entities: [string, string]
  selectedTopic: string
}): VsScreenViewModel {
  const relevantDebates = cabildeos
    .filter(cabildeo => entities.some(entity => matchesEntity(cabildeo, entity)))
    .map(cabildeo => mapVsDebateCard(cabildeo, entities))

  const topics = buildTopicFilters(relevantDebates)
  const effectiveTopic = topics.some(topic => topic.key === selectedTopic)
    ? selectedTopic
    : 'all'
  const filteredDebates =
    effectiveTopic === 'all'
      ? relevantDebates
      : relevantDebates.filter(card => card.topics.includes(effectiveTopic))

  const recent = [...filteredDebates]
    .sort((a, b) => compareDatesDesc(a.createdAt, b.createdAt))
    .slice(0, 4)

  const recentUris = new Set(recent.map(item => item.uri))
  const popular = [...filteredDebates]
    .sort((a, b) => {
      if (b.participationTotal !== a.participationTotal) {
        return b.participationTotal - a.participationTotal
      }
      return compareDatesDesc(a.createdAt, b.createdAt)
    })
    .filter(item => !recentUris.has(item.uri))
    .slice(0, 4)

  const entitySummaries = entities.map(entity =>
    summarizeEntity({
      entity,
      entities,
      debates: filteredDebates,
    }),
  ) as [VsEntitySummary, VsEntitySummary]

  const maxParticipation = Math.max(
    entitySummaries[0].participationTotal,
    entitySummaries[1].participationTotal,
    1,
  )

  entitySummaries[0].participationShare =
    entitySummaries[0].participationTotal / maxParticipation
  entitySummaries[1].participationShare =
    entitySummaries[1].participationTotal / maxParticipation

  return {
    entities: entitySummaries,
    topics,
    selectedTopic: effectiveTopic,
    recent,
    popular,
    totalRelevant: filteredDebates.length,
  }
}

function summarizeEntity({
  entity,
  entities,
  debates,
}: {
  entity: string
  entities: [string, string]
  debates: VsDebateCard[]
}): VsEntitySummary {
  const relatedDebates = debates.filter(card =>
    card.relevantEntities.some(name => normalizeCommunitySlug(name) === normalizeCommunitySlug(entity)),
  )
  const activeCount = relatedDebates.filter(card =>
    ['open', 'deliberating', 'voting'].includes(card.phase),
  ).length
  const sharedCount = relatedDebates.filter(card => card.relevantEntities.length > 1)
    .length
  const participationTotal = relatedDebates.reduce(
    (sum, card) => sum + card.participationTotal,
    0,
  )
  const consensusSamples = relatedDebates
    .map(card => card.consensusRate)
    .filter(value => value > 0)
  const consensusRate = consensusSamples.length
    ? consensusSamples.reduce((sum, value) => sum + value, 0) /
      consensusSamples.length
    : 0

  const meta = getCommunityMeta(entity)
  const counterpart = entities.find(item => item !== entity)

  return {
    name: meta.name,
    plainName: meta.plainName,
    initials: meta.initials,
    color: meta.color,
    accent: meta.accent,
    subtitle: meta.subtitle,
    description:
      relatedDebates.length > 0
        ? `${sharedCount} debates shared with ${normalizeCommunityPlainName(counterpart) || 'the network'}.`
        : 'No seeded debates match this entity yet.',
    debateCount: relatedDebates.length,
    activeCount,
    sharedCount,
    participationTotal,
    consensusRate,
    participationShare: 0,
  }
}

function mapVsDebateCard(
  cabildeo: CabildeoReadView,
  entities: [string, string],
): VsDebateCard {
  const topics = dedupe(
    (cabildeo.flairs || []).map(flair => classifyTopicKey(flair)),
  ).filter(Boolean)
  const relevantEntities = entities.filter(entity => matchesEntity(cabildeo, entity))
  const leading = pickLeadingOption(cabildeo)
  const normalizedVotes = cabildeo.voteTotals.total || 0
  const normalizedPositions = cabildeo.positionCounts.total || 0
  const participationTotal = normalizedVotes + normalizedPositions
  const meta = getCommunityMeta(cabildeo.community)

  return {
    uri: cabildeo.uri,
    title: cabildeo.title,
    description: cabildeo.description,
    community: cabildeo.community,
    communityColor: meta.color,
    phase: cabildeo.phase,
    phaseLabel: PHASE_LABELS[cabildeo.phase] || cabildeo.phase,
    createdAt: cabildeo.createdAt,
    createdLabel: formatShortDate(cabildeo.createdAt),
    flairs: cabildeo.flairs || [],
    topics,
    relevantEntities,
    totalVotes: normalizedVotes,
    totalPositions: normalizedPositions,
    participationTotal,
    consensusRate: leading.consensusRate,
    consensusLabel: `${Math.round(leading.consensusRate * 100)}%`,
    leadingLabel: leading.label,
    leadingMetricLabel: leading.metricLabel,
  }
}

function pickLeadingOption(cabildeo: CabildeoReadView) {
  const breakdown = cabildeo.outcomeSummary?.breakdown || []
  if (breakdown.length > 0) {
    const winner = [...breakdown].sort(
      (a, b) => b.votes - a.votes,
    )[0]
    const total = cabildeo.outcomeSummary?.effectiveTotalPower || 0
    return {
      label: winner?.label || 'Sin lider',
      consensusRate: total > 0 ? (winner?.votes || 0) / total : 0,
      metricLabel: `${winner?.votes || 0} votos efectivos`,
    }
  }

  const optionSummary = cabildeo.optionSummary || []
  if (optionSummary.length > 0) {
    const voteWinner = [...optionSummary].sort((a, b) => b.votes - a.votes)[0]
    if (voteWinner && cabildeo.voteTotals.total > 0) {
      return {
        label: voteWinner.label,
        consensusRate: voteWinner.votes / cabildeo.voteTotals.total,
        metricLabel: `${voteWinner.votes} votos`,
      }
    }

    const positionWinner = [...optionSummary].sort(
      (a, b) => b.positions - a.positions,
    )[0]
    if (positionWinner && cabildeo.positionCounts.total > 0) {
      return {
        label: positionWinner.label,
        consensusRate: positionWinner.positions / cabildeo.positionCounts.total,
        metricLabel: `${positionWinner.positions} posiciones`,
      }
    }
  }

  return {
    label: 'Sin actividad',
    consensusRate: 0,
    metricLabel: 'Sin votos',
  }
}

function buildTopicFilters(cards: VsDebateCard[]): VsTopicFilter[] {
  const counts = new Map<string, {label: string; count: number}>()
  for (const card of cards) {
    for (const key of card.topics) {
      const current = counts.get(key)
      if (current) {
        current.count += 1
      } else {
        counts.set(key, {label: labelForTopicKey(key), count: 1})
      }
    }
  }

  const dynamic = [...counts.entries()]
    .sort((a, b) => b[1].count - a[1].count || a[1].label.localeCompare(b[1].label))
    .map(([key, value]) => ({
      key,
      label: value.label,
    }))

  return [{key: 'all', label: 'Todo'}, ...dynamic]
}

function classifyTopicKey(value: string) {
  const normalized = value.trim()
  if (/policy/i.test(normalized)) return 'policy'
  if (/matter/i.test(normalized)) return 'matter'

  const flair = Object.values(POST_FLAIRS).find(item => item.tag === normalized)
  if (flair) return flair.id

  return normalized.toLowerCase()
}

function labelForTopicKey(key: string) {
  if (key === 'all') return 'Todo'
  if (key === 'policy') return 'Policy'
  if (key === 'matter') return 'Matter'

  const flair = Object.values(POST_FLAIRS).find(item => item.id === key)
  if (flair) return flair.label

  return key
    .replace(/^[|#]+/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, letter => letter.toUpperCase())
}

function normalizeVsEntity(value: string | undefined) {
  const raw = (value || '').trim()
  if (!raw) return ''

  const alias = ENTITY_ALIASES[raw.toUpperCase()]
  if (alias) return alias

  return formatCommunityName(raw).displayName
}

function matchesEntity(cabildeo: CabildeoReadView, entity: string) {
  const target = normalizeCommunitySlug(entity)
  const candidates = [cabildeo.community, ...(cabildeo.communities || [])]
  return candidates.some(candidate => normalizeCommunitySlug(candidate) === target)
}

function getCommunityMeta(entity: string) {
  const formatted = formatCommunityName(entity)
  const match = COMMUNITY_DATA.find(
    item =>
      normalizeCommunitySlug(item.communityName) === formatted.slug ||
      normalizeCommunitySlug(item.name) === formatted.slug,
  )

  if (match) {
    return {
      name: match.communityName,
      plainName: match.name,
      initials: buildInitials(match.name),
      color: match.color,
      accent: match.accent || match.color,
      subtitle: match.subtitle || match.eyebrow || 'Community',
    }
  }

  const fallbackColor = colorFromSlug(formatted.slug)
  return {
    name: formatted.displayName,
    plainName: formatted.plainName,
    initials: buildInitials(formatted.plainName),
    color: fallbackColor,
    accent: fallbackColor,
    subtitle: 'Community',
  }
}

function buildInitials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() || '')
    .join('')
}

function colorFromSlug(slug: string) {
  const colors = ['#0F766E', '#1D4ED8', '#B45309', '#9333EA', '#BE123C']
  let hash = 0
  for (const char of slug) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  }
  return colors[hash % colors.length] || colors[0]
}

function formatShortDate(value: string) {
  try {
    return new Intl.DateTimeFormat('es-MX', {
      month: 'short',
      day: 'numeric',
    }).format(new Date(value))
  } catch {
    return value
  }
}

function compareDatesDesc(a: string, b: string) {
  return new Date(b).getTime() - new Date(a).getTime()
}

function dedupe(values: string[]) {
  return [...new Set(values)]
}
