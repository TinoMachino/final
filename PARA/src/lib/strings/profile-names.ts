import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'

export function formatUserDisplayName({
  displayName,
  handle,
  isFigure,
  isGroup = false,
  moderation,
}: {
  displayName?: string | null
  handle: string
  isFigure: boolean
  isGroup?: boolean
  moderation?: Parameters<typeof sanitizeDisplayName>[1]
}) {
  const baseName = sanitizeDisplayName(
    displayName || sanitizeHandle(handle),
    moderation,
  )
  const prefix = isGroup ? 'g/' : isFigure ? 'f/' : 'i/'
  return `${prefix}${baseName}`
}
