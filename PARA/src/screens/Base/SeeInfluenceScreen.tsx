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
import * as Layout from '#/components/Layout'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'SeeInfluence'>

type InfluenceEntry = {
  id: string
  type: 'post' | 'comment' | 'policy' | 'highlight'
  text: string
  influence: number
  date: string
  reactions: number
  replies: number
}

// Mock data sorted by influence descending
const INFLUENCE_ENTRIES: InfluenceEntry[] = [
  {
    id: '1',
    type: 'post',
    text: "Universal Healthcare should be a fundamental right for every citizen. Here's my analysis on why the current bill needs amendments...",
    influence: 142,
    date: '2025-01-15',
    reactions: 89,
    replies: 34,
  },
  {
    id: '2',
    type: 'comment',
    text: 'The education reform bill overlooks rural communities entirely. We need provisions for...',
    influence: 98,
    date: '2025-01-12',
    reactions: 56,
    replies: 22,
  },
  {
    id: '3',
    type: 'policy',
    text: 'Voted on Universal Healthcare v2',
    influence: 75,
    date: '2025-01-10',
    reactions: 0,
    replies: 0,
  },
  {
    id: '4',
    type: 'post',
    text: 'Public transport expansion would reduce commute times by 40% in metropolitan areas according to latest data...',
    influence: 67,
    date: '2025-01-08',
    reactions: 41,
    replies: 18,
  },
  {
    id: '5',
    type: 'highlight',
    text: 'Key insight on carbon tax implementation shared by @rep.garcia',
    influence: 54,
    date: '2025-01-05',
    reactions: 32,
    replies: 8,
  },
  {
    id: '6',
    type: 'comment',
    text: 'This policy would disproportionately affect small businesses. Consider a graduated approach...',
    influence: 48,
    date: '2025-01-03',
    reactions: 29,
    replies: 15,
  },
  {
    id: '7',
    type: 'policy',
    text: 'Voted on Police Funding Increase',
    influence: 35,
    date: '2024-12-28',
    reactions: 0,
    replies: 0,
  },
  {
    id: '8',
    type: 'post',
    text: 'Water industry privatization threatens access for low-income communities...',
    influence: 31,
    date: '2024-12-22',
    reactions: 20,
    replies: 11,
  },
  {
    id: '9',
    type: 'comment',
    text: 'Cybersecurity Act needs stronger privacy protections before it can gain public trust.',
    influence: 22,
    date: '2024-12-18',
    reactions: 14,
    replies: 6,
  },
  {
    id: '10',
    type: 'highlight',
    text: 'Community discussion on automation tax gaining traction',
    influence: 15,
    date: '2024-12-15',
    reactions: 9,
    replies: 3,
  },
]

const TYPE_CONFIG = {
  post: {label: 'Post', color: '#3B82F6'},
  comment: {label: 'Comment', color: '#8B5CF6'},
  policy: {label: 'Policy', color: '#10B981'},
  highlight: {label: 'Highlight', color: '#F59E0B'},
}

