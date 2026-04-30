import {useCallback, useMemo, useState} from 'react'
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native'
import {StickyTable} from 'react-native-sticky-table'
import {LinearGradient} from 'expo-linear-gradient'
import {AtUri} from '@atproto/api'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'
import {useNavigation, useRoute} from '@react-navigation/native'

import {getCommunityInsignia} from '#/lib/civic-insignias'
import {type CommunityGovernanceView} from '#/lib/community-governance'
import {useInitialNumToRender} from '#/lib/hooks/useInitialNumToRender'
import {usePalette} from '#/lib/hooks/usePalette'
import {COMMUNITY_AGENT_PROFILE} from '#/lib/mock-data/community-agent'
import {getPostBadges} from '#/lib/post-flairs'
import {type NavigationProp} from '#/lib/routes/types'
import {
  formatCommunityName,
  formatGeographicGroupName,
  isGeographicGroupCommunity,
} from '#/lib/strings/community-names'
import {cleanError} from '#/lib/strings/errors'
import {
  useAcceptDraftInviteMutation,
  useCommunityBoardQuery,
  useJoinCommunityMutation,
  useLeaveCommunityMutation,
} from '#/state/queries/community-boards'
import {useCommunityGovernanceQuery} from '#/state/queries/community-governance'
import {useSearchPostsQuery} from '#/state/queries/search-posts'
import {Post} from '#/view/com/post/Post'
import {Text} from '#/view/com/util/text/Text'
import {useTheme} from '#/alf'
import {CivicInsignia} from '#/components/CivicInsignia'
import {Macintosh_Stroke2_Corner2_Rounded as MacintoshIcon} from '#/components/icons/Macintosh'
import {Message_Stroke2_Corner0_Rounded as ChatIcon} from '#/components/icons/Message'
import {PageText_Stroke2_Corner0_Rounded as PageTextIcon} from '#/components/icons/PageText'
import {Tree_Stroke2_Corner0_Rounded as TreeIcon} from '#/components/icons/Tree'
import * as Layout from '#/components/Layout'
import {ListFooter} from '#/components/Lists'
import {ProfileHoverCard} from '#/components/ProfileHoverCard'

type CommunityProfileParams = {
  communityId?: string
  _communityId?: string
  communityName: string
}

const EMPTY_GOVERNANCE: CommunityGovernanceView = {
  source: 'network',
  community: '',
  communityId: undefined,
  slug: '',
  createdAt: '',
  updatedAt: '',
  moderators: [],
  officials: [],
  deputies: [],
  metadata: undefined,
  editHistory: [],
}

