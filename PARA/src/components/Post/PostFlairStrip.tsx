import {useCallback} from 'react'
import {Pressable, StyleSheet, View} from 'react-native'
import {useNavigation} from '@react-navigation/native'

import {type PostBadge} from '#/lib/post-flairs'
import {type NavigationProp} from '#/lib/routes/types'
import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'

type PostFlairStripProps = {
  badges: PostBadge[]
  compact?: boolean
  showHeader?: boolean
}

function getBadgeDescriptor(badge: PostBadge) {
  if (badge.kind === 'postType') {
    return null
  }

  return {
    marker: badge.kind === 'policy' ? '||' : '|',
  }
}

function isBadgeNavigable(badge: PostBadge): boolean {
  // postType badges (Meme, RAQ, etc.) are decorative only
  if (badge.kind === 'postType') return false
  // Generic fallback badges have no specific tag to filter by
  if (!badge.tag || badge.key.endsWith(':generic')) return false
  return true
}

function useFlairPress() {
  const navigation = useNavigation<NavigationProp>()

  return useCallback(
    (badge: PostBadge) => {
      if (!isBadgeNavigable(badge)) return

      navigation.navigate('FlairFeed', {
        flairId: badge.flairId ?? badge.key,
        flairTag: badge.tag!,
        flairLabel: badge.label,
        kind: badge.kind as 'matter' | 'policy',
        color: badge.color,
        isOfficial: badge.isOfficial,
      })
    },
    [navigation],
  )
}

export function PostFlairStrip({
  badges,
  compact = false,
  showHeader = false,
}: PostFlairStripProps) {
  const t = useTheme()
  const onPressBadge = useFlairPress()

  if (!badges.length) {
    return null
  }

  return (
    <View style={[showHeader && a.gap_xs]}>
      {showHeader ? (
        <Text style={[a.text_xs, a.font_bold, t.atoms.text_contrast_medium]}>
          Flairs
        </Text>
      ) : null}
      <View
        style={[
          styles.wrap,
          compact ? styles.wrapCompact : styles.wrapSpacious,
        ]}>
        {badges.map(badge => {
          const descriptor = getBadgeDescriptor(badge)
          const isNavigable = isBadgeNavigable(badge)

          return (
            <Pressable
              key={badge.key}
              onPress={() => onPressBadge(badge)}
              disabled={!isNavigable}
              accessible={isNavigable}
              accessibilityRole={isNavigable ? 'button' : undefined}
              accessibilityLabel={
                isNavigable ? `Ver posts sobre ${badge.label}` : badge.label
              }
              style={({pressed}) => [
                styles.badgeRow,
                compact ? styles.badgeRowCompact : styles.badgeRowRegular,
                isNavigable && pressed && styles.badgeRowPressed,
              ]}>
              {descriptor ? (
                <View
                  style={[
                    styles.sigRail,
                    compact ? styles.sigRailCompact : styles.sigRailRegular,
                    t.atoms.border_contrast_low,
                    t.atoms.bg_contrast_25,
                  ]}>
                  <Text
                    style={[
                      styles.sigMarker,
                      compact && styles.sigMarkerCompact,
                      t.atoms.text_contrast_medium,
                    ]}>
                    {descriptor.marker}
                  </Text>
                </View>
              ) : null}
              <View
                style={[
                  styles.pill,
                  compact ? styles.pillCompact : styles.pillRegular,
                  {
                    backgroundColor: badge.color,
                  },
                ]}>
                <Text
                  style={[
                    compact ? styles.labelCompact : styles.labelRegular,
                    {
                      color: '#FFFFFF',
                    },
                  ]}>
                  {badge.label}
                </Text>
              </View>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  wrapCompact: {
    gap: 6,
  },
  wrapSpacious: {
    gap: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeRowCompact: {
    gap: 4,
  },
  badgeRowRegular: {
    gap: 6,
  },
  badgeRowPressed: {
    opacity: 0.7,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
  },
  pillCompact: {
    paddingVertical: 4,
    paddingLeft: 9,
    paddingRight: 9,
  },
  pillRegular: {
    paddingVertical: 5,
    paddingLeft: 11,
    paddingRight: 11,
  },
  sigRail: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
  },
  sigRailCompact: {
    paddingHorizontal: 5,
    paddingVertical: 4,
  },
  sigRailRegular: {
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  sigMarker: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  sigMarkerCompact: {
    fontSize: 9,
  },
  sigLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.35,
    marginLeft: 4,
  },
  labelCompact: {
    fontSize: 11,
    fontWeight: '700',
  },
  labelRegular: {
    fontSize: 12,
    fontWeight: '700',
  },
})
