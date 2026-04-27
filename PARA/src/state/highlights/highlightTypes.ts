/**
 * Highlight data types for the text highlighting feature
 */

/**
 * Available highlight colors
 */
export const HIGHLIGHT_COLORS = {
  yellow: '#FEF08A',
  green: '#BBF7D0',
  blue: '#BAE6FD',
  pink: '#FECDD3',
  purple: '#DDD6FE',
  orange: '#FED7AA',
} as const

export type HighlightColorKey = keyof typeof HIGHLIGHT_COLORS
export type HighlightColor = (typeof HIGHLIGHT_COLORS)[HighlightColorKey]

/**
 * Represents a saved highlight on a post
 */
export interface HighlightData {
  id: string
  postUri: string
  start: number
  end: number
  color: HighlightColor
  tag?: string
  isPublic: boolean
  text: string
  createdAt: number
  syncedAt?: number
  creatorDid?: string
}

/**
 * Pending highlight during selection (before color/tag assignment)
 */
export interface PendingHighlight {
  start: number
  end: number
}

/**
 * Highlight mode state
 */
export interface HighlightModeState {
  isActive: boolean
  postUri: string | null
  pendingHighlight: PendingHighlight | null
}