export function CommunityProfileScreen() {
  const pal = usePalette('default')
  const t = useTheme()
  const navigation = useNavigation<NavigationProp>()
  const route = useRoute<{
    key: string
    name: 'CommunityProfile'
    params: CommunityProfileParams
  }>()
  const {_} = useLingui()
  const _initialNumToRender = useInitialNumToRender()

  const communityId =
    route.params?.communityId || route.params?._communityId || '1'
  const {communityName = 'Community'} = route.params || {}
  const {data: fetchedBoard} = useCommunityBoardQuery({communityId})
  const board = fetchedBoard?.board
  const formattedCommunity = useMemo(
    () => formatCommunityName(board?.name || communityName),
    [board?.name, communityName],
  )
  const {
    data: fetchedGovernance,
    isLoading: isGovernanceLoading,
    isError: isGovernanceError,
    refetch: refetchGovernance,
  } = useCommunityGovernanceQuery({
    communityName,
    communityId,
  })
  const governance = fetchedGovernance || EMPTY_GOVERNANCE
  const governanceCommunity = fetchedGovernance?.community
  const resolvedCommunityName = governanceCommunity || board?.name || communityName
  const isGeographicGroup = isGeographicGroupCommunity({
    communityId,
    communityName: resolvedCommunityName,
    slug: fetchedGovernance?.slug,
  })
  const formattedDisplayNameParts = isGeographicGroup
    ? formatGeographicGroupName(resolvedCommunityName)
    : governanceCommunity
      ? formatCommunityName(governanceCommunity)
      : board?.name
        ? formatCommunityName(board.name)
        : formattedCommunity
  const displayCommunityName = formattedDisplayNameParts.displayName
  const plainCommunityName = formattedDisplayNameParts.plainName
  const featuredRepresentative = useMemo(
    () => governance.officials[0] || governance.deputies[0]?.activeHolder || null,
    [governance.deputies, governance.officials],
  )
  const agentDisplayName =
    featuredRepresentative?.displayName ||
    featuredRepresentative?.handle ||
    featuredRepresentative?.did ||
    COMMUNITY_AGENT_PROFILE.displayName
  const agentRoleLabel = 'AI Agent'
  const agentGovernanceRole = (featuredRepresentative as any)?.office || (featuredRepresentative as any)?.role || ''
  const agentMandate = (featuredRepresentative as any)?.mandate || (featuredRepresentative as any)?.description || COMMUNITY_AGENT_PROFILE.bio
  const agentActorId =
    featuredRepresentative?.did || featuredRepresentative?.handle || COMMUNITY_AGENT_PROFILE.id

  const {
    data,
    isFetched,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
  } = useSearchPostsQuery({
    query: '*',
    tag: [plainCommunityName],
    sort: 'latest',
  })

  const posts = useMemo(() => {
    return (
      data?.pages.flatMap(page => page.posts).filter(post => {
        // Filter out posts from users with unresolved/invalid handles
        return post.author.handle !== 'handle.invalid'
      }) || []
    )
  }, [data])

  const isDraft = board?.status === 'draft'
  const quorumCount = board?.memberCount ?? 0
  const membersToUnlock = Math.max(0, 9 - quorumCount)
  const [activeTab, setActiveTab] = useState<'Feed' | 'about'>(
    isDraft ? 'about' : 'Feed',
  )
  const displayedTab = isDraft ? 'about' : activeTab
  const [joinOverride, setJoinOverride] = useState<boolean | null>(null)
  const [isPTR, setIsPTR] = useState(false)
  const [showEstandarte, setShowEstandarte] = useState(true)
  const isJoined = joinOverride ?? (board?.viewerMembershipState === 'active')
  const acceptInviteMutation = useAcceptDraftInviteMutation()
  const joinMutation = useJoinCommunityMutation()
  const leaveMutation = useLeaveCommunityMutation()
  const isJoinPending = joinMutation.isPending || leaveMutation.isPending
  const joinLeaveError = joinMutation.error || leaveMutation.error

  const onPressJoin = async () => {
    if (!board?.uri) return
    const currentlyJoined = joinOverride ?? (board?.viewerMembershipState === 'active')
    try {
      if (currentlyJoined) {
        await leaveMutation.mutateAsync({communityUri: board.uri})
        setJoinOverride(false)
      } else {
        await joinMutation.mutateAsync({communityUri: board.uri})
        setJoinOverride(true)
      }
    } catch {
      // Error handled by mutation state
    }
  }

  const onPressAcceptFounderInvite = async () => {
    if (!board?.uri) return
    try {
      await acceptInviteMutation.mutateAsync({communityUri: board.uri})
      setJoinOverride(true)
    } catch {}
  }

  const onPressFoundingStarterPack = () => {
    if (!board?.founderStarterPackUri) return
    const starterPackUri = new AtUri(board.founderStarterPackUri)
    navigation.navigate('StarterPack', {
      name: board.creatorHandle || board.creatorDid,
      rkey: starterPackUri.rkey,
    })
  }

  const onRefresh = useCallback(async () => {
    setIsPTR(true)
    await Promise.all([refetch(), refetchGovernance()])
    setIsPTR(false)
  }, [refetch, refetchGovernance])
  const onPullToRefresh = useCallback(() => {
    void onRefresh()
  }, [onRefresh])

  const onEndReached = useCallback(() => {
    if (isFetchingNextPage || !hasNextPage || error) return
    void fetchNextPage()
  }, [isFetchingNextPage, hasNextPage, error, fetchNextPage])

  const communityStats = useMemo(() => {
    let policyPosts = 0
    let matterPosts = 0
    let raqPosts = 0
    const visiblePosters = new Set<string>()

    for (const post of posts) {
      visiblePosters.add(post.author.did)
      const badges = getPostBadges(post.record as any)
      if (
        badges.some(
          badge =>
            badge.key === 'postType:raq' ||
            badge.key === 'postType:open_question',
        )
      ) {
        raqPosts += 1
      }
      if (badges.some(badge => badge.kind === 'policy')) {
        policyPosts += 1
      }
      if (badges.some(badge => badge.kind === 'matter')) {
        matterPosts += 1
      }
    }

    return {
      policyPosts,
      matterPosts,
      raqPosts,
      visiblePosters: visiblePosters.size,
    }
  }, [posts])

  const createdAt = board?.createdAt || fetchedGovernance?.createdAt || governance.createdAt

  // Derive community brand color from insignia system
  const insigniaColors = getCommunityInsignia(resolvedCommunityName)
  const brandColor = insigniaColors[0] || '#6366f1'
  // Convert hex to rgba helper
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r},${g},${b},${alpha})`
  }

  const onPressDocuments = () => {
    navigation.navigate('MemesAndDocuments', {mode: 'Documents'})
  }

  const onPressPolicies = () => {
    navigation.navigate('PoliciesDashboard', {mode: 'Policies'})
  }

  const onPressMatters = () => {
    navigation.navigate('PoliciesDashboard', {mode: 'Matters'})
  }

  const onPressRAQ = () => {
    navigation.navigate('CommunityRAQ', {
      communityId,
      communityName,
    })
  }

  const onPressVoters = () => {
    navigation.navigate('CommunityVoters', {
      communityId,
      communityName,
    })
  }

  const onPressCabildeo = () => {
    navigation.navigate('CabildeoList', {
      communityId,
      communityName,
    })
  }

  const onPressRoles = () => {
    navigation.navigate('CommunityRoles', {
      communityId,
      communityName,
    })
  }

  const onPressChat = () => {
    if (!agentActorId) return
    navigation.navigate('AgentChat', {agentId: agentActorId})
  }

  const onPressAgentProfile = () => {
    if (!agentActorId) return
    navigation.navigate('CommunityAgentProfile', {
      agentId: agentActorId,
      communityName: board?.name || communityName,
    })
  }

  const rules = [
    'Be respectful and civil',
    'No spam or self-promotion',
    'Stay on topic',
    'No harassment or hate speech',
    'Follow community guidelines',
  ]

  return (
    <Layout.Screen>
      <Layout.Header.Outer noBottomBorder>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Community</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}>
        <Layout.Center>
          {/* Hero Banner Section */}
          <LinearGradient
            colors={
              t.scheme === 'dark'
                ? [hexToRgba(brandColor, 0.22), hexToRgba(brandColor, 0.06), 'transparent']
                : [hexToRgba(brandColor, 0.14), hexToRgba(brandColor, 0.04), 'transparent']
            }
            start={{x: 0, y: 0}}
            end={{x: 0, y: 1}}
            style={styles.heroBanner}>
            <View style={styles.heroContent}>
              {/* Community Avatar and Name Row */}
              <View style={styles.heroTopRow}>
                <View
                  style={[
                    styles.communityAvatar,
                    {
                      backgroundColor: t.scheme === 'dark' ? hexToRgba(brandColor, 0.3) : hexToRgba(brandColor, 0.12),
                      borderColor: t.scheme === 'dark' ? hexToRgba(brandColor, 0.6) : hexToRgba(brandColor, 0.35),
                      borderWidth: 2.5,
                    },
                  ]}>
                  <Text
                    style={[styles.avatarText, {color: brandColor}]}>
                    {plainCommunityName.charAt(0).toUpperCase()}
                  </Text>
                </View>

                <View style={styles.heroTopInfo}>
                  {/* Community Name */}
                  <Text style={[styles.communityNameCompact, pal.text]}>
                    {displayCommunityName}
                  </Text>
                  <Text style={[styles.communitySubtitle, pal.textLight]}>
                    Community governance, representation, and civic activity.
                  </Text>
                </View>

                <TouchableOpacity
                  accessibilityRole="button"
                  disabled={isDraft || isJoinPending}
                  style={[
                    styles.followButton,
                    {
                      backgroundColor: isJoined
                        ? t.scheme === 'dark'
                          ? t.palette.primary_100
                          : t.palette.primary_100
                        : t.palette.primary_500,
                      borderWidth: isJoined ? 1 : 0,
                      borderColor: isJoined
                        ? t.palette.primary_200
                        : 'transparent',
                      opacity: isJoinPending ? 0.6 : 1,
                    },
                  ]}
                  onPress={isDraft ? undefined : () => void onPressJoin()}>
                  <Text
                    style={[
                      styles.followButtonText,
                      {
                        color: isJoined
                          ? t.palette.primary_700
                          : '#fff',
                      },
                    ]}>
                    {isDraft
                      ? isJoined
                        ? 'Founding member'
                        : 'Draft quorum'
                      : isJoinPending
                        ? isJoined
                          ? 'Leaving...'
                          : 'Joining...'
                        : isJoined
                          ? 'Joined'
                          : 'Join'}
                  </Text>
                </TouchableOpacity>
              </View>
              {joinLeaveError ? (
                <Text
                  style={{
                    color: t.palette.negative_500,
                    fontSize: 13,
                    marginTop: 4,
                  }}>
                  {cleanError(joinLeaveError)}
                </Text>
              ) : null}

              {/* Pill-Chip Stats Grid */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsPillScroll} contentContainerStyle={styles.statsPillContainer}>
                {[
                  {label: 'Members', value: (board?.memberCount ?? 0).toLocaleString()},
                  {label: 'Posts', value: posts.length.toLocaleString()},
                  {label: 'Policy', value: communityStats.policyPosts.toLocaleString()},
                  {label: 'Matter', value: communityStats.matterPosts.toLocaleString()},
                ].map(stat => (
                  <View key={stat.label} style={[styles.statPill, {backgroundColor: t.scheme === 'dark' ? hexToRgba(brandColor, 0.12) : hexToRgba(brandColor, 0.10)}]}>
                    <Text style={[styles.statPillValue, {color: t.scheme === 'dark' ? '#e0e7ff' : brandColor}]}>{stat.value}</Text>
                    <Text style={[styles.statPillLabel, {color: t.scheme === 'dark' ? 'rgba(255,255,255,0.5)' : hexToRgba(brandColor, 0.6)}]}>{stat.label}</Text>
                  </View>
                ))}
                {/* Docs Button */}
                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={onPressDocuments}
                  style={[styles.statPill, styles.docsPill, {backgroundColor: t.scheme === 'dark' ? hexToRgba(brandColor, 0.18) : hexToRgba(brandColor, 0.12), borderColor: t.scheme === 'dark' ? hexToRgba(brandColor, 0.4) : hexToRgba(brandColor, 0.25)}]}>
                  <PageTextIcon style={{color: t.scheme === 'dark' ? '#e0e7ff' : brandColor}} size="sm" />
                  <Text style={[styles.statPillLabel, {color: t.scheme === 'dark' ? '#e0e7ff' : brandColor, marginTop: 2}]}>Docs</Text>
                </TouchableOpacity>
              </ScrollView>

              {/* Activity Stats Row — Interactive pills */}
              <View style={styles.voterStatsRow}>
                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={onPressRAQ}
                  style={[styles.activityPill, {backgroundColor: t.scheme === 'dark' ? 'rgba(255,255,255,0.06)' : t.palette.primary_25}]}>
                  <Text style={[styles.activityPillValue, {color: t.scheme === 'dark' ? '#c7d2fe' : t.palette.primary_600}]}>
                    {communityStats.raqPosts.toLocaleString()}
                  </Text>
                  <Text style={[styles.activityPillLabel, pal.textLight]}>RAQ</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={onPressRoles}
                  style={[styles.activityPill, {backgroundColor: t.scheme === 'dark' ? 'rgba(255,255,255,0.06)' : t.palette.primary_25}]}>
                  <Text style={[styles.activityPillValue, {color: t.scheme === 'dark' ? '#c7d2fe' : t.palette.primary_600}]}>
                    {(governance.moderators.length + governance.officials.length + governance.deputies.length).toLocaleString()}
                  </Text>
                  <Text style={[styles.activityPillLabel, pal.textLight]}>Roles</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={onPressVoters}
                  style={[styles.activityPill, {backgroundColor: t.scheme === 'dark' ? 'rgba(255,255,255,0.06)' : t.palette.primary_25}]}>
                  <Text style={[styles.activityPillValue, {color: t.scheme === 'dark' ? '#c7d2fe' : t.palette.primary_600}]}>
                    {communityStats.visiblePosters.toLocaleString()}
                  </Text>
                  <Text style={[styles.activityPillLabel, pal.textLight]}>Voters</Text>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>

          {!isGeographicGroup ? (
            <View
              style={[
                styles.repCardContainer,
                {
                  backgroundColor: t.scheme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(99,102,241,0.04)',
                  borderColor: t.scheme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(99,102,241,0.12)',
                },
              ]}>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="View AI Delegate Profile"
                accessibilityHint="Navigates to the AI Delegate's profile page"
                onPress={onPressAgentProfile}
                disabled={!agentActorId}
                style={[
                  styles.repCardTouchable,
                  !featuredRepresentative && {paddingVertical: 8},
                ]}>
                <View style={styles.repAvatarWrap}>
                  {featuredRepresentative?.did ? (
                    <ProfileHoverCard inline did={featuredRepresentative.did}>
                      <View
                        style={[
                          styles.repAvatarCircle,
                          {
                            backgroundColor: featuredRepresentative
                              ? t.scheme === 'dark'
                                ? '#6366f1'
                                : t.palette.primary_500
                              : t.palette.contrast_100,
                          },
                        ]}>
                        <MacintoshIcon
                          style={{
                            color: featuredRepresentative ? '#fff' : t.palette.contrast_400,
                          }}
                          size="sm"
                        />
                      </View>
                    </ProfileHoverCard>
                  ) : (
                    <View
                      style={[
                        styles.repAvatarCircle,
                        {
                          backgroundColor: featuredRepresentative
                            ? t.scheme === 'dark'
                              ? '#6366f1'
                              : t.palette.primary_500
                            : t.palette.contrast_100,
                        },
                      ]}>
                      <MacintoshIcon
                        style={{
                          color: featuredRepresentative ? '#fff' : t.palette.contrast_400,
                        }}
                        size="sm"
                      />
                    </View>
                  )}
                  {/* Status dot */}
                  <View
                    style={[
                      styles.repStatusDot,
                      {backgroundColor: featuredRepresentative ? '#34d399' : '#9ca3af'},
                    ]}
                  />
                </View>
                <View style={{flex: 1}}>
                  <Text
                    style={[
                      pal.text,
                      {fontSize: 15, fontWeight: '700'},
                      !featuredRepresentative && {color: t.palette.contrast_500},
                    ]}>
                    {agentDisplayName}
                  </Text>
                  <Text
                    style={[
                      {
                        fontSize: 12,
                        color: t.scheme === 'dark' ? 'rgba(255,255,255,0.45)' : t.palette.primary_400,
                      },
                      !featuredRepresentative && {color: t.palette.contrast_400},
                    ]}>
                    {agentRoleLabel}
                  </Text>
                  {featuredRepresentative && (agentGovernanceRole || agentMandate) ? (
                    <Text
                      numberOfLines={1}
                      style={[
                        {
                          fontSize: 11,
                          marginTop: 2,
                          color: t.palette.contrast_500,
                        },
                      ]}>
                      {agentGovernanceRole ? `${agentGovernanceRole}${agentMandate ? ` • ${agentMandate}` : ''}` : agentMandate}
                    </Text>
                  ) : null}
                </View>
                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={onPressChat}
                  style={[
                    styles.repMessageBtn,
                    {backgroundColor: t.scheme === 'dark' ? '#6366f1' : t.palette.primary_500},
                  ]}>
                  <ChatIcon style={{color: '#fff'}} size="xs" />
                  <Text style={styles.repMessageText}>Chat</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Draft Banner */}
          {isDraft ? (
            <View
              style={[
                styles.draftBanner,
                {backgroundColor: t.palette.primary_25,
                 borderColor: t.palette.primary_200},
              ]}>
              <Text
                style={[
                  styles.draftBannerTitle,
                  {color: t.palette.primary_700},
                ]}>
                🚧 Draft Community
              </Text>
                <Text
                  style={[
                    styles.draftBannerBody,
                    {color: t.palette.primary_600},
                  ]}>
                  This community needs {membersToUnlock} more founding members
                  to become active. Until the quorum is reached, posts and
                  governance actions stay locked while members can still review
                  policies, matters, RAQ, and community information.
              </Text>
            </View>
          ) : null}

          {/* Navigation Tabs */}
          <View style={[styles.tabsContainer, {backgroundColor: t.scheme === 'dark' ? 'rgba(255,255,255,0.03)' : t.palette.primary_25}]}>
            <View style={[styles.tabsInner, {backgroundColor: t.scheme === 'dark' ? 'rgba(255,255,255,0.06)' : t.palette.primary_50, borderRadius: 12}]}>
              {!isDraft ? (
                <TouchableOpacity
                  accessibilityRole="button"
                  style={[
                    styles.pillTab,
                    displayedTab === 'Feed' && [
                      styles.pillTabActive,
                      {backgroundColor: t.palette.primary_500},
                    ],
                  ]}
                  onPress={() => setActiveTab('Feed')}>
                  <Text
                    style={[
                      styles.pillTabText,
                      {color: displayedTab === 'Feed' ? '#fff' : t.palette.contrast_400},
                    ]}>
                    <Trans>Posts</Trans>
                  </Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                accessibilityRole="button"
                style={[
                  styles.pillTab,
                  displayedTab === 'about' && [
                    styles.pillTabActive,
                    {backgroundColor: t.palette.primary_500},
                  ],
                ]}
                onPress={() => setActiveTab('about')}>
                <Text
                  style={[
                    styles.pillTabText,
                    {color: displayedTab === 'about' ? '#fff' : t.palette.contrast_400},
                  ]}>
                  <Trans>About</Trans>
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Content Area */}
          <View style={styles.contentArea}>
            {!isDraft && displayedTab === 'Feed' && (
              <View style={styles.feedScroll}>
                {(isLoading || !isFetched) ? (
                  <View style={styles.feedLoadingWrap}>
                    <ActivityIndicator size="large" color={t.palette.primary_500} />
                    <Text style={[styles.feedLoadingText, {color: t.palette.primary_400}]}>
                      Loading community posts…
                    </Text>
                  </View>
                ) : isError ? (
                  <View style={[styles.feedErrorCard, {backgroundColor: t.scheme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)', borderColor: t.palette.negative_200}]}>
                    <Text style={[styles.feedErrorTitle, {color: t.palette.negative_500}]}>
                      Couldn't load posts
                    </Text>
                    <Text style={[styles.feedErrorBody, pal.textLight]}>
                      {error ? cleanError(error) : 'An unexpected error occurred. Pull to refresh or tap retry.'}
                    </Text>
                    <TouchableOpacity
                      accessibilityRole="button"
                      onPress={() => void refetch()}
                      style={[styles.feedRetryButton, {backgroundColor: t.palette.primary_500}]}>
                      <Text style={styles.feedRetryText}>Retry</Text>
                    </TouchableOpacity>
                  </View>
                ) : posts.length < 1 ? (
                  <View style={styles.feedEmptyWrap}>
                    <Text style={[styles.feedEmptyIcon]}>📭</Text>
                    <Text style={[styles.feedEmptyTitle, pal.text]}>No posts yet</Text>
                    <Text style={[styles.feedEmptyBody, pal.textLight]}>
                      {_(msg`We couldn't find any real posts for this community yet.`)}
                    </Text>
                  </View>
                ) : (
                  <>
                    {posts.map((post, index) => (
                      <Post
                        key={`${post.uri}-${index}`}
                        post={post}
                        hideTopBorder={index === 0}
                      />
                    ))}
                    <ListFooter
                      isFetchingNextPage={isFetchingNextPage}
                      error={cleanError(error)}
                      onRetry={() => fetchNextPage()}
                    />
                  </>
                )}
              </View>
            )}

            {displayedTab === 'about' && (
              <View style={styles.aboutContainer}>
                {/* Accept Founder Invite Card (Draft only, non-members) */}
                {isDraft && !isJoined ? (
                  <View
                    style={[
                      styles.sectionCard,
                      pal.border,
                      {backgroundColor: t.palette.primary_50},
                    ]}>
                    <Text
                      style={[
                        styles.sectionCardTitle,
                        {color: t.palette.primary_700},
                      ]}>
                      🤝 Join as a Founding Member
                    </Text>
                    <Text
                      style={[
                        styles.civicActionsSubtitle,
                        {color: t.palette.primary_600},
                      ]}>
                      This community is gathering its founding members. Accept
                      the invite to become one of the first 9 and help bring
                      this community to life.
                    </Text>
                    <View style={{gap: 8, marginTop: 4}}>
                      <Text
                        style={[
                          styles.aboutHelperText,
                          {color: t.palette.primary_600},
                        ]}>
                        Current founding members:{' '}
                        {quorumCount} / 9
                      </Text>
                      <View
                        style={[
                          styles.quorumBar,
                          {backgroundColor: t.palette.contrast_100},
                        ]}>
                        <View
                          style={[
                            styles.quorumBarFill,
                            {
                              backgroundColor: t.palette.primary_500,
                              width: `${Math.min(100, (quorumCount / 9) * 100)}%`,
                            },
                          ]}
                        />
                      </View>
                    </View>
                    {acceptInviteMutation.error ? (
                      <Text
                        style={{
                          color: t.palette.negative_500,
                          fontSize: 13,
                          marginTop: 4,
                        }}>
                        {cleanError(acceptInviteMutation.error)}
                      </Text>
                    ) : null}
                    {acceptInviteMutation.isSuccess ? (
                      <Text
                        style={{
                          color: t.palette.positive_500,
                          fontSize: 14,
                          fontWeight: '700',
                          marginTop: 4,
                        }}>
                        ✅ You've joined as a founding member!
                      </Text>
                    ) : (
                      <TouchableOpacity
                        accessibilityRole="button"
                        disabled={acceptInviteMutation.isPending}
                        onPress={() => void onPressAcceptFounderInvite()}
                        style={[
                          styles.primaryButton,
                          {
                            backgroundColor: acceptInviteMutation.isPending
                              ? t.palette.contrast_200
                              : t.palette.primary_500,
                            marginTop: 8,
                          },
                        ]}>
                        <Text style={styles.primaryButtonText}>
                          {acceptInviteMutation.isPending
                            ? 'Joining...'
                            : 'Accept Founder Invite'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ) : null}

                {board?.founderStarterPackUri ? (
                  <View
                    style={[
                      styles.sectionCard,
                      pal.border,
                      {
                        backgroundColor: isDraft
                          ? t.palette.primary_25
                          : t.atoms.bg.backgroundColor,
                      },
                    ]}>
                    <Text
                      style={[
                        styles.sectionCardTitle,
                        isDraft ? {color: t.palette.primary_700} : pal.text,
                      ]}>
                      Founding Starter Pack
                    </Text>
                    <Text
                      style={[
                        styles.aboutHelperText,
                        isDraft
                          ? {color: t.palette.primary_600}
                          : pal.textLight,
                      ]}>
                      This internal starter pack tracks the founding quorum for
                      the community and unlocks the full community experience at
                      9 members.
                    </Text>
                    <View style={styles.aboutInfo}>
                      <Text
                        style={[
                          styles.aboutLabel,
                          isDraft ? {color: t.palette.primary_600} : pal.textLight,
                        ]}>
                        Progress:
                      </Text>
                      <Text style={[styles.aboutValue, pal.text]}>
                        {quorumCount} / 9 founding members
                      </Text>
                    </View>
                    <View style={styles.aboutInfo}>
                      <Text
                        style={[
                          styles.aboutLabel,
                          isDraft ? {color: t.palette.primary_600} : pal.textLight,
                        ]}>
                        Status:
                      </Text>
                      <Text style={[styles.aboutValue, pal.text]}>
                        {isDraft ? 'Draft quorum in progress' : 'Community unlocked'}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.quorumBar,
                        {
                          backgroundColor: isDraft
                            ? t.palette.contrast_100
                            : t.palette.primary_100,
                        },
                      ]}>
                      <View
                        style={[
                          styles.quorumBarFill,
                          {
                            backgroundColor: t.palette.primary_500,
                            width: `${Math.min(100, (quorumCount / 9) * 100)}%`,
                          },
                        ]}
                      />
                    </View>
                    <TouchableOpacity
                      accessibilityRole="button"
                      onPress={onPressFoundingStarterPack}
                      style={[
                        styles.secondaryButton,
                        {
                          backgroundColor: isDraft
                            ? t.palette.primary_50
                            : t.palette.contrast_25,
                          borderColor: t.palette.primary_200,
                        },
                      ]}>
                      <Text
                        style={[
                          styles.secondaryButtonText,
                          {color: t.palette.primary_700},
                        ]}>
                        Open founding starter pack
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : null}

                {/* Civic Actions */}
                <View style={[styles.sectionCard, pal.border, t.atoms.bg]}>
                  <View style={styles.civicActionsHeader}>
                    <Text style={[styles.sectionCardTitle, pal.text]}>
                      Civic Actions
                    </Text>
                    <Text style={[styles.civicActionsSubtitle, pal.textLight]}>
                      Jump straight into structured participation for this
                      community.
                    </Text>
                  </View>
                  <View style={styles.civicActionsGrid}>
                    {[
                      {
                        key: 'policies',
                        title: 'Policies',
                        subtitle: 'Governance and community rules',
                        icon: '||#',
                        onPress: onPressPolicies,
                        bg: t.palette.primary_100,
                      },
                      {
                        key: 'matters',
                        title: 'Matters',
                        subtitle: 'Core community priorities',
                        icon: '|#',
                        onPress: onPressMatters,
                        bg: t.palette.contrast_100,
                      },
                      {
                        key: 'raq',
                        title: 'RAQ',
                        subtitle: 'Append and frame open questions',
                        icon: '?!',
                        onPress: onPressRAQ,
                        bg: t.palette.primary_25,
                      },
                      {
                        key: 'cabildeo',
                        title: 'Cabildeo',
                        subtitle:
                          'Open scoped deliberations for this community',
                        icon: '|#|',
                        onPress: onPressCabildeo,
                        bg: t.palette.primary_100,
                      },
                      {
                        key: 'voters',
                        title: 'Voters',
                        subtitle: 'See the active voter landscape',
                        icon: '|',
                        onPress: onPressVoters,
                        bg: t.palette.contrast_25,
                      },
                      {
                        key: 'roles',
                        title: 'Roles',
                        subtitle: 'Community executives & experts',
                        icon: '***',
                        onPress: onPressRoles,
                        bg: t.palette.primary_50,
                      },
                      {
                        key: 'docs',
                        title: 'Docs',
                        subtitle: 'Browse source documents and references',
                        icon: '[]',
                        onPress: onPressDocuments,
                        bg: t.palette.primary_100,
                      },
                    ].map(action => (
                      <TouchableOpacity
                        accessibilityRole="button"
                        key={action.key}
                        onPress={action.onPress}
                        style={[
                          styles.civicActionCard,
                          {backgroundColor: action.bg},
                        ]}>
                        <View style={styles.civicActionTopRow}>
                          <Text
                            style={[
                              styles.civicActionSigil,
                              {color: t.palette.primary_600},
                            ]}>
                            {action.icon}
                          </Text>
                          {action.key === 'docs' ? (
                            <PageTextIcon
                              style={{color: t.palette.primary_600}}
                              size="sm"
                            />
                          ) : null}
                        </View>
                        <Text style={[styles.civicActionTitle, pal.text]}>
                          {action.title}
                        </Text>
                        <Text
                          style={[styles.civicActionSubtitle, pal.textLight]}>
                          {action.subtitle}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Community Info */}
                <View style={[styles.sectionCard, pal.border, t.atoms.bg]}>
                  <Text style={[styles.aboutTitle, pal.text]}>
                    <Trans>About this Community</Trans>
                  </Text>

                  {/* Estandarte toggle */}
                  <TouchableOpacity
                    accessibilityRole="button"
                    onPress={() => setShowEstandarte(v => !v)}
                    style={[
                      styles.estandarteToggle,
                      {borderColor: t.palette.contrast_100},
                    ]}>
                    <Text style={[styles.estandarteToggleText, pal.text]}>
                      {showEstandarte ? 'Hide estandarte' : 'Show estandarte'}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        color: t.palette.primary_500,
                      }}>
                      {showEstandarte ? '▲' : '▼'}
                    </Text>
                  </TouchableOpacity>
                  {showEstandarte && (
                    <CivicInsignia
                      variant="banner"
                      colors={getCommunityInsignia(resolvedCommunityName)}
                      height={8}
                      style={{marginBottom: 12}}
                    />
                  )}

                  <View style={styles.badgesSection}>
                    <View style={styles.badgesSectionHeader}>
                      <Text style={[styles.badgesSectionTitle, pal.text]}>
                        <Trans>Community Directory</Trans>
                      </Text>
                      <TouchableOpacity
                        accessibilityRole="button"
                        onPress={onPressRoles}
                        style={[
                          styles.badgesSectionButton,
                          {borderColor: t.palette.contrast_100},
                        ]}>
                        <Text
                          style={[
                            styles.badgesSectionButtonText,
                            {color: t.palette.primary_500},
                          ]}>
                          Open directory
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={[styles.aboutHelperText, pal.textLight]}>
                      {isGovernanceLoading
                        ? 'Loading published governance record...'
                        : isGovernanceError
                          ? 'Could not load governance right now. You can retry and continue browsing other sections.'
                          : fetchedGovernance
                            ? `Published governance currently lists ${governance.moderators.length} moderators, ${governance.officials.length} official representatives, and ${governance.deputies.length} deputy roles.`
                            : 'This community has not published a governance record yet.'}
                    </Text>
                    {isGovernanceError ? (
                      <TouchableOpacity
                        accessibilityRole="button"
                        onPress={() => void refetchGovernance()}
                        style={[
                          styles.badgesSectionButton,
                          {borderColor: t.palette.contrast_100},
                        ]}>
                        <Text
                          style={[
                            styles.badgesSectionButtonText,
                            {color: t.palette.primary_500},
                          ]}>
                          Retry governance
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                    <View style={styles.badgesCardsRow}>
                      <TouchableOpacity
                        accessibilityRole="button"
                        onPress={onPressRoles}
                        style={[
                          styles.badgesStatCard,
                          {backgroundColor: t.palette.primary_100},
                        ]}>
                        <Text style={[styles.badgesStatCount, pal.text]}>
                          {governance.moderators.length}
                        </Text>
                        <Text style={[styles.badgesStatLabel, pal.textLight]}>
                          moderators
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        accessibilityRole="button"
                        onPress={onPressRoles}
                        style={[
                          styles.badgesStatCard,
                          {backgroundColor: t.palette.primary_50},
                        ]}>
                        <Text style={[styles.badgesStatCount, pal.text]}>
                          {governance.officials.length}
                        </Text>
                        <Text style={[styles.badgesStatLabel, pal.textLight]}>
                          official reps
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        accessibilityRole="button"
                        onPress={onPressRoles}
                        style={[
                          styles.badgesStatCard,
                          {backgroundColor: t.palette.contrast_25},
                        ]}>
                        <Text style={[styles.badgesStatCount, pal.text]}>
                          {governance.deputies.length}
                        </Text>
                        <Text style={[styles.badgesStatLabel, pal.textLight]}>
                          deputy roles
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Text style={[styles.aboutText, pal.text]}>
                    {board?.description ||
                      `${plainCommunityName} is a community space for governance, public coordination, and structured participation.`}
                  </Text>
                  {board?.quadrant ? (
                    <View style={styles.aboutInfo}>
                      <Text style={[styles.aboutLabel, pal.textLight]}>
                        Quadrant:
                      </Text>
                      <Text style={[styles.aboutValue, pal.text]}>
                        {board.quadrant}
                      </Text>
                    </View>
                  ) : null}
                  {createdAt ? (
                    <View style={styles.aboutInfo}>
                      <Text style={[styles.aboutLabel, pal.textLight]}>
                        Created:
                      </Text>
                      <Text style={[styles.aboutValue, pal.text]}>
                        {new Date(createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                  ) : null}
                  {typeof board?.memberCount === 'number' ? (
                    <View style={styles.aboutInfo}>
                      <Text style={[styles.aboutLabel, pal.textLight]}>
                        Members:
                      </Text>
                      <Text style={[styles.aboutValue, pal.text]}>
                        {board.memberCount}
                      </Text>
                    </View>
                  ) : null}
                  <View style={styles.aboutInfo}>
                    <Text style={[styles.aboutLabel, pal.textLight]}>
                      Moderators:
                    </Text>
                    <Text style={[styles.aboutValue, pal.text]}>
                      {governance.moderators.length
                        ? governance.moderators
                            .map(
                              member =>
                                member.displayName ||
                                member.handle ||
                                member.did,
                            )
                            .join(', ')
                        : 'Not published yet'}
                    </Text>
                  </View>

                  {board ? (
                    <View
                      style={[
                        styles.sectionCard,
                        pal.border,
                        t.atoms.bg,
                        {backgroundColor: t.atoms.bg.backgroundColor},
                      ]}>
                      <Text style={[styles.sectionCardTitle, pal.text]}>
                        Governance Setup
                      </Text>
                      <Text
                        style={[
                          styles.aboutHelperText,
                          pal.textLight,
                          {marginBottom: 8},
                        ]}>
                        Delegate and subdelegate chats exist as linked
                        governance resources for this community.
                      </Text>
                      <View style={styles.aboutInfo}>
                        <Text style={[styles.aboutLabel, pal.textLight]}>
                          Delegates chat:
                        </Text>
                        <Text style={[styles.aboutValue, pal.text]}>
                          {board.delegatesChatId}
                        </Text>
                      </View>
                      <View style={styles.aboutInfo}>
                        <Text style={[styles.aboutLabel, pal.textLight]}>
                          Subdelegates chat:
                        </Text>
                        <Text style={[styles.aboutValue, pal.text]}>
                          {board.subdelegatesChatId}
                        </Text>
                      </View>
                    </View>
                  ) : null}
                </View>

                <View
                  style={[
                    styles.rulesCard,
                    pal.border,
                    t.atoms.bg,
                    {backgroundColor: t.atoms.bg.backgroundColor},
                  ]}>
                  <Text style={[styles.rulesTitle, pal.text]}>
                    <Trans>Community Rules</Trans>
                  </Text>
                  {rules.map((rule, index) => (
                    <View key={index} style={styles.ruleItem}>
                      <View
                        style={[
                          styles.ruleNumber,
                          {backgroundColor: t.palette.primary_500},
                        ]}>
                        <Text style={styles.ruleNumberText}>{index + 1}</Text>
                      </View>
                      <Text style={[styles.ruleText, pal.text]}>{rule}</Text>
                    </View>
                  ))}
                </View>

                <View
                  style={[
                    styles.sectionCard,
                    pal.border,
                    t.atoms.bg,
                    {backgroundColor: t.atoms.bg.backgroundColor},
                  ]}>
                  <Text style={[styles.sectionCardTitle, pal.text]}>
                    <Trans>Policy Results</Trans>
                  </Text>

                  <View style={styles.policyTreeItem}>
                    <View style={styles.policyTreeHeader}>
                      <Text style={[styles.policyTreeTitle, pal.text]}>
                        <Trans>Answered by voters</Trans>
                      </Text>
                    </View>

                    {/* Results Table */}
                    <View style={styles.resultsSection}>
                      <TableContent pal={pal} />
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  accessibilityRole="button"
                  style={[
                    styles.expandCard,
                    pal.border,
                    t.atoms.bg,
                    {backgroundColor: t.atoms.bg.backgroundColor},
                  ]}>
                  <View style={styles.expandCardContent}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                      }}>
                      <TreeIcon size="lg" style={pal.text} />
                      <Text
                        style={[
                          styles.expandCardTitle,
                          pal.text,
                          {marginBottom: 0},
                        ]}>
                        <Trans>Policy Tree</Trans>
                      </Text>
                    </View>
                    <Text style={[styles.expandCardSubtitle, pal.textLight]}>
                      score:
                    </Text>
                  </View>
                  <Text style={[styles.expandIcon, pal.text]}>⌄</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </Layout.Center>
      </ScrollView>
    </Layout.Screen>
  )
}

const styles = StyleSheet.create({
  feedScroll: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  // Enhanced Hero Section
  heroBanner: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  heroContent: {
    gap: 14,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  communityAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  avatarText: {
    fontSize: 34,
    fontWeight: '800',
  },
  heroTopInfo: {
    flex: 1,
    gap: 4,
  },
  communityNameCompact: {
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  communitySubtitle: {
    fontSize: 13,
    lineHeight: 18,
    maxWidth: 280,
  },
  followButton: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 20,
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  statsPillScroll: {
    marginTop: 2,
  },
  statsPillContainer: {
    gap: 8,
    paddingRight: 8,
  },
  statPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    minWidth: 68,
  },
  statPillValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  statPillLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  docsPill: {
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
  },
  voterStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activityPill: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  activityPillValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  activityPillLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  documentsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  documentsButtonIcon: {
    color: '#fff',
  },
  documentsButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
  aiDelegateChip: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 22,
    borderWidth: 1,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3,
    padding: 14,
  },
  aiDelegateTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  aiDelegateIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  aiDelegateAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiDelegateTextBlock: {
    flex: 1,
  },
  aiDelegateEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  aiDelegateName: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  aiDelegateRole: {
    fontSize: 13,
    lineHeight: 18,
  },
  aiDelegateChevron: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiDelegateChevronText: {
    fontSize: 18,
    fontWeight: '700',
  },
  aiDelegateExpanded: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(148, 163, 184, 0.25)',
    gap: 12,
  },
  aiDelegateMetaRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  aiDelegateMetaPill: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(148, 163, 184, 0.12)',
  },
  aiDelegateActions: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  aiDelegateActionPrimary: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiDelegateActionPrimaryText: {
    fontSize: 14,
    fontWeight: '800',
  },
  aiDelegateActionSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  aiDelegateActionSecondaryText: {
    fontSize: 14,
    fontWeight: '700',
  },
  aiDelegateActionWide: {
    width: '100%',
  },
  // Old hero styles removed (communityName, memberCount, joinButton, etc.)
  statsBar: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  tabsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  tabsInner: {
    flexDirection: 'row',
    padding: 3,
  },
  pillTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  pillTabActive: {
    shadowColor: '#6366f1',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  pillTabText: {
    fontSize: 14,
    fontWeight: '700',
  },
  contentArea: {
    padding: 16,
  },
  // Posts Section - Enhanced
  postsContainer: {
    gap: 12,
  },
  postContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  postLayout: {
    flexDirection: 'row',
    gap: 12,
  },
  postAvatarColumn: {
    width: 42,
  },
  postContentColumn: {
    flex: 1,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  postAuthorName: {
    fontWeight: 'bold',
    fontSize: 15,
  },
  postAuthorHandle: {
    fontSize: 14,
    flexShrink: 1,
  },
  postTime: {
    fontSize: 14,
  },
  postContext: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '600',
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  pinnedBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pinnedText: {
    fontSize: 11,
    color: '#666',
  },
  postBody: {
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 12,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  voteControlContainer: {
    marginRight: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 14,
  },
  // Old post styles (keeping voteButton and voteCount for backwards compat)
  postVotes: {
    alignItems: 'center',
    marginRight: 12,
    gap: 4,
  },
  voteButton: {
    fontSize: 18,
  },
  voteCount: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  postContent: {
    flex: 1,
  },
  postMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  postAuthor: {
    fontSize: 12,
  },
  postComments: {
    fontSize: 12,
  },
  aboutCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  aboutTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  estandarteToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  estandarteToggleText: {
    fontSize: 14,
    fontWeight: '500',
  },
  aboutText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  aboutHelperText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  aboutInfo: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  aboutLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
    width: 100,
  },
  aboutValue: {
    fontSize: 14,
    flex: 1,
  },
  badgesSection: {
    marginTop: 12,
  },
  badgesSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  badgesSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  badgesSectionButton: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  badgesSectionButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
  badgesCardsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  badgesStatCard: {
    flex: 1,
    minWidth: 150,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  badgesStatCount: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  badgesStatLabel: {
    fontSize: 13,
    lineHeight: 18,
  },
  rulesCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  rulesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  ruleNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  ruleNumberText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  ruleText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 32,
  },
  // New About Section Styles
  aboutContainer: {
    gap: 12,
  },
  sectionCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 10,
  },
  sectionCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  civicActionsHeader: {
    marginBottom: 16,
  },
  civicActionsSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: -6,
  },
  civicActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  civicActionCard: {
    flex: 1,
    minWidth: 150,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  civicActionTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  civicActionSigil: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  civicActionTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  civicActionSubtitle: {
    fontSize: 12,
    lineHeight: 17,
  },
  governanceHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  governanceIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  governanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  governanceAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  governanceAvatarText: {
    fontSize: 18,
    fontWeight: '800',
  },
  governanceBody: {
    flex: 1,
  },
  governanceTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  governanceSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  governanceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  governanceBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  repCard: {
    borderTopWidth: 1,
    paddingTop: 14,
    paddingBottom: 4,
  },
  repHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  repHeaderText: {
    flex: 1,
  },
  repName: {
    fontSize: 16,
    fontWeight: '700',
  },
  repOffice: {
    fontSize: 13,
    marginTop: 2,
  },
  repMandate: {
    fontSize: 14,
    lineHeight: 20,
  },
  flexOne: {
    flex: 1,
  },
  deputyIntro: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: -8,
  },
  deputyCard: {
    borderTopWidth: 1,
    paddingTop: 14,
    paddingBottom: 4,
  },
  deputyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 10,
  },
  deputyTier: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  deputyRole: {
    fontSize: 16,
    fontWeight: '700',
  },
  deputyMetricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  deputyMetricCard: {
    flex: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(148, 163, 184, 0.08)',
  },
  deputyMetricLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  deputyMetricValue: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  deputyApplicantsWrap: {
    gap: 8,
  },
  applicantChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  applicantChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
  },
  applicantChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  policyTreeItem: {
    gap: 12,
  },
  policyTreeHeader: {
    marginBottom: 8,
  },
  policyTreeTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  resultsSection: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  resultsSectionLabel: {
    fontSize: 14,
  },
  resultsSectionValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  statsGrid: {
    gap: 8,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  statsLabel: {
    flex: 1,
    fontSize: 13,
  },
  statsHeader: {
    width: 50,
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  statsValue: {
    width: 50,
    fontSize: 13,
    textAlign: 'center',
  },
  badgeContainer: {
    alignItems: 'flex-end',
    marginVertical: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  extendedStatsTable: {
    marginTop: 12,
    gap: 8,
  },
  expandCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  expandCardContent: {
    flex: 1,
  },
  expandCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  expandCardSubtitle: {
    fontSize: 14,
  },
  expandIcon: {
    fontSize: 24,
  },
  draftBanner: {
    marginHorizontal: 16,
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  draftBannerTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  draftBannerBody: {
    fontSize: 13,
    lineHeight: 18,
  },
  quorumBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden' as const,
  },
  quorumBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  primaryButton: {
    minHeight: 48,
    borderRadius: 14,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: 16,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryButton: {
    minHeight: 44,
    borderRadius: 14,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: 16,
    borderWidth: 1,
    marginTop: 12,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  // Representative Card
  repCardContainer: {
    marginHorizontal: 16,
    marginTop: -12,
    marginBottom: 12,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden' as const,
  },
  repCardTouchable: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  repAvatarWrap: {
    position: 'relative' as const,
  },
  repAvatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  repStatusDot: {
    position: 'absolute' as const,
    bottom: 0,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#1e1e2e',
  },
  repMessageBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  repMessageText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Feed States
  feedLoadingWrap: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 60,
    gap: 12,
  },
  feedLoadingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  feedErrorCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center' as const,
    gap: 8,
    marginTop: 20,
  },
  feedErrorTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  feedErrorBody: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center' as const,
  },
  feedRetryButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 4,
  },
  feedRetryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  feedEmptyWrap: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 60,
    gap: 8,
  },
  feedEmptyIcon: {
    fontSize: 40,
  },
  feedEmptyTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  feedEmptyBody: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center' as const,
    maxWidth: 280,
  },
})
function TableContent({pal}: {pal: any}) {
  const {width} = useWindowDimensions()
  const isMobile = width < 800 || Platform.OS !== 'web'

  return (
    <StickyTable
      data={{
        titleData: [
          'Policy',
          'RAQ',
          'Global',
          'Socialissues',
          'PublicServices',
          'InternalRevenueService',
          'ExternalAffairs',
          'Economy',
          'InternalAffairs',
        ],
        tableData: [
          {
            maxWidth: isMobile ? 70 : 100, // Responsive width
            data: [
              isMobile ? 'NV' : 'No. of votes',
              '9',
              '26',
              '2',
              '9',
              '6',
              '1',
              '5',
              '8',
            ],
          },
          {
            maxWidth: 70,
            data: [
              isMobile ? 'MV' : 'Abs. Average',
              '3.0',
              '2.8',
              '3.0',
              '3.0',
              '2.8',
              '2.8',
              '2.8',
              '2.8',
            ],
          },
          {
            maxWidth: isMobile ? 70 : 100, // Responsive width
            data: [
              isMobile ? 'Avg(+)' : '  (+) Average',
              '1.5',
              '1.4',
              '1.8',
              '1.9',
              '1.2',
              '1.1',
              '1.3',
              '1.4',
            ],
          },
          {
            maxWidth: isMobile ? 70 : 100, // Responsive width
            data: [
              isMobile ? 'Avg(-)' : '  (-) Average',
              '-1.5',
              '-1.4',
              '-1.2',
              '-1.1',
              '-1.6',
              '-1.7',
              '-1.5',
              '-1.4',
            ],
          },
        ],
      }}
      maxWidth={140} // Width for Policy column
      minWidth={140}
      rowTitleProps={{
        titleBackgroundColor: pal.view.backgroundColor as string,
        firstIndexContainerStyle: [
          pal.view,
          pal.border,
          {
            borderRightWidth: 0,
            borderBottomWidth: 0,
            paddingHorizontal: 8,
            justifyContent: 'center',
          },
        ] as any,
        otherIndexContainerStyle: [
          pal.view,
          pal.border,
          {
            borderRightWidth: 0,
            borderBottomWidth: 0,
            paddingHorizontal: 8,
            justifyContent: 'center',
          },
        ] as any,
        separatorViewStyle: [
          pal.view,
          pal.border,
          {borderRightWidth: 0, width: 0},
        ],
        firstWordTextProps: {
          style: [pal.text, {fontWeight: 'bold', textAlign: 'center'}],
        },
        restSentenceTextProps: {
          style: [pal.text, {textAlign: 'center'}],
        },
      }}
      tableItemProps={{
        listItemContainerStyle: pal.view,
        columnTitleStyle: [
          pal.view,
          pal.border,
          {
            borderRightWidth: 0,
            borderBottomWidth: 0,
            justifyContent: 'center',
            alignItems: 'center',
          },
        ] as any,
        columnItemStyle: [
          pal.view,
          pal.border,
          {
            borderRightWidth: 0,
            borderBottomWidth: 0,
            justifyContent: 'center',
            alignItems: 'center',
          },
        ] as any,
        separatorViewStyle: [pal.view, {width: 0}],
        columnItemTextStyle: [pal.text, {textAlign: 'center'}],
      }}
    />
  )
}
