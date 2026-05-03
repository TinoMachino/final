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
import {RedditVoteButton} from '#/components/PostControls/VoteButton'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'SeePosts'>

type PostEntry = {
  id: string
  category: 'post' | 'highlight' | 'reply'
  text: string
  upvotes: number
  downvotes: number
  quotes: number
  replies: number
  date: string
  viewerVote: 'upvote' | 'downvote' | 'none'
}

const POST_ENTRIES: PostEntry[] = [
  {
    id: '1',
    category: 'post',
    text: "Universal Healthcare should be a fundamental right for every citizen. Here's my analysis on why the current bill needs amendments...",
    upvotes: 72,
    downvotes: 17,
    quotes: 23,
    replies: 34,
    date: '2025-01-15',
    viewerVote: 'upvote',
  },
  {
    id: '2',
    category: 'post',
    text: 'Education Reform Bill analysis — what the proposal gets right and where it falls short for rural communities.',
    upvotes: 48,
    downvotes: 8,
    quotes: 14,
    replies: 22,
    date: '2025-01-14',
    viewerVote: 'none',
  },
  {
    id: '3',
    category: 'post',
    text: 'Public transport expansion would reduce commute times by 40% in metropolitan areas according to latest data.',
    upvotes: 35,
    downvotes: 6,
    quotes: 12,
    replies: 18,
    date: '2025-01-08',
    viewerVote: 'upvote',
  },
  {
    id: '4',
    category: 'highlight',
    text: 'Key insight on carbon tax implementation shared by @rep.garcia — this could change how we approach climate policy.',
    upvotes: 28,
    downvotes: 4,
    quotes: 8,
    replies: 8,
    date: '2025-01-12',
    viewerVote: 'none',
  },
  {
    id: '5',
    category: 'reply',
    text: 'The education reform bill overlooks rural communities entirely. We need provisions for equitable access...',
    upvotes: 24,
    downvotes: 5,
    quotes: 5,
    replies: 15,
    date: '2025-01-12',
    viewerVote: 'downvote',
  },
  {
    id: '6',
    category: 'highlight',
    text: 'Water industry privatization threatens access for low-income communities — breaking down the numbers.',
    upvotes: 18,
    downvotes: 2,
    quotes: 7,
    replies: 11,
    date: '2025-01-05',
    viewerVote: 'none',
  },
  {
    id: '7',
    category: 'post',
    text: "Cybersecurity Act needs stronger privacy protections before it can gain public trust. Here's what I propose...",
    upvotes: 15,
    downvotes: 3,
    quotes: 4,
    replies: 9,
    date: '2024-12-22',
    viewerVote: 'none',
  },
  {
    id: '8',
    category: 'reply',
    text: 'This policy would disproportionately affect small businesses. Consider a graduated approach instead of flat rates.',
    upvotes: 12,
    downvotes: 2,
    quotes: 2,
    replies: 6,
    date: '2025-01-03',
    viewerVote: 'upvote',
  },
  {
    id: '9',
    category: 'post',
    text: 'Plastic ban initiative — comparing implementation strategies from other regions and what works best.',
    upvotes: 10,
    downvotes: 2,
    quotes: 5,
    replies: 4,
    date: '2024-12-18',
    viewerVote: 'none',
  },
  {
    id: '10',
    category: 'highlight',
    text: 'Community discussion on automation tax gaining traction — 200+ citizens have weighed in.',
    upvotes: 8,
    downvotes: 1,
    quotes: 3,
    replies: 3,
    date: '2024-12-28',
    viewerVote: 'none',
  },
]

const CATEGORY_CONFIG = {
  post: {label: 'Post', color: '#4B5563'},
  highlight: {label: 'Highlight', color: '#B45309'},
  reply: {label: 'Reply', color: '#6B7280'},
}

type PostFilter = 'all' | PostEntry['category']
type VoteState = PostEntry['viewerVote']

function TypePill({category}: {category: PostEntry['category']}) {
  const config = CATEGORY_CONFIG[category]

  return (
    <View
      style={[
        styles.typePill,
        {
          backgroundColor: config.color,
          borderColor: config.color,
        },
      ]}>
      <Text style={styles.typePillText}>{config.label}</Text>
    </View>
  )
}

