import {useCallback, useMemo, useState} from 'react'
import {StyleSheet, TouchableOpacity, View} from 'react-native'
import {type AppBskyActorDefs, AtUri} from '@atproto/api'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'
import {useFocusEffect, useNavigation} from '@react-navigation/native'

import {type CabildeoView} from '#/lib/cabildeo-client'
import {type PoliticalAffiliation} from '#/lib/political-affiliations'
import {type NavigationProp} from '#/lib/routes/types'
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
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {CompassMini} from '#/components/CompassMini'
import {ArrowLeft_Stroke2_Corner0_Rounded as BackIcon} from '#/components/icons/Arrow'
import {CommunityIcon_Stroke as CommunityIcon} from '#/components/icons/Community'
import {SettingsGear2_Stroke2_Corner0_Rounded as SettingsIcon} from '#/components/icons/SettingsGear2'
import {TimesLarge_Stroke2_Corner0_Rounded as XIcon} from '#/components/icons/Times'
import {Tree_Stroke2_Corner0_Rounded as TreeIcon} from '#/components/icons/Tree'
import * as Layout from '#/components/Layout'
import {toClout} from '#/analytics/metrics'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type MetricKey = 'Influence' | 'Votes' | 'Posts' | 'Followers' | 'Following'

// No hardcoded colors used

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function getPhaseStyle(phase: string) {
  const meta: Record<string, {label: string; color: string}> = {
    draft: {label: 'Draft', color: '#6B7280'},
    open: {label: 'Open', color: '#0EA5E9'},
    deliberating: {label: 'Deliberating', color: '#F59E0B'},
    voting: {label: 'Voting', color: '#22C55E'},
    resolved: {label: 'Resolved', color: '#8B5CF6'},
  }
  return meta[phase] || meta.draft
}

// ─────────────────────────────────────────────────────────────────────────────
// MyBaseHeader — profile header with avatar, metrics, compass mini
// ─────────────────────────────────────────────────────────────────────────────

