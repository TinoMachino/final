/**
 * HighlightsScreen V5 - Grouped Community Feeds
 * Features: Separate feeds per selected community/state, dynamic color headers, upvotes
 * Data Source: com.para.highlight.listHighlights backed by persisted highlight annotations.
 */
import {useCallback, useMemo, useRef, useState} from 'react'
import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {useFocusEffect, useNavigation} from '@react-navigation/native'

import {NINTHS_COMMUNITIES} from '#/lib/communities'
import {type Highlight} from '#/lib/mock-data'
import {type NavigationProp} from '#/lib/routes/types'
import {
  deleteHighlight,
  getAllHighlights,
  saveHighlight,
} from '#/state/highlights/highlightStorage'
import {type HighlightColor} from '#/state/highlights/highlightTypes'
import {useHighlightVoteMutation} from '#/state/mutations/highlights'
import {useHighlightsQuery} from '#/state/queries/highlights'
import {useBaseFilter} from '#/state/shell/base-filter'
import {Text} from '#/view/com/util/text/Text'
import {atoms as a, useTheme} from '#/alf'
import {ActiveFiltersStackButton} from '#/components/BaseFilterControls'
import {SearchInput} from '#/components/forms/SearchInput'
import {ArrowTop_Stroke2_Corner0_Rounded as UpvoteIcon} from '#/components/icons/Arrow'
import {Bookmark, BookmarkFilled} from '#/components/icons/Bookmark'
import {Trending3_Stroke2_Corner1_Rounded as TrendIcon} from '#/components/icons/Trending'
import {Verified_Stroke2_Corner2_Rounded as VerifiedIcon} from '#/components/icons/Verified'
import * as Layout from '#/components/Layout'
import {RedditVoteButton} from '#/components/PostControls/VoteButton'
import {WebScrollControls} from '#/components/WebScrollControls'

// Sort options
type SortOption = 'recent' | 'popular' | 'mostSaved'
const SAVED_HIGHLIGHT_PREFIX = 'saved:'

const SORT_OPTIONS: {
  key: SortOption
  label: string
  icon: 'time' | 'upvote' | 'bookmark'
}[] = [
  {key: 'recent', label: 'Recent', icon: 'time'},
  {key: 'popular', label: 'Top Voted', icon: 'upvote'},
  {key: 'mostSaved', label: 'Saved', icon: 'bookmark'},
]

// Color filter options — use community name for matching, not just hex
const COLOR_FILTERS = [
  {label: 'All', color: null, communityName: null},
  ...Object.values(NINTHS_COMMUNITIES).map(c => ({
    label: c.name,
    color: c.color,
    communityName: c.name,
  })),
]

// Helper function to determine contrasting text color
const getContrastingTextColor = (hexColor: string): string => {
  const hex = hexColor.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? '#333333' : '#FFFFFF'
}

const getHighlightSubjectUri = (highlight: Highlight) =>
  highlight.sourcePostUri || highlight.id

const getSavedHighlightId = (highlightId: string) =>
  `${SAVED_HIGHLIGHT_PREFIX}${highlightId}`

