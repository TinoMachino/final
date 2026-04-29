import {useMemo, useState} from 'react'
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import {LinearGradient} from 'expo-linear-gradient'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'
import {useNavigation} from '@react-navigation/native'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'

import {type CommonNavigatorParams, type NavigationProp} from '#/lib/routes/types'
import {
  type RepresentativeItem,
  useRepresentativesQuery,
} from '#/state/queries/data-tab'
import {useBaseFilter} from '#/state/shell/base-filter'
import {Text} from '#/view/com/util/text/Text'
import {atoms as a, useTheme} from '#/alf'
import {ActiveFiltersStackButton} from '#/components/BaseFilterControls'
import {SearchInput} from '#/components/forms/SearchInput'
import {Verified_Stroke2_Corner2_Rounded as VerifiedIcon} from '#/components/icons/Verified'
import {ArrowsDiagonalIn_Stroke2_Corner0_Rounded as SortIcon} from '#/components/icons/ArrowsDiagonal'
import {Person_Stroke2_Corner0_Rounded as UsersIcon} from '#/components/icons/Person'
import {Globe_Stroke2_Corner0_Rounded as BuildingIcon} from '#/components/icons/Globe'
import * as Layout from '#/components/Layout'

const CATEGORIES = [
  'All',
  'President',
  'Governor',
  'Senator',
  'Federal Deputy',
  'Leader',
  'Spokesperson',
  'Treasurer',
  'City Council',
  'Activist',
]

type SortMode = 'followers' | 'name'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'Representatives'>

