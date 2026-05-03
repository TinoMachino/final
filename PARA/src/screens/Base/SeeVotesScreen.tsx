import {useState} from 'react'
import {ScrollView, StyleSheet, TouchableOpacity, View} from 'react-native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'

import {usePalette} from '#/lib/hooks/usePalette'
import {type CommonNavigatorParams} from '#/lib/routes/types'
import {Text} from '#/view/com/util/text/Text'
import {useTheme} from '#/alf'
import {CircleInfo_Stroke2_Corner0_Rounded as CircleInfo} from '#/components/icons/CircleInfo'
import * as Layout from '#/components/Layout'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'SeeVotes'>

type VoteEntry = {
  id: string
  category: 'policy' | 'matter' | 'post'
  title: string
  vote: number // -3 to +3 for policies, -1/+1 for matters/posts
  communityAvg: number // community average vote
  date: string
  status: 'Passed' | 'Pending' | 'Rejected'
}

// Mock data
const VOTE_ENTRIES: VoteEntry[] = [
  {
    id: '1',
    category: 'policy',
    title: 'Universal Healthcare v2',
    vote: 3,
    communityAvg: 2.1,
    date: '2025-01-15',
    status: 'Passed',
  },
  {
    id: '2',
    category: 'policy',
    title: 'Education Reform Bill',
    vote: 2,
    communityAvg: -0.8,
    date: '2025-01-10',
    status: 'Pending',
  },
  {
    id: '3',
    category: 'policy',
    title: 'Public Transport Expansion',
    vote: -2,
    communityAvg: -1.5,
    date: '2025-01-05',
    status: 'Rejected',
  },
  {
    id: '4',
    category: 'policy',
    title: 'Police Funding Increase',
    vote: -3,
    communityAvg: 1.2,
    date: '2024-12-20',
    status: 'Passed',
  },
  {
    id: '5',
    category: 'policy',
    title: 'Cybersecurity Act',
    vote: 1,
    communityAvg: 0.9,
    date: '2024-12-15',
    status: 'Pending',
  },
  {
    id: '6',
    category: 'matter',
    title: '#WaterIndustry Reform',
    vote: 1,
    communityAvg: 0.7,
    date: '2025-01-12',
    status: 'Pending',
  },
  {
    id: '7',
    category: 'matter',
    title: '#TaxExemptionOnCharity',
    vote: 1,
    communityAvg: 0.3,
    date: '2025-01-08',
    status: 'Pending',
  },
  {
    id: '8',
    category: 'matter',
    title: '#PlasticBan Initiative',
    vote: 1,
    communityAvg: 0.8,
    date: '2024-12-28',
    status: 'Passed',
  },
  {
    id: '9',
    category: 'post',
    title: 'Rep. García on Healthcare Reform',
    vote: 1,
    communityAvg: 0.6,
    date: '2025-01-14',
    status: 'Passed',
  },
  {
    id: '10',
    category: 'post',
    title: 'Sen. López on Education Spending',
    vote: -1,
    communityAvg: -0.4,
    date: '2025-01-11',
    status: 'Pending',
  },
]

const POLICY_FLAIR_COLOR = '#474652'
const MATTER_FLAIR_BORDER_LIGHT = '#000000'
const MATTER_FLAIR_BORDER_DARK = '#FFFFFF'
const POST_FLAIR_COLOR = '#4B5563'

const CATEGORY_CONFIG = {
  policy: {label: 'Policy', marker: '||'},
  matter: {label: 'Matter', marker: '|'},
  post: {label: 'Post', marker: undefined},
}

const STATUS_CONFIG = {
  Passed: {color: '#10B981', bg: 'rgba(16,185,129,0.15)'},
  Pending: {color: '#F59E0B', bg: 'rgba(245,158,11,0.15)'},
  Rejected: {color: '#EF4444', bg: 'rgba(239,68,68,0.15)'},
}