function FeedSection({
  title,
  filterName,
  globalColor,
  searchQuery,
  isVerifiedOnly,
  sortBy,
  highlights,
  toggleSave,
  savedHighlights,
  onVote,
  onCardPress,
}: {
  title: string
  filterName: string // Community or State name
  globalColor: string | null
  searchQuery: string
  isVerifiedOnly: boolean
  sortBy: SortOption
  highlights: Highlight[]
  toggleSave: (id: string) => void
  savedHighlights: Set<string>
  onVote: (id: string, direction: 'up' | 'down') => void
  onCardPress: (id: string) => void
}) {
  const t = useTheme()

  const filteredData = useMemo(() => {
    let filtered = highlights.filter(h => {
      // 1. Filter by Section Scope (Community OR State)
      const matchesSection =
        filterName === 'For You' ||
        (filterName === 'Trending Highlights' && h.isTrending) ||
        (filterName === 'Most Saved' && h.saves > 100) ||
        (filterName === 'Verified Voices' && h.isVerified) ||
        (filterName === 'Rising' && h.upvotes >= 200 && h.upvotes < 800) ||
        h.community === filterName ||
        h.state === filterName

      // 2. Global Color Filter — match by community name for reliability
      const matchesColor = globalColor ? h.community === globalColor : true

      // 3. Search Query
      const matchesSearch = searchQuery
        ? h.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
          h.postAuthor.toLowerCase().includes(searchQuery.toLowerCase()) ||
          h.community.toLowerCase().includes(searchQuery.toLowerCase()) ||
          h.state?.toLowerCase().includes(searchQuery.toLowerCase())
        : true

      // 4. Verified
      const matchesVerified = isVerifiedOnly ? h.isVerified : true

      return matchesSection && matchesColor && matchesSearch && matchesVerified
    })

    // Sort
    switch (sortBy) {
      case 'popular':
        filtered = filtered.sort((a, b) => b.upvotes - a.upvotes)
        break
      case 'mostSaved':
        filtered = filtered.sort((a, b) => b.saves - a.saves)
        break
      case 'recent':
      default:
        filtered = filtered.sort((a, b) => b.createdAt - a.createdAt)
        break
    }

    return filtered
  }, [highlights, filterName, globalColor, searchQuery, isVerifiedOnly, sortBy])

  if (filteredData.length === 0) return null

  return (
    <View style={styles.feedSection}>
      <View style={styles.feedHeader}>
        <Text style={[styles.feedTitle, t.atoms.text]}>{title}</Text>
        <Text style={[styles.feedCount, t.atoms.text_contrast_low]}>
          {filteredData.length}
        </Text>
      </View>

      <View style={styles.sectionList}>
        {filteredData.map(highlight => (
          <Pressable
            accessibilityRole="button"
            key={highlight.id}
            onPress={() => onCardPress(highlight.id)}
            style={({pressed}) => [
              styles.highlightCard,
              t.atoms.bg_contrast_25,
              {borderLeftWidth: 4, borderLeftColor: highlight.color},
              pressed && {opacity: 0.85},
            ]}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <View
                  style={[
                    styles.tagBadge,
                    {backgroundColor: highlight.color + '30'},
                  ]}>
                  <Text style={[styles.tagText, {color: highlight.color}]}>
                    {highlight.community}
                  </Text>
                </View>
                {highlight.state && (
                  <Text style={[styles.stateLabel, t.atoms.text_contrast_low]}>
                    {highlight.state}
                  </Text>
                )}
                {highlight.isVerified && (
                  <VerifiedIcon
                    width={16}
                    height={16}
                    style={{color: t.palette.primary_500}}
                  />
                )}
                {highlight.isTrending && (
                  <View
                    style={[
                      styles.trendingBadge,
                      {backgroundColor: t.palette.primary_500 + '20'},
                    ]}>
                    <TrendIcon
                      width={12}
                      height={12}
                      style={{color: t.palette.primary_500}}
                    />
                    <Text
                      style={[
                        styles.trendingText,
                        {color: t.palette.primary_500},
                      ]}>
                      Trending
                    </Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => toggleSave(highlight.id)}
                hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                {savedHighlights.has(highlight.id) ? (
                  <BookmarkFilled
                    width={20}
                    height={20}
                    style={{color: t.palette.primary_500}}
                  />
                ) : (
                  <Bookmark
                    width={20}
                    height={20}
                    style={t.atoms.text_contrast_low}
                  />
                )}
              </TouchableOpacity>
            </View>

            <View
              style={[
                styles.highlightedTextContainer,
                {backgroundColor: highlight.color},
              ]}>
              <Text
                style={[
                  styles.highlightedText,
                  {color: getContrastingTextColor(highlight.color)},
                ]}>
                "{highlight.text.split('#')[0].trim()}"
              </Text>
            </View>

            <Text
              style={[styles.postPreview, t.atoms.text_contrast_medium]}
              numberOfLines={2}>
              {highlight.postPreview}
            </Text>

            <View style={styles.cardFooter}>
              <View style={styles.authorRow}>
                <Image
                  accessibilityIgnoresInvertColors
                  source={{uri: highlight.avatarUrl}}
                  style={[
                    styles.cardAvatar,
                    {borderColor: highlight.color, borderWidth: 2},
                  ]}
                />
                <View style={{flex: 1}}>
                  <Text
                    style={[styles.authorName, t.atoms.text]}
                    numberOfLines={1}>
                    {highlight.authorName}
                  </Text>
                  <View style={styles.cardFlairRow}>
                    <View
                      style={[
                        styles.cardAuthorFlair,
                        {
                          backgroundColor: highlight.color + '18',
                          borderColor: highlight.color + '40',
                        },
                      ]}>
                      <View
                        style={[
                          styles.cardFlairDotInline,
                          {backgroundColor: highlight.color},
                        ]}
                      />
                      <Text
                        style={[
                          styles.cardFlairText,
                          {color: highlight.color},
                        ]}>
                        {highlight.community}
                      </Text>
                    </View>
                    {highlight.party && (
                      <View
                        style={[styles.cardPartyFlair, t.atoms.bg_contrast_50]}>
                        <Text
                          style={[
                            styles.cardPartyFlairText,
                            t.atoms.text_contrast_medium,
                          ]}>
                          {highlight.party}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
              <View style={styles.footerRight}>
                <RedditVoteButton
                  score={highlight.upvotes - (highlight.downvotes || 0)}
                  currentVote={
                    highlight.viewerHasUpvoted
                      ? 'upvote'
                      : highlight.viewerHasDownvoted
                        ? 'downvote'
                        : 'none'
                  }
                  hasBeenToggled={false}
                  onUpvote={() => onVote(highlight.id, 'up')}
                  onDownvote={() => onVote(highlight.id, 'down')}
                />
              </View>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  )
}

export function HighlightsScreen() {
  const t = useTheme()
  const {_} = useLingui()
  const _navigation = useNavigation<NavigationProp>()
  const {activeFilters} = useBaseFilter()
  const filterScrollRef = useRef<ScrollView>(null)

  const [refreshing, setRefreshing] = useState(false)
  const [selectedColorFilter, setSelectedColorFilter] = useState<{
    color: string | null
    communityName: string | null
  }>({color: null, communityName: null})
  const [searchQuery, setSearchQuery] = useState('')
  const [isVerifiedOnly, setIsVerifiedOnly] = useState(false)
  const [sortBy, setSortBy] = useState<SortOption>('recent')
  const [savedHighlights, setSavedHighlights] = useState<Set<string>>(new Set())

  // Load saved highlights on focus
  useFocusEffect(
    useCallback(() => {
      const all = getAllHighlights()
      const savedIds = new Set(
        all
          .filter(h => h.id.startsWith(SAVED_HIGHLIGHT_PREFIX))
          .map(h => h.id.slice(SAVED_HIGHLIGHT_PREFIX.length)),
      )
      setSavedHighlights(savedIds)
    }, []),
  )

  const {
    data: highlights = [],
    isLoading: _isLoading,
    isError: _isError,
    refetch,
  } = useHighlightsQuery()

  const {mutate: voteHighlight} = useHighlightVoteMutation()

  // Optimistic local vote state: { [highlightId]: 'up' | 'down' | 'none' }
  const [localVotes, setLocalVotes] = useState<
    Record<string, 'up' | 'down' | 'none'>
  >({})

  // Merge local votes into highlights for UI display
  const highlightsWithVotes = useMemo(() => {
    return highlights.map(h => {
      const vote = localVotes[h.id]
      if (!vote) return h

      const wasUp = h.viewerHasUpvoted
      const wasDown = h.viewerHasDownvoted

      if (vote === 'up') {
        return {
          ...h,
          upvotes: h.upvotes + (wasUp ? 0 : 1),
          downvotes: (h.downvotes || 0) - (wasDown ? 1 : 0),
          viewerHasUpvoted: true,
          viewerHasDownvoted: false,
        }
      } else if (vote === 'down') {
        return {
          ...h,
          upvotes: h.upvotes - (wasUp ? 1 : 0),
          downvotes: (h.downvotes || 0) + (wasDown ? 0 : 1),
          viewerHasUpvoted: false,
          viewerHasDownvoted: true,
        }
      } else {
        // 'none' — user toggled off
        return {
          ...h,
          upvotes: h.upvotes - (wasUp ? 1 : 0),
          downvotes: (h.downvotes || 0) - (wasDown ? 1 : 0),
          viewerHasUpvoted: false,
          viewerHasDownvoted: false,
        }
      }
    })
  }, [highlights, localVotes])

  const handleVote = useCallback(
    (id: string, direction: 'up' | 'down') => {
      // Optimistic update
      setLocalVotes(prev => {
        const current = prev[id]
        // Toggle: if already voted this direction, remove vote
        const newVote = current === direction ? 'none' : direction
        return {...prev, [id]: newVote}
      })
      // Fire mutation
      voteHighlight({id, direction})
    },
    [voteHighlight],
  )

  const handleCardPress = useCallback(
    (id: string) => {
      _navigation.navigate('SeeHighlightDetails', {highlightId: id})
    },
    [_navigation],
  )

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await refetch()
    } catch (e) {
      console.error(e)
    } finally {
      setTimeout(() => setRefreshing(false), 1000)
    }
  }, [refetch])

  const toggleSave = useCallback(
    (highlightId: string) => {
      const isSaved = savedHighlights.has(highlightId)
      const highlight = highlightsWithVotes.find(h => h.id === highlightId)
      if (!highlight) return

      const subjectUri = getHighlightSubjectUri(highlight)
      const savedHighlightId = getSavedHighlightId(highlightId)

      if (isSaved) {
        deleteHighlight(subjectUri, savedHighlightId)

        setSavedHighlights(prev => {
          const next = new Set(prev)
          next.delete(highlightId)
          return next
        })
      } else {
        const postText = highlight.postPreview || highlight.text
        const start =
          typeof highlight.start === 'number'
            ? highlight.start
            : Math.max(0, postText.indexOf(highlight.text))
        const end =
          typeof highlight.end === 'number'
            ? highlight.end
            : start + highlight.text.length

        saveHighlight(subjectUri, {
          id: savedHighlightId,
          start,
          end,
          color: (highlight.color || '#FEF08A') as HighlightColor,
          text: highlight.text,
          isPublic: false,
          tag: highlight.community,
        })

        setSavedHighlights(prev => {
          const next = new Set(prev)
          next.add(highlightId)
          return next
        })
      }
    },
    [savedHighlights, highlightsWithVotes],
  )

  return (
    <Layout.Screen testID="highlightsScreen">
      <Layout.Header.Outer noBottomBorder>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            {_(msg`Highlights`)}
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot>
          <ActiveFiltersStackButton />
        </Layout.Header.Slot>
      </Layout.Header.Outer>

      <Layout.Center style={{flex: 1}}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                void onRefresh()
              }}
            />
          }>
          {/* Filter Section */}
          <View style={styles.filterSection}>
            <View style={{paddingHorizontal: 16}}>
              <SearchInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search highlights..."
                onClearText={() => setSearchQuery('')}
                style={styles.searchBar}
              />
            </View>
          </View>

          {/* Quadrant filters */}
          <View style={{position: 'relative'}}>
            <WebScrollControls scrollViewRef={filterScrollRef} iconSize={16} />
            <ScrollView
              ref={filterScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filtersContainer}
              contentContainerStyle={styles.filtersContent}>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => setIsVerifiedOnly(!isVerifiedOnly)}
                style={{marginRight: 10, justifyContent: 'center'}}>
                {isVerifiedOnly ? (
                  <View
                    style={[
                      a.rounded_full,
                      {
                        backgroundColor: t.palette.primary_500,
                        width: 38,
                        height: 38,
                        justifyContent: 'center',
                        alignItems: 'center',
                      },
                    ]}>
                    <VerifiedIcon
                      width={20}
                      height={20}
                      style={{color: 'white'}}
                    />
                  </View>
                ) : (
                  <View
                    style={[
                      a.rounded_full,
                      t.atoms.bg_contrast_25,
                      {
                        width: 38,
                        height: 38,
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: t.atoms.border_contrast_low.borderColor,
                      },
                    ]}>
                    <VerifiedIcon width={20} height={20} style={t.atoms.text} />
                  </View>
                )}
              </TouchableOpacity>

              {COLOR_FILTERS.map(filter => {
                const isSelected =
                  selectedColorFilter.communityName === filter.communityName
                return (
                  <TouchableOpacity
                    accessibilityRole="button"
                    key={filter.label}
                    onPress={() =>
                      setSelectedColorFilter({
                        color: filter.color,
                        communityName: filter.communityName,
                      })
                    }>
                    {isSelected ? (
                      <View
                        style={[
                          styles.filterPill,
                          {
                            backgroundColor:
                              filter.color || t.palette.primary_500,
                          },
                        ]}>
                        <Text
                          style={[
                            styles.filterPillText,
                            {
                              color: filter.color
                                ? getContrastingTextColor(filter.color)
                                : 'white',
                            },
                          ]}>
                          {filter.label}
                        </Text>
                      </View>
                    ) : (
                      <View
                        style={[
                          styles.filterPill,
                          t.atoms.bg_contrast_25,
                          {
                            borderWidth: 1,
                            borderColor:
                              filter.color ||
                              t.atoms.border_contrast_low.borderColor,
                          },
                        ]}>
                        <Text style={[styles.filterPillText, t.atoms.text]}>
                          {filter.label}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                )
              })}
            </ScrollView>
          </View>

          {/* Sort Options */}
          <View style={styles.sortContainer}>
            <Text style={[styles.sortLabel, t.atoms.text_contrast_medium]}>
              Sort by:
            </Text>
            {SORT_OPTIONS.map(option => (
              <TouchableOpacity
                key={option.key}
                accessibilityRole="button"
                onPress={() => setSortBy(option.key)}
                style={[
                  styles.sortButton,
                  sortBy === option.key && {
                    backgroundColor: t.palette.primary_500 + '20',
                    borderColor: t.palette.primary_500,
                  },
                  sortBy !== option.key && t.atoms.bg_contrast_25,
                ]}>
                {option.icon === 'upvote' && (
                  <UpvoteIcon
                    width={14}
                    height={14}
                    style={
                      sortBy === option.key
                        ? {color: t.palette.primary_500}
                        : t.atoms.text
                    }
                  />
                )}
                {option.icon === 'bookmark' && (
                  <Bookmark
                    width={14}
                    height={14}
                    style={
                      sortBy === option.key
                        ? {color: t.palette.primary_500}
                        : t.atoms.text
                    }
                  />
                )}
                {option.icon === 'time' && (
                  <TrendIcon
                    width={14}
                    height={14}
                    style={
                      sortBy === option.key
                        ? {color: t.palette.primary_500}
                        : t.atoms.text
                    }
                  />
                )}
                <Text
                  style={[
                    styles.sortButtonText,
                    sortBy === option.key
                      ? {color: t.palette.primary_500, fontWeight: '700'}
                      : t.atoms.text,
                  ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Grouped Feeds */}
          {activeFilters.length > 0 ? (
            activeFilters.map(filterName => (
              <FeedSection
                key={filterName}
                title={filterName}
                filterName={filterName}
                globalColor={selectedColorFilter.communityName}
                searchQuery={searchQuery}
                isVerifiedOnly={isVerifiedOnly}
                sortBy={sortBy}
                highlights={highlightsWithVotes}
                toggleSave={toggleSave}
                savedHighlights={savedHighlights}
                onVote={handleVote}
                onCardPress={handleCardPress}
              />
            ))
          ) : (
            <>
              <FeedSection
                title="🔥 Trending"
                filterName="Trending Highlights"
                globalColor={selectedColorFilter.communityName}
                searchQuery={searchQuery}
                isVerifiedOnly={isVerifiedOnly}
                sortBy={sortBy}
                highlights={highlightsWithVotes}
                toggleSave={toggleSave}
                savedHighlights={savedHighlights}
                onVote={handleVote}
                onCardPress={handleCardPress}
              />
              <FeedSection
                title="💾 Most Saved"
                filterName="Most Saved"
                globalColor={selectedColorFilter.communityName}
                searchQuery={searchQuery}
                isVerifiedOnly={isVerifiedOnly}
                sortBy="mostSaved"
                highlights={highlightsWithVotes}
                toggleSave={toggleSave}
                savedHighlights={savedHighlights}
                onVote={handleVote}
                onCardPress={handleCardPress}
              />
              <FeedSection
                title="✅ Verified Voices"
                filterName="Verified Voices"
                globalColor={selectedColorFilter.communityName}
                searchQuery={searchQuery}
                isVerifiedOnly={isVerifiedOnly}
                sortBy={sortBy}
                highlights={highlightsWithVotes}
                toggleSave={toggleSave}
                savedHighlights={savedHighlights}
                onVote={handleVote}
                onCardPress={handleCardPress}
              />
              <FeedSection
                title="📈 Rising"
                filterName="Rising"
                globalColor={selectedColorFilter.communityName}
                searchQuery={searchQuery}
                isVerifiedOnly={isVerifiedOnly}
                sortBy="recent"
                highlights={highlightsWithVotes}
                toggleSave={toggleSave}
                savedHighlights={savedHighlights}
                onVote={handleVote}
                onCardPress={handleCardPress}
              />
              <FeedSection
                title="🌐 For You"
                filterName="For You"
                globalColor={selectedColorFilter.communityName}
                searchQuery={searchQuery}
                isVerifiedOnly={isVerifiedOnly}
                sortBy={sortBy}
                highlights={highlightsWithVotes}
                toggleSave={toggleSave}
                savedHighlights={savedHighlights}
                onVote={handleVote}
                onCardPress={handleCardPress}
              />
            </>
          )}

          {/* Empty State */}
          {activeFilters.length > 0 && highlights.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyStateText, t.atoms.text]}>
                No highlights in {activeFilters.join(', ')}
              </Text>
              <Text
                style={[
                  styles.emptyStateSubtext,
                  t.atoms.text_contrast_medium,
                ]}>
                Try adjusting your filters or check back later.
              </Text>
            </View>
          )}
        </ScrollView>
      </Layout.Center>
    </Layout.Screen>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  filterSection: {
    marginBottom: 12,
  },
  searchBar: {
    borderRadius: 24,
  },
  filtersContainer: {
    marginBottom: 12,
  },
  filtersContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 30,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterPillText: {
    fontWeight: '600',
    fontSize: 13,
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 20,
    gap: 8,
  },
  sortLabel: {
    fontSize: 13,
    marginRight: 4,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  sortButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  // Feed Sections
  feedSection: {
    marginBottom: 24,
  },
  feedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  feedTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  feedCount: {
    fontSize: 14,
    fontWeight: '500',
  },
  stateLabel: {
    fontSize: 11,
    marginLeft: 2,
  },
  trendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 3,
  },
  trendingText: {
    fontSize: 10,
    fontWeight: '700',
  },
  sectionList: {
    paddingHorizontal: 16,
    gap: 16,
  },
  highlightCard: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tagBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  highlightedTextContainer: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  highlightedText: {
    fontSize: 15,
    fontWeight: '600',
    fontStyle: 'italic',
    lineHeight: 22,
  },
  postPreview: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  authorName: {
    fontSize: 13,
    fontWeight: '600',
  },
  authorHandle: {
    fontSize: 12,
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  // Card Flair
  cardFlairRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    marginTop: 2,
  },
  cardAuthorFlair: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  cardFlairDotInline: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  cardFlairText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  cardPartyFlair: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  cardPartyFlairText: {
    fontSize: 10,
    fontWeight: '600',
  },
})
