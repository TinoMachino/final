import {StyleSheet, TouchableOpacity, View} from 'react-native'
import {Trans} from '@lingui/react/macro'

import {
  COMPASS_ID_TO_NINTH_NAME,
  NINTH_NAME_TO_COMPASS_ID,
  type PoliticalAffiliation,
} from '#/lib/political-affiliations'
import {getPartyNinthId} from '#/lib/compass/party-distributions'
import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'

const MINI_GRID_COLORS = [
  ['#efb9bb', '#cda7d8', '#99d0ea'],
  ['#d8d9be', '#efe7d6', '#bfd7e8'],
  ['#c7e4c2', '#dfe498', '#f6efb3'],
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

function getExplicitNinthId(affiliations: PoliticalAffiliation[]): string | null {
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

function getDisplayedNinthId(affiliations: PoliticalAffiliation[]): string | null {
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
  onPress: () => void
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
                  {backgroundColor: color},
                  isActive && styles.cellActive,
                  !hasPosition && {opacity: 0.5},
                ]}
              />
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
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
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
