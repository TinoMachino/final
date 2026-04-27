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

type Props = NativeStackScreenProps<CommonNavigatorParams, 'SeePosts'>

type PostEntry = {
  id: string
  category: 'post' | 'para' | 'highlight' | 'reply'
  text: string
  upvotes: number
  downvotes: number
  quotes: number
  replies: number
  influence: number
  date: string
}

// Mock data sorted by influence descending
const POST_ENTRIES: PostEntry[] = [
  {
    id: '1',
    category: 'post',
    text: "Universal Healthcare should be a fundamental right for every citizen. Here's my analysis on why the current bill needs amendments...",
    upvotes: 72,
    downvotes: 17,
    quotes: 23,
    replies: 34,
    influence: 142,
    date: '2025-01-15',
  },
  {
    id: '2',
    category: 'para',
    text: 'Education Reform Bill analysis — what the proposal gets right and where it falls short for rural communities.',
    upvotes: 48,
    downvotes: 8,
    quotes: 14,
    replies: 22,
    influence: 98,
    date: '2025-01-14',
  },
  {
    id: '3',
    category: 'post',
    text: 'Public transport expansion would reduce commute times by 40% in metropolitan areas according to latest data.',
    upvotes: 35,
    downvotes: 6,
    quotes: 12,
    replies: 18,
    influence: 67,
    date: '2025-01-08',
  },
  {
    id: '4',
    category: 'highlight',
    text: 'Key insight on carbon tax implementation shared by @rep.garcia — this could change how we approach climate policy.',
    upvotes: 28,
    downvotes: 4,
    quotes: 8,
    replies: 8,
    influence: 54,
    date: '2025-01-12',
  },
  {
    id: '5',
    category: 'reply',
    text: 'The education reform bill overlooks rural communities entirely. We need provisions for equitable access...',
    upvotes: 24,
    downvotes: 5,
    quotes: 5,
    replies: 15,
    influence: 48,
    date: '2025-01-12',
  },
  {
    id: '6',
    category: 'para',
    text: 'Water industry privatization threatens access for low-income communities — breaking down the numbers.',
    upvotes: 18,
    downvotes: 2,
    quotes: 7,
    replies: 11,
    influence: 31,
    date: '2025-01-05',
  },
  {
    id: '7',
    category: 'post',
    text: "Cybersecurity Act needs stronger privacy protections before it can gain public trust. Here's what I propose...",
    upvotes: 15,
    downvotes: 3,
    quotes: 4,
    replies: 9,
    influence: 25,
    date: '2024-12-22',
  },
  {
    id: '8',
    category: 'reply',
    text: 'This policy would disproportionately affect small businesses. Consider a graduated approach instead of flat rates.',
    upvotes: 12,
    downvotes: 2,
    quotes: 2,
    replies: 6,
    influence: 22,
    date: '2025-01-03',
  },
  {
    id: '9',
    category: 'para',
    text: 'Plastic ban initiative — comparing implementation strategies from other regions and what works best.',
    upvotes: 10,
    downvotes: 2,
    quotes: 5,
    replies: 4,
    influence: 18,
    date: '2024-12-18',
  },
  {
    id: '10',
    category: 'highlight',
    text: 'Community discussion on automation tax gaining traction — 200+ citizens have weighed in.',
    upvotes: 8,
    downvotes: 1,
    quotes: 3,
    replies: 3,
    influence: 15,
    date: '2024-12-28',
  },
]

const CATEGORY_CONFIG = {
  post: {label: 'Post', color: '#3B82F6'},
  para: {label: 'Para', color: '#8B5CF6'},
  highlight: {label: 'Highlight', color: '#F59E0B'},
  reply: {label: 'Reply', color: '#6B7280'},
}

