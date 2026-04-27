import {useMemo} from 'react'
import {Dimensions, ScrollView, StyleSheet, View} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import Svg, {G, Line, Polygon, Text as SvgText} from 'react-native-svg'
import {Trans} from '@lingui/react/macro'

import {Text} from '#/view/com/util/text/Text'
import {useTheme} from '#/alf'
import * as Layout from '#/components/Layout'
import {
  calculateCompassXY,
  calculateIdeology,
  calculatePartyMatches,
  getNinth,
  NINTHS_COLORS,
} from './logic/scoring'

const {width} = Dimensions.get('window')
const CHART_SIZE = Math.min(width - 40, 350)
const CENTER = CHART_SIZE / 2
const RADIUS = CENTER - 40

export default function RAQResultsScreen({route}: {route: any}) {
  const t = useTheme()

  // Fix: Memoize results to prevent dependency issues
  const results = useMemo(
    () => route.params?.results || [],
    [route.params?.results],
  )

  // Extract scores for the vector [0-100]
  const userVector = useMemo(() => results.map((r: any) => r.score), [results])
  const {primary, secondary} = useMemo(
    () => calculateIdeology(userVector),
    [userVector],
  )
  const {x, y} = useMemo(() => calculateCompassXY(userVector), [userVector])
  const ninthMatch = useMemo(() => getNinth(x, y), [x, y])
  const partyMatches = useMemo(
    () => calculatePartyMatches(userVector),
    [userVector],
  )
  const insets = useSafeAreaInsets()

  // Radar Chart calculation
  const points = useMemo(() => {
    const angleStep = (Math.PI * 2) / 12
    return results
      .map((res: any, i: number) => {
        const angle = i * angleStep - Math.PI / 2
        const r = (res.score / 100) * RADIUS
        // Fix: Rename variables to avoid shadowing
        const pointX = CENTER + r * Math.cos(angle)
        const pointY = CENTER + r * Math.sin(angle)
        return `${pointX},${pointY}`
      })
      .join(' ')
  }, [results])

  const gridCircles = [0.25, 0.5, 0.75, 1]

  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Your Results</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
      </Layout.Header.Outer>

      <ScrollView
        style={[styles.container, t.atoms.bg]}
        contentContainerStyle={{paddingBottom: insets.bottom + 150}}>
        {/* Ideology Hero */}
        <View style={styles.heroSection}>
          <Text style={[styles.ideologyLabel, {color: t.palette.primary_500}]}>
            {primary.name}
          </Text>
          <Text style={[styles.description, t.atoms.text]}>
            {primary.description}
          </Text>
          <Text style={[styles.secondaryMatch, t.atoms.text_contrast_medium]}>
            Secondary alignment: {secondary.name}
          </Text>

          <View
            style={[
              styles.ninthBadge,
              {
                backgroundColor:
                  (NINTHS_COLORS as any)[ninthMatch] || t.palette.primary_500,
              },
            ]}>
            <Text style={styles.ninthBadgeText}>{ninthMatch}</Text>
          </View>
        </View>

        {/* Political Compass (9ths) - MOVED TO TOP */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, t.atoms.text]}>
            Political Compass (9ths)
          </Text>
        </View>
        <View style={styles.compassContainer}>
          <View
            style={[styles.compassGrid, {borderColor: t.palette.contrast_200}]}>
            {/* 3x3 Grid */}
            <View style={styles.gridRow}>
              <View
                style={[
                  styles.gridCell,
                  {backgroundColor: NINTHS_COLORS['Auth Left']},
                ]}
              />
              <View
                style={[
                  styles.gridCell,
                  {backgroundColor: NINTHS_COLORS['Auth Econocenter']},
                ]}
              />
              <View
                style={[
                  styles.gridCell,
                  {backgroundColor: NINTHS_COLORS['Auth Right']},
                ]}
              />
            </View>
            <View style={styles.gridRow}>
              <View
                style={[
                  styles.gridCell,
                  {backgroundColor: NINTHS_COLORS['Center Left']},
                ]}
              />
              <View
                style={[
                  styles.gridCell,
                  {backgroundColor: NINTHS_COLORS['Center Econocenter']},
                ]}
              />
              <View
                style={[
                  styles.gridCell,
                  {backgroundColor: NINTHS_COLORS['Center Right']},
                ]}
              />
            </View>
            <View style={styles.gridRow}>
              <View
                style={[
                  styles.gridCell,
                  {backgroundColor: NINTHS_COLORS['Lib Left']},
                ]}
              />
              <View
                style={[
                  styles.gridCell,
                  {backgroundColor: NINTHS_COLORS['Lib Econocenter']},
                ]}
              />
              <View
                style={[
                  styles.gridCell,
                  {backgroundColor: NINTHS_COLORS['Lib Right']},
                ]}
              />
            </View>

            {/* Labels */}
            <Text style={[styles.compassLabel, styles.labelAuth]}>
              AUTHORITARIAN
            </Text>
            <Text style={[styles.compassLabel, styles.labelLib]}>
              LIBERTARIAN
            </Text>
            <Text style={[styles.compassLabel, styles.labelLeft]}>LEFT</Text>
            <Text style={[styles.compassLabel, styles.labelRight]}>RIGHT</Text>

            {/* Dot */}
            <View
              style={[
                styles.compassDot,
                {
                  left: `${((x + 1) / 2) * 100}%`,
                  top: `${((1 - y) / 2) * 100}%`,
                  borderColor: t.palette.contrast_50,
                },
              ]}
            />
          </View>
        </View>

        {/* Radar Chart - NOW BELOW COMPASS */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, t.atoms.text]}>
            12-Axis Radar Profile
          </Text>
        </View>
        <View style={styles.chartContainer}>
          <Svg width={CHART_SIZE} height={CHART_SIZE}>
            <G>
              {/* Grid Lines */}
              {gridCircles.map(c => {
                const angleStep = (Math.PI * 2) / 12
                const gridPoints = Array.from({length: 12})
                  .map((_, i) => {
                    const angle = i * angleStep - Math.PI / 2
                    const r = c * RADIUS
                    // Fix: Rename variables to avoid shadowing
                    const gridX = CENTER + r * Math.cos(angle)
                    const gridY = CENTER + r * Math.sin(angle)
                    return `${gridX},${gridY}`
                  })
                  .join(' ')
                return (
                  <Polygon
                    key={c}
                    points={gridPoints}
                    fill="none"
                    stroke={t.palette.contrast_100}
                    strokeWidth="1"
                  />
                )
              })}

              {/* Axis Spoke Lines */}
              {Array.from({length: 12}).map((_, i) => {
                const angle = i * ((Math.PI * 2) / 12) - Math.PI / 2
                const x2 = CENTER + RADIUS * Math.cos(angle)
                const y2 = CENTER + RADIUS * Math.sin(angle)
                return (
                  <Line
                    key={i}
                    x1={CENTER}
                    y1={CENTER}
                    x2={x2}
                    y2={y2}
                    stroke={t.palette.contrast_100}
                    strokeWidth="1"
                  />
                )
              })}

              {/* Data Polygon */}
              <Polygon
                points={points}
                fill={t.palette.primary_500}
                fillOpacity={0.3}
                stroke={t.palette.primary_500}
                strokeWidth="2"
              />

              {/* Labels */}
              {results.map((res: any, i: number) => {
                const angle = i * ((Math.PI * 2) / 12) - Math.PI / 2
                // Fix: Rename variables to avoid shadowing
                const labelX = CENTER + (RADIUS + 20) * Math.cos(angle)
                const labelY = CENTER + (RADIUS + 20) * Math.sin(angle)
                return (
                  <SvgText
                    key={i}
                    x={labelX}
                    y={labelY}
                    fontSize="8"
                    fill={t.palette.contrast_900}
                    textAnchor="middle"
                    alignmentBaseline="middle">
                    {i + 1}
                  </SvgText>
                )
              })}
            </G>
          </Svg>
        </View>

        {/* Breakdown */}
        <View style={styles.breakdownSection}>
          <Text style={[styles.sectionTitle, t.atoms.text]}>
            Detailed Axis Breakdown
          </Text>
          {/* Fix: Prefix unused variable with underscore */}
          {results.map((res: any, _i: number) => (
            <View
              key={res.axisId}
              style={[styles.axisRow, t.atoms.border_contrast_low]}>
              <View style={styles.axisInfo}>
                <Text style={[styles.axisTitle, t.atoms.text]}>
                  {res.axisTitle}
                </Text>
              </View>
              <View style={styles.dichotomyLabels}>
                <Text
                  style={[
                    styles.dichotomyLabel,
                    res.score < 50
                      ? {fontWeight: '900', color: t.palette.primary_500}
                      : t.atoms.text_contrast_medium,
                  ]}>
                  {res.labelLow}
                </Text>
                <Text
                  style={[
                    styles.dichotomyLabel,
                    res.score > 50
                      ? {fontWeight: '900', color: t.palette.primary_500}
                      : t.atoms.text_contrast_medium,
                  ]}>
                  {res.labelHigh}
                </Text>
              </View>
              <View style={[styles.progressBarBg, t.atoms.bg_contrast_25]}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      backgroundColor: t.palette.primary_500,
                      width: `${res.score}%`,
                    },
                  ]}
                />
              </View>
              <View style={styles.scoreRow}>
                <Text
                  style={[styles.axisScore, {color: t.palette.primary_500}]}>
                  {res.score}% {res.label}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Community Match */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, t.atoms.text]}>
            Party Alignment
          </Text>
        </View>
        <View style={styles.partyMatchSection}>
          {partyMatches.slice(0, 3).map((match, idx) => (
            <View
              key={match.party.id}
              style={[
                styles.partyCard,
                {
                  backgroundColor: match.party.color,
                  opacity: idx === 0 ? 1 : 0.75,
                },
              ]}>
              <Text style={styles.partyName}>{match.party.name}</Text>
              <Text style={styles.partyFullName}>{match.party.fullName}</Text>
              <Text style={styles.partyMatch}>{match.matchPercent}% Match</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </Layout.Screen>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroSection: {
    padding: 24,
    alignItems: 'center',
  },
  ideologyLabel: {
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 12,
  },
  secondaryMatch: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
  },
  ninthBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
  },
  ninthBadgeText: {
    color: 'white',
    fontWeight: '900',
    fontSize: 14,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginBottom: 20,
  },
  compassContainer: {
    alignItems: 'center',
    padding: 20,
    marginBottom: 20,
  },
  compassGrid: {
    width: 260,
    height: 260,
    borderWidth: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  gridRow: {
    flex: 1,
    flexDirection: 'row',
  },
  gridCell: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.2)',
    opacity: 0.8,
  },
  compassDot: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'white',
    borderWidth: 2,
    marginLeft: -7,
    marginTop: -7,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 5,
  },
  compassLabel: {
    position: 'absolute',
    fontSize: 10,
    fontWeight: '900',
    color: 'white',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 1,
  },
  labelAuth: {top: 4, alignSelf: 'center'},
  labelLib: {bottom: 4, alignSelf: 'center'},
  labelLeft: {left: 4, top: '48%'},
  labelRight: {right: 4, top: '48%'},
  breakdownSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 16,
  },
  axisRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  axisInfo: {
    marginBottom: 4,
  },
  dichotomyLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  dichotomyLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
  },
  axisTitle: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 4,
  },
  axisScore: {
    fontSize: 12,
    fontWeight: '800',
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
  },
  partyMatchSection: {
    paddingHorizontal: 20,
    gap: 12,
  },
  partyCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  partyName: {
    color: 'white',
    fontSize: 20,
    fontWeight: '900',
  },
  partyFullName: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 2,
  },
  partyMatch: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 8,
  },
})
