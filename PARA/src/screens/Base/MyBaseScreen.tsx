import {useCallback, useMemo, useState} from 'react'
import {
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import {AtUri} from '@atproto/api'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'
import {useFocusEffect, useNavigation} from '@react-navigation/native'

import {type CabildeoView} from '#/lib/cabildeo-client'
import {
  type DebateKind,
  getCabildeoBadge,
  getCabildeoPhaseMeta,
  getCabildeoTotalParticipants,
  getViewerParticipation,
} from '#/lib/cabildeo-display'
import {
  POLITICAL_AFFILIATION_TYPE_LABELS,
  type PoliticalAffiliation,
} from '#/lib/political-affiliations'
import {type NavigationProp} from '#/lib/routes/types'
import {USER_FLAIRS} from '#/lib/tags'
import {deleteHighlight, getAllHighlights} from '#/state/highlights'
import {type HighlightData} from '#/state/highlights'
import {useCabildeosQuery} from '#/state/queries/cabildeo'
import {useProfileQuery} from '#/state/queries/profile'
import {useSession} from '#/state/session'
import {usePoliticalAffiliation} from '#/state/shell/political-affiliation'
import {FOLLOWED_ITEM_CATEGORIES, useFollowedItems} from '#/state/topics'
import {type FollowedItem} from '#/state/topics'
import {Text} from '#/view/com/util/text/Text'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useTheme} from '#/alf'
import {ColorStack} from '#/components/AvatarStack'
import {Button, ButtonIcon} from '#/components/Button'
import {ChevronRight_Stroke2_Corner0_Rounded as ChevronRight} from '#/components/icons/Chevron'
import {SettingsGear2_Stroke2_Corner0_Rounded as SettingsIcon} from '#/components/icons/SettingsGear2'
import {TimesLarge_Stroke2_Corner0_Rounded as XIcon} from '#/components/icons/Times'
import {Tree_Stroke2_Corner0_Rounded as TreeIcon} from '#/components/icons/Tree'
import * as Layout from '#/components/Layout'
import {toClout} from '#/analytics/metrics'

// ---------------------------------------------------------------------------
// MyBaseScreen
// ---------------------------------------------------------------------------
type MetricKey = 'Influence' | 'Votes' | 'Posts' | 'Followers' | 'Following'

type MyBaseDebateCard = {
  uri: string
  title: string
  description: string
  kind: DebateKind
  badgeLabel: string
  badgeColor: string
  badgeBackground: string
  phaseLabel: string
  phaseColor: string
  participationLabel: string
  optionLabel?: string
  participationCount: number
  communityLabel: string
  createdAt: string
}