export function RepresentativesScreen({route}: Props) {
  const {_} = useLingui()
  const t = useTheme()
  const navigation = useNavigation<NavigationProp>()

  const [selectedCategory, setSelectedCategory] = useState(
    route.params?.category || 'All',
  )
  const [searchQuery, setSearchQuery] = useState(route.params?.q || '')
  const [sortMode, setSortMode] = useState<SortMode>('followers')
  const {activeFilters} = useBaseFilter()

  // V2: Query Hook
  const {data, isLoading, error} = useRepresentativesQuery({
    category: selectedCategory,
    query: searchQuery,
  })

  const reps = data?.pages.flatMap(page => page.items) || []

  // Client-side filtering + sorting
  const filteredReps = useMemo(() => {
    let result = reps.filter(rep => {
      // Base Filter (Compass)
      if (activeFilters.length > 0) {
        const matchesFilter = activeFilters.some(
          filter => filter === rep.affiliate || filter === rep.state,
        )
        if (!matchesFilter) return false
      }
      return true
    })

    // Sort
    if (sortMode === 'followers') {
      result = [...result].sort((a, b) => {
        const aCount = a.followersCount ?? 0
        const bCount = b.followersCount ?? 0
        return bCount - aCount
      })
    } else {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name))
    }

    return result
  }, [reps, activeFilters, sortMode])

  const partyReps = filteredReps.filter(r => r.type === 'Party')
  const communityReps = filteredReps.filter(r => r.type === 'Community')

  // Stats
  const totalCount = filteredReps.length
  const partyCount = partyReps.length
  const communityCount = communityReps.length
  const totalFollowers = filteredReps.reduce(
    (sum, r) => sum + (r.followersCount ?? 0),
    0,
  )

  const onPressRep = (rep: RepresentativeItem) => {
    navigation.navigate('Profile', {name: rep.handle})
  }

  const getRepresentativeBadges = useMemo(
    () => (rep: RepresentativeItem) => {
      const badges: Array<{
        label: string
        tone: 'verified' | 'official' | 'state' | 'community'
      }> = [{label: 'Verified', tone: 'verified'}]

      if (rep.type === 'Party') {
        badges.push({label: 'Official', tone: 'official' as const})
      }

      if (rep.state !== 'National' && rep.municipality === 'State') {
        badges.push({label: 'State', tone: 'state' as const})
      } else if (rep.type === 'Community') {
        badges.push({label: 'Community', tone: 'community' as const})
      }

      return badges
    },
    [],
  )

  const formatCount = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
    return `${n}`
  }

  return (
    <Layout.Screen testID="representativesScreen">
      <Layout.Header.Outer noBottomBorder>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Representatives</Trans>
          </Layout.Header.TitleText>
          <Layout.Header.SubtitleText>
            Discover your representatives
          </Layout.Header.SubtitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot>
          <ActiveFiltersStackButton />
        </Layout.Header.Slot>
      </Layout.Header.Outer>

      <Layout.Center style={{flex: 1}}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}>
          <View style={[styles.filterSection, {marginBottom: 12}]}>
            <SearchInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              onClearText={() => setSearchQuery('')}
              placeholder={_(msg`Search names, handles...`)}
              style={styles.enhancedSearchBar}
            />
          </View>

          {/* Categories Horizontal Scroll */}
          <View style={styles.categoriesRow}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryScroll}>
              {CATEGORIES.map(cat => {
                const isSelected = selectedCategory === cat
                return (
                  <TouchableOpacity
                    accessibilityRole="button"
                    key={cat}
                    onPress={() => setSelectedCategory(cat)}
                    style={[
                      styles.categoryPill,
                      isSelected
                        ? {backgroundColor: t.palette.primary_500}
                        : [
                            t.atoms.bg_contrast_25,
                            {
                              borderWidth: 1,
                              borderColor:
                                t.atoms.border_contrast_low.borderColor,
                            },
                          ],
                    ]}>
                    <Text
                      style={[
                        styles.categoryPillText,
                        isSelected ? {color: 'white'} : t.atoms.text,
                      ]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </ScrollView>
          </View>

          {/* Stats Bar */}
          {!isLoading && !error && filteredReps.length > 0 && (
            <View style={[styles.statsBar, t.atoms.bg_contrast_25]}>
              <View style={styles.statItem}>
                <UsersIcon size="sm" style={[t.atoms.text_contrast_medium]} />
                <Text style={[styles.statValue, t.atoms.text]}>
                  {formatCount(totalFollowers)}
                </Text>
                <Text style={[styles.statLabel, t.atoms.text_contrast_medium]}>
                  Total Reach
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <BuildingIcon size="sm" style={[t.atoms.text_contrast_medium]} />
                <Text style={[styles.statValue, t.atoms.text]}>
                  {partyCount}
                </Text>
                <Text style={[styles.statLabel, t.atoms.text_contrast_medium]}>
                  Official
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, t.atoms.text]}>
                  {communityCount}
                </Text>
                <Text style={[styles.statLabel, t.atoms.text_contrast_medium]}>
                  Community
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, t.atoms.text]}>
                  {totalCount}
                </Text>
                <Text style={[styles.statLabel, t.atoms.text_contrast_medium]}>
                  Total
                </Text>
              </View>
            </View>
          )}

          {/* Sort Toggle */}
          {!isLoading && !error && filteredReps.length > 0 && (
            <View style={styles.sortRow}>
              <TouchableOpacity
                accessibilityRole="button"
                style={[
                  styles.sortBtn,
                  sortMode === 'followers'
                    ? {backgroundColor: t.palette.primary_500}
                    : t.atoms.bg_contrast_25,
                ]}
                onPress={() => setSortMode('followers')}>
                <SortIcon
                  size="xs"
                  style={{
                    color: sortMode === 'followers' ? 'white' : t.palette.contrast_400,
                  }}
                />
                <Text
                  style={[
                    styles.sortBtnText,
                    sortMode === 'followers'
                      ? {color: 'white'}
                      : t.atoms.text_contrast_medium,
                  ]}>
                  Followers
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                style={[
                  styles.sortBtn,
                  sortMode === 'name'
                    ? {backgroundColor: t.palette.primary_500}
                    : t.atoms.bg_contrast_25,
                ]}
                onPress={() => setSortMode('name')}>
                <SortIcon
                  size="xs"
                  style={{
                    color: sortMode === 'name' ? 'white' : t.palette.contrast_400,
                  }}
                />
                <Text
                  style={[
                    styles.sortBtnText,
                    sortMode === 'name'
                      ? {color: 'white'}
                      : t.atoms.text_contrast_medium,
                  ]}>
                  Name A-Z
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {isLoading && (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color={t.palette.primary_500} />
            </View>
          )}

          {error && (
            <View style={styles.emptyState}>
              <Text style={[t.atoms.text_contrast_high]}>
                Error loading representatives.
              </Text>
            </View>
          )}

          {!isLoading && !error && filteredReps.length > 0 ? (
            <>
              {partyReps.length > 0 && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, t.atoms.text]}>
                    Official Parties
                  </Text>
                  {partyReps.map(rep => (
                    <RepCard
                      key={rep.id}
                      rep={rep}
                      badges={getRepresentativeBadges(rep)}
                      onPress={() => onPressRep(rep)}
                      formatCount={formatCount}
                    />
                  ))}
                </View>
              )}

              {communityReps.length > 0 && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, t.atoms.text]}>
                    Communities
                  </Text>
                  {communityReps.map(rep => (
                    <RepCard
                      key={rep.id}
                      rep={rep}
                      badges={getRepresentativeBadges(rep)}
                      onPress={() => onPressRep(rep)}
                      formatCount={formatCount}
                      variant="community"
                    />
                  ))}
                </View>
              )}
            </>
          ) : (
            !isLoading &&
            !error && (
              <View style={styles.emptyState}>
                <Text
                  style={[t.atoms.text_contrast_medium, {textAlign: 'center'}]}>
                  No representatives found for this selection.
                </Text>
              </View>
            )
          )}
        </ScrollView>
      </Layout.Center>
    </Layout.Screen>
  )
}

