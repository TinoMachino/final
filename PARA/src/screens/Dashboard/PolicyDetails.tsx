import {useMemo} from 'react'
import {ScrollView, StyleSheet, View} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {Trans} from '@lingui/react/macro'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'

import {type CabildeoPositionRecord} from '#/lib/api/para-lexicons'
import {type CabildeoView} from '#/lib/cabildeo-client'
import {
  getCabildeoBadge,
  getCabildeoCommunities,
  getCabildeoPhaseMeta,
  getCabildeoTotalParticipants,
  getViewerParticipation,
} from '#/lib/cabildeo-display'
import {getCommunityConsensusPermissions} from '#/lib/policy-consensus'
import {type CommonNavigatorParams} from '#/lib/routes/types'
import {
  useCabildeoPositionsQuery,
  useCabildeoQuery,
} from '#/state/queries/cabildeo'
import {useCommunityGovernanceQuery} from '#/state/queries/community-governance'
import {useSession} from '#/state/session'
import {Text} from '#/view/com/util/text/Text'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Layout from '#/components/Layout'
import {ListMaybePlaceholder} from '#/components/Lists'
import {type PolicyItem} from './types'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'PolicyDetails'>

type DetailMetric = {
  label: string
  value: string
}

type DetailOptionRow = {
  key: string
  label: string
  description?: string
  valueLabel: string
  secondaryLabel?: string
  share: number
  isLeading?: boolean
}

type DetailPositionRow = {
  id: string
  stanceLabel: string
  stanceColor: string
  stanceBackground: string
  text: string
  optionLabel?: string
}

type DetailSummaryChip = {
  label: string
  value: string
  color: string
  background: string
}

type DetailModel = {
  eyebrow: string
  title: string
  phaseLabel?: string
  phaseColor?: string
  categoryLabel: string
  categoryColor: string
  categoryBackground: string
  summary: string
  metrics: DetailMetric[]
  communities: string[]
  summaryChips: DetailSummaryChip[]
  viewerParticipation?: ReturnType<typeof getViewerParticipation>
  options: DetailOptionRow[]
  positions: DetailPositionRow[]
  cabildeoUri?: string
  governanceCommunity?: string
}

const STANCE_META: Record<
  CabildeoPositionRecord['stance'],
  {label: string; color: string; background: string}
> = {
  for: {label: 'For', color: '#166534', background: '#DCFCE7'},
  against: {label: 'Against', color: '#991B1B', background: '#FEE2E2'},
  amendment: {label: 'Amendment', color: '#9A3412', background: '#FFEDD5'},
}