export function MyBaseScreen() {
  const {_, i18n} = useLingui()
  const t = useTheme()
  const {currentAccount} = useSession()
  const navigation = useNavigation<NavigationProp>()
  const currentDid = currentAccount?.did
  const {data: currentProfile} = useProfileQuery({did: currentDid})
  const {data: cabildeos = [], isLoading: isCabildeosLoading} =
    useCabildeosQuery()
  const {affiliations} = usePoliticalAffiliation()
  const [myHighlights, setMyHighlights] = useState<HighlightData[]>([])
  const [selectedFlair, setSelectedFlair] = useState<
    (typeof USER_FLAIRS)[keyof typeof USER_FLAIRS]
  >(USER_FLAIRS.CENTRISM)

  const [showFlairModal, setShowFlairModal] = useState(false)

  // Load highlights on focus
  useFocusEffect(
    useCallback(() => {
      setMyHighlights(getAllHighlights())
    }, []),
  )

  const handleDeleteHighlight = useCallback((highlight: HighlightData) => {
    deleteHighlight(highlight.postUri, highlight.id)
    setMyHighlights(getAllHighlights())
  }, [])

  // Followed topics/items
  const {items: followedItems, unfollow: unfollowItem} = useFollowedItems()

  const participatedDebates = useMemo(
    () => cabildeos.filter(item => getViewerParticipation(item)),
    [cabildeos],
  )

  const votedPolicyCards = useMemo(
    () => buildMyBaseDebateCards(participatedDebates, 'policy'),
    [participatedDebates],
  )

  const votedMatterCards = useMemo(
    () => buildMyBaseDebateCards(participatedDebates, 'matter'),
    [participatedDebates],
  )

  const influenceScore = useMemo(() => {
    const followerClout = toClout(currentProfile?.followersCount ?? 0) ?? 0
    return followerClout + myHighlights.length + followedItems.length
  }, [currentProfile?.followersCount, myHighlights.length, followedItems.length])

  const formatCount = useCallback(
    (value: number | undefined | null) => i18n.number(value ?? 0),
    [i18n],
  )

  const profileHandle = currentProfile?.handle
  const profileHandleText = profileHandle ? `@${profileHandle}` : '@para'
  const profileDisplayName =
    currentProfile?.displayName || currentProfile?.handle || 'User'

  const affiliationSummary = useMemo(
    () => summarizeAffiliations(affiliations),
    [affiliations],
  )

  const onPressPolicyTree = () => {
    navigation.navigate('Compass')
  }

  const onPressRAQ = () => {
    navigation.navigate('RAQ')
  }

  const onPressMetric = (metric: MetricKey) => {
    if (metric === 'Followers') {
      if (profileHandle) {
        navigation.push('ProfileFollowers', {name: profileHandle})
      }
    } else if (metric === 'Following') {
      if (profileHandle) {
        navigation.push('ProfileFollows', {name: profileHandle})
      }
    } else if (metric === 'Influence') {
      navigation.navigate('SeeInfluence', {})
    } else if (metric === 'Votes') {
      navigation.navigate('SeeVotes', {})
    } else if (metric === 'Posts') {
      navigation.navigate('SeePosts', {})
    }
  }

  const onPressHighlight = (highlight: HighlightData) => {
    try {
      const urip = new AtUri(highlight.postUri)
      navigation.push('PostThread', {
        name: urip.host,
        rkey: urip.rkey,
      })
    } catch (e) {
      console.error('Invalid post URI', e)
    }
  }

  const onPressSettings = () => {
    navigation.navigate('AccountSettings')
  }

  if (!currentAccount) {
    return null
  }

  return (
    <Layout.Screen>
      {/* Header */}
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>My Base</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot>
          <Button
            label={_(msg`Settings`)}
            onPress={onPressSettings}
            size="small"
            variant="ghost"
            color="secondary"
            shape="round">
            <ButtonIcon icon={SettingsIcon} size="lg" />
          </Button>
        </Layout.Header.Slot>
      </Layout.Header.Outer>

      <Layout.Center style={styles.flex1}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}>
          {/* Profile Section */}
          <View style={[styles.profileSection, t.atoms.border_contrast_low]}>
            <View style={styles.profileHeaderRow}>
              <UserAvatar
                avatar={currentProfile?.avatar}
                size={60}
                type={currentProfile?.associated?.labeler ? 'labeler' : 'user'}
              />
              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, t.atoms.text]}>
                  {profileDisplayName}
                </Text>
                <Text style={[styles.profileHandle, t.atoms.text]}>
                  {profileHandleText}
                </Text>
                <TouchableOpacity
                  accessibilityRole="button"
                  style={[
                    styles.flairBadge,
                    {backgroundColor: selectedFlair.color + '20'},
                  ]}
                  onPress={() => setShowFlairModal(true)}>
                  <View
                    style={[
                      styles.flairDot,
                      {backgroundColor: selectedFlair.color},
                    ]}
                  />
                  <Text
                    style={[
                      styles.flairText,
                      {color: selectedFlair.color},
                      a.font_bold,
                    ]}>
                    {selectedFlair.label}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Metrics Data */}
            <View style={styles.metricsContainer}>
              <MetricItem
                label="Influence"
                value={formatCount(influenceScore)}
                onPress={() => onPressMetric('Influence')}
              />
              <MetricItem
                label="Votes"
                value={formatCount(
                  votedPolicyCards.length + votedMatterCards.length,
                )}
                onPress={() => onPressMetric('Votes')}
              />
              <MetricItem
                label="Posts"
                value={formatCount(currentProfile?.postsCount)}
                onPress={() => onPressMetric('Posts')}
              />
              <MetricItem
                label="Followers"
                value={formatCount(currentProfile?.followersCount)}
                onPress={() => onPressMetric('Followers')}
              />
              <MetricItem
                label="Following"
                value={formatCount(currentProfile?.followsCount)}
                onPress={() => onPressMetric('Following')}
              />
            </View>

            {/* Political Affiliation Section */}
            <TouchableOpacity
              accessibilityRole="button"
              style={styles.supportInfoContainer}
              onPress={() => navigation.navigate('PoliticalAffiliation')}>
              <View style={styles.supportInfoRow}>
                {affiliations.length > 0 ? (
                  <ColorStack
                    items={affiliations.map(item => ({
                      id: item.id,
                      color: item.color,
                    }))}
                    size={20}
                  />
                ) : (
                  <View
                    style={[
                      styles.supportAvatar,
                      {backgroundColor: t.palette.contrast_300},
                    ]}
                  />
                )}
                <View style={styles.supportInfoTextContainer}>
                  <Text
                    style={[
                      styles.supportInfoLabel,
                      t.atoms.text_contrast_medium,
                    ]}>
                    <Trans>Political Affiliation</Trans>
                  </Text>
                  <Text style={[styles.supportInfoValue, t.atoms.text]}>
                    {affiliationSummary || 'Not set'}
                  </Text>
                </View>
                <ChevronRight size="sm" style={t.atoms.text_contrast_medium} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Voted Policies Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.mainSectionTitle, t.atoms.text]}>
                <Trans>Voted Policies</Trans>
              </Text>
              <Text style={[styles.highlightCount, t.atoms.text_contrast_medium]}>
                {isCabildeosLoading && votedPolicyCards.length === 0
                  ? _(msg`Loading`)
                  : `${formatCount(votedPolicyCards.length)} on record`}
              </Text>
            </View>
            <DebateCardList
              cards={votedPolicyCards}
              emptyIcon="🗳️"
              emptyTitle={_(msg`No voted policies yet`)}
              emptyMessage={_(
                msg`When you vote in a policy debate, it will show up here with live participation data.`,
              )}
              isLoading={isCabildeosLoading}
              onPressCard={card =>
                navigation.navigate('PolicyDetails', {cabildeoUri: card.uri})
              }
            />
          </View>

          {/* Matters Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.mainSectionTitle, t.atoms.text]}>
                <Trans>Voted Matters</Trans>
              </Text>
              <Text style={[styles.highlightCount, t.atoms.text_contrast_medium]}>
                {isCabildeosLoading && votedMatterCards.length === 0
                  ? _(msg`Loading`)
                  : `${formatCount(votedMatterCards.length)} on record`}
              </Text>
            </View>
            <DebateCardList
              cards={votedMatterCards}
              emptyIcon="📌"
              emptyTitle={_(msg`No voted matters yet`)}
              emptyMessage={_(
                msg`As soon as you participate in a matter debate, it will appear here with the live backend totals.`,
              )}
              isLoading={isCabildeosLoading}
              onPressCard={card =>
                navigation.navigate('PolicyDetails', {cabildeoUri: card.uri})
              }
            />
          </View>

          {/* My Highlights Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.mainSectionTitle, t.atoms.text]}>
                <Trans>My Highlights</Trans>
              </Text>
              <Text
                style={[
                  styles.highlightCount,
                  t.atoms.text_contrast_medium,
                ]}>
                {myHighlights.length} saved
              </Text>
            </View>

            {myHighlights.length === 0 ? (
              <View
                style={[styles.emptyHighlights, t.atoms.bg_contrast_25]}>
                <Text style={styles.emptyHighlightsIcon}>✨</Text>
                <Text style={[styles.emptyHighlightsText, t.atoms.text]}>
                  <Trans>No highlights yet</Trans>
                </Text>
                <Text
                  style={[
                    styles.emptyHighlightsSubtext,
                    t.atoms.text_contrast_medium,
                  ]}>
                  Long-press text in a post and select "Highlight" to save it
                  here
                </Text>
              </View>
            ) : (
              <View style={styles.highlightsListContainer}>
                {myHighlights.slice(0, 5).map(highlight => (
                  <View
                    key={highlight.id}
                    style={[
                      styles.highlightItem,
                      t.atoms.border_contrast_low,
                      t.atoms.bg_contrast_25,
                    ]}>
                    <TouchableOpacity
                      accessibilityRole="button"
                      style={[styles.highlightItemContent, a.flex_1]}
                      onPress={() => onPressHighlight(highlight)}>
                      <View
                        style={[
                          styles.highlightColorDot,
                          {backgroundColor: highlight.color},
                        ]}
                      />
                      <View style={styles.highlightTextContainer}>
                        {highlight.tag && (
                          <Text
                            style={[
                              styles.highlightTag,
                              {color: highlight.color},
                            ]}>
                            #{highlight.tag}
                          </Text>
                        )}
                        <Text
                          style={[styles.highlightText, t.atoms.text]}
                          numberOfLines={2}>
                          {highlight.text ||
                            `Highlight from post (chars ${highlight.start}-${highlight.end})`}
                        </Text>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      accessibilityRole="button"
                      onPress={() => handleDeleteHighlight(highlight)}
                      style={styles.deleteHighlightButton}
                      hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                      <XIcon size="sm" style={t.atoms.text_contrast_medium} />
                    </TouchableOpacity>
                  </View>
                ))}
                {myHighlights.length > 5 && (
                  <TouchableOpacity
                    accessibilityRole="button"
                    style={[
                      styles.viewAllHighlights,
                      t.atoms.bg_contrast_25,
                    ]}
                    onPress={() => navigation.navigate('Highlights')}>
                    <Text
                      style={[
                        styles.viewAllText,
                        {color: t.palette.primary_500},
                      ]}>
                      View all {myHighlights.length} highlights →
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* Followed Elements Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.mainSectionTitle, t.atoms.text]}>
                <Trans>Followed Elements</Trans>
              </Text>
              <Text
                style={[
                  styles.highlightCount,
                  t.atoms.text_contrast_medium,
                ]}>
                {followedItems.length} following
              </Text>
            </View>

            {followedItems.length === 0 ? (
              <View
                style={[styles.emptyHighlights, t.atoms.bg_contrast_25]}>
                <Text style={styles.emptyHighlightsIcon}>🔖</Text>
                <Text style={[styles.emptyHighlightsText, t.atoms.text]}>
                  No topics followed
                </Text>
                <Text
                  style={[
                    styles.emptyHighlightsSubtext,
                    t.atoms.text_contrast_medium,
                  ]}>
                  Follow hashtags, policies, matters, or threads to see them
                  here
                </Text>
              </View>
            ) : (
              <View style={styles.topicsGrid}>
                {followedItems.slice(0, 8).map((item: FollowedItem) => {
                  const category = FOLLOWED_ITEM_CATEGORIES[item.type]
                  return (
                    <View
                      key={item.id}
                      style={[
                        styles.topicCard,
                        t.atoms.bg_contrast_25,
                        t.atoms.border_contrast_low,
                      ]}>
                      <View style={styles.topicCardContent}>
                        <View
                          style={[
                            styles.topicTypeIcon,
                            {backgroundColor: category.color + '20'},
                          ]}>
                          <Text style={styles.topicTypeEmoji}>
                            {category.icon}
                          </Text>
                        </View>
                        <View style={styles.topicInfo}>
                          <Text
                            style={[styles.topicName, t.atoms.text]}
                            numberOfLines={1}>
                            {item.displayName}
                          </Text>
                          <Text
                            style={[
                              styles.topicType,
                              t.atoms.text_contrast_medium,
                            ]}>
                            {category.label}
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        accessibilityRole="button"
                        onPress={() => unfollowItem(item.id)}
                        style={styles.unfollowButton}
                        hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                        <XIcon
                          size="sm"
                          style={t.atoms.text_contrast_medium}
                        />
                      </TouchableOpacity>
                    </View>
                  )
                })}
              </View>
            )}
          </View>

          {/* RAQ Section */}
          <View
            style={[
              styles.raqSection,
              t.atoms.border_contrast_low,
              t.atoms.bg_contrast_25,
            ]}>
            <View>
              <Text style={[styles.raqTitle, t.atoms.text]}>RAQ</Text>
              <Text style={[styles.raqProgress, t.atoms.text_contrast_medium]}>
                <Trans>Open your questionnaire and review your latest results.</Trans>
              </Text>
            </View>
            <Button
              label="Continue Questionnaire"
              onPress={onPressRAQ}
              size="small"
              variant="ghost"
              color="secondary"
              shape="round">
              <ButtonIcon icon={ChevronRight} />
            </Button>
          </View>

          {/* Policy Tree Button */}
          <TouchableOpacity
            accessibilityRole="button"
            style={[
              styles.policyTreeButton,
              {backgroundColor: t.palette.primary_500},
            ]}
            onPress={onPressPolicyTree}
            activeOpacity={0.8}>
            <TreeIcon size="xl" style={{color: 'white'}} />
            <Text style={styles.policyTreeText}>Open policy tree</Text>
          </TouchableOpacity>
        </ScrollView>
      </Layout.Center>

      {/* Flair Selection Modal */}
      <Modal
        visible={showFlairModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFlairModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            accessibilityRole="button"
            style={styles.modalBackdrop}
            onPress={() => setShowFlairModal(false)}
          />
          <View
            style={[
              styles.modalContent,
              t.atoms.bg,
              t.atoms.border_contrast_low,
            ]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, t.atoms.text]}>
                Choose Your Flair
              </Text>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => setShowFlairModal(false)}>
                <XIcon size="lg" style={t.atoms.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.flairScrollView}>
              <View style={styles.modalBody}>
                {Object.values(USER_FLAIRS).map(flair => (
                  <TouchableOpacity
                    key={flair.id}
                    accessibilityRole="button"
                    style={[
                      styles.flairOption,
                      selectedFlair.id === flair.id &&
                        styles.flairOptionSelected,
                      t.atoms.border_contrast_low,
                    ]}
                    onPress={() => {
                      setSelectedFlair(flair)
                      setShowFlairModal(false)
                    }}>
                    <View
                      style={[styles.flairDot, {backgroundColor: flair.color}]}
                    />
                    <Text style={[styles.flairOptionText, t.atoms.text]}>
                      {flair.label}
                    </Text>
                    {selectedFlair.id === flair.id && (
                      <Text style={{color: flair.color, fontWeight: 'bold'}}>
                        ✓
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Layout.Screen>
  )
}

function buildMyBaseDebateCards(
  debates: CabildeoView[],
  kind: DebateKind,
): MyBaseDebateCard[] {
  return debates
    .map(debate => {
      const badge = getCabildeoBadge(debate)
      if (badge.kind !== kind) return null

      const participation = getViewerParticipation(debate)
      if (!participation) return null

      const phase = getCabildeoPhaseMeta(debate.phase)
      return {
        uri: debate.uri,
        title: debate.title,
        description: debate.description,
        kind,
        badgeLabel: badge.label,
        badgeColor: badge.color,
        badgeBackground: badge.bgColor,
        phaseLabel: phase.label,
        phaseColor: phase.color,
        participationLabel: participation.label,
        optionLabel: participation.optionLabel,
        participationCount: getCabildeoTotalParticipants(debate),
        communityLabel: debate.community,
        createdAt: debate.createdAt,
      }
    })
    .filter(Boolean)
    .sort((a, b) =>
      (b?.createdAt ?? '').localeCompare(a?.createdAt ?? ''),
    ) as MyBaseDebateCard[]
}

function DebateCardList({
  cards,
  emptyIcon,
  emptyTitle,
  emptyMessage,
  isLoading,
  onPressCard,
}: {
  cards: MyBaseDebateCard[]
  emptyIcon: string
  emptyTitle: string
  emptyMessage: string
  isLoading: boolean
  onPressCard: (card: MyBaseDebateCard) => void
}) {
  const t = useTheme()

  if (cards.length === 0) {
    return (
      <View style={[styles.emptyHighlights, t.atoms.bg_contrast_25]}>
        <Text style={styles.emptyHighlightsIcon}>{emptyIcon}</Text>
        <Text style={[styles.emptyHighlightsText, t.atoms.text]}>
          {isLoading ? 'Loading your participation...' : emptyTitle}
        </Text>
        <Text
          style={[
            styles.emptyHighlightsSubtext,
            t.atoms.text_contrast_medium,
          ]}>
          {isLoading
            ? 'We are pulling your debate activity from the backend.'
            : emptyMessage}
        </Text>
      </View>
    )
  }

  return (
    <View style={styles.debateList}>
      {cards.slice(0, 4).map(card => (
        <TouchableOpacity
          accessibilityRole="button"
          key={card.uri}
          onPress={() => onPressCard(card)}
          activeOpacity={0.8}
          style={[
            styles.debateCard,
            t.atoms.bg_contrast_25,
            t.atoms.border_contrast_low,
          ]}>
          <View style={styles.debateCardHeader}>
            <View
              style={[
                styles.debateBadge,
                {backgroundColor: card.badgeBackground},
              ]}>
              <Text style={[styles.debateBadgeText, {color: card.badgeColor}]}>
                {card.badgeLabel}
              </Text>
            </View>
            <Text
              style={[
                styles.debatePhase,
                {color: card.phaseColor},
              ]}>
              {card.phaseLabel}
            </Text>
          </View>

          <Text style={[styles.debateTitle, t.atoms.text]} numberOfLines={2}>
            {card.title}
          </Text>
          <Text
            style={[styles.debateDescription, t.atoms.text_contrast_medium]}
            numberOfLines={2}>
            {card.description}
          </Text>

          <View style={styles.debateMetaRow}>
            <Text style={[styles.debateMetaText, t.atoms.text_contrast_medium]}>
              {card.communityLabel}
            </Text>
            <Text style={[styles.debateMetaText, t.atoms.text_contrast_medium]}>
              {card.participationCount} participants
            </Text>
          </View>

          <View style={styles.debateFooter}>
            <View
              style={[
                styles.debateParticipationPill,
                {backgroundColor: card.kind === 'policy' ? '#DBEAFE' : '#FFEDD5'},
              ]}>
              <Text
                style={[
                  styles.debateParticipationText,
                  {color: card.kind === 'policy' ? '#1D4ED8' : '#C2410C'},
                ]}>
                {card.optionLabel
                  ? `${card.participationLabel}: ${card.optionLabel}`
                  : card.participationLabel}
              </Text>
            </View>
            <ChevronRight size="sm" style={t.atoms.text_contrast_medium} />
          </View>
        </TouchableOpacity>
      ))}
    </View>
  )
}

function summarizeAffiliations(affiliations: PoliticalAffiliation[]) {
  if (affiliations.length === 0) {
    return ''
  }

  return affiliations
    .map(item => `${POLITICAL_AFFILIATION_TYPE_LABELS[item.type]}: ${item.name}`)
    .join(' • ')
}

function MetricItem({
  label,
  value,
  onPress,
}: {
  label: string
  value: string
  onPress: () => void
}) {
  const t = useTheme()
  return (
    <View style={styles.metricItem}>
      <Text style={[styles.metricLabel, t.atoms.text_contrast_medium]}>
        {label}
      </Text>
      <TouchableOpacity accessibilityRole="button" onPress={onPress}>
        <Text style={[styles.metricValue, t.atoms.text]}>{value}</Text>
      </TouchableOpacity>
    </View>
  )
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  // Profile
  profileSection: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  profileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileInfo: {
    marginLeft: 16,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
  },
  profileHandle: {
    fontSize: 16,
    opacity: 0.7,
  },
  // Metrics
  metricsContainer: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  metricItem: {
    alignItems: 'flex-start',
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  // Political affiliation
  supportInfoContainer: {
    marginTop: 20,
  },
  supportInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  supportInfoTextContainer: {
    flex: 1,
    gap: 2,
  },
  supportInfoLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  supportAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  supportInfoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Sections
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  savedButton: {
    paddingHorizontal: 8,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  mainSectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  debateList: {
    gap: 12,
  },
  debateCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  debateCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  debateBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  debateBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  debatePhase: {
    fontSize: 12,
    fontWeight: '700',
  },
  debateTitle: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  debateDescription: {
    fontSize: 13,
    lineHeight: 19,
  },
  debateMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  debateMetaText: {
    fontSize: 12,
    fontWeight: '500',
  },
  debateFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  debateParticipationPill: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  debateParticipationText: {
    fontSize: 12,
    fontWeight: '700',
  },
  // Category cards
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48%',
    padding: 12,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
    opacity: 0.9,
  },
  categoryItem: {
    fontSize: 12,
    marginBottom: 4,
    lineHeight: 16,
  },
  // RAQ
  raqSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  raqTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  raqProgress: {
    fontSize: 14,
    opacity: 0.7,
  },
  // Policy tree
  policyTreeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  policyTreeText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  // Modal styles (shared by Details + Flair)
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalBody: {
    gap: 12,
  },
  // Highlights
  highlightCount: {
    fontSize: 13,
    fontWeight: '500',
  },
  emptyHighlights: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  emptyHighlightsIcon: {
    fontSize: 36,
    marginBottom: 12,
  },
  emptyHighlightsText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptyHighlightsSubtext: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  highlightsListContainer: {
    gap: 8,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  highlightItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  highlightColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  highlightTextContainer: {
    flex: 1,
  },
  highlightTag: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  highlightText: {
    fontSize: 14,
    lineHeight: 18,
  },
  deleteHighlightButton: {
    padding: 4,
  },
  viewAllHighlights: {
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 4,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Topics
  topicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  topicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    minWidth: 160,
    flexBasis: '47%',
    flexGrow: 0,
    flexShrink: 0,
  },
  topicCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  topicTypeIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topicTypeEmoji: {
    fontSize: 14,
  },
  topicInfo: {
    flex: 1,
  },
  topicName: {
    fontSize: 13,
    fontWeight: '600',
  },
  topicType: {
    fontSize: 11,
    marginTop: 1,
  },
  unfollowButton: {
    padding: 4,
  },
  // Flair
  flairBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  flairDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  flairText: {
    fontSize: 13,
  },
  flairScrollView: {
    maxHeight: 400,
  },
  flairOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  flairOptionSelected: {
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  flairOptionText: {
    fontSize: 16,
    flex: 1,
  },
})
