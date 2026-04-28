import {RichText as RichTextAPI} from '@atproto/api'

import {inferPoliticalAffiliation} from '#/lib/political-affiliations'

export type PartyShieldInfo = {
  abbreviation: string
  color: string
  name: string
}

const PARTY_PREFIX_REGEX = /^\[([^\]]+)\]\s*/

/**
 * Extract a party shield from the beginning of post text.
 * PARA demo posts prefix the party as `[MC] Title...` or `[PT] Title...`.
 */
export function extractPartyShield(
  text: string,
): {shield: PartyShieldInfo | null; textWithoutPrefix: string} {
  const match = text.match(PARTY_PREFIX_REGEX)
  if (!match) {
    return {shield: null, textWithoutPrefix: text}
  }

  const abbreviation = match[1].trim()
  const affiliation = inferPoliticalAffiliation(abbreviation)

  if (!affiliation) {
    return {shield: null, textWithoutPrefix: text}
  }

  const textWithoutPrefix = text.slice(match[0].length)

  return {
    shield: {
      abbreviation,
      color: affiliation.color,
      name: affiliation.name,
    },
    textWithoutPrefix,
  }
}

/**
 * Check if post text starts with a party prefix like `[MC]`.
 */
export function hasPartyPrefix(text: string): boolean {
  return PARTY_PREFIX_REGEX.test(text)
}

/**
 * Create a display RichText with the party prefix stripped.
 * Adjusts facet byte offsets to account for the removed prefix.
 */
export function createDisplayRichText(
  original: RichTextAPI,
): {richText: RichTextAPI; prefixLength: number} {
  const text = original.text
  const match = text.match(PARTY_PREFIX_REGEX)
  if (!match) {
    return {richText: original, prefixLength: 0}
  }

  const prefixLength = match[0].length
  const displayText = text.slice(prefixLength)

  // Adjust facets: shift all byte offsets back by prefix length
  const adjustedFacets = original.facets
    ?.map(facet => ({
      ...facet,
      index: {
        byteStart: Math.max(0, facet.index.byteStart - prefixLength),
        byteEnd: Math.max(0, facet.index.byteEnd - prefixLength),
      },
    }))
    .filter(facet => facet.index.byteEnd > 0)

  return {
    richText: new RichTextAPI({text: displayText, facets: adjustedFacets}),
    prefixLength,
  }
}