export function SeeInfluenceScreen({}: Props) {
  const t = useTheme()
  const pal = usePalette('default')
  const {_} = useLingui()
  const [filter, setFilter] = useState<
    'all' | 'post' | 'comment' | 'policy' | 'highlight'
  >('all')

  const totalInfluence = INFLUENCE_ENTRIES.reduce(
    (sum, e) => sum + e.influence,
    0,
  )

  const filtered =
    filter === 'all'
      ? INFLUENCE_ENTRIES
      : INFLUENCE_ENTRIES.filter(e => e.type === filter)

  const filters: Array<'all' | 'post' | 'comment' | 'policy' | 'highlight'> = [
    'all',
    'post',
    'comment',
    'policy',
    'highlight',
  ]
  const filterLabels = {
    all: 'All',
    post: 'Posts',
    comment: 'Comments',
    policy: 'Policies',
    highlight: 'Highlights',
  }

  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Influence</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>

      <Layout.Content>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}>
          {/* Score Hero */}
          <View
            style={[styles.heroCard, {backgroundColor: t.palette.primary_500}]}>
            <Text style={styles.heroLabel}>Total Influence</Text>
            <Text style={styles.heroValue}>{totalInfluence}</Text>
            <View style={styles.heroStats}>
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatValue}>
                  {INFLUENCE_ENTRIES.filter(e => e.type === 'post').length}
                </Text>
                <Text style={styles.heroStatLabel}>Posts</Text>
              </View>
              <View style={[styles.heroDivider]} />
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatValue}>
                  {INFLUENCE_ENTRIES.filter(e => e.type === 'comment').length}
                </Text>
                <Text style={styles.heroStatLabel}>Comments</Text>
              </View>
              <View style={[styles.heroDivider]} />
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatValue}>
                  {INFLUENCE_ENTRIES.filter(e => e.type === 'policy').length}
                </Text>
                <Text style={styles.heroStatLabel}>Policies</Text>
              </View>
              <View style={[styles.heroDivider]} />
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatValue}>
                  {INFLUENCE_ENTRIES.filter(e => e.type === 'highlight').length}
                </Text>
                <Text style={styles.heroStatLabel}>Highlights</Text>
              </View>
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
                accessibilityHint={_(
                  msg`Shows only ${filterLabels[f]} entries`,
                )}
                style={[
                  styles.filterChip,
                  pal.border,
                  filter === f && {
                    backgroundColor: t.palette.primary_500,
                    borderColor: t.palette.primary_500,
                  },
                ]}
                onPress={() => setFilter(f)}>
                <Text
                  style={[
                    styles.filterChipText,
                    pal.text,
                    filter === f && {color: '#fff'},
                  ]}>
                  {filterLabels[f]}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Entries List */}
          {filtered.map((entry, index) => (
            <View key={entry.id} style={[styles.entryCard, pal.border]}>
              <View style={styles.entryHeader}>
                <View style={styles.entryMeta}>
                  <View
                    style={[
                      styles.typeBadge,
                      {backgroundColor: TYPE_CONFIG[entry.type].color},
                    ]}>
                    <Text style={styles.typeBadgeText}>
                      {TYPE_CONFIG[entry.type].label}
                    </Text>
                  </View>
                  <Text style={[styles.entryDate, pal.textLight]}>
                    {entry.date}
                  </Text>
                </View>
                <View style={styles.influenceBadge}>
                  <Text
                    style={[styles.rankNumber, {color: t.palette.primary_500}]}>
                    #{index + 1}
                  </Text>
                  <Text
                    style={[
                      styles.influenceValue,
                      {color: t.palette.primary_500},
                    ]}>
                    +{entry.influence}
                  </Text>
                </View>
              </View>
              <Text style={[styles.entryText, pal.text]} numberOfLines={3}>
                {entry.text}
              </Text>
              {(entry.reactions > 0 || entry.replies > 0) && (
                <View style={styles.entryFooter}>
                  {entry.reactions > 0 && (
                    <Text style={[styles.footerStat, pal.textLight]}>
                      {entry.reactions} reactions
                    </Text>
                  )}
                  {entry.replies > 0 && (
                    <Text style={[styles.footerStat, pal.textLight]}>
                      {entry.replies} replies
                    </Text>
                  )}
                </View>
              )}
              {/* Influence Bar */}
              <View
                style={[
                  styles.influenceBarBg,
                  {backgroundColor: t.atoms.bg_contrast_25.backgroundColor},
                ]}>
                <View
                  style={[
                    styles.influenceBarFill,
                    {
                      backgroundColor: TYPE_CONFIG[entry.type].color,
                      width: `${Math.min((entry.influence / (filtered[0]?.influence || 1)) * 100, 100)}%`,
                      opacity: 0.7,
                    },
                  ]}
                />
              </View>
            </View>
          ))}
        </ScrollView>
      </Layout.Content>
    </Layout.Screen>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  heroCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  heroLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
  heroValue: {
    color: '#fff',
    fontSize: 56,
    fontWeight: '800',
    letterSpacing: -2,
    marginVertical: 4,
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 16,
  },
  heroStatItem: {
    alignItems: 'center',
  },
  heroStatValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  heroStatLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  heroDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.25)',
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
  entryCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  entryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  entryDate: {
    fontSize: 12,
  },
  influenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rankNumber: {
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.6,
  },
  influenceValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  entryText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  entryFooter: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  footerStat: {
    fontSize: 12,
  },
  influenceBarBg: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  influenceBarFill: {
    height: '100%',
    borderRadius: 2,
  },
})