// ── RepCard component ──

function RepCard({
  rep,
  badges,
  onPress,
  formatCount,
  variant = 'party',
}: {
  rep: RepresentativeItem
  badges: Array<{label: string; tone: 'verified' | 'official' | 'state' | 'community'}>
  onPress: () => void
  formatCount: (n: number) => string
  variant?: 'party' | 'community'
}) {
  const t = useTheme()

  return (
    <TouchableOpacity
      accessibilityRole="button"
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.repCard,
        t.atoms.bg_contrast_25,
        t.atoms.shadow_sm,
      ]}>
      {variant === 'party' && (
        <LinearGradient
          colors={[
            rep.avatarColor || t.palette.primary_500,
            (rep.avatarColor || t.palette.primary_500) + '20',
          ]}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 0}}
          style={styles.cardGradientBorder}
        />
      )}
      <View
        style={[
          styles.avatar,
          {backgroundColor: rep.avatarColor},
        ]}
      />
      <View style={styles.repInfo}>
        <Text style={[styles.repName, t.atoms.text]}>
          {rep.name}
        </Text>
        <View style={styles.badgesRow}>
          {badges.map(badge => (
            <View
              key={`${rep.id}-${badge.label}`}
              style={[
                styles.badgePill,
                badge.tone === 'verified'
                  ? {backgroundColor: t.palette.primary_25}
                  : badge.tone === 'official'
                    ? {backgroundColor: 'rgba(52, 199, 89, 0.14)'}
                    : {backgroundColor: t.palette.contrast_25},
              ]}>
              {badge.tone === 'verified' ? (
                <VerifiedIcon
                  size="xs"
                  style={{color: t.palette.primary_600}}
                />
              ) : null}
              <Text
                style={[
                  styles.badgeText,
                  badge.tone === 'verified'
                    ? {color: t.palette.primary_700}
                    : badge.tone === 'official'
                      ? {color: '#34C759'}
                      : t.atoms.text_contrast_medium,
                ]}>
                {badge.label}
              </Text>
            </View>
          ))}
        </View>
        <Text
          style={[
            styles.repHandle,
            t.atoms.text_contrast_medium,
          ]}>
          {rep.handle} • {rep.category}
        </Text>
        <Text
          style={[
            styles.repAffiliate,
            t.atoms.text_contrast_low,
            {fontSize: 12, fontWeight: '600'},
          ]}>
          {rep.affiliate}
        </Text>
        {rep.followersCount !== undefined && (
          <Text
            style={[
              styles.followerCount,
              t.atoms.text_contrast_medium,
            ]}>
            {formatCount(rep.followersCount)} followers
          </Text>
        )}
      </View>
      <View
        style={[
          styles.viewProfileBtn,
          variant === 'party'
            ? {backgroundColor: t.palette.primary_500}
            : {borderColor: t.palette.primary_500, borderWidth: 1},
        ]}>
        <Text
          style={{
            color: variant === 'party' ? 'white' : t.palette.primary_500,
            fontWeight: variant === 'party' ? '700' : '600',
            fontSize: 12,
          }}>
          View
        </Text>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  filterSection: {
    marginBottom: 16,
  },
  enhancedSearchBar: {
    borderRadius: 24,
  },
  categoriesRow: {
    marginBottom: 16,
  },
  categoryScroll: {},
  categoryPill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 30,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryPillText: {
    fontWeight: '600',
    fontSize: 14,
  },
  // Stats bar
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  // Sort
  sortRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  sortBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  // Section
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  // Card
  repCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 0,
    overflow: 'hidden',
    position: 'relative',
  },
  cardGradientBorder: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
    marginLeft: 6,
  },
  repInfo: {
    flex: 1,
    marginRight: 12,
  },
  repName: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 2,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  repHandle: {
    fontSize: 13,
    marginBottom: 4,
  },
  repAffiliate: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  followerCount: {
    fontSize: 12,
    marginTop: 2,
  },
  viewProfileBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
})
