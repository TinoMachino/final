import {
  parseTag,
  POST_FLAIRS,
  POST_TYPES,
  type PostFlair,
  type PostType,
} from '#/lib/tags'

export interface CustomPostFlair {
  id: string
  label: string
  tag: string
  color?: string
  category?: string
}

export type ComposerFlair = PostFlair | CustomPostFlair

export interface PostBadge {
  key: string
  label: string
  color: string
  bgColor: string
  kind: 'policy' | 'matter' | 'postType'
  isOfficial?: boolean
}

type PostBadgeRecord = {
  flairs?: string[]
  tags?: string[]
  postType?: string | null
}

const DEFAULT_POLICY_COLOR = '#474652'
const DEFAULT_MATTER_COLOR = '#6B7280'

function normalizeTag(tag: string) {
  const parsed = parseTag(tag)
  return parsed.type ? `#${parsed.type}` : tag
}

function titleCaseTagLabel(label: string) {
  return label
    .replace(/^#/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
}

export function isPolicyFlair(flair: {id: string}) {
  return flair.id.startsWith('policy_')
}

export function findPostTypeById(id?: string | null): PostType | undefined {
  if (!id || id === 'none') return undefined
  return Object.values(POST_TYPES).find(pt => pt.id === id)
}

export function applyOfficialToFlairTag(tag: string, isOfficial: boolean) {
  if (tag.startsWith('||#')) {
    return isOfficial ? tag : `|#${tag.slice(3)}`
  }
  if (tag.startsWith('|#')) {
    return isOfficial ? `||#${tag.slice(2)}` : tag
  }
  return tag
}

export function applyOfficialToFlair<T extends ComposerFlair>(
  flair: T,
  isOfficial: boolean,
): T {
  return {
    ...flair,
    tag: applyOfficialToFlairTag(flair.tag, isOfficial),
  }
}

export function normalizeComposerFlairs(
  flairs: ComposerFlair[],
): ComposerFlair[] {
  let policy: ComposerFlair | undefined
  let matter: ComposerFlair | undefined

  for (const flair of flairs) {
    if (isPolicyFlair(flair)) {
      policy = flair
    } else {
      matter = flair
    }
  }

  return [policy, matter].filter(Boolean) as ComposerFlair[]
}

export function derivePostTypeId(post: {
  flairs?: ComposerFlair[]
  postType?: PostType | null
}) {
  if (post.postType?.id && post.postType.id !== 'none') {
    return post.postType.id
  }

  if (!post.flairs?.length) {
    return undefined
  }

  return post.flairs.some(isPolicyFlair) ? 'policy' : 'matter'
}

function resolveBadgeFromTag(
  tag: string,
  fallbackKind?: 'policy' | 'matter',
): PostBadge | undefined {
  const parsed = parseTag(tag)
  const matched = Object.values(POST_FLAIRS).find(
    flair => normalizeTag(flair.tag) === normalizeTag(tag),
  )

  const kind = matched
    ? isPolicyFlair(matched)
      ? 'policy'
      : 'matter'
    : parsed.type === 'Policy'
      ? 'policy'
      : parsed.type === 'Matter'
        ? 'matter'
        : fallbackKind

  if (!kind) {
    return undefined
  }

  const color =
    matched?.color ||
    (kind === 'policy' ? DEFAULT_POLICY_COLOR : DEFAULT_MATTER_COLOR)
  const label = matched?.label || titleCaseTagLabel(parsed.type ?? tag)

  return {
    key: `${kind}:${normalizeTag(tag)}`,
    label,
    color,
    bgColor: `${color}20`,
    kind,
    isOfficial: parsed.isOfficial,
  }
}

export function getPostBadges(record: PostBadgeRecord): PostBadge[] {
  const badges: PostBadge[] = []
  const seen = new Set<string>()
  const flairTags =
    record.flairs?.filter(Boolean) ||
    record.tags?.filter(tag => tag.startsWith('|#') || tag.startsWith('||#')) ||
    []

  const fallbackKind =
    record.postType === 'policy' || record.postType === 'matter'
      ? record.postType
      : undefined

  for (const tag of flairTags) {
    const badge = resolveBadgeFromTag(tag, fallbackKind)
    if (!badge || seen.has(badge.kind)) {
      continue
    }
    seen.add(badge.kind)
    badges.push(badge)
  }

  if (badges.length === 0 && fallbackKind) {
    const fallbackTag = flairTags[0]
    const parsed = fallbackTag
      ? parseTag(fallbackTag)
      : {isOfficial: false, type: null}
    const label = `${parsed.isOfficial ? 'Official' : 'Community'} ${
      fallbackKind === 'policy' ? 'Policy' : 'Matter'
    }`
    const color =
      fallbackKind === 'policy' ? DEFAULT_POLICY_COLOR : DEFAULT_MATTER_COLOR
    badges.push({
      key: `${fallbackKind}:generic`,
      label,
      color,
      bgColor: `${color}20`,
      kind: fallbackKind,
      isOfficial: parsed.isOfficial,
    })
  }

  const postType = findPostTypeById(record.postType)
  if (postType) {
    badges.push({
      key: `postType:${postType.id}`,
      label: postType.label,
      color: postType.color,
      bgColor: `${postType.color}20`,
      kind: 'postType',
    })
  }

  return badges
}

export function isPolicyPostRecord(record: PostBadgeRecord) {
  if (record.postType === 'policy') {
    return true
  }

  const flairTags =
    record.flairs?.filter(Boolean) ||
    record.tags?.filter(tag => tag.startsWith('|#') || tag.startsWith('||#')) ||
    []

  return flairTags.some(tag => {
    const badge = resolveBadgeFromTag(tag, 'policy')
    return badge?.kind === 'policy'
  })
}