function MyBaseHeader({
  profile,
  influenceScore,
  votedCount,
  affiliations,
  activeFlair,
  onPressMetric,
  onPressSettings,
  onPressCommunities,
  onPressCompass,
  onPressPoliticalAffiliation,
  onPressBack,
  gtMobile,
}: {
  profile: AppBskyActorDefs.ProfileViewDetailed
  influenceScore: number
  votedCount: number
  affiliations: PoliticalAffiliation[]
  activeFlair: {id: string; label: string; color: string} | null
  onPressMetric: (m: MetricKey) => void
  onPressSettings: () => void
  onPressCommunities: () => void
  onPressCompass: () => void
  onPressPoliticalAffiliation: () => void
  onPressBack: () => void
  gtMobile?: boolean
}) {
  const t = useTheme()
  const {i18n} = useLingui()
  const formatCount = (v: number | undefined | null) => i18n.number(v ?? 0)

  const profileHandle = profile?.handle
  const profileHandleText = profileHandle ? `@${profileHandle}` : '@para'
  const profileDisplayName = profile?.displayName || profile?.handle || 'User'

  return (
    <Layout.Center>
      <View style={t.atoms.bg}>
        {/* Banner / top bar */}
        <View
          style={[
            styles.headerTopBar,
            {backgroundColor: t.palette.primary_500}, // Brand color for banner
          ]}>
          <View style={[a.flex_row, {width: '100%', alignItems: 'center'}]}>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={onPressBack}
              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
              <BackIcon size="md" style={{color: 'white'}} />
            </TouchableOpacity>
            <View style={{flex: 1}} />
            <TouchableOpacity
              accessibilityRole="button"
              onPress={onPressCommunities}
              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
              style={{marginRight: 12}}>
              <CommunityIcon size="md" style={{color: 'white'}} />
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={onPressSettings}
              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
              <SettingsIcon size="md" style={{color: 'white'}} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile block */}
        <View
          style={[
            styles.headerProfileBlock,
            gtMobile && styles.headerProfileBlockWeb,
          ]}>
          {/* Top row: Avatar + Identity + Compass */}
          <View style={[styles.headerTopRow, gtMobile && a.align_center]}>
            <View style={[styles.headerAvatarWrap, {borderColor: t.atoms.bg.backgroundColor}]}>
              <UserAvatar
                avatar={profile?.avatar}
                size={84}
                type={profile?.associated?.labeler ? 'labeler' : 'user'}
              />
            </View>

            <View style={styles.headerIdentityColumn}>
              <View style={[a.flex_row, a.align_center, {flexWrap: 'wrap', gap: 6}]}>
                <Text style={[styles.headerName, t.atoms.text]}>
                  {profileDisplayName}
                </Text>
                {/* Flair Inline */}
                {activeFlair ? (
                  <TouchableOpacity
                    accessibilityRole="button"
                    style={[
                      styles.flairBadge,
                      {backgroundColor: activeFlair.color + '20', borderColor: activeFlair.color + '40', borderWidth: 1},
                    ]}
                    onPress={onPressPoliticalAffiliation}>
                    <View
                      style={[
                        styles.flairDot,
                        {backgroundColor: activeFlair.color},
                      ]}
                    />
                    <Text
                      style={[
                        styles.flairText,
                        {color: activeFlair.color},
                        a.font_bold,
                      ]}>
                      {activeFlair.label}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    accessibilityRole="button"
                    style={[
                      styles.flairBadge,
                      t.atoms.bg_contrast_50,
                    ]}
                    onPress={onPressPoliticalAffiliation}>
                    <View
                      style={[
                        styles.flairDot,
                        {backgroundColor: t.atoms.text_contrast_medium.color},
                      ]}
                    />
                    <Text
                      style={[
                        styles.flairText,
                        t.atoms.text_contrast_medium,
                        a.font_bold,
                      ]}>
                      Set position →
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <Text style={[styles.headerHandle, t.atoms.text_contrast_medium]}>
                {profileHandleText}
              </Text>

              <View style={styles.headerSocialRow}>
                <SocialMetricItem
                  label="Followers"
                  value={formatCount(profile?.followersCount)}
                  onPress={() => onPressMetric('Followers')}
                />
                <View style={[styles.headerSocialDivider, {backgroundColor: t.atoms.border_contrast_low.borderColor}]} />
                <SocialMetricItem
                  label="Following"
                  value={formatCount(profile?.followsCount)}
                  onPress={() => onPressMetric('Following')}
                />
              </View>
            </View>

            <CompassMini
              affiliations={affiliations}
              onPress={onPressCompass}
              size={gtMobile ? 84 : 72}
              compact
            />
          </View>

          {/* Metrics */}
          <View style={[styles.metricsRow, {borderTopColor: t.atoms.border_contrast_low.borderColor}]}>
            <MetricItem
              label="Influence"
              value={formatCount(influenceScore)}
              onPress={() => onPressMetric('Influence')}
            />
            <MetricItem
              label="Votes"
              value={formatCount(votedCount)}
              onPress={() => onPressMetric('Votes')}
            />
            <MetricItem
              label="Posts"
              value={formatCount(profile?.postsCount)}
              onPress={() => onPressMetric('Posts')}
            />
          </View>
        </View>
      </View>
    </Layout.Center>
  )
}

function SocialMetricItem({
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
    <TouchableOpacity
      accessibilityRole="button"
      onPress={onPress}
      style={styles.socialMetricItem}>
      <Text style={[styles.socialMetricValue, t.atoms.text]}>{value}</Text>
      <Text style={[styles.socialMetricLabel, t.atoms.text_contrast_medium]}>{label}</Text>
    </TouchableOpacity>
  )
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
    <TouchableOpacity
      accessibilityRole="button"
      onPress={onPress}
      style={[
        styles.metricItem,
        t.atoms.bg_contrast_25,
      ]}>
      <Text style={[styles.metricValue, t.atoms.text]}>{value}</Text>
      <Text style={[styles.metricLabel, t.atoms.text_contrast_medium]}>
        {label}
      </Text>
    </TouchableOpacity>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab: Summary
// ─────────────────────────────────────────────────────────────────────────────

function MyBaseSummaryTab({
  cabildeos,
  myHighlights,
  followedItems,
  onPressCard,
  onPressHighlight,
  onDeleteHighlight,
  onUnfollowItem,
  onPressRAQ,
  onPressPolicyTree,
  onPressViewAllHighlights,
  onPressViewProfile,
  onPressFollowedItem,
  gtMobile,
}: {
  cabildeos: CabildeoView[]
  myHighlights: HighlightData[]
  followedItems: FollowedItem[]
  onPressCard: (uri: string) => void
  onPressHighlight: (h: HighlightData) => void
  onDeleteHighlight: (h: HighlightData) => void
  onUnfollowItem: (id: string) => void
  onPressRAQ: () => void
  onPressPolicyTree: () => void
  onPressViewAllHighlights: () => void
  onPressViewProfile: () => void
  onPressFollowedItem: (item: FollowedItem) => void
  gtMobile?: boolean
}) {
  const t = useTheme()
  const {_} = useLingui()
  const [now, setNow] = useState(() => Date.now())
  void setNow

  // ── Upcoming: cabildeos in voting where user hasn't voted ──
  const upcoming = useMemo(() => {
    return cabildeos
      .filter(c => {
        if (c.phase !== 'voting') return false
        const deadline = c.phaseDeadline
          ? new Date(c.phaseDeadline).getTime()
          : 0
        const hasVoted = c.userContext?.viewerVoteOption !== undefined
        return !hasVoted && deadline > now
      })
      .sort((a, b) => {
        const da = a.phaseDeadline ? new Date(a.phaseDeadline).getTime() : 0
        const db = b.phaseDeadline ? new Date(b.phaseDeadline).getTime() : 0
        return da - db
      })
      .slice(0, 3)
  }, [cabildeos, now])

  // ── Recent votes (mini cards for quick scan) ──
  const recentVotes = useMemo(() => {
    return cabildeos
      .filter(c => c.userContext?.viewerVoteOption !== undefined)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 3)
  }, [cabildeos])

  // ── Highlights ──
  const recentHighlights = myHighlights.slice(0, 5)

  // ── Followed ──
  const recentFollowed = followedItems.slice(0, 8)

  return (
    <Layout.Content
      style={styles.tabScroll}
      contentContainerStyle={[
        styles.tabScrollContent,
        gtMobile && {paddingHorizontal: 32} // Added Web horizontal padding
      ]}>
      {/* ── UPCOMING ACTIONS ── */}
      {upcoming.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, t.atoms.text]}>
            <Trans>Upcoming actions</Trans>
          </Text>
          <View style={{gap: 10}}>
            {upcoming.map(c => (
              <CabildeoMiniCard
                key={c.uri}
                cabildeo={c}
                onPress={() => onPressCard(c.uri)}
                now={now}
                showDeadline
              />
            ))}
          </View>
        </View>
      )}

      {/* ── RECENT VOTES (mini cards) ── */}
      {recentVotes.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, t.atoms.text]}>
            <Trans>Recent votes</Trans>
          </Text>
          <View style={{gap: 10}}>
            {recentVotes.map(c => (
              <CabildeoMiniCard
                key={c.uri}
                cabildeo={c}
                onPress={() => onPressCard(c.uri)}
                now={now}
              />
            ))}
          </View>
        </View>
      )}

      {/* ── MY HIGHLIGHTS ── */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, t.atoms.text]}>
            <Trans>My Highlights</Trans>
          </Text>
          <Text style={[styles.sectionCount, t.atoms.text_contrast_medium]}>
            {myHighlights.length} saved
          </Text>
        </View>
        {myHighlights.length === 0 ? (
          <EmptyState
            icon="✨"
            title={_(msg`No highlights yet`)}
            message={_(
              msg`Long-press text in a post and select "Highlight" to save it here`,
            )}
          />
        ) : (
          <View
            style={[
              styles.highlightsGrid,
              gtMobile && a.flex_row,
              gtMobile && a.flex_wrap,
            ]}>
            {recentHighlights.map(h => (
              <HighlightCard
                key={h.id}
                highlight={h}
                onPress={() => onPressHighlight(h)}
                onDelete={() => onDeleteHighlight(h)}
                isWeb={gtMobile}
              />
            ))}
            {myHighlights.length > 5 && (
              <TouchableOpacity
                accessibilityRole="button"
                style={[
                  styles.viewAllButton,
                  t.atoms.bg_contrast_25,
                  gtMobile && {width: '100%'},
                ]}
                onPress={onPressViewAllHighlights}>
                <Text
                  style={[styles.viewAllText, {color: t.palette.primary_500}]}>
                  View all {myHighlights.length} highlights →
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* ── FOLLOWED ELEMENTS ── */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, t.atoms.text]}>
            <Trans>Followed Elements</Trans>
          </Text>
          <Text style={[styles.sectionCount, t.atoms.text_contrast_medium]}>
            {followedItems.length} following
          </Text>
        </View>
        {followedItems.length === 0 ? (
          <EmptyState
            icon="🔖"
            title={_(msg`No topics followed`)}
            message={_(
              msg`Follow hashtags, policies, matters, or threads to see them here`,
            )}
          />
        ) : (
          <View
            style={[styles.followedGrid, gtMobile && styles.followedGridWeb]}>
            {recentFollowed.map(item => (
              <FollowedItemCard
                key={item.id}
                item={item}
                onPress={() => onPressFollowedItem(item)}
                onUnfollow={() => onUnfollowItem(item.id)}
                isWeb={gtMobile}
              />
            ))}
          </View>
        )}
      </View>


      {/* ── RAQ SECTION ── */}
      <View
        style={[
          styles.raqSection,
          t.atoms.border_contrast_low,
          t.atoms.bg_contrast_25,
        ]}>
        <View>
          <Text style={[styles.raqTitle, t.atoms.text]}>RAQ</Text>
          <Text style={[styles.raqProgress, t.atoms.text_contrast_medium]}>
            <Trans>
              Open your questionnaire and review your latest results.
            </Trans>
          </Text>
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={onPressRAQ}
          style={styles.raqButton}>
          <Text style={[styles.raqButtonText, {color: t.palette.primary_500}]}>
            Continue →
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── POLICY TREE CTA ── */}
      <TouchableOpacity
        accessibilityRole="button"
        style={[
          styles.policyTreeButton,
          {backgroundColor: t.palette.primary_500},
        ]}
        onPress={onPressPolicyTree}
        activeOpacity={0.8}>
        <TreeIcon size="xl" style={{color: 'white'}} />
        <Text style={styles.policyTreeText}>
          <Trans>Open policy tree</Trans>
        </Text>
      </TouchableOpacity>

      {/* ── VIEW PROFILE LINK ── */}
      <TouchableOpacity
        accessibilityRole="button"
        style={[styles.viewProfileLink, t.atoms.bg_contrast_25]}
        onPress={onPressViewProfile}>
        <Text style={[styles.viewProfileText, {color: t.palette.primary_500}]}>
          <Trans>View public profile →</Trans>
        </Text>
      </TouchableOpacity>
    </Layout.Content>

  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab: Votes
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// Card Components
// ─────────────────────────────────────────────────────────────────────────────

function CabildeoMiniCard({
  cabildeo,
  onPress,
  now,
  showDeadline,
}: {
  cabildeo: CabildeoView
  onPress: () => void
  now: number
  showDeadline?: boolean
}) {
  const t = useTheme()
  const phase = getPhaseStyle(cabildeo.phase)
  const deadline = cabildeo.phaseDeadline
    ? new Date(cabildeo.phaseDeadline).getTime()
    : 0
  const hoursLeft =
    deadline > now ? Math.ceil((deadline - now) / (1000 * 60 * 60)) : 0

  return (
    <TouchableOpacity
      accessibilityRole="button"
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.miniCard,
        t.atoms.bg_contrast_25,
        {borderLeftWidth: 3, borderLeftColor: phase.color},
      ]}>
      <Text style={[styles.miniCardTitle, t.atoms.text]} numberOfLines={2}>
        {cabildeo.title}
      </Text>
      <View style={styles.miniCardMeta}>
        <View style={[styles.phasePill, {backgroundColor: phase.color + '18'}]}>
          <Text style={[styles.phasePillText, {color: phase.color}]}>
            {phase.label}
          </Text>
        </View>
        <Text style={[styles.miniCardStats, t.atoms.text_contrast_medium]}>
          🗳️ {cabildeo.voteTotals.total} · 🗣️ {cabildeo.positionCounts.total}
        </Text>
        {showDeadline && hoursLeft > 0 && hoursLeft < 168 && (
          <Text style={[styles.deadlineText, {color: t.palette.negative_500}]}>
            {hoursLeft < 24
              ? `${hoursLeft}h left`
              : `${Math.floor(hoursLeft / 24)}d left`}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  )
}

function HighlightCard({
  highlight,
  onPress,
  onDelete,
  isWeb,
}: {
  highlight: HighlightData
  onPress: () => void
  onDelete: () => void
  isWeb?: boolean
}) {
  const t = useTheme()
  return (
    <View
      style={[
        styles.highlightCard,
        t.atoms.bg_contrast_25,
        t.atoms.border_contrast_low,
        isWeb && styles.highlightCardWeb,
      ]}>
      <TouchableOpacity
        accessibilityRole="button"
        style={styles.highlightCardContent}
        onPress={onPress}>
        <View
          style={[styles.highlightDot, {backgroundColor: highlight.color}]}
        />
        <View style={{flex: 1}}>
          {highlight.tag && (
            <Text style={[styles.highlightTag, {color: highlight.color}]}>
              #{highlight.tag}
            </Text>
          )}
          <Text style={[styles.highlightText, t.atoms.text]} numberOfLines={2}>
            {highlight.text || `Highlight`}
          </Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        accessibilityRole="button"
        onPress={onDelete}
        hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
        <XIcon size="sm" style={t.atoms.text_contrast_medium} />
      </TouchableOpacity>
    </View>
  )
}

function FollowedItemCard({
  item,
  onPress,
  onUnfollow,
  isWeb,
}: {
  item: FollowedItem
  onPress: () => void
  onUnfollow: () => void
  isWeb?: boolean
}) {
  const t = useTheme()
  const category = FOLLOWED_ITEM_CATEGORIES[item.type]
  return (
    <View
      style={[
        styles.followedCard,
        t.atoms.bg_contrast_25,
        t.atoms.border_contrast_low,
        isWeb && styles.followedCardWeb,
      ]}>
      <TouchableOpacity
        accessibilityRole="button"
        onPress={onPress}
        style={styles.followedCardContent}>
        <View
          style={[
            styles.followedIcon,
            {backgroundColor: category.color + '20'},
          ]}>
          <Text style={styles.followedEmoji}>{category.icon}</Text>
        </View>
        <View style={{flex: 1}}>
          <Text style={[styles.followedName, t.atoms.text]} numberOfLines={1}>
            {item.displayName}
          </Text>
          <Text style={[styles.followedCategory, t.atoms.text_contrast_medium]}>
            {category.label}
          </Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        accessibilityRole="button"
        onPress={onUnfollow}
        hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
        <XIcon size="sm" style={t.atoms.text_contrast_medium} />
      </TouchableOpacity>
    </View>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ── EmptyState helper ──

function EmptyState({
  icon,
  title,
  message,
}: {
  icon: string
  title: string
  message: string
}) {
  const t = useTheme()
  return (
    <View style={[styles.emptyState, t.atoms.bg_contrast_25]}>
      <Text style={styles.emptyStateIcon}>{icon}</Text>
      <Text style={[styles.emptyStateTitle, t.atoms.text]}>{title}</Text>
      <Text style={[styles.emptyStateMessage, t.atoms.text_contrast_medium]}>
        {message}
      </Text>
    </View>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────

export function MyBaseScreen() {
  const {currentAccount} = useSession()
  const navigation = useNavigation<NavigationProp>()
  const {gtMobile} = useBreakpoints()
  const t = useTheme()
  const currentDid = currentAccount?.did

  const {data: currentProfile} = useProfileQuery({did: currentDid})
  const {data: cabildeos = []} = useCabildeosQuery()
  const {affiliations, activeFlair} = usePoliticalAffiliation()

  const [myHighlights, setMyHighlights] = useState<HighlightData[]>([])
  const {items: followedItems, unfollow: unfollowItem} = useFollowedItems()

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

  const votedCount = useMemo(() => {
    return cabildeos.filter(c => c.userContext?.viewerVoteOption !== undefined)
      .length
  }, [cabildeos])

  const influenceScore = useMemo(() => {
    const followerClout = toClout(currentProfile?.followersCount ?? 0) ?? 0
    return followerClout + myHighlights.length + followedItems.length
  }, [
    currentProfile?.followersCount,
    myHighlights.length,
    followedItems.length,
  ])

  const onPressMetric = useCallback(
    (metric: MetricKey) => {
      const profileHandle = currentProfile?.handle
      if (metric === 'Followers' && profileHandle) {
        navigation.push('ProfileFollowers', {name: profileHandle})
      } else if (metric === 'Following' && profileHandle) {
        navigation.push('ProfileFollows', {name: profileHandle})
      } else if (metric === 'Influence') {
        navigation.navigate('SeeInfluence', {})
      } else if (metric === 'Votes') {
        navigation.navigate('SeeVotes', {})
      } else if (metric === 'Posts') {
        navigation.navigate('SeePosts', {})
      }
    },
    [currentProfile?.handle, navigation],
  )

  const onPressCard = useCallback(
    (uri: string) => {
      navigation.navigate('PolicyDetails', {cabildeoUri: uri})
    },
    [navigation],
  )

  const onPressHighlight = useCallback(
    (highlight: HighlightData) => {
      navigation.navigate('SeeHighlightDetails', {highlightId: highlight.id})
    },
    [navigation],
  )

  const onPressFollowedItem = useCallback(
    (item: FollowedItem) => {
      if (item.type === 'policy') {
        navigation.navigate('PoliciesDashboard', {mode: 'Policies'})
        return
      }
      if (item.type === 'matter') {
        navigation.navigate('PoliciesDashboard', {mode: 'Matters'})
        return
      }
      if (item.type === 'hashtag') {
        navigation.navigate('Hashtag', {
          tag: item.identifier.replace(/^#/, ''),
        })
        return
      }

      const uri = item.uri || item.identifier
      try {
        const urip = new AtUri(uri)
        navigation.push('PostThread', {
          name: urip.host,
          rkey: urip.rkey,
          ...(urip.collection !== 'app.bsky.feed.post'
            ? {collection: urip.collection}
            : {}),
        })
      } catch (e) {
        navigation.navigate('Topic', {topic: item.displayName})
      }
    },
    [navigation],
  )

  if (!currentAccount) {
    return null
  }

  if (!currentProfile) {
    return (
      <Layout.Screen>
        <Layout.Center style={styles.loadingWrap}>
          <Text style={[styles.loadingTitle, t.atoms.text]}>My Base</Text>
          <Text style={[styles.loadingText, t.atoms.text_contrast_medium]}>
            Loading your profile
          </Text>
        </Layout.Center>
      </Layout.Screen>
    )
  }

  return (
    <Layout.Screen>
      <MyBaseHeader
        profile={currentProfile}
        influenceScore={influenceScore}
        votedCount={votedCount}
        affiliations={affiliations}
        activeFlair={activeFlair}
        onPressMetric={onPressMetric}
        onPressSettings={() => navigation.navigate('AccountSettings')}
        onPressCommunities={() => navigation.navigate('MyCommunities')}
        onPressCompass={() => navigation.navigate('MyAffiliations')}
        onPressPoliticalAffiliation={() =>
          navigation.navigate('PoliticalAffiliation')
        }
        onPressBack={() => {
          if (navigation.canGoBack()) {
            navigation.goBack()
          }
        }}
        gtMobile={gtMobile}
      />
      <MyBaseSummaryTab
        cabildeos={cabildeos}
        myHighlights={myHighlights}
        followedItems={followedItems}
        onPressCard={onPressCard}
        onPressHighlight={onPressHighlight}
        onDeleteHighlight={handleDeleteHighlight}
        onUnfollowItem={unfollowItem}
        onPressFollowedItem={onPressFollowedItem}
        onPressRAQ={() => navigation.navigate('MyRAQ')}
        onPressPolicyTree={() => navigation.navigate('Compass')}
        onPressViewAllHighlights={() => navigation.navigate('Highlights')}
        onPressViewProfile={() =>
          navigation.navigate('Profile', {
            name: currentProfile?.handle || '',
          })
        }
        gtMobile={gtMobile}
      />

    </Layout.Screen>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Header
  headerTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 64, // extended for a nicer banner height
  },
  headerProfileBlock: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerProfileBlockWeb: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerAvatarWrap: {
    marginTop: -48,
    borderWidth: 4,
    borderRadius: 44,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  headerIdentityColumn: {
    flex: 1,
    paddingTop: 4,
    minWidth: 0,
  },
  headerName: {
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 27,
  },
  headerHandle: {
    fontSize: 15,
    marginTop: 2,
  },
  headerSocialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  headerSocialDivider: {
    width: 1,
    height: 22,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  socialMetricItem: {
    paddingVertical: 2,
    paddingRight: 4,
  },
  socialMetricValue: {
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 16,
  },
  socialMetricLabel: {
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 13,
    textTransform: 'uppercase',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  metricItem: {
    alignItems: 'center',
    minWidth: 54,
    flex: 1,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  affiliationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  affiliationPlaceholder: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  affiliationLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  affiliationValue: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },

  // Flair
  flairBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 16,
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

  // Tabs
  tabScroll: {
    flex: 1,
  },
  tabScrollContent: {
    padding: 16,
    paddingTop: 18,
    paddingBottom: 100,
  },

  // Sections
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 12,
    lineHeight: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Filters
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Mini card
  miniCard: {
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  miniCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  miniCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  phasePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  phasePillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  miniCardStats: {
    fontSize: 11,
    fontWeight: '600',
  },
  deadlineText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Full card
  fullCard: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  fullCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  fullCardCommunity: {
    fontSize: 12,
    fontWeight: '600',
  },
  fullCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: 4,
  },
  fullCardDesc: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 10,
  },
  fullCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  fullCardStats: {
    flexDirection: 'row',
    gap: 12,
  },
  statText: {
    fontSize: 12,
    fontWeight: '600',
  },
  participationPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  participationText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Highlight card
  highlightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  highlightCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  highlightDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  highlightTag: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  highlightText: {
    fontSize: 13,
    lineHeight: 18,
  },

  // Followed grid
  followedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  followedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 150,
    flexBasis: '47%',
    flexGrow: 0,
    flexShrink: 0,
  },
  followedCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  followedIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followedEmoji: {
    fontSize: 14,
  },
  followedName: {
    fontSize: 12,
    fontWeight: '600',
  },
  followedCategory: {
    fontSize: 10,
    marginTop: 1,
  },

  // CTAs
  ctaRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  ctaButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  ctaButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  viewProfileLink: {
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  viewProfileText: {
    fontSize: 14,
    fontWeight: '700',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  emptyStateIcon: {
    fontSize: 36,
    marginBottom: 12,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptyStateMessage: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },

  // Section count
  sectionCount: {
    fontSize: 13,
    fontWeight: '500',
  },

  // View all button
  viewAllButton: {
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 4,
  },

  // RAQ
  raqSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 8,
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
  raqButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  raqButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },

  // Policy tree
  policyTreeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
  },
  policyTreeText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },

  // Modal
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
    borderRadius: 8,
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
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  flairOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  flairOptionSelected: {
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  flairOptionText: {
    fontSize: 16,
    flex: 1,
  },

  // Web overrides
  metricsRowWeb: {
    borderTopWidth: 0,
    gap: 12,
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  metricItemWeb: {
    flex: 1,
    minWidth: 100,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  highlightsGrid: {
    gap: 10,
  },
  highlightCardWeb: {
    flexBasis: '48.5%',
    flexGrow: 0,
  },
  followedGridWeb: {
    gap: 12,
  },
  followedCardWeb: {
    flexBasis: '48.5%',
    flexGrow: 1,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  loadingTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 6,
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '600',
  },
})