function getVoteColor(vote: number): string {
  if (vote > 0) return '#10B981'
  if (vote < 0) return '#EF4444'
  return '#9CA3AF'
}

function formatVote(vote: number): string {
  if (vote > 0) return `+${vote}`
  return `${vote}`
}

function VoteFlairBadge({category}: {category: VoteEntry['category']}) {
  const t = useTheme()
  const config = CATEGORY_CONFIG[category]
  const isPolicy = category === 'policy'
  const isMatter = category === 'matter'
  const matterBorderColor =
    t.scheme === 'light' ? MATTER_FLAIR_BORDER_LIGHT : MATTER_FLAIR_BORDER_DARK
  const flairColor = isPolicy ? POLICY_FLAIR_COLOR : POST_FLAIR_COLOR

  return (
    <View style={styles.flairRow}>
      {config.marker ? (
        <View
          style={[
            styles.flairMarker,
            isMatter
              ? {
                  backgroundColor: '#FFFFFF',
                  borderColor: matterBorderColor,
                }
              : {
                  backgroundColor: POLICY_FLAIR_COLOR,
                  borderColor: POLICY_FLAIR_COLOR,
                },
          ]}>
          <Text
            style={[
              styles.flairMarkerText,
              {color: isMatter ? '#000000' : '#FFFFFF'},
            ]}>
            {config.marker}
          </Text>
        </View>
      ) : null}
      <View
        style={[
          styles.flairPill,
          {
            backgroundColor: isMatter ? '#FFFFFF' : flairColor,
            borderColor: isMatter ? matterBorderColor : flairColor,
            borderWidth: isMatter && t.scheme === 'light' ? 1 : 0,
          },
        ]}>
        <Text
          style={[styles.flairPillText, {color: isMatter ? '#000000' : '#fff'}]}>
          {config.label}
        </Text>
      </View>
    </View>
  )
}

/** Renders a -3 to +3 scale bar for policy votes */
function VoteScaleBar({
  vote,
  communityAvg,
}: {
  vote: number
  communityAvg: number
}) {
  const t = useTheme()
  // Scale: -3 to +3, center at 3 (index), total 7 positions
  const userPos = ((vote + 3) / 6) * 100
  const communityPos = ((communityAvg + 3) / 6) * 100

  return (
    <View style={scaleStyles.container}>
      <View style={scaleStyles.labels}>
        <Text style={[scaleStyles.labelText, t.atoms.text_contrast_medium]}>
          -3
        </Text>
        <Text style={[scaleStyles.labelText, t.atoms.text_contrast_medium]}>
          0
        </Text>
        <Text style={[scaleStyles.labelText, t.atoms.text_contrast_medium]}>
          +3
        </Text>
      </View>
      <View
        style={[
          scaleStyles.track,
          {backgroundColor: t.atoms.bg_contrast_25.backgroundColor},
        ]}>
        {/* Center line */}
        <View
          style={[
            scaleStyles.centerLine,
            {
              backgroundColor:
                t.atoms.bg_contrast_100?.backgroundColor || '#555',
            },
          ]}
        />
        {/* Community marker */}
        <View
          style={[
            scaleStyles.marker,
            scaleStyles.communityMarker,
            {left: `${communityPos}%`, borderColor: '#F59E0B'},
          ]}
        />
        {/* User marker */}
        <View
          style={[
            scaleStyles.marker,
            scaleStyles.userMarker,
            {left: `${userPos}%`, backgroundColor: getVoteColor(vote)},
          ]}
        />
      </View>
      <View style={scaleStyles.legend}>
        <View style={scaleStyles.legendItem}>
          <View
            style={[
              scaleStyles.legendDot,
              {backgroundColor: getVoteColor(vote)},
            ]}
          />
          <Text style={[scaleStyles.legendText, t.atoms.text_contrast_medium]}>
            You: {formatVote(vote)}
          </Text>
        </View>
        <View style={scaleStyles.legendItem}>
          <View
            style={[scaleStyles.legendDotOutline, {borderColor: '#F59E0B'}]}
          />
          <Text style={[scaleStyles.legendText, t.atoms.text_contrast_medium]}>
            Community: {communityAvg > 0 ? '+' : ''}
            {communityAvg.toFixed(1)}
          </Text>
        </View>
      </View>
    </View>
  )
}

