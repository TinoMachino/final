import {useEffect, useRef, useState} from 'react'
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import {LinearGradient} from 'expo-linear-gradient'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'
import {useNavigation} from '@react-navigation/native'

import {CATEGORIES} from '#/lib/constants/mockData'
import {type NavigationProp} from '#/lib/routes/types'
import {
  useCommunityPoliciesQuery,
  useFeaturedPoliciesQuery,
  usePartyPoliciesQuery,
  useRecommendedPoliciesQuery,
  useStatePoliciesQuery,
} from '#/state/queries/data-tab'
import {useBaseFilter} from '#/state/shell/base-filter'
import {Text} from '#/view/com/util/text/Text'
import {atoms as a, useTheme} from '#/alf'
import {ActiveFiltersStackButton} from '#/components/BaseFilterControls'
import {SearchInput} from '#/components/forms/SearchInput'
import {Verified_Stroke2_Corner2_Rounded as VerifiedIcon} from '#/components/icons/Verified'
import * as Layout from '#/components/Layout'
import {WebScrollControls} from '#/components/WebScrollControls'
import {type PolicyItem} from './types'

export function PoliciesDashboard({route}: {route: any}) {
  const t = useTheme()
  useLingui()
  const navigation = useNavigation<NavigationProp>()
  const categoryScrollRef = useRef<ScrollView>(null)

  const mode = route.params?.mode as 'Policies' | 'Matters' | undefined
  const filterMode = route.params?.filter as
    | 'Communities'
    | 'Parties'
    | 'Both'
    | undefined

  const onPressItem = (item: PolicyItem) => {
    navigation.navigate('PolicyDetails', {
      item,
      cabildeoUri: item.cabildeoUri,
    })
  }

  const [activeTab, setActiveTab] = useState<'Matters' | 'Policies'>(
    mode || 'Policies',
  )
  const {activeFilters, activeState} = useBaseFilter()

  const [selectedCategory, setSelectedCategory] = useState('All')
  const [isVerifiedOnly, setIsVerifiedOnly] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (route.params?.category) {
      setSelectedCategory(route.params.category)
    }
  }, [route.params?.category])

  // Common params for all queries
  const queryType: 'Policy' | 'Matter' =
    activeTab === 'Policies' ? 'Policy' : 'Matter'
  const commonParams = {
    category: selectedCategory,
    verified: isVerifiedOnly,
    query: searchQuery,
    type: queryType,
    filters: activeFilters.length > 0 ? activeFilters : undefined,
  }

  // V2: Specialized Feed Queries
  const featuredQuery = useFeaturedPoliciesQuery(commonParams)
  const communityQuery = useCommunityPoliciesQuery(commonParams)
  const partyQuery = usePartyPoliciesQuery(commonParams)
  const recommendedQuery = useRecommendedPoliciesQuery(commonParams)

  const stateQuery = useStatePoliciesQuery({
    ...commonParams,
    state: activeState,
  })

  // Helper to extract items safely
  const getItems = (query: any) =>
    query.data?.pages.flatMap((p: any) => p.items) || []

  // V2: Directly sourced items
  const featuredItems = getItems(featuredQuery)
  const communityItems = getItems(communityQuery)
  const partyItems = getItems(partyQuery)
  const recommendedItems = getItems(recommendedQuery)
  const stateItems = getItems(stateQuery)

  // Control visible feeds based on filterMode from BaseScreen
  const showCommunity = filterMode !== 'Parties'
  const showParty = filterMode !== 'Communities'

  const isLoading =
    featuredQuery.isLoading ||
    communityQuery.isLoading ||
    partyQuery.isLoading ||
    recommendedQuery.isLoading ||
    stateQuery.isLoading

  const hasResults =
    featuredItems.length > 0 ||
    communityItems.length > 0 ||
    partyItems.length > 0 ||
    recommendedItems.length > 0 ||
    stateItems.length > 0

  const title =
    mode === 'Policies'
      ? 'Policies'
      : mode === 'Matters'
        ? 'Matters'
        : 'Policies & Matters'

  return (
    <Layout.Screen testID="policiesDashboard">
      <Layout.Header.Outer noBottomBorder>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>{title}</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot>
          <ActiveFiltersStackButton />
        </Layout.Header.Slot>
      </Layout.Header.Outer>

      {!mode && (
        <View style={[styles.tabBar, t.atoms.border_contrast_low]}>
          <TouchableOpacity
            accessibilityRole="button"
            style={[
              styles.tabItem,
              activeTab === 'Policies' && styles.tabItemActive,
              activeTab === 'Policies' && {
                borderBottomColor: t.palette.primary_500,
              },
            ]}
            onPress={() => setActiveTab('Policies')}>
            <Text
              style={[
                styles.tabText,
                activeTab === 'Policies'
                  ? [t.atoms.text, styles.tabTextActive]
                  : t.atoms.text_contrast_medium,
              ]}>
              Policies
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            style={[
              styles.tabItem,
              activeTab === 'Matters' && styles.tabItemActive,
              activeTab === 'Matters' && {
                borderBottomColor: t.palette.primary_500,
              },
            ]}
            onPress={() => setActiveTab('Matters')}>
            <Text
              style={[
                styles.tabText,
                activeTab === 'Matters'
                  ? [t.atoms.text, styles.tabTextActive]
                  : t.atoms.text_contrast_medium,
              ]}>
              Matters
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <Layout.Center style={{flex: 1}}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}>
          <View style={[styles.filterSection, {marginBottom: 12}]}>
            <SearchInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search policies, matters..."
              onClearText={() => setSearchQuery('')}
              style={styles.enhancedSearchBar}
            />
          </View>

          <View style={{position: 'relative'}}>
            <WebScrollControls
              scrollViewRef={categoryScrollRef}
              iconSize={16}
            />
            <ScrollView
              ref={categoryScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryScroll}>
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
                        width: 38, // Slightly smaller to match pills
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
                        width: 38, // Slightly smaller to match pills
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
              {CATEGORIES.map(cat => {
                const isSelected = selectedCategory === cat
                return (
                  <TouchableOpacity
                    accessibilityRole="button"
                    key={cat}
                    onPress={() => setSelectedCategory(cat)}>
                    {isSelected ? (
                      <View
                        style={[
                          styles.categoryPill,
                          {
                            backgroundColor: t.palette.primary_500,
                          },
                        ]}>
                        <Text
                          style={[styles.categoryPillText, {color: 'white'}]}>
                          {cat}
                        </Text>
                      </View>
                    ) : (
                      <View
                        style={[
                          styles.categoryPill,
                          t.atoms.bg_contrast_25,
                          {
                            borderWidth: 1,
                            borderColor:
                              t.atoms.border_contrast_low.borderColor,
                          },
                        ]}>
                        <Text style={[styles.categoryPillText, t.atoms.text]}>
                          {cat}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                )
              })}
            </ScrollView>
          </View>

          {/* Featured Feed */}
          {featuredItems.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, t.atoms.text]}>
                {selectedCategory !== 'All'
                  ? `${selectedCategory} Featured`
                  : 'Featured'}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.horizontalScroll}
                contentContainerStyle={{paddingRight: 16}}>
                {featuredItems.map((item: PolicyItem) => (
                  <View
                    key={item.id}
                    style={[
                      styles.featuredCardShadowContainer,
                      t.atoms.bg_contrast_25,
                    ]}>
                    <TouchableOpacity
                      accessibilityRole="button"
                      onPress={() => onPressItem(item)}
                      activeOpacity={0.9}>
                      <LinearGradient
                        colors={[
                          item.color || t.palette.primary_500,
                          (item.color || t.palette.primary_500) + '99',
                        ]}
                        start={{x: 0, y: 0}}
                        end={{x: 1, y: 1}}
                        style={styles.featuredCard}>
                        <View style={styles.featuredCardContent}>
                          <View style={{flex: 1}}>
                            <Text
                              numberOfLines={3}
                              style={[
                                styles.featuredCardTitle,
                                {color: 'white'},
                              ]}>
                              {item.title}
                            </Text>
                            <View style={styles.featuredBadge}>
                              <Text style={styles.featuredBadgeText}>
                                Featured
                              </Text>
                            </View>
                          </View>
                        </View>
                        <View
                          style={{
                            marginTop: 12,
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'flex-end',
                          }}>
                          <Text
                            style={[
                              styles.categoryLabel,
                              {color: 'rgba(255,255,255,0.8)'},
                            ]}>
                            {item.category}
                          </Text>
                          <Text style={[styles.policyStat, {color: 'white'}]}>
                            See details →
                          </Text>
                        </View>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Community Feed */}
          {showCommunity && communityItems.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, t.atoms.text]}>
                {selectedCategory !== 'All'
                  ? `${selectedCategory} Community ${activeTab}`
                  : `Community ${activeTab}`}
              </Text>
              {communityItems.map((item: PolicyItem) => (
                <View
                  key={item.id}
                  style={[
                    styles.policyCardShadowContainer,
                    t.atoms.bg_contrast_25,
                  ]}>
                  <TouchableOpacity
                    accessibilityRole="button"
                    onPress={() => onPressItem(item)}
                    style={[styles.policyCard, t.atoms.bg_contrast_25]}>
                    <View style={styles.policyHeader}>
                      <View style={{flex: 1, marginRight: 12}}>
                        <Text
                          style={[
                            styles.categoryLabel,
                            t.atoms.text_contrast_medium,
                            {
                              marginBottom: 4,
                              textTransform: 'uppercase',
                              fontSize: 10,
                              letterSpacing: 1,
                            },
                          ]}>
                          {item.category}
                        </Text>
                        <Text style={[styles.policyTitle, t.atoms.text]}>
                          {item.title}
                        </Text>
                      </View>
                      <View style={{alignItems: 'flex-end'}}>
                        {/* Stats removed for cleaner look, moved to Details */}
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* State Feed */}
          {stateItems.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, t.atoms.text]}>
                {activeState !== 'None'
                  ? selectedCategory !== 'All'
                    ? `${selectedCategory} ${activeTab} in ${activeState}`
                    : `${activeTab} in ${activeState}`
                  : selectedCategory !== 'All'
                    ? `${selectedCategory} State ${activeTab}`
                    : `State ${activeTab} Around Mexico`}
              </Text>
              {stateItems.map((item: PolicyItem) => (
                <View
                  key={item.id}
                  style={[
                    styles.policyCardShadowContainer,
                    t.atoms.bg_contrast_25,
                  ]}>
                  <TouchableOpacity
                    accessibilityRole="button"
                    onPress={() => onPressItem(item)}
                    style={[
                      styles.policyCard,
                      t.atoms.bg_contrast_25,
                      {borderLeftWidth: 4, borderLeftColor: item.color},
                    ]}>
                    <View style={styles.policyHeader}>
                      <View style={{flex: 1, marginRight: 12}}>
                        <View
                          style={{flexDirection: 'row', alignItems: 'center'}}>
                          <Text
                            style={[
                              styles.categoryLabel,
                              t.atoms.text_contrast_medium,
                              {
                                marginBottom: 4,
                                textTransform: 'uppercase',
                                fontSize: 10,
                                letterSpacing: 1,
                              },
                            ]}>
                            {item.category}
                          </Text>
                          <Text
                            style={[
                              t.atoms.text_contrast_low,
                              {fontSize: 10, marginLeft: 8, marginBottom: 4},
                            ]}>
                            • {item.state}
                          </Text>
                        </View>
                        <Text style={[styles.policyTitle, t.atoms.text]}>
                          {item.title}
                        </Text>
                      </View>
                      <View style={{alignItems: 'flex-end'}}>
                        {/* Stats removed */}
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Party Feed */}
          {showParty && partyItems.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, t.atoms.text]}>
                {selectedCategory !== 'All'
                  ? `${selectedCategory} Party ${activeTab}`
                  : `Party ${activeTab}`}
              </Text>
              {partyItems.map((item: PolicyItem) => (
                <View
                  key={item.id}
                  style={[
                    styles.policyCardShadowContainer,
                    t.atoms.bg_contrast_25,
                  ]}>
                  <TouchableOpacity
                    accessibilityRole="button"
                    onPress={() => onPressItem(item)}
                    style={[styles.policyCard, t.atoms.bg_contrast_25]}>
                    <View style={styles.policyHeader}>
                      <View style={{flex: 1, marginRight: 12}}>
                        <Text
                          style={[
                            styles.categoryLabel,
                            t.atoms.text_contrast_medium,
                            {
                              marginBottom: 4,
                              textTransform: 'uppercase',
                              fontSize: 10,
                              letterSpacing: 1,
                            },
                          ]}>
                          {item.category} • {item.party}
                        </Text>
                        <Text style={[styles.policyTitle, t.atoms.text]}>
                          {item.title}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {isLoading && (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color={t.palette.primary_500} />
            </View>
          )}

          {!isLoading && !hasResults && (
            <View style={styles.emptyState}>
              <Text
                style={[
                  t.atoms.text_contrast_medium,
                  {textAlign: 'center', fontSize: 16},
                ]}>
                No {activeTab.toLowerCase()} found.
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
    padding: 16,
    paddingBottom: 100,
  },
  enhancedSearchBar: {
    borderRadius: 24,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  filterSection: {
    marginBottom: 20,
  },
  searchBar: {
    padding: 12,
    borderRadius: 8,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  // Policy Card (Community)
  policyCard: {
    padding: 20,
    borderRadius: 20,
    // marginBottom: 16, // Moved to container
    // Shadows handled by atoms or elevation
    borderWidth: 0,
  },
  policyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  policyTitle: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },
  policyStatBig: {
    fontSize: 24,
    fontWeight: '800',
  },
  policyStat: {
    fontSize: 14,
    fontWeight: '700',
  },
  progressBarBg: {
    height: 10,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  horizontalScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
    overflow: 'visible',
  },
  partyCard: {
    width: 220,
    padding: 20,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 0,
    height: 160,
    justifyContent: 'space-between',
  },
  partyCardTitle: {
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: 12,
  },
  partyCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  partyCardStat: {
    fontSize: 12,
    fontWeight: '700',
  },
  trendIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  gridCard: {
    width: '47%', // Approx half
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 0,
  },
  gridCardTitle: {
    fontSize: 16, // slightly bigger
    fontWeight: '700',
    marginBottom: 8,
    lineHeight: 20,
  },
  gridCardMatch: {
    fontSize: 18,
    fontWeight: '800',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: 16,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    //
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
  },
  tabTextActive: {
    fontWeight: '800',
  },
  categoryScroll: {
    marginBottom: 24,
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  categoryPill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 30, // Fully rounded
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryPillText: {
    fontWeight: '600',
    fontSize: 14,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#CCCCCC',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  settingsSection: {
    marginBottom: 24,
  },
  settingsSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333333',
  },
  settingsOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  settingsOptionText: {
    fontSize: 16,
    color: '#333333',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CCCCCC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: '#474652',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#474652',
  },
  closeButton: {
    marginTop: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  filterButton: {
    width: 33,
    paddingHorizontal: 0,
    paddingVertical: 8,
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{translateY: 1}],
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  featuredCardShadowContainer: {
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    borderRadius: 24, // Need to match card radius for proper shadow appearance if bg is set
  },
  policyCardShadowContainer: {
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderRadius: 20,
  },
  featuredCard: {
    width: 280,
    height: 180,
    padding: 20,
    borderRadius: 24,
    // marginRight: 16, // Moved to container
    justifyContent: 'space-between',
    // Shadows removed to fix warning
  },
  featuredCardContent: {
    flexDirection: 'row',
  },
  featuredCardTitle: {
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: {width: 0, height: 2},
    textShadowRadius: 4,
  },
  featuredBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  featuredBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  gridHeaderGradient: {
    height: 6,
    width: '100%',
  },
  gridContent: {
    padding: 16,
  },
})
