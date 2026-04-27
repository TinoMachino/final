import {useCallback, useMemo, useState} from 'react'
import {
  type NativeScrollEvent,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import {type AppBskyFeedDefs} from '@atproto/api'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'
import {useNavigation, useRoute} from '@react-navigation/native'

import {
  canManageGovernance,
  communityGovernanceHandleLabel,
  type CommunityGovernanceView,
  getModeratorCapabilities,
  isCommunityModerator,
} from '#/lib/community-governance'
import {getPostBadges, type PostBadge} from '#/lib/post-flairs'
import {type NavigationProp} from '#/lib/routes/types'
import {
  buildCommunitySearchQuery,
  formatCommunityName,
} from '#/lib/strings/community-names'
import {cleanError} from '#/lib/strings/errors'
import {
  publishDeputySelection,
  publishOfficialRepresentative,
  useCommunityGovernanceMutation,
  useCommunityGovernanceQuery,
} from '#/state/queries/community-governance'
import {useSearchPostsQuery} from '#/state/queries/search-posts'
import {useSession} from '#/state/session'
import {Text} from '#/view/com/util/text/Text'
import {PreviewableUserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useTheme} from '#/alf'
import {Person_Stroke2_Corner0_Rounded as PersonIcon} from '#/components/icons/Person'
import {Shield_Stroke2_Corner0_Rounded as ShieldIcon} from '#/components/icons/Shield'
import {Tree_Stroke2_Corner0_Rounded as TreeIcon} from '#/components/icons/Tree'
import {Verified_Stroke2_Corner2_Rounded as VerifiedIcon} from '#/components/icons/Verified'
import * as Layout from '#/components/Layout'
import {ListFooter, ListMaybePlaceholder} from '#/components/Lists'

type CommunityBadgeParams = {
  communityId: string
  communityName: string
}

type BadgeHolder = {
  author: AppBskyFeedDefs.PostView['author']
  count: number
  latestIndexedAt: string
}

type BadgeSection = {
  badge: PostBadge
  description: string
  holders: BadgeHolder[]
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

function describeBadge(badge: PostBadge) {
  if (badge.kind === 'policy') {
    return badge.isOfficial
      ? 'Marks authors currently posting official policy positions for this community.'
      : 'Marks authors currently posting community policy proposals or discussion points.'
  }

  if (badge.kind === 'matter') {
    return badge.isOfficial
      ? 'Marks authors currently posting official matters tracked by this community.'
      : 'Marks authors currently posting community matters, incidents, or local cases.'
  }

  switch (badge.key.replace('postType:', '')) {
    case 'meme':
      return 'Used for satirical or remix-style posts that still belong to the community conversation.'
    case 'raq':
      return 'Used for RAQ-style framing posts that append or clarify a position.'
    case 'open_question':
      return 'Used for open questions that invite structured community responses.'
    case 'meta':
      return 'Used for posts about the community itself, moderation, or process.'
    case 'competition':
      return 'Used for submissions to a community contest or challenge.'
    case 'fake_article':
      return 'Used for fictional article, tweet, or text simulations shared in-context.'
    default:
      return 'Used for a distinct post format currently active in this community.'
  }
}

export function CommunityBadgesScreen() {
  const t = useTheme()
  const {_} = useLingui()
  const navigation = useNavigation<NavigationProp>()
  const {currentAccount} = useSession()
  const route = useRoute<{
    key: string
    name: 'CommunityBadges'
    params: CommunityBadgeParams
  }>()
  const {communityName = 'Community', communityId} = route.params || {}
  const formattedCommunity = useMemo(
    () => formatCommunityName(communityName),
    [communityName],
  )
  const [isPTR, setIsPTR] = useState(false)
  const [editingRoleKey, setEditingRoleKey] = useState<string | null>(null)
  const [roleDescriptionDraft, setRoleDescriptionDraft] = useState('')
  const [roleCapabilitiesDraft, setRoleCapabilitiesDraft] = useState('')
  const [metadataDraft, setMetadataDraft] = useState({
    reviewCadence: '',
    escalationPath: '',
    publicContact: '',
  })
  const [officialDraft, setOfficialDraft] = useState({
    displayName: '',
    handle: '',
    office: '',
    mandate: '',
  })

  const {
    data: fetchedGovernance,
    isLoading: isGovernanceLoading,
    isError: isGovernanceError,
    refetch: refetchGovernance,
  } = useCommunityGovernanceQuery({
    communityName,
    communityId,
  })
  const governanceMutation = useCommunityGovernanceMutation({
    communityName,
    communityId,
  })
  const governance = fetchedGovernance || EMPTY_GOVERNANCE
  const communitySearchQuery = useMemo(
    () =>
      buildCommunitySearchQuery(communityName, fetchedGovernance?.community),
    [communityName, fetchedGovernance?.community],
  )
  const governanceCommunity = fetchedGovernance?.community
  const displayCommunityName = governanceCommunity
    ? formatCommunityName(governanceCommunity).displayName
    : formattedCommunity.displayName
  const viewerDid = currentAccount?.did
  const viewerHandle = currentAccount?.handle
  const isModerator = isCommunityModerator(governance, viewerDid)
  const canEditGovernance = canManageGovernance(governance, viewerDid)
  const moderatorCapabilities = getModeratorCapabilities(governance, viewerDid)

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
  } = useSearchPostsQuery({query: communitySearchQuery, sort: 'latest'})

  const posts = useMemo(
    () => data?.pages.flatMap(page => page.posts) || [],
    [data],
  )

  const badgeSections = useMemo<BadgeSection[]>(() => {
    const sections = new Map<
      string,
      {
        badge: PostBadge
        holders: Map<string, BadgeHolder>
      }
    >()

    for (const post of posts) {
      const badges = getPostBadges(post.record as any)
      for (const badge of badges) {
        let section = sections.get(badge.key)
        if (!section) {
          section = {
            badge,
            holders: new Map(),
          }
          sections.set(badge.key, section)
        }

        const existingHolder = section.holders.get(post.author.did)
        if (!existingHolder) {
          section.holders.set(post.author.did, {
            author: post.author,
            count: 1,
            latestIndexedAt: post.indexedAt,
          })
          continue
        }

        existingHolder.count += 1
        if (
          new Date(post.indexedAt).getTime() >
          new Date(existingHolder.latestIndexedAt).getTime()
        ) {
          existingHolder.latestIndexedAt = post.indexedAt
        }
      }
    }

    return Array.from(sections.values())
      .map(section => ({
        badge: section.badge,
        description: describeBadge(section.badge),
        holders: Array.from(section.holders.values()).sort((left, right) => {
          if (right.count !== left.count) {
            return right.count - left.count
          }
          return (
            new Date(right.latestIndexedAt).getTime() -
            new Date(left.latestIndexedAt).getTime()
          )
        }),
      }))
      .sort((left, right) => {
        const kindOrder = {policy: 0, matter: 1, postType: 2}
        if (kindOrder[left.badge.kind] !== kindOrder[right.badge.kind]) {
          return kindOrder[left.badge.kind] - kindOrder[right.badge.kind]
        }
        return right.holders.length - left.holders.length
      })
  }, [posts])

  const holderCount = useMemo(() => {
    const dids = new Set<string>()
    for (const section of badgeSections) {
      for (const holder of section.holders) {
        dids.add(holder.author.did)
      }
    }
    return dids.size
  }, [badgeSections])

  const governanceStats = {
    moderators: governance.moderators.length,
    officials: governance.officials.length,
    deputyRoles: governance.deputies.length,
    deputyApplicants: governance.deputies.reduce(
      (sum, role) => sum + role.applicants.length,
      0,
    ),
  }

  const activeRole =
    governance.deputies.find(role => role.key === editingRoleKey) || null

  const onRefresh = useCallback(async () => {
    setIsPTR(true)
    await Promise.all([refetch(), refetchGovernance()])
    setIsPTR(false)
  }, [refetch, refetchGovernance])
  const onPullToRefresh = useCallback(() => {
    void onRefresh()
  }, [onRefresh])

  const onMaybeLoadMore = useCallback(
    ({layoutMeasurement, contentOffset, contentSize}: NativeScrollEvent) => {
      if (
        isFetchingNextPage ||
        !hasNextPage ||
        layoutMeasurement.height + contentOffset.y < contentSize.height - 120
      ) {
        return
      }
      void fetchNextPage()
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage],
  )

  const onStartEditingRole = (
    role: CommunityGovernanceView['deputies'][number],
  ) => {
    setEditingRoleKey(role.key)
    setRoleDescriptionDraft(role.description)
    setRoleCapabilitiesDraft(role.capabilities.join(', '))
  }

  const onSaveRole = async () => {
    if (!activeRole || !canEditGovernance) return
    await governanceMutation.mutateAsync(current => ({
      ...current,
      deputies: current.deputies.map(role =>
        role.key === activeRole.key
          ? {
              ...role,
              description: roleDescriptionDraft.trim() || role.description,
              capabilities:
                roleCapabilitiesDraft
                  .split(',')
                  .map(item => item.trim())
                  .filter(Boolean) || role.capabilities,
            }
          : role,
      ),
      editHistory: [
        {
          id: `edit-role-${activeRole.key}-${Date.now()}`,
          action: 'edit_role_descriptions',
          actorDid: viewerDid,
          actorHandle: viewerHandle,
          createdAt: new Date().toISOString(),
          summary: `Updated ${activeRole.role} role charter and capabilities.`,
        },
        ...(current.editHistory || []),
      ].slice(0, 20),
    }))
    setEditingRoleKey(null)
  }

  const onPublishMetadata = async () => {
    if (!canEditGovernance) return
    await governanceMutation.mutateAsync(current => ({
      ...current,
      metadata: {
        ...current.metadata,
        reviewCadence:
          metadataDraft.reviewCadence.trim() || current.metadata?.reviewCadence,
        escalationPath:
          metadataDraft.escalationPath.trim() ||
          current.metadata?.escalationPath,
        publicContact:
          metadataDraft.publicContact.trim() || current.metadata?.publicContact,
        lastPublishedAt: new Date().toISOString(),
      },
      editHistory: [
        {
          id: `publish-governance-${Date.now()}`,
          action: 'publish_governance_updates',
          actorDid: viewerDid,
          actorHandle: viewerHandle,
          createdAt: new Date().toISOString(),
          summary: 'Published governance metadata updates.',
        },
        ...(current.editHistory || []),
      ].slice(0, 20),
    }))
  }

  const onAddOfficialRepresentative = async () => {
    if (!canEditGovernance || !officialDraft.displayName.trim()) return
    await governanceMutation.mutateAsync(current =>
      publishOfficialRepresentative(
        current,
        {
          displayName: officialDraft.displayName.trim(),
          handle: officialDraft.handle.trim() || undefined,
          office: officialDraft.office.trim() || 'Official representative',
          mandate:
            officialDraft.mandate.trim() || 'Mandate pending publication.',
        },
        viewerDid || '',
        viewerHandle,
      ),
    )
    setOfficialDraft({
      displayName: '',
      handle: '',
      office: '',
      mandate: '',
    })
  }

  const onPromoteApplicant = async (
    roleKey: string,
    applicantIndex: number,
  ) => {
    if (!canEditGovernance) return
    const role = governance.deputies.find(item => item.key === roleKey)
    const applicant = role?.applicants[applicantIndex]
    if (!role || !applicant) return

    await governanceMutation.mutateAsync(current =>
      publishDeputySelection(
        current,
        roleKey,
        applicant,
        viewerDid || '',
        viewerHandle,
      ),
    )
  }

  return (
    <Layout.Screen testID="communityBadgesScreen" style={t.atoms.bg}>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Community Badges</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>

      {!badgeSections.length && (isLoading || !isFetched || isError) ? (
        <ListMaybePlaceholder
          isLoading={isLoading || !isFetched}
          isError={isError}
          onRetry={() => refetch()}
          emptyType="results"
          emptyMessage={_(
            msg`We couldn't find badge-bearing posts for this community yet.`,
          )}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={isPTR}
              onRefresh={onPullToRefresh}
              tintColor={t.palette.primary_500}
            />
          }
          onScroll={({nativeEvent}) => onMaybeLoadMore(nativeEvent)}
          scrollEventThrottle={400}>
          <View
            style={[
              styles.summaryCard,
              t.atoms.bg_contrast_25,
              t.atoms.border_contrast_low,
            ]}>
            <Text style={[a.text_2xl, a.font_bold, t.atoms.text]}>
              {displayCommunityName}
            </Text>
            <Text style={[a.text_sm, a.mt_xs, t.atoms.text_contrast_medium]}>
              {badgeSections.length} badge types, {holderCount} visible holders
            </Text>
            <Text style={[a.text_sm, a.mt_sm, t.atoms.text_contrast_medium]}>
              Governance is now read from the community governance record when
              available, and badge holders are still derived from indexed
              community posts.
            </Text>
            <View style={[a.mt_md, a.gap_sm]}>
              <View
                style={[
                  styles.statusCard,
                  t.atoms.bg,
                  t.atoms.border_contrast_low,
                ]}>
                <Text style={[a.text_sm, a.font_bold, t.atoms.text]}>
                  {isGovernanceLoading
                    ? 'Loading governance'
                    : fetchedGovernance
                      ? 'Published governance'
                      : 'No governance record'}
                </Text>
                <Text
                  style={[a.text_sm, a.mt_2xs, t.atoms.text_contrast_medium]}>
                  {isGovernanceLoading
                    ? 'Fetching the current governance record from the network.'
                    : isGovernanceError
                      ? 'Governance could not be loaded right now.'
                      : fetchedGovernance
                        ? `Authority record loaded${governance.repoDid ? ` from ${governance.repoDid}` : ''}.`
                        : 'This community has not published a governance record yet.'}
                </Text>
                {isGovernanceError ? (
                  <TouchableOpacity
                    accessibilityRole="button"
                    onPress={() => void refetchGovernance()}
                    style={[
                      styles.inlineAction,
                      {backgroundColor: t.palette.primary_25},
                    ]}>
                    <Text
                      style={[
                        styles.inlineActionText,
                        {color: t.palette.primary_700},
                      ]}>
                      Retry governance
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
              <View
                style={[
                  styles.statusCard,
                  t.atoms.bg,
                  t.atoms.border_contrast_low,
                ]}>
                <Text style={[a.text_sm, a.font_bold, t.atoms.text]}>
                  {isModerator ? 'Moderator access detected' : 'Read-only view'}
                </Text>
                <Text
                  style={[a.text_sm, a.mt_2xs, t.atoms.text_contrast_medium]}>
                  {isModerator
                    ? canEditGovernance
                      ? 'Your DID is present in the moderator roster, so governance tools are unlocked.'
                      : 'Your DID is present in the moderator roster, but writes are locked because this record is published from a different repo.'
                    : 'Moderator controls appear only when the fetched governance roster contains your DID.'}
                </Text>
              </View>
            </View>
            <View style={styles.topStatsRow}>
              <View
                style={[
                  styles.topStatCard,
                  t.atoms.bg,
                  t.atoms.border_contrast_low,
                ]}>
                <Text style={[styles.topStatCount, t.atoms.text]}>
                  {governanceStats.moderators}
                </Text>
                <Text
                  style={[styles.topStatLabel, t.atoms.text_contrast_medium]}>
                  moderators
                </Text>
              </View>
              <View
                style={[
                  styles.topStatCard,
                  t.atoms.bg,
                  t.atoms.border_contrast_low,
                ]}>
                <Text style={[styles.topStatCount, t.atoms.text]}>
                  {governanceStats.officials}
                </Text>
                <Text
                  style={[styles.topStatLabel, t.atoms.text_contrast_medium]}>
                  official reps
                </Text>
              </View>
              <View
                style={[
                  styles.topStatCard,
                  t.atoms.bg,
                  t.atoms.border_contrast_low,
                ]}>
                <Text style={[styles.topStatCount, t.atoms.text]}>
                  {governanceStats.deputyApplicants}
                </Text>
                <Text
                  style={[styles.topStatLabel, t.atoms.text_contrast_medium]}>
                  deputy applicants
                </Text>
              </View>
            </View>
          </View>

          <View
            style={[
              styles.sectionCard,
              t.atoms.bg,
              t.atoms.border_contrast_low,
            ]}>
            <View style={styles.sectionHeader}>
              <View
                style={[
                  styles.sectionIconBadge,
                  t.atoms.bg_contrast_25,
                  t.atoms.border_contrast_low,
                ]}>
                <ShieldIcon size="md" style={t.atoms.text} />
              </View>
              <View style={[a.flex_1]}>
                <Text style={[a.text_lg, a.font_bold, t.atoms.text]}>
                  <Trans>Moderation Badges</Trans>
                </Text>
                <Text
                  style={[a.text_sm, a.mt_2xs, t.atoms.text_contrast_medium]}>
                  The people currently steering moderation, case review, and
                  process integrity for this community.
                </Text>
              </View>
            </View>

            <View style={[a.gap_sm]}>
              {governance.moderators.map(member => (
                <View
                  key={member.did || member.handle || member.displayName}
                  style={[
                    styles.profileRow,
                    t.atoms.bg_contrast_25,
                    t.atoms.border_contrast_low,
                  ]}>
                  <View
                    style={[
                      styles.profileAvatar,
                      {backgroundColor: t.palette.primary_25},
                    ]}>
                    <Text
                      style={[
                        styles.profileAvatarText,
                        {color: t.palette.primary_600},
                      ]}>
                      {communityGovernanceHandleLabel(member).charAt(0)}
                    </Text>
                  </View>
                  <View style={[a.flex_1]}>
                    <View
                      style={[
                        a.flex_row,
                        a.align_center,
                        a.gap_xs,
                        a.flex_wrap,
                      ]}>
                      <Text style={[a.text_md, a.font_bold, t.atoms.text]}>
                        {communityGovernanceHandleLabel(member)}
                      </Text>
                      <View
                        style={[
                          styles.roleBadgeInline,
                          {backgroundColor: t.palette.primary_25},
                        ]}>
                        <Text
                          style={[
                            styles.roleBadgeText,
                            {color: t.palette.primary_600},
                          ]}>
                          {member.badge}
                        </Text>
                      </View>
                    </View>
                    <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
                      {member.handle || member.did || '@unknown'} •{' '}
                      {member.role}
                    </Text>
                    <Text
                      style={[
                        a.text_xs,
                        a.mt_xs,
                        t.atoms.text_contrast_medium,
                      ]}>
                      {member.capabilities.join(' • ')}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View
            style={[
              styles.sectionCard,
              t.atoms.bg,
              t.atoms.border_contrast_low,
            ]}>
            <View style={styles.sectionHeader}>
              <View
                style={[
                  styles.sectionIconBadge,
                  t.atoms.bg_contrast_25,
                  t.atoms.border_contrast_low,
                ]}>
                <VerifiedIcon
                  size="md"
                  style={{color: t.palette.primary_600}}
                />
              </View>
              <View style={[a.flex_1]}>
                <Text style={[a.text_lg, a.font_bold, t.atoms.text]}>
                  <Trans>Official Representatives</Trans>
                </Text>
                <Text
                  style={[a.text_sm, a.mt_2xs, t.atoms.text_contrast_medium]}>
                  Verified officials and desks that currently speak for the
                  community in formal policy and matter channels.
                </Text>
              </View>
            </View>

            <View style={[a.gap_sm]}>
              {governance.officials.map(rep => (
                <TouchableOpacity
                  key={`${rep.did || rep.handle || rep.displayName}-${rep.office}`}
                  accessibilityRole="button"
                  disabled={!rep.did && !rep.handle}
                  onPress={() => {
                    const actorId = rep.did || rep.handle
                    if (!actorId) return
                    navigation.navigate('Profile', {name: actorId})
                  }}
                  style={[
                    styles.repCard,
                    t.atoms.bg_contrast_25,
                    t.atoms.border_contrast_low,
                  ]}>
                  <View style={[a.flex_1]}>
                    <View
                      style={[
                        a.flex_row,
                        a.align_center,
                        a.gap_xs,
                        a.flex_wrap,
                      ]}>
                      <Text style={[a.text_md, a.font_bold, t.atoms.text]}>
                        {communityGovernanceHandleLabel(rep)}
                      </Text>
                      <View
                        style={[
                          styles.roleBadgeInline,
                          {backgroundColor: t.palette.primary_25},
                        ]}>
                        <Text
                          style={[
                            styles.roleBadgeText,
                            {color: t.palette.primary_600},
                          ]}>
                          Verified
                        </Text>
                      </View>
                    </View>
                    <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
                      {rep.office}
                    </Text>
                  </View>
                  <Text style={[a.text_sm, a.mt_sm, t.atoms.text]}>
                    {rep.mandate}
                  </Text>
                  {rep.handle ? (
                    <Text
                      style={[
                        a.text_xs,
                        a.mt_xs,
                        t.atoms.text_contrast_medium,
                      ]}>
                      {rep.handle}
                    </Text>
                  ) : null}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View
            style={[
              styles.sectionCard,
              t.atoms.bg,
              t.atoms.border_contrast_low,
            ]}>
            <View style={styles.sectionHeader}>
              <View
                style={[
                  styles.sectionIconBadge,
                  t.atoms.bg_contrast_25,
                  t.atoms.border_contrast_low,
                ]}>
                <TreeIcon size="md" style={{color: t.palette.primary_600}} />
              </View>
              <View style={[a.flex_1]}>
                <Text style={[a.text_lg, a.font_bold, t.atoms.text]}>
                  <Trans>Digital Deputies</Trans>
                </Text>
                <Text
                  style={[a.text_sm, a.mt_2xs, t.atoms.text_contrast_medium]}>
                  Hierarchy, active role support, and open applicants across the
                  digital organization.
                </Text>
              </View>
            </View>

            <View style={[a.gap_md]}>
              {governance.deputies.map(role => (
                <View
                  key={role.key}
                  style={[
                    styles.deputyCard,
                    t.atoms.bg_contrast_25,
                    t.atoms.border_contrast_low,
                  ]}>
                  <View style={[a.flex_row, a.justify_between, a.align_center]}>
                    <View style={[a.flex_1]}>
                      <Text
                        style={[
                          styles.deputyTier,
                          t.atoms.text_contrast_medium,
                        ]}>
                        {role.tier}
                      </Text>
                      <Text style={[a.text_md, a.font_bold, t.atoms.text]}>
                        {role.role}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.roleBadge,
                        {backgroundColor: t.palette.primary_25},
                      ]}>
                      <Text
                        style={[
                          styles.roleBadgeText,
                          {color: t.palette.primary_700},
                        ]}>
                        Active role
                      </Text>
                    </View>
                  </View>

                  <View style={styles.metricsRow}>
                    <View
                      style={[
                        styles.metricCard,
                        t.atoms.bg,
                        t.atoms.border_contrast_low,
                      ]}>
                      <Text
                        style={[
                          styles.metricLabel,
                          t.atoms.text_contrast_medium,
                        ]}>
                        holder
                      </Text>
                      <Text style={[styles.metricValue, t.atoms.text]}>
                        {communityGovernanceHandleLabel(role.activeHolder)}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.metricCard,
                        t.atoms.bg,
                        t.atoms.border_contrast_low,
                      ]}>
                      <Text
                        style={[
                          styles.metricLabel,
                          t.atoms.text_contrast_medium,
                        ]}>
                        votes backing role
                      </Text>
                      <Text style={[styles.metricValue, t.atoms.text]}>
                        {role.votes.toLocaleString()}
                      </Text>
                    </View>
                  </View>

                  <Text style={[a.text_sm, a.mb_sm, t.atoms.text]}>
                    {role.description}
                  </Text>
                  <Text
                    style={[styles.metricLabel, t.atoms.text_contrast_medium]}>
                    capabilities
                  </Text>
                  <View style={styles.capabilityList}>
                    {role.capabilities.map(capability => (
                      <View
                        key={capability}
                        style={[
                          styles.capabilityChip,
                          t.atoms.bg,
                          t.atoms.border_contrast_low,
                        ]}>
                        <Text
                          style={[a.text_sm, a.font_semi_bold, t.atoms.text]}>
                          {capability}
                        </Text>
                      </View>
                    ))}
                  </View>

                  <Text
                    style={[styles.metricLabel, t.atoms.text_contrast_medium]}>
                    applicants
                  </Text>
                  <View style={styles.applicantRow}>
                    {role.applicants.map((applicant, index) => (
                      <View
                        key={`${role.key}-${applicant.did || applicant.handle || applicant.displayName}-${index}`}
                        style={[
                          styles.applicantChip,
                          t.atoms.bg,
                          t.atoms.border_contrast_low,
                        ]}>
                        <PersonIcon
                          size="xs"
                          style={t.atoms.text_contrast_medium}
                        />
                        <Text
                          style={[a.text_sm, a.font_semi_bold, t.atoms.text]}>
                          {communityGovernanceHandleLabel(applicant)}
                        </Text>
                        {canEditGovernance ? (
                          <TouchableOpacity
                            accessibilityRole="button"
                            accessibilityLabel={`Activate ${communityGovernanceHandleLabel(
                              applicant,
                            )} for ${role.role}`}
                            accessibilityHint="Promotes this applicant into the active deputy role."
                            onPress={() =>
                              void onPromoteApplicant(role.key, index)
                            }
                            style={[
                              styles.inlineAction,
                              {backgroundColor: t.palette.primary_25},
                            ]}>
                            <Text
                              style={[
                                styles.inlineActionText,
                                {color: t.palette.primary_700},
                              ]}>
                              Activate
                            </Text>
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    ))}
                  </View>
                  {canEditGovernance ? (
                    <View style={[a.mt_md, a.gap_sm]}>
                      <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel={`Edit ${role.role} charter`}
                        accessibilityHint="Opens the inline editor for this deputy role."
                        onPress={() => onStartEditingRole(role)}
                        style={[
                          styles.primaryActionButton,
                          {backgroundColor: t.palette.primary_25},
                        ]}>
                        <Text
                          style={[
                            styles.primaryActionText,
                            {color: t.palette.primary_700},
                          ]}>
                          Edit role charter
                        </Text>
                      </TouchableOpacity>
                      {editingRoleKey === role.key ? (
                        <View
                          style={[
                            styles.editorCard,
                            t.atoms.bg,
                            t.atoms.border_contrast_low,
                          ]}>
                          <Text style={[a.text_sm, a.font_bold, t.atoms.text]}>
                            Update description
                          </Text>
                          <TextInput
                            accessibilityLabel="Role description input"
                            accessibilityHint="Edit the public description for this deputy role."
                            value={roleDescriptionDraft}
                            onChangeText={setRoleDescriptionDraft}
                            multiline
                            placeholder="Role description"
                            placeholderTextColor={t.palette.contrast_500}
                            style={[
                              styles.editorInput,
                              t.atoms.text,
                              t.atoms.border_contrast_low,
                            ]}
                          />
                          <Text style={[a.text_sm, a.font_bold, t.atoms.text]}>
                            Capabilities
                          </Text>
                          <TextInput
                            accessibilityLabel="Role capabilities input"
                            accessibilityHint="Edit the comma-separated capabilities for this deputy role."
                            value={roleCapabilitiesDraft}
                            onChangeText={setRoleCapabilitiesDraft}
                            placeholder="Comma-separated capabilities"
                            placeholderTextColor={t.palette.contrast_500}
                            style={[
                              styles.editorInput,
                              t.atoms.text,
                              t.atoms.border_contrast_low,
                            ]}
                          />
                          <View style={[a.flex_row, a.gap_sm]}>
                            <TouchableOpacity
                              accessibilityRole="button"
                              accessibilityLabel={`Save ${role.role} charter`}
                              accessibilityHint="Publishes the updated description and capabilities."
                              onPress={() => void onSaveRole()}
                              style={[
                                styles.primaryActionButton,
                                {backgroundColor: t.palette.primary_500},
                              ]}>
                              <Text
                                style={[
                                  styles.primaryActionText,
                                  {color: '#fff'},
                                ]}>
                                Save role
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              accessibilityRole="button"
                              accessibilityLabel={`Cancel editing ${role.role}`}
                              accessibilityHint="Closes the role editor without saving changes."
                              onPress={() => setEditingRoleKey(null)}
                              style={[
                                styles.secondaryActionButton,
                                t.atoms.border_contrast_low,
                              ]}>
                              <Text
                                style={[
                                  styles.secondaryActionText,
                                  t.atoms.text,
                                ]}>
                                Cancel
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ) : null}
                    </View>
                  ) : null}
                </View>
              ))}
            </View>
          </View>

          <View
            style={[
              styles.sectionCard,
              t.atoms.bg,
              t.atoms.border_contrast_low,
            ]}>
            <View style={styles.sectionHeader}>
              <View
                style={[
                  styles.sectionIconBadge,
                  t.atoms.bg_contrast_25,
                  t.atoms.border_contrast_low,
                ]}>
                <ShieldIcon size="md" style={{color: t.palette.primary_600}} />
              </View>
              <View style={[a.flex_1]}>
                <Text style={[a.text_lg, a.font_bold, t.atoms.text]}>
                  <Trans>Official Moderator Controls</Trans>
                </Text>
                <Text
                  style={[a.text_sm, a.mt_2xs, t.atoms.text_contrast_medium]}>
                  The capabilities an official moderator would need to manage
                  deputies, keep role information current, and publish
                  governance updates safely.
                </Text>
              </View>
            </View>

            <View style={[a.gap_sm]}>
              {[
                {
                  title: 'Select or remove active deputies',
                  description:
                    'Active deputy selection now writes against the governance record, so the directory can show who holds the role instead of a hardcoded name.',
                },
                {
                  title: 'Edit role descriptions and capability lists',
                  description:
                    'Role charter edits should live on the same record as the roster, because the holder and the role meaning must version together.',
                },
                {
                  title: 'Manage applicant pools and review state',
                  description:
                    'Applicants should stay attached to their role so moderators can promote, approve, or reject from one place.',
                },
                {
                  title: 'Publish governance metadata',
                  description:
                    'Review cadence, escalation path, and public contact should be published together with edit history so the community can see who changed what.',
                },
              ].map(control => (
                <View
                  key={control.title}
                  style={[
                    styles.controlCard,
                    t.atoms.bg_contrast_25,
                    t.atoms.border_contrast_low,
                  ]}>
                  <Text style={[a.text_md, a.font_bold, t.atoms.text]}>
                    {control.title}
                  </Text>
                  <Text
                    style={[a.text_sm, a.mt_xs, t.atoms.text_contrast_medium]}>
                    {control.description}
                  </Text>
                </View>
              ))}
            </View>

            <View
              style={[
                styles.controlCard,
                a.mt_md,
                t.atoms.bg_contrast_25,
                t.atoms.border_contrast_low,
              ]}>
              <Text style={[a.text_md, a.font_bold, t.atoms.text]}>
                Moderator proof model
              </Text>
              <Text style={[a.text_sm, a.mt_xs, t.atoms.text_contrast_medium]}>
                The app treats moderation as proven only when the fetched
                governance record contains your DID in the moderator roster.
                {moderatorCapabilities.length
                  ? ` Your current capabilities: ${moderatorCapabilities.join(', ')}.`
                  : ' This account has no moderator capabilities for this community.'}
              </Text>
            </View>

            {canEditGovernance ? (
              <View style={[a.mt_md, a.gap_md]}>
                <View
                  style={[
                    styles.editorCard,
                    t.atoms.bg,
                    t.atoms.border_contrast_low,
                  ]}>
                  <Text style={[a.text_md, a.font_bold, t.atoms.text]}>
                    Publish governance metadata
                  </Text>
                  <Text
                    style={[a.text_sm, a.mt_xs, t.atoms.text_contrast_medium]}>
                    These fields describe how the community is actually run and
                    are versioned into edit history.
                  </Text>
                  <TextInput
                    accessibilityLabel="Review cadence input"
                    accessibilityHint="Edit how often this community reviews governance."
                    value={metadataDraft.reviewCadence}
                    onChangeText={value =>
                      setMetadataDraft(current => ({
                        ...current,
                        reviewCadence: value,
                      }))
                    }
                    placeholder={
                      governance.metadata?.reviewCadence || 'Review cadence'
                    }
                    placeholderTextColor={t.palette.contrast_500}
                    style={[
                      styles.editorInput,
                      a.mt_md,
                      t.atoms.text,
                      t.atoms.border_contrast_low,
                    ]}
                  />
                  <TextInput
                    accessibilityLabel="Escalation path input"
                    accessibilityHint="Edit the escalation path for unresolved governance issues."
                    value={metadataDraft.escalationPath}
                    onChangeText={value =>
                      setMetadataDraft(current => ({
                        ...current,
                        escalationPath: value,
                      }))
                    }
                    placeholder={
                      governance.metadata?.escalationPath || 'Escalation path'
                    }
                    placeholderTextColor={t.palette.contrast_500}
                    style={[
                      styles.editorInput,
                      t.atoms.text,
                      t.atoms.border_contrast_low,
                    ]}
                  />
                  <TextInput
                    accessibilityLabel="Public contact input"
                    accessibilityHint="Edit the public contact channel for governance."
                    value={metadataDraft.publicContact}
                    onChangeText={value =>
                      setMetadataDraft(current => ({
                        ...current,
                        publicContact: value,
                      }))
                    }
                    placeholder={
                      governance.metadata?.publicContact || 'Public contact'
                    }
                    placeholderTextColor={t.palette.contrast_500}
                    style={[
                      styles.editorInput,
                      t.atoms.text,
                      t.atoms.border_contrast_low,
                    ]}
                  />
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Publish governance metadata update"
                    accessibilityHint="Publishes review cadence, escalation path, and public contact changes."
                    onPress={() => void onPublishMetadata()}
                    style={[
                      styles.primaryActionButton,
                      a.mt_md,
                      {backgroundColor: t.palette.primary_500},
                    ]}>
                    <Text style={[styles.primaryActionText, {color: '#fff'}]}>
                      Publish update
                    </Text>
                  </TouchableOpacity>
                </View>

                <View
                  style={[
                    styles.editorCard,
                    t.atoms.bg,
                    t.atoms.border_contrast_low,
                  ]}>
                  <Text style={[a.text_md, a.font_bold, t.atoms.text]}>
                    Add official representative
                  </Text>
                  <TextInput
                    accessibilityLabel="Representative name input"
                    accessibilityHint="Enter the display name for the new official representative."
                    value={officialDraft.displayName}
                    onChangeText={value =>
                      setOfficialDraft(current => ({
                        ...current,
                        displayName: value,
                      }))
                    }
                    placeholder="Representative name"
                    placeholderTextColor={t.palette.contrast_500}
                    style={[
                      styles.editorInput,
                      a.mt_md,
                      t.atoms.text,
                      t.atoms.border_contrast_low,
                    ]}
                  />
                  <TextInput
                    accessibilityLabel="Representative handle input"
                    accessibilityHint="Enter the handle for the new official representative."
                    value={officialDraft.handle}
                    onChangeText={value =>
                      setOfficialDraft(current => ({...current, handle: value}))
                    }
                    placeholder="Handle"
                    placeholderTextColor={t.palette.contrast_500}
                    style={[
                      styles.editorInput,
                      t.atoms.text,
                      t.atoms.border_contrast_low,
                    ]}
                  />
                  <TextInput
                    accessibilityLabel="Representative office input"
                    accessibilityHint="Enter the office or title for the new official representative."
                    value={officialDraft.office}
                    onChangeText={value =>
                      setOfficialDraft(current => ({...current, office: value}))
                    }
                    placeholder="Office"
                    placeholderTextColor={t.palette.contrast_500}
                    style={[
                      styles.editorInput,
                      t.atoms.text,
                      t.atoms.border_contrast_low,
                    ]}
                  />
                  <TextInput
                    accessibilityLabel="Representative mandate input"
                    accessibilityHint="Enter the public mandate or scope for the new official representative."
                    value={officialDraft.mandate}
                    onChangeText={value =>
                      setOfficialDraft(current => ({
                        ...current,
                        mandate: value,
                      }))
                    }
                    multiline
                    placeholder="Mandate"
                    placeholderTextColor={t.palette.contrast_500}
                    style={[
                      styles.editorInput,
                      styles.editorInputMultiline,
                      t.atoms.text,
                      t.atoms.border_contrast_low,
                    ]}
                  />
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Add official representative"
                    accessibilityHint="Adds the drafted representative to the published governance roster."
                    onPress={() => void onAddOfficialRepresentative()}
                    style={[
                      styles.primaryActionButton,
                      a.mt_md,
                      {backgroundColor: t.palette.primary_500},
                    ]}>
                    <Text style={[styles.primaryActionText, {color: '#fff'}]}>
                      Add representative
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}
          </View>

          {badgeSections.length === 0 ? (
            <View
              style={[
                styles.emptyCard,
                t.atoms.bg_contrast_25,
                t.atoms.border_contrast_low,
              ]}>
              <Text style={[a.text_lg, a.font_bold, t.atoms.text]}>
                <Trans>No badges yet</Trans>
              </Text>
              <Text style={[a.text_sm, a.mt_xs, t.atoms.text_contrast_medium]}>
                <Trans>
                  As soon as the community has posts with flairs or post types,
                  badge holders will appear here.
                </Trans>
              </Text>
            </View>
          ) : (
            badgeSections.map(section => (
              <View
                key={section.badge.key}
                style={[
                  styles.sectionCard,
                  t.atoms.bg,
                  t.atoms.border_contrast_low,
                ]}>
                <View style={[a.flex_row, a.align_center, a.justify_between]}>
                  <View
                    style={[
                      styles.badgePill,
                      {backgroundColor: section.badge.bgColor},
                    ]}>
                    <Text
                      style={[
                        a.text_sm,
                        a.font_bold,
                        {color: section.badge.color},
                      ]}>
                      {section.badge.label}
                    </Text>
                  </View>
                  <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
                    {section.holders.length} holders
                  </Text>
                </View>

                <Text
                  style={[a.text_sm, a.mt_sm, t.atoms.text_contrast_medium]}>
                  {section.description}
                </Text>

                <View style={[a.mt_md, a.gap_sm]}>
                  {section.holders.map(holder => (
                    <TouchableOpacity
                      key={`${section.badge.key}:${holder.author.did}`}
                      accessibilityRole="button"
                      onPress={() =>
                        navigation.navigate('Profile', {
                          name: holder.author.handle,
                        })
                      }
                      style={[
                        styles.holderRow,
                        t.atoms.bg_contrast_25,
                        t.atoms.border_contrast_low,
                      ]}>
                      <PreviewableUserAvatar
                        size={38}
                        profile={holder.author}
                        type={
                          holder.author.associated?.labeler ? 'labeler' : 'user'
                        }
                        moderation={undefined}
                        disableHoverCard
                      />
                      <View style={[a.flex_1, a.ml_md]}>
                        <Text style={[a.text_md, a.font_bold, t.atoms.text]}>
                          {holder.author.displayName || holder.author.handle}
                        </Text>
                        <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
                          @{holder.author.handle}
                        </Text>
                      </View>
                      <View style={[a.align_end]}>
                        <Text style={[a.text_sm, a.font_bold, t.atoms.text]}>
                          {holder.count} posts
                        </Text>
                        <Text style={[a.text_xs, t.atoms.text_contrast_medium]}>
                          {new Date(
                            holder.latestIndexedAt,
                          ).toLocaleDateString()}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))
          )}

          <ListFooter
            isFetchingNextPage={isFetchingNextPage}
            error={cleanError(error)}
            onRetry={() => fetchNextPage()}
          />
        </ScrollView>
      )}
    </Layout.Screen>
  )
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 16,
  },
  summaryCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
  },
  statusCard: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  topStatsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  topStatCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  topStatCount: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  topStatLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  emptyCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
  },
  sectionCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  sectionIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  badgePill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    alignSelf: 'flex-start',
  },
  profileRow: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: {
    fontSize: 18,
    fontWeight: '800',
  },
  roleBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  roleBadgeInline: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  repCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  deputyCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
  },
  deputyTier: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    marginBottom: 14,
  },
  metricCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  metricLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    fontWeight: '700',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  capabilityList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  capabilityChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  applicantRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  applicantChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inlineAction: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 4,
  },
  inlineActionText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  controlCard: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  editorCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  editorInput: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 15,
  },
  editorInputMultiline: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  primaryActionButton: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignSelf: 'flex-start',
  },
  primaryActionText: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  secondaryActionButton: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignSelf: 'flex-start',
  },
  secondaryActionText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  holderRow: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
})