export function SeePostsScreen({}: Props) {
  const t = useTheme()
  const pal = usePalette('default')
  const {_} = useLingui()
  const [filter, setFilter] = useState<
    'all' | 'post' | 'para' | 'highlight' | 'reply'
  >('all')

  const filtered =
    filter === 'all'
      ? POST_ENTRIES
      : POST_ENTRIES.filter(e => e.category === filter)

  // Always sorted by influence descending
  const sorted = [...filtered].sort((a, b) => b.influence - a.influence)

  const totalUpvotes = POST_ENTRIES.reduce((s, e) => s + e.upvotes, 0)
  const totalDownvotes = POST_ENTRIES.reduce((s, e) => s + e.downvotes, 0)
  const totalQuotes = POST_ENTRIES.reduce((s, e) => s + e.quotes, 0)
  const totalReplies = POST_ENTRIES.reduce((s, e) => s + e.replies, 0)

  const filters: Array<'all' | 'post' | 'para' | 'highlight' | 'reply'> = [
    'all',
    'post',
    'para',
    'highlight',
    'reply',
  ]
  const filterLabels = {
    all: 'All',
    post: 'Posts',
    para: 'Para',
    highlight: 'Highlights',
    reply: 'Replies',
  }

  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Posts</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>

      <Layout.Content>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}>
          {/* Hero Card */}
          <View
            style={[styles.heroCard, {backgroundColor: t.palette.primary_500}]}>
            <Text style={styles.heroLabel}>Total Posts</Text>
            <Text style={styles.heroValue}>{POST_ENTRIES.length}</Text>
            <View style={styles.heroStats}>
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatValue}>
                  {POST_ENTRIES.filter(e => e.category === 'post').length}
                </Text>
                <Text style={styles.heroStatLabel}>Posts</Text>
              </View>
              <View style={styles.heroDivider} />
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatValue}>
                  {POST_ENTRIES.filter(e => e.category === 'para').length}
                </Text>
                <Text style={styles.heroStatLabel}>Para</Text>
              </View>
              <View style={styles.heroDivider} />
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatValue}>
                  {POST_ENTRIES.filter(e => e.category === 'highlight').length}
                </Text>
                <Text style={styles.heroStatLabel}>Highlights</Text>
              </View>
              <View style={styles.heroDivider} />
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatValue}>
                  {POST_ENTRIES.filter(e => e.category === 'reply').length}
                </Text>
                <Text style={styles.heroStatLabel}>Replies</Text>
              </View>
            </View>
          </View>

          {/* Engagement Breakdown */}
          <View style={[styles.engagementCard, pal.border]}>
            <Text style={[styles.engagementLabel, pal.text]}>
              <Trans>Engagement</Trans>
            </Text>
            <View style={styles.engagementRow}>
              <View style={styles.engagementItem}>
                <Text style={[styles.engagementValue, {color: '#10B981'}]}>
                  {totalUpvotes}
                </Text>
                <Text style={[styles.engagementItemLabel, pal.textLight]}>
                  Upvotes
                </Text>
              </View>
              <View
                style={[
                  styles.engagementDivider,
                  {backgroundColor: t.atoms.bg_contrast_25.backgroundColor},
                ]}
              />
              <View style={styles.engagementItem}>
                <Text style={[styles.engagementValue, {color: '#EF4444'}]}>
                  {totalDownvotes}
                </Text>
                <Text style={[styles.engagementItemLabel, pal.textLight]}>
                  Downvotes
                </Text>
              </View>
              <View
                style={[
                  styles.engagementDivider,
                  {backgroundColor: t.atoms.bg_contrast_25.backgroundColor},
                ]}
              />
              <View style={styles.engagementItem}>
                <Text style={[styles.engagementValue, {color: '#8B5CF6'}]}>
                  {totalQuotes}
                </Text>
                <Text style={[styles.engagementItemLabel, pal.textLight]}>
                  Quotes
                </Text>
              </View>
              <View
                style={[
                  styles.engagementDivider,
                  {backgroundColor: t.atoms.bg_contrast_25.backgroundColor},
                ]}
              />
              <View style={styles.engagementItem}>
                <Text style={[styles.engagementValue, {color: '#3B82F6'}]}>
                  {totalReplies}
                </Text>
                <Text style={[styles.engagementItemLabel, pal.textLight]}>
                  Replies
                </Text>
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
                accessibilityHint={_(msg`Filter posts by ${filterLabels[f]}`)}
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

          {/* Post Entries — sorted by influence */}
          {sorted.map((entry, index) => (
            <View key={entry.id} style={[styles.entryCard, pal.border]}>
              <View style={styles.entryHeader}>
                <View style={styles.entryMeta}>
                  <View
                    style={[
                      styles.typeBadge,
                      {backgroundColor: CATEGORY_CONFIG[entry.category].color},
                    ]}>
                    <Text style={styles.typeBadgeText}>
                      {CATEGORY_CONFIG[entry.category].label}
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
              <View style={styles.entryFooter}>
                <Text style={[styles.footerStat, {color: '#10B981'}]}>
                  ▲ {entry.upvotes}
                </Text>
                <Text style={[styles.footerStat, {color: '#EF4444'}]}>
                  ▼ {entry.downvotes}
                </Text>
                <Text style={[styles.footerStat, pal.textLight]}>
                  {entry.quotes} quotes
                </Text>
                <Text style={[styles.footerStat, pal.textLight]}>
                  {entry.replies} replies
                </Text>
              </View>
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
                      backgroundColor: CATEGORY_CONFIG[entry.category].color,
                      width: `${Math.min((entry.influence / (sorted[0]?.influence || 1)) * 100, 100)}%`,
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
  engagementCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  engagementLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  engagementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  engagementItem: {
    alignItems: 'center',
  },
  engagementValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  engagementItemLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  engagementDivider: {
    width: 1,
    height: 30,
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
    gap: 14,
    marginBottom: 8,
  },
  footerStat: {
    fontSize: 12,
    fontWeight: '600',
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