export function SeePostsScreen({}: Props) {
  const t = useTheme()
  const pal = usePalette('default')
  const {_} = useLingui()
  const [filter, setFilter] = useState<PostFilter>('all')
  const [localVotes, setLocalVotes] = useState<Record<string, VoteState>>({})

  const entries = POST_ENTRIES.map(entry => {
    const viewerVote = localVotes[entry.id] ?? entry.viewerVote
    const baseScore = entry.upvotes - entry.downvotes
    const initialVoteImpact =
      entry.viewerVote === 'upvote'
        ? 1
        : entry.viewerVote === 'downvote'
          ? -1
          : 0
    const localVoteImpact =
      viewerVote === 'upvote' ? 1 : viewerVote === 'downvote' ? -1 : 0

    return {
      ...entry,
      viewerVote,
      score: baseScore - initialVoteImpact + localVoteImpact,
    }
  })

  const filtered =
    filter === 'all'
      ? entries
      : entries.filter(e => e.category === filter)

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  )

  const totalQuotes = entries.reduce((s, e) => s + e.quotes, 0)
  const totalReplies = entries.reduce((s, e) => s + e.replies, 0)
  const conversationTotal = totalQuotes + totalReplies
  const postCount = entries.filter(e => e.category === 'post').length
  const highlightCount = entries.filter(e => e.category === 'highlight').length
  const replyCount = entries.filter(e => e.category === 'reply').length

  const filters: PostFilter[] = ['all', 'post', 'highlight', 'reply']
  const filterLabels = {
    all: 'All',
    post: 'Posts',
    highlight: 'Highlights',
    reply: 'Replies',
  }

  const handleVote = (id: string, nextVote: VoteState) => {
    setLocalVotes(prev => ({...prev, [id]: nextVote}))
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
          <View style={styles.screenIntro}>
            <Text style={[styles.screenTitle, pal.text]}>
              Your post ledger
            </Text>
            <Text style={[styles.screenSubtitle, t.atoms.text_contrast_medium]}>
              Ranked posts, highlights, and replies with the same voting
              controls used across the app.
            </Text>
          </View>

          <View
            style={[
              styles.overviewCard,
              pal.border,
              {backgroundColor: t.atoms.bg_contrast_25.backgroundColor},
            ]}>
            <View style={styles.overviewTop}>
              <View>
                <Text style={[styles.overviewKicker, t.atoms.text_contrast_medium]}>
                  Library
                </Text>
                <Text style={[styles.overviewValue, pal.text]}>
                  {entries.length} items
                </Text>
              </View>
              <View style={styles.overviewRight}>
                <Text style={[styles.overviewKicker, t.atoms.text_contrast_medium]}>
                  Conversation
                </Text>
                <Text style={[styles.overviewValue, {color: '#474652'}]}>
                  {conversationTotal}
                </Text>
              </View>
            </View>
            <View style={styles.mixRow}>
              <View style={styles.mixItem}>
                <TypePill category="post" />
                <Text style={[styles.mixCount, pal.text]}>{postCount}</Text>
              </View>
              <View style={styles.mixItem}>
                <TypePill category="highlight" />
                <Text style={[styles.mixCount, pal.text]}>{highlightCount}</Text>
              </View>
              <View style={styles.mixItem}>
                <TypePill category="reply" />
                <Text style={[styles.mixCount, pal.text]}>{replyCount}</Text>
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
                  {backgroundColor: t.atoms.bg_contrast_25.backgroundColor},
                  filter === f && {
                    backgroundColor:
                      f === 'all'
                        ? t.palette.primary_500
                        : CATEGORY_CONFIG[f].color,
                    borderColor:
                      f === 'all'
                        ? t.palette.primary_500
                        : CATEGORY_CONFIG[f].color,
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

          {sorted.map(entry => (
            <View
              key={entry.id}
              style={[
                styles.entryCard,
                pal.border,
                {backgroundColor: t.atoms.bg_contrast_25.backgroundColor},
              ]}>
              <View style={styles.entryHeader}>
                <View style={styles.entryMeta}>
                  <TypePill category={entry.category} />
                  <Text
                    style={[
                      styles.entryDate,
                      t.atoms.text_contrast_medium,
                    ]}>
                    {entry.date}
                  </Text>
                </View>
              </View>
              <Text style={[styles.entryText, pal.text]} numberOfLines={3}>
                {entry.text}
              </Text>
              <View style={styles.entryActions}>
                <RedditVoteButton
                  score={entry.score}
                  currentVote={entry.viewerVote}
                  hasBeenToggled={localVotes[entry.id] !== undefined}
                  onUpvote={() =>
                    handleVote(
                      entry.id,
                      entry.viewerVote === 'upvote' ? 'none' : 'upvote',
                    )
                  }
                  onDownvote={() =>
                    handleVote(
                      entry.id,
                      entry.viewerVote === 'downvote' ? 'none' : 'downvote',
                    )
                  }
                />
                <View style={styles.entryFooter}>
                  <Text
                    style={[styles.footerStat, t.atoms.text_contrast_medium]}>
                    {entry.quotes} quotes
                  </Text>
                  <Text
                    style={[styles.footerStat, t.atoms.text_contrast_medium]}>
                    {entry.replies} replies
                  </Text>
                </View>
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
  overviewCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  overviewTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 16,
  },
  overviewRight: {
    alignItems: 'flex-end',
  },
  overviewKicker: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 3,
  },
  overviewValue: {
    fontSize: 24,
    fontWeight: '800',
  },
  mixRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mixItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 6,
  },
  mixCount: {
    fontSize: 14,
    fontWeight: '800',
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
    borderRadius: 8,
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
    flexShrink: 1,
    flexWrap: 'wrap',
    gap: 8,
  },
  typePill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  typePillText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  entryDate: {
    fontSize: 12,
  },
  entryText: {
    fontSize: 15,
    lineHeight: 21,
    marginBottom: 10,
  },
  entryActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  entryFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  footerStat: {
    fontSize: 12,
    fontWeight: '600',
  },
})