/** Renders a simple +1/-1 indicator for matter/post votes */
function SimpleVoteIndicator({
  vote,
  communityAvg,
}: {
  vote: number
  communityAvg: number
}) {
  const t = useTheme()
  const sameDirection =
    (vote > 0 && communityAvg > 0) || (vote < 0 && communityAvg < 0)

  return (
    <View style={simpleStyles.container}>
      <View style={simpleStyles.row}>
        <View
          style={[
            simpleStyles.votePill,
            {backgroundColor: getVoteColor(vote)},
          ]}>
          <Text style={simpleStyles.votePillText}>
            {vote > 0 ? '▲ Upvote' : '▼ Downvote'}
          </Text>
        </View>
        <Text style={[simpleStyles.communityText, t.atoms.text_contrast_medium]}>
          Community: {communityAvg > 0 ? '+' : ''}
          {communityAvg.toFixed(1)}
        </Text>
        {sameDirection && <Text style={simpleStyles.alignedBadge}>✓</Text>}
      </View>
    </View>
  )
}

export function SeeVotesScreen({}: Props) {
  const t = useTheme()
  const pal = usePalette('default')
  const {_} = useLingui()
  const [filter, setFilter] = useState<'all' | 'policy' | 'matter' | 'post'>(
    'all',
  )
  const [showInfo, setShowInfo] = useState(false)

  const filtered =
    filter === 'all'
      ? VOTE_ENTRIES
      : VOTE_ENTRIES.filter(e => e.category === filter)

  const policyVotes = VOTE_ENTRIES.filter(e => e.category === 'policy')
  const avgPolicyVote =
    policyVotes.length > 0
      ? policyVotes.reduce((sum, e) => sum + e.vote, 0) / policyVotes.length
      : 0
  const totalPositive = VOTE_ENTRIES.filter(e => e.vote > 0).length
  const totalNegative = VOTE_ENTRIES.filter(e => e.vote < 0).length
  const alignedCount = VOTE_ENTRIES.filter(
    e =>
      (e.vote > 0 && e.communityAvg > 0) || (e.vote < 0 && e.communityAvg < 0),
  ).length
  const alignmentRate = Math.round((alignedCount / VOTE_ENTRIES.length) * 100)

  const filters: Array<'all' | 'policy' | 'matter' | 'post'> = [
    'all',
    'policy',
    'matter',
    'post',
  ]
  const filterLabels = {
    all: 'All',
    policy: 'Policies',
    matter: 'Matters',
    post: 'Posts',
  }

  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Votes</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>

      <Layout.Content>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}>
          <View style={styles.screenIntro}>
            <Text style={[styles.screenTitle, pal.text]}>Your vote ledger</Text>
            <Text style={[styles.screenSubtitle, t.atoms.text_contrast_medium]}>
              Recent policy stances, matter signals, and post votes in one
              place.
            </Text>
          </View>

          {/* Summary Cards */}
          <View style={styles.summaryRow}>
            <View
              style={[
                styles.summaryCard,
                pal.border,
                {backgroundColor: t.atoms.bg_contrast_25.backgroundColor},
              ]}>
              <Text style={[styles.summaryCardValue, {color: '#047857'}]}>
                {totalPositive}
              </Text>
              <Text
                style={[styles.summaryCardLabel, t.atoms.text_contrast_medium]}>
                Positive
              </Text>
            </View>
            <View
              style={[
                styles.summaryCard,
                pal.border,
                {backgroundColor: t.atoms.bg_contrast_25.backgroundColor},
              ]}>
              <Text style={[styles.summaryCardValue, {color: '#B91C1C'}]}>
                {totalNegative}
              </Text>
              <Text
                style={[styles.summaryCardLabel, t.atoms.text_contrast_medium]}>
                Negative
              </Text>
            </View>
            <View
              style={[
                styles.summaryCard,
                pal.border,
                {backgroundColor: t.atoms.bg_contrast_25.backgroundColor},
              ]}>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={_(msg`Show aligned vote information`)}
                accessibilityHint={_(
                  msg`Explains how aligned votes are calculated`,
                )}
                onPress={() => setShowInfo(value => !value)}
                style={[
                  styles.alignedInfoButton,
                  {
                    borderColor: t.atoms.text_contrast_medium.color,
                    backgroundColor: showInfo
                      ? POLICY_FLAIR_COLOR
                      : 'transparent',
                  },
                ]}>
                <CircleInfo
                  size="xs"
                  fill={showInfo ? '#FFFFFF' : t.atoms.text.color}
                />
              </TouchableOpacity>
              <Text
                style={[styles.summaryCardValue, {color: POLICY_FLAIR_COLOR}]}>
                {alignmentRate}%
              </Text>
              <Text
                style={[styles.summaryCardLabel, t.atoms.text_contrast_medium]}>
                Aligned
              </Text>
              {showInfo ? (
                <Text style={[styles.alignedInfoCopy, t.atoms.text]}>
                  Votes where your direction matches the community average.
                </Text>
              ) : null}
            </View>
          </View>

          {/* Policy Avg Stance */}
          <View
            style={[
              styles.avgStanceCard,
              pal.border,
              {backgroundColor: t.atoms.bg_contrast_25.backgroundColor},
            ]}>
            <View style={styles.avgStanceHeader}>
              <VoteFlairBadge category="policy" />
              <Text style={[styles.avgStanceLabel, pal.text]}>
                <Trans>Avg. Policy Stance</Trans>
              </Text>
            </View>
            <View style={styles.avgStanceRow}>
              <Text
                style={[
                  styles.avgStanceValue,
                  {color: getVoteColor(avgPolicyVote)},
                ]}>
                {avgPolicyVote > 0 ? '+' : ''}
                {avgPolicyVote.toFixed(1)}
              </Text>
              <View
                style={[
                  styles.avgScaleTrack,
                  {backgroundColor: t.atoms.bg_contrast_25.backgroundColor},
                ]}>
                <View
                  style={[
                    styles.avgScaleCenterLine,
                    {
                      backgroundColor:
                        t.atoms.bg_contrast_100?.backgroundColor || '#555',
                    },
                  ]}
                />
                <View
                  style={[
                    styles.avgScaleMarker,
                    {
                      left: `${((avgPolicyVote + 3) / 6) * 100}%`,
                      backgroundColor: getVoteColor(avgPolicyVote),
                    },
                  ]}
                />
              </View>
            </View>
            <View style={styles.avgScaleLabels}>
              <Text style={[styles.avgScaleLabelText, pal.textLight]}>
                Strong Against
              </Text>
              <Text style={[styles.avgScaleLabelText, pal.textLight]}>
                Strong For
              </Text>
            </View>
          </View>

          {/* Filter Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filtersScroll}
            contentContainerStyle={styles.filtersContent}>
            {filters.map(f => (
              <TouchableOpacity
                key={f}
                accessibilityRole="button"
                accessibilityLabel={_(msg`Filter by ${filterLabels[f]}`)}
                accessibilityHint={_(msg`Filter votes by ${filterLabels[f]}`)}
                style={[
                  styles.filterChip,
                  pal.border,
                  {backgroundColor: t.atoms.bg_contrast_25.backgroundColor},
                  filter === f && {
                    backgroundColor:
                      f === 'policy'
                        ? POLICY_FLAIR_COLOR
                        : f === 'matter'
                          ? '#FFFFFF'
                          : t.palette.primary_500,
                    borderColor:
                      f === 'matter'
                        ? t.scheme === 'light'
                          ? '#000000'
                          : '#FFFFFF'
                        : f === 'policy'
                          ? POLICY_FLAIR_COLOR
                          : t.palette.primary_500,
                  },
                ]}
                onPress={() => setFilter(f)}>
                <Text
                  style={[
                    styles.filterChipText,
                    pal.text,
                    filter === f && {color: f === 'matter' ? '#000' : '#fff'},
                  ]}>
                  {filterLabels[f]}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Vote Entries */}
          {filtered.map(entry => (
            <View
              key={entry.id}
              style={[
                styles.voteCard,
                pal.border,
                {backgroundColor: t.atoms.bg_contrast_25.backgroundColor},
              ]}>
              <View style={styles.voteCardHeader}>
                <View style={styles.voteCardMeta}>
                  <VoteFlairBadge category={entry.category} />
                  <View
                    style={[
                      styles.statusBadge,
                      {backgroundColor: STATUS_CONFIG[entry.status].bg},
                    ]}>
                    <Text
                      style={[
                        styles.statusBadgeText,
                        {color: STATUS_CONFIG[entry.status].color},
                      ]}>
                      {entry.status}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.voteCardDate, pal.textLight]}>
                  {entry.date}
                </Text>
              </View>

              <Text style={[styles.voteCardTitle, pal.text]}>
                {entry.title}
              </Text>

              {entry.category === 'policy' ? (
                <VoteScaleBar
                  vote={entry.vote}
                  communityAvg={entry.communityAvg}
                />
              ) : (
                <SimpleVoteIndicator
                  vote={entry.vote}
                  communityAvg={entry.communityAvg}
                />
              )}
            </View>
          ))}
        </ScrollView>
      </Layout.Content>
    </Layout.Screen>
  )
}

