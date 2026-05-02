import {StyleSheet, TouchableOpacity, View} from 'react-native'
import {LinearGradient} from 'expo-linear-gradient'
import {Trans} from '@lingui/react/macro'

import {getPartyNinthId} from '#/lib/compass/party-distributions'
import {
  COMPASS_ID_TO_NINTH_NAME,
  NINTH_NAME_TO_COMPASS_ID,
  type PoliticalAffiliation,
} from '#/lib/political-affiliations'
import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'

const MINI_GRID_COLORS = [
  ['#efb9bb', ['#efb9bb', '#99d0ea'], '#99d0ea'],
  [['#efb9bb', '#c7e4c2'], '#efe7d6', ['#99d0ea', '#f6efb3']],
  ['#c7e4c2', ['#c7e4c2', '#f6efb3'], '#f6efb3'],
]

const NINTH_COMPASS_IDS = [
  'auth-left',
  'auth-center',
  'auth-right',
  'center-left',
  'center',
  'center-right',
  'lib-left',
  'lib-center',
  'lib-right',
]

function getExplicitNinthId(
  affiliations: PoliticalAffiliation[],
): string | null {
  const ninth = affiliations.find(a => a.type === 'ninth')
  if (ninth) {
    return NINTH_NAME_TO_COMPASS_ID[ninth.name] || null
  }
  const tf = affiliations.find(a => a.type === 'twentyFifth')
  if (tf) {
    const match = tf.id.match(/twenty-fifth-(\d+)-(\d+)/)
    if (match) {
      const row = parseInt(match[1], 10)
      const col = parseInt(match[2], 10)
      const parentRow = Math.floor(row / 2)
      const parentCol = Math.floor(col / 2)
      return NINTH_COMPASS_IDS[parentRow * 3 + parentCol] || null
    }
  }
  return null
}

function getDisplayedNinthId(
  affiliations: PoliticalAffiliation[],
): string | null {
  const explicit = getExplicitNinthId(affiliations)
  if (explicit) return explicit
  // Fallback: derive from party's predominant ninth
  const party = affiliations.find(a => a.type === 'party')
  if (party) {
    return getPartyNinthId(party.id)
  }
  return null
}

export function CompassMini({
  affiliations,
  onPress,
  size = 78,
  compact = false,
}: {
  affiliations: PoliticalAffiliation[]
  onPress?: () => void
  size?: number
  compact?: boolean
}) {
  const t = useTheme()
  const explicitNinthId = getExplicitNinthId(affiliations)
  const displayedNinthId = getDisplayedNinthId(affiliations)
  const partyAffiliations = affiliations.filter(a => a.type === 'party')
  const hasPosition = explicitNinthId !== null

  const grid = (
    <View style={[styles.grid, {width: size, height: size}]}>
      {MINI_GRID_COLORS.map((row, rowIdx) => (
        <View key={rowIdx} style={styles.row}>
          {row.map((color, colIdx) => {
            const id = NINTH_COMPASS_IDS[rowIdx * 3 + colIdx]
            const isActive = id === displayedNinthId
            return (
              <View
                key={colIdx}
                style={[
                  styles.cell,
                  isActive && {
                    transform: [{scale: 1.15}],
                    borderWidth: 2,
                    borderColor: Array.isArray(color) ? color[0] : color,
                    shadowColor: Array.isArray(color) ? color[0] : color,
                    shadowOffset: {width: 0, height: 0},
                    shadowOpacity: 0.5,
                    shadowRadius: 6,
                    elevation: 6,
                    zIndex: 1,
                  },
                  !hasPosition && {opacity: 0.5},
                ]}>
                {Array.isArray(color) ? (
                  <LinearGradient
                    colors={color as unknown as readonly [string, string, ...string[]]}
                    start={rowIdx === 0 || rowIdx === 2 ? {x: 0, y: 0.5} : {x: 0.5, y: 0}}
                    end={rowIdx === 0 || rowIdx === 2 ? {x: 1, y: 0.5} : {x: 0.5, y: 1}}
                    style={StyleSheet.absoluteFill}
                  />
                ) : (
                  <View
                    style={[StyleSheet.absoluteFill, {backgroundColor: color}]}
                  />
                )}
                {isActive && (
                  <View
                    style={[
                      StyleSheet.absoluteFill,
                      {borderWidth: 2, borderColor: '#ffffff80'},
                    ]}
                  />
                )}
              </View>
            )
          })}
        </View>
      ))}
    </View>
  )

  const partyDots = partyAffiliations.length > 0 && (
    <View style={styles.partyDots}>
      {partyAffiliations.slice(0, 3).map((p, i) => (
        <View
          key={p.id}
          style={[
            styles.partyDot,
            {
              backgroundColor: p.color,
              marginLeft: i > 0 ? -6 : 0,
              borderColor: t.atoms.bg.backgroundColor || '#fff',
            },
          ]}
        />
      ))}
    </View>
  )

  const positionLabel = (() => {
    const party = affiliations.find(a => a.type === 'party')
    const ninthName = displayedNinthId
      ? COMPASS_ID_TO_NINTH_NAME[displayedNinthId]
      : null
    if (ninthName && party) return `${ninthName} • ${party.name}`
    if (ninthName) return ninthName
    if (party) return party.name
    return 'Set position'
  })()

  if (compact) {
    return (
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Ver posición política"
        accessibilityHint="Navega a la pantalla de detalle de tu posición política"
        onPress={onPress}>
        <View style={[a.align_center, a.gap_xs]}>
          {grid}
          {partyDots}
          <Text
            style={[
              a.text_xs,
              a.font_bold,
              t.atoms.text_contrast_medium,
              {fontSize: 9, marginTop: 2},
            ]}
            numberOfLines={1}>
            {positionLabel}
          </Text>
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel="Ver posición política"
      accessibilityHint="Navega a la pantalla de detalle de tu posición política"
      style={[styles.card, {gap: 14}]}
      onPress={onPress}>
      <View style={[a.align_center, a.gap_xs]}>
        {grid}
        {partyDots}
      </View>

      <View style={styles.info}>
        <Text style={[styles.label, t.atoms.text_contrast_medium]}>
          <Trans>Posición política</Trans>
        </Text>
        <Text style={[styles.value, t.atoms.text]} numberOfLines={1}>
          {affiliations.length > 0
            ? affiliations.map(a => a.name).join(' • ')
            : 'No configurada'}
        </Text>
        <Text style={[styles.link, {color: t.palette.primary_500}]}>
          <Trans>Editar →</Trans>
        </Text>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  grid: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
  },
  row: {
    flexDirection: 'row',
    flex: 1,
  },
  cell: {
    flex: 1,
    margin: 0.5,
  },
  cellActive: {
    transform: [{scale: 1.15}],
    zIndex: 1,
  },
  partyDots: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  partyDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  link: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 6,
  },
})