export function PolicyDetailsScreen({route, navigation}: Props) {
  const t = useTheme()
  const insets = useSafeAreaInsets()
  const cabildeoUri = route.params?.cabildeoUri
  const legacyItem = route.params?.item as PolicyItem | undefined
  const {currentAccount} = useSession()

  const {
    data: cabildeo = null,
    isFetched,
    isLoading,
    isError,
    refetch,
  } = useCabildeoQuery(cabildeoUri)
  const {
    data: positions = [],
    isLoading: isPositionsLoading,
    isError: isPositionsError,
    refetch: refetchPositions,
  } = useCabildeoPositionsQuery(cabildeoUri)

  const formatCount = (value: number) =>
    new Intl.NumberFormat().format(Math.round(value))

  const governanceCommunityName =
    cabildeo?.community || legacyItem?.community || ''
  const {data: governance} = useCommunityGovernanceQuery({
    communityName: governanceCommunityName,
    enabled: Boolean(governanceCommunityName),
  })
  const permissions = getCommunityConsensusPermissions(
    governance,
    currentAccount?.did,
  )

  const model = useMemo(() => {
    if (cabildeo) {
      return buildLiveDetailModel({
        cabildeo,
        positions,
        formatCount,
      })
    }
    if (legacyItem) {
      return buildFallbackDetailModel({
        item: legacyItem,
        formatCount,
      })
    }
    return null
  }, [cabildeo, legacyItem, positions])

  if (cabildeoUri && !cabildeo && (isLoading || !isFetched || isError)) {
    return (
      <Layout.Screen>
        <Layout.Header.Outer>
          <Layout.Header.BackButton />
          <Layout.Header.Content>
            <Layout.Header.TitleText>
              <Trans>Details</Trans>
            </Layout.Header.TitleText>
          </Layout.Header.Content>
        </Layout.Header.Outer>
        <ListMaybePlaceholder
          isLoading={isLoading || !isFetched}
          isError={isError}
          emptyType="page"
          emptyTitle="Debate unavailable"
          emptyMessage="We could not load this debate."
          onRetry={async () => {
            await Promise.all([refetch(), refetchPositions()])
          }}
        />
      </Layout.Screen>
    )
  }

  if (!model) {
    return (
      <Layout.Screen>
        <Layout.Header.Outer>
          <Layout.Header.BackButton />
          <Layout.Header.Content>
            <Layout.Header.TitleText>
              <Trans>Details</Trans>
            </Layout.Header.TitleText>
          </Layout.Header.Content>
        </Layout.Header.Outer>
        <ListMaybePlaceholder
          isLoading={false}
          isError={false}
          emptyType="page"
          emptyTitle="No detail available"
          emptyMessage="There is no policy or matter detail to show here yet."
        />
      </Layout.Screen>
    )
  }

  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Details</Trans>
          </Layout.Header.TitleText>
          <Layout.Header.SubtitleText>{model.eyebrow}</Layout.Header.SubtitleText>
        </Layout.Header.Content>
      </Layout.Header.Outer>

      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.contentContainer,
          {paddingBottom: insets.bottom + 48},
        ]}>
        <Layout.Center>
          <View
            style={[
              styles.heroCard,
              t.atoms.bg_contrast_25,
              t.atoms.border_contrast_low,
            ]}>
            <View style={styles.heroTopRow}>
              <View
                style={[
                  styles.heroBadge,
                  {backgroundColor: model.categoryBackground},
                ]}>
                <Text style={[styles.heroBadgeText, {color: model.categoryColor}]}>
                  {model.categoryLabel}
                </Text>
              </View>
              {model.phaseLabel ? (
                <Text style={[styles.heroPhase, {color: model.phaseColor}]}>
                  {model.phaseLabel}
                </Text>
              ) : null}
            </View>

            <Text style={[styles.heroTitle, t.atoms.text]}>{model.title}</Text>
            <Text style={[styles.heroSummary, t.atoms.text_contrast_medium]}>
              {model.summary}
            </Text>

            {model.viewerParticipation ? (
              <View
                style={[
                  styles.viewerChip,
                  {backgroundColor: model.viewerParticipation.accentBackground},
                ]}>
                <Text
                  style={[
                    styles.viewerChipText,
                    {color: model.viewerParticipation.accentColor},
                  ]}>
                  {model.viewerParticipation.optionLabel
                    ? `${model.viewerParticipation.label}: ${model.viewerParticipation.optionLabel}`
                    : model.viewerParticipation.label}
                </Text>
              </View>
            ) : null}

            {model.communities.length > 0 ? (
              <View style={styles.communityWrap}>
                {model.communities.map(value => (
                  <View
                    key={value}
                    style={[
                      styles.communityChip,
                      {backgroundColor: t.palette.contrast_100},
                    ]}>
                    <Text style={[styles.communityChipText, t.atoms.text]}>
                      {value}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>

          <View style={styles.metricGrid}>
            {model.metrics.map(metric => (
              <View
                key={metric.label}
                style={[
                  styles.metricCard,
                  t.atoms.bg_contrast_25,
                  t.atoms.border_contrast_low,
                ]}>
                <Text style={[styles.metricCardLabel, t.atoms.text_contrast_medium]}>
                  {metric.label}
                </Text>
                <Text style={[styles.metricCardValue, t.atoms.text]}>
                  {metric.value}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, t.atoms.text]}>
              <Trans>Discussion snapshot</Trans>
            </Text>
            <View style={styles.summaryChipRow}>
              {model.summaryChips.map(chip => (
                <View
                  key={chip.label}
                  style={[
                    styles.summaryChip,
                    {backgroundColor: chip.background},
                  ]}>
                  <Text style={[styles.summaryChipLabel, {color: chip.color}]}>
                    {chip.label}
                  </Text>
                  <Text style={[styles.summaryChipValue, {color: chip.color}]}>
                    {chip.value}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, t.atoms.text]}>
              <Trans>Option breakdown</Trans>
            </Text>
            {model.options.length === 0 ? (
              <View
                style={[
                  styles.emptyStateCard,
                  t.atoms.bg_contrast_25,
                  t.atoms.border_contrast_low,
                ]}>
                <Text style={[styles.emptyStateTitle, t.atoms.text]}>
                  No option analytics yet
                </Text>
                <Text
                  style={[
                    styles.emptyStateText,
                    t.atoms.text_contrast_medium,
                  ]}>
                  Once the backend publishes option-level vote totals, the
                  breakdown will appear here automatically.
                </Text>
              </View>
            ) : (
              <View style={styles.optionList}>
                {model.options.map(option => (
                  <View
                    key={option.key}
                    style={[
                      styles.optionCard,
                      t.atoms.bg_contrast_25,
                      t.atoms.border_contrast_low,
                    ]}>
                    <View style={styles.optionHeader}>
                      <View style={a.flex_1}>
                        <View style={styles.optionTitleRow}>
                          <Text style={[styles.optionTitle, t.atoms.text]}>
                            {option.label}
                          </Text>
                          {option.isLeading ? (
                            <View
                              style={[
                                styles.leadingBadge,
                                {backgroundColor: '#DCFCE7'},
                              ]}>
                              <Text
                                style={[
                                  styles.leadingBadgeText,
                                  {color: '#166534'},
                                ]}>
                                Leading
                              </Text>
                            </View>
                          ) : null}
                        </View>
                        {option.description ? (
                          <Text
                            style={[
                              styles.optionDescription,
                              t.atoms.text_contrast_medium,
                            ]}>
                            {option.description}
                          </Text>
                        ) : null}
                      </View>
                      <Text style={[styles.optionValue, t.atoms.text]}>
                        {option.valueLabel}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.optionBarTrack,
                        {backgroundColor: t.palette.contrast_100},
                      ]}>
                      <View
                        style={[
                          styles.optionBarFill,
                          {
                            width: `${Math.max(
                              option.share * 100,
                              option.share > 0 ? 8 : 0,
                            )}%`,
                            backgroundColor: model.categoryColor,
                          },
                        ]}
                      />
                    </View>

                    {option.secondaryLabel ? (
                      <Text
                        style={[
                          styles.optionSecondary,
                          t.atoms.text_contrast_medium,
                        ]}>
                        {option.secondaryLabel}
                      </Text>
                    ) : null}
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, t.atoms.text]}>
              <Trans>Recent positions</Trans>
            </Text>
            {model.positions.length === 0 ? (
              <View
                style={[
                  styles.emptyStateCard,
                  t.atoms.bg_contrast_25,
                  t.atoms.border_contrast_low,
                ]}>
                <Text style={[styles.emptyStateTitle, t.atoms.text]}>
                  {cabildeoUri && isPositionsLoading
                    ? 'Loading positions...'
                    : 'No positions yet'}
                </Text>
                <Text
                  style={[
                    styles.emptyStateText,
                    t.atoms.text_contrast_medium,
                  ]}>
                  {cabildeoUri && isPositionsError
                    ? 'We could not load the latest written positions for this debate.'
                    : 'As people publish positions, the latest ones will appear here.'}
                </Text>
              </View>
            ) : (
              <View style={styles.positionList}>
                {model.positions.map(position => (
                  <View
                    key={position.id}
                    style={[
                      styles.positionCard,
                      t.atoms.bg_contrast_25,
                      t.atoms.border_contrast_low,
                    ]}>
                    <View style={styles.positionHeader}>
                      <View
                        style={[
                          styles.positionBadge,
                          {backgroundColor: position.stanceBackground},
                        ]}>
                        <Text
                          style={[
                            styles.positionBadgeText,
                            {color: position.stanceColor},
                          ]}>
                          {position.stanceLabel}
                        </Text>
                      </View>
                      {position.optionLabel ? (
                        <Text
                          style={[
                            styles.positionOptionLabel,
                            t.atoms.text_contrast_medium,
                          ]}>
                          {position.optionLabel}
                        </Text>
                      ) : null}
                    </View>
                    <Text style={[styles.positionText, t.atoms.text]}>
                      {position.text}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {model.governanceCommunity ? (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, t.atoms.text]}>
                <Trans>Governance permissions</Trans>
              </Text>
              <View
                style={[
                  styles.governanceCard,
                  t.atoms.bg_contrast_25,
                  t.atoms.border_contrast_low,
                ]}>
                <Text style={[styles.governanceLead, t.atoms.text]}>
                  {governance
                    ? `Published governance is active for ${model.governanceCommunity}.`
                    : `No published governance record was found yet for ${model.governanceCommunity}.`}
                </Text>

                <View style={styles.permissionChipRow}>
                  {(permissions.roles.length > 0
                    ? permissions.roles
                    : ['member']
                  ).map(role => (
                    <View
                      key={role}
                      style={[
                        styles.permissionChip,
                        {backgroundColor: t.palette.contrast_100},
                      ]}>
                      <Text style={[styles.permissionChipText, t.atoms.text]}>
                        {role}
                      </Text>
                    </View>
                  ))}
                </View>

                <View style={styles.permissionList}>
                  <Text style={[styles.permissionText, t.atoms.text]}>
                    {permissions.canPropose
                      ? 'Can propose policy drafts'
                      : 'Cannot propose official policy drafts yet'}
                  </Text>
                  <Text style={[styles.permissionText, t.atoms.text]}>
                    {permissions.canVote
                      ? 'Can vote in weighted policy consensus'
                      : 'Cannot cast official weighted votes yet'}
                  </Text>
                  <Text style={[styles.permissionText, t.atoms.text]}>
                    {permissions.canCertify
                      ? 'Can certify outcomes'
                      : 'Cannot certify outcomes'}
                  </Text>
                  <Text style={[styles.permissionText, t.atoms.text]}>
                    {permissions.canMarkOfficial
                      ? 'Can mark a passed policy as official'
                      : 'Cannot mark policy as official'}
                  </Text>
                </View>
              </View>
            </View>
          ) : null}

          {model.cabildeoUri ? (
            <View style={styles.section}>
              <Button
                label="Open full debate"
                onPress={() =>
                  navigation.navigate('CabildeoDetail', {
                    cabildeoUri: model.cabildeoUri!,
                  })
                }
                size="large"
                variant="solid"
                color="primary"
                shape="default">
                <ButtonText>
                  <Trans>Open full debate</Trans>
                </ButtonText>
              </Button>
            </View>
          ) : null}
        </Layout.Center>
      </ScrollView>
    </Layout.Screen>
  )
}

function buildLiveDetailModel({
  cabildeo,
  positions,
  formatCount,
}: {
  cabildeo: CabildeoView
  positions: CabildeoPositionRecord[]
  formatCount: (value: number) => string
}): DetailModel {
  const badge = getCabildeoBadge(cabildeo)
  const phase = getCabildeoPhaseMeta(cabildeo.phase)
  const communities = getCabildeoCommunities(cabildeo)
  const participants = getCabildeoTotalParticipants(cabildeo)
  const optionBase =
    cabildeo.outcome?.effectiveTotalPower ||
    cabildeo.voteTotals.total ||
    cabildeo.positionCounts.total ||
    1
  const leadingOptionIndex =
    cabildeo.outcome?.winningOption ??
    [...cabildeo.optionSummary].sort(
      (a, b) => b.votes - a.votes || b.positions - a.positions,
    )[0]?.optionIndex

  return {
    eyebrow: badge.kind === 'policy' ? 'Policy debate' : 'Matter debate',
    title: cabildeo.title,
    phaseLabel: phase.label,
    phaseColor: phase.color,
    categoryLabel: badge.label,
    categoryColor: badge.color,
    categoryBackground: badge.bgColor,
    summary: cabildeo.description,
    metrics: [
      {label: 'Participants', value: formatCount(participants)},
      {label: 'Votes', value: formatCount(cabildeo.voteTotals.total)},
      {label: 'Positions', value: formatCount(cabildeo.positionCounts.total)},
      {label: 'Delegated', value: formatCount(cabildeo.voteTotals.delegated)},
    ],
    communities,
    summaryChips: [
      {
        label: 'For',
        value: formatCount(cabildeo.positionCounts.for),
        color: '#166534',
        background: '#DCFCE7',
      },
      {
        label: 'Against',
        value: formatCount(cabildeo.positionCounts.against),
        color: '#991B1B',
        background: '#FEE2E2',
      },
      {
        label: 'Amendment',
        value: formatCount(cabildeo.positionCounts.amendment),
        color: '#9A3412',
        background: '#FFEDD5',
      },
    ],
    viewerParticipation: getViewerParticipation(cabildeo) || undefined,
    options: cabildeo.options.map((option, index) => {
      const summary = cabildeo.optionSummary.find(
        item => item.optionIndex === index,
      )
      const resolved = cabildeo.outcome?.breakdown.find(
        item => item.optionIndex === index,
      )
      const primaryValue =
        typeof resolved?.effectiveVotes === 'number'
          ? resolved.effectiveVotes
          : summary?.votes || 0
      return {
        key: `${cabildeo.uri}:${index}`,
        label: option.label,
        description: option.description,
        valueLabel:
          cabildeo.outcome?.breakdown.length && resolved
            ? `${formatCount(resolved.effectiveVotes)} effective votes`
            : `${formatCount(summary?.votes || 0)} votes`,
        secondaryLabel:
          summary?.positions || 0
            ? `${formatCount(summary?.positions || 0)} positions`
            : undefined,
        share: primaryValue / optionBase,
        isLeading: leadingOptionIndex === index,
      }
    }),
    positions: [...positions]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 4)
      .map((position, index) => {
      const meta = STANCE_META[position.stance]
      return {
        id: `${position.createdAt}:${index}`,
        stanceLabel: meta.label,
        stanceColor: meta.color,
        stanceBackground: meta.background,
        text: position.text,
        optionLabel:
          typeof position.optionIndex === 'number'
            ? cabildeo.options[position.optionIndex]?.label
            : undefined,
      }
    }),
    cabildeoUri: cabildeo.uri,
    governanceCommunity: cabildeo.community,
  }
}

function buildFallbackDetailModel({
  item,
  formatCount,
}: {
  item: PolicyItem
  formatCount: (value: number) => string
}): DetailModel {
  const isPolicy = item.type === 'Policy'
  const categoryColor = item.color || (isPolicy ? '#2563EB' : '#EA580C')
  const categoryBackground = `${categoryColor}20`
  const metrics: DetailMetric[] = []

  if (typeof item.support === 'number') {
    metrics.push({label: 'Support', value: `${formatCount(item.support)}%`})
  }
  if (typeof item.mentions === 'number') {
    metrics.push({label: 'Mentions', value: formatCount(item.mentions)})
  }
  if (typeof item.match === 'number') {
    metrics.push({label: 'Match', value: `${formatCount(item.match)}%`})
  }
  metrics.push({label: 'Source', value: item.promotedBy})

  return {
    eyebrow: isPolicy ? 'Policy summary' : 'Matter summary',
    title: item.title,
    categoryLabel: item.category,
    categoryColor,
    categoryBackground,
    summary:
      item.type === 'Policy'
        ? 'This view is using feed-level summary data. Full debate analytics will appear automatically once this item is linked to a live backend debate record.'
        : 'This view is using feed-level matter summary data. Full backend debate details will appear here once a live record is available.',
    metrics,
    communities: [item.party, item.community, item.state].filter(
      (value): value is string => Boolean(value),
    ),
    summaryChips: [
      {
        label: 'Promoted by',
        value: item.promotedBy,
        color: categoryColor,
        background: categoryBackground,
      },
    ],
    options: [],
    positions: [],
    governanceCommunity: item.community,
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  heroCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    gap: 12,
    marginBottom: 16,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  heroBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  heroPhase: {
    fontSize: 12,
    fontWeight: '700',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
  },
  heroSummary: {
    fontSize: 15,
    lineHeight: 22,
  },
  viewerChip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  viewerChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  communityWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  communityChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  communityChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    width: '48%',
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 6,
  },
  metricCardLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricCardValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 12,
  },
  summaryChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  summaryChip: {
    minWidth: '31%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  summaryChipLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  summaryChipValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  optionList: {
    gap: 12,
  },
  optionCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  optionDescription: {
    fontSize: 13,
    lineHeight: 19,
  },
  optionValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  optionBarTrack: {
    height: 10,
    borderRadius: 999,
    overflow: 'hidden',
  },
  optionBarFill: {
    height: '100%',
    borderRadius: 999,
  },
  optionSecondary: {
    fontSize: 12,
    fontWeight: '500',
  },
  leadingBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  leadingBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  positionList: {
    gap: 12,
  },
  positionCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  positionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  positionBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  positionBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  positionOptionLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  positionText: {
    fontSize: 14,
    lineHeight: 21,
  },
  governanceCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  governanceLead: {
    fontSize: 14,
    lineHeight: 21,
  },
  permissionChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  permissionChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  permissionChipText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  permissionList: {
    gap: 8,
  },
  permissionText: {
    fontSize: 13,
    lineHeight: 19,
  },
  emptyStateCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 6,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptyStateText: {
    fontSize: 14,
    lineHeight: 20,
  },
})