const scaleStyles = StyleSheet.create({
  container: {
    marginTop: 4,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  labelText: {
    fontSize: 10,
    fontWeight: '600',
  },
  track: {
    height: 8,
    borderRadius: 4,
    position: 'relative',
  },
  centerLine: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: 1,
  },
  marker: {
    position: 'absolute',
    top: -3,
    width: 14,
    height: 14,
    borderRadius: 7,
    marginLeft: -7,
  },
  userMarker: {},
  communityMarker: {
    backgroundColor: 'transparent',
    borderWidth: 2,
  },
  legend: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendDotOutline: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  legendText: {
    fontSize: 11,
  },
})

const simpleStyles = StyleSheet.create({
  container: {
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  votePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  votePillText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  communityText: {
    fontSize: 12,
  },
  alignedBadge: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10B981',
  },
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  screenIntro: {
    marginBottom: 16,
    gap: 4,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
  },
  screenSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 96,
    paddingHorizontal: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCardValue: {
    fontSize: 26,
    fontWeight: '800',
  },
  summaryCardLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  alignedInfoButton: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alignedInfoCopy: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 8,
    textAlign: 'center',
  },
  avgStanceCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  avgStanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  avgStanceLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  avgStanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avgStanceValue: {
    fontSize: 24,
    fontWeight: '800',
    minWidth: 48,
  },
  avgScaleTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    position: 'relative',
  },
  avgScaleCenterLine: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: 1,
  },
  avgScaleMarker: {
    position: 'absolute',
    top: -3,
    width: 14,
    height: 14,
    borderRadius: 7,
    marginLeft: -7,
  },
  avgScaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  avgScaleLabelText: {
    fontSize: 10,
    fontWeight: '500',
  },
  filtersScroll: {
    marginBottom: 16,
  },
  filtersContent: {
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  voteCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
  },
  voteCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  voteCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    flexWrap: 'wrap',
    gap: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  voteCardDate: {
    fontSize: 12,
  },
  voteCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 10,
  },
  flairRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  flairMarker: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  flairMarkerText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  flairPill: {
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  flairPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
})
