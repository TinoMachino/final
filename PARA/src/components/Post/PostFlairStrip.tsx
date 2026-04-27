import {StyleSheet, View} from 'react-native'

import {type PostBadge} from '#/lib/post-flairs'
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

export function PostFlairStrip({
  badges,
  compact = false,
  showHeader = false,
}: PostFlairStripProps) {
  const t = useTheme()

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

          return (
            <View
              key={badge.key}
              style={[
                styles.badgeRow,
                compact ? styles.badgeRowCompact : styles.badgeRowRegular,
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
                    backgroundColor: badge.bgColor,
                    borderColor: `${badge.color}40`,
                  },
                ]}>
                <Text
                  style={[
                    compact ? styles.labelCompact : styles.labelRegular,
                    {
                      color: badge.color,
                    },
                  ]}>
                  {badge.label}
                </Text>
              </View>
            </View>
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
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
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
