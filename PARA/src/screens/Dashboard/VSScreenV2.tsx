import {type ReactNode, useMemo, useState} from 'react'
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import {type RouteProp, useNavigation, useRoute} from '@react-navigation/native'
import {useQuery} from '@tanstack/react-query'

import {type CabildeoReadView, fetchCabildeos} from '#/lib/api/cabildeo'
import {
  type CommonNavigatorParams,
  type NavigationProp,
} from '#/lib/routes/types'
import {
  buildVsScreenViewModel,
  resolveInitialVsTopic,
  resolveVsEntities,
  type VsDebateCard,
  type VsEntitySummary,
} from '#/lib/vs-screen'
import {STALE} from '#/state/queries'
import {useAgent} from '#/state/session'
import {Text} from '#/view/com/util/text/Text'
import {useTheme} from '#/alf'
import {ArrowLeft_Stroke2_Corner0_Rounded as ArrowLeftIcon} from '#/components/icons/Arrow'
import * as Layout from '#/components/Layout'
import {IS_WEB} from '#/env'

const SCREEN_WIDTH = Dimensions.get('window').width
const CARD_COLUMNS = IS_WEB && SCREEN_WIDTH > 1180 ? 2 : 1
const USE_COMPACT_HERO = CARD_COLUMNS === 1

type VsRoute = RouteProp<CommonNavigatorParams, 'VSScreenV2'>

export function VSScreen() {
  const navigation = useNavigation<NavigationProp>()
  const route = useRoute<VsRoute>()
  const entities = useMemo(
    () => resolveVsEntities(route.params?.entities),
    [route.params?.entities],
  )
  const initialTopic = resolveInitialVsTopic(route.params?.matter)
  const screenKey = `${entities[0]}::${entities[1]}::${initialTopic}`

  return (
    <VSScreenContent
      key={screenKey}
      navigation={navigation}
      entities={entities}
      initialTopic={initialTopic}
    />
  )
}

function VSScreenContent({
  navigation,
  entities,
  initialTopic,
}: {
  navigation: NavigationProp
  entities: [string, string]
  initialTopic: string
}) {
  const agent = useAgent()
  const t = useTheme()
  const [selectedTopic, setSelectedTopic] = useState(initialTopic)

  const {
    data = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<CabildeoReadView[]>({
    staleTime: STALE.MINUTES.ONE,
    queryKey: ['vs-screen', 'cabildeos'],
    placeholderData: previous => previous,
    queryFn: async () => fetchCabildeos(agent, {limit: 50}),
  })

  const viewModel = useMemo(
    () =>
      buildVsScreenViewModel({
        cabildeos: data,
        entities,
        selectedTopic,
      }),
    [data, entities, selectedTopic],
  )

  return (
    <Layout.Screen testID="vsScreenV2">
      <View
        style={[
          styles.headerShell,
          t.atoms.bg,
          {borderBottomColor: t.palette.contrast_100},
        ]}>
        <View style={styles.appBar}>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => navigation.goBack()}
            style={styles.backButton}>
            <ArrowLeftIcon size="md" style={t.atoms.text} />
          </TouchableOpacity>
          <Text style={[styles.title, t.atoms.text]}>Comparativas</Text>
          <View style={styles.appBarSpacer} />
        </View>

        <Layout.Center style={styles.headerCenter}>
          <Text style={[styles.subtitle, t.atoms.text_contrast_medium]}>
            Compara comunidades por actividad, consenso y debates recientes en
            tiempo real.
          </Text>

          <View style={styles.topicRow}>
            {viewModel.topics.map(topic => {
              const isActive = viewModel.selectedTopic === topic.key
              return (
                <TouchableOpacity
                  accessibilityRole="button"
                  key={topic.key}
                  onPress={() => setSelectedTopic(topic.key)}
                  style={[
                    styles.topicChip,
                    {
                      backgroundColor: isActive
                        ? t.palette.primary_500
                        : t.palette.contrast_25,
                      borderColor: isActive
                        ? t.palette.primary_500
                        : t.palette.contrast_100,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.topicChipText,
                      isActive
                        ? {color: t.palette.white}
                        : t.atoms.text_contrast_medium,
                    ]}>
                    {topic.label}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>

          {USE_COMPACT_HERO ? (
            <CompactHero
              entities={viewModel.entities}
              totalRelevant={viewModel.totalRelevant}
            />
          ) : (
            <View style={styles.heroRow}>
              <EntityPanel entity={viewModel.entities[0]} />

              <View style={styles.vsColumn}>
                <Text style={[styles.vsText, t.atoms.text]}>VS</Text>
                <Text style={[styles.vsMeta, t.atoms.text_contrast_medium]}>
                  {viewModel.totalRelevant} debates relevantes
                </Text>
              </View>

              <EntityPanel entity={viewModel.entities[1]} />
            </View>
          )}
        </Layout.Center>
      </View>

      <ScrollView
        style={[styles.scrollView, t.atoms.bg_contrast_25]}
        contentContainerStyle={styles.scrollContent}>
        <Layout.Center style={styles.bodyCenter}>
          {isLoading ? (
            <StateBlock
              title="Cargando comparativa"
              description="Estamos reuniendo actividad reciente, coincidencias y debates para esta vista."
              action={
                <ActivityIndicator color={t.palette.primary_500} size="small" />
              }
            />
          ) : isError ? (
            <StateBlock
              title="No pudimos cargar la comparativa"
              description="Intenta de nuevo en unos segundos. Si el problema sigue, es probable que la fuente de datos no haya respondido a tiempo."
              action={
                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={() => {
                    void refetch()
                  }}
                  style={[
                    styles.retryButton,
                    {backgroundColor: t.palette.primary_500},
                  ]}>
                  <Text style={styles.retryButtonText}>Reintentar</Text>
                </TouchableOpacity>
              }
            />
          ) : viewModel.totalRelevant === 0 ? (
            <StateBlock
              title="Aun no hay comparaciones para este filtro"
              description={`Todavia no encontramos suficiente actividad compartida entre ${viewModel.entities[0].name} y ${viewModel.entities[1].name}.`}
            />
          ) : (
            <>
              <Section
                title="Recientes"
                description="Debates recientes relacionados con alguna de las dos entidades."
                cards={viewModel.recent}
              />
              <Section
                title="Populares"
                description="Debates con mayor actividad agregada de votos y posiciones."
                cards={viewModel.popular}
                emptyTitle="Aun no hay suficientes debates para destacar popularidad."
              />
            </>
          )}
        </Layout.Center>
      </ScrollView>
    </Layout.Screen>
  )
}

function CompactHero({
  entities,
  totalRelevant,
}: {
  entities: [VsEntitySummary, VsEntitySummary]
  totalRelevant: number
}) {
  const t = useTheme()

  return (
    <View
      style={[
        styles.compactHero,
        t.atoms.bg,
        {borderColor: t.palette.contrast_100},
      ]}>
      <CompactEntitySummary entity={entities[0]} align="left" />

      <View
        style={[
          styles.compactVsBadge,
          {
            backgroundColor: t.palette.contrast_25,
            borderColor: t.palette.contrast_100,
          },
        ]}>
        <Text style={[styles.compactVsText, t.atoms.text]}>VS</Text>
        <Text style={[styles.compactVsMeta, t.atoms.text_contrast_medium]}>
          {totalRelevant} relevantes
        </Text>
      </View>

      <CompactEntitySummary entity={entities[1]} align="right" />
    </View>
  )
}

function CompactEntitySummary({
  entity,
  align,
}: {
  entity: VsEntitySummary
  align: 'left' | 'right'
}) {
  const t = useTheme()

  return (
    <View
      style={[
        styles.compactEntity,
        align === 'right' && styles.compactEntityRight,
      ]}>
      <View style={[styles.compactAvatar, {backgroundColor: entity.color}]}>
        <Text style={styles.compactAvatarText}>{entity.initials}</Text>
      </View>
      <Text
        style={[
          styles.compactEntityName,
          t.atoms.text,
          align === 'right' && styles.compactTextRight,
        ]}
        numberOfLines={1}>
        {entity.name}
      </Text>
      <Text
        style={[
          styles.compactEntitySubtitle,
          t.atoms.text_contrast_medium,
          align === 'right' && styles.compactTextRight,
        ]}
        numberOfLines={2}>
        {entity.subtitle}
      </Text>
    </View>
  )
}

function EntityPanel({entity}: {entity: VsEntitySummary}) {
  const t = useTheme()

  return (
    <View
      style={[
        styles.entityPanel,
        t.atoms.bg,
        {borderColor: t.palette.contrast_100},
      ]}>
      <View style={[styles.avatar, {backgroundColor: entity.color}]}>
        <Text style={styles.avatarText}>{entity.initials}</Text>
      </View>

      <Text style={[styles.entityName, t.atoms.text]}>{entity.name}</Text>
      <Text style={[styles.entitySubtitle, t.atoms.text_contrast_medium]}>
        {entity.subtitle}
      </Text>
      <Text style={[styles.entityDescription, t.atoms.text_contrast_medium]}>
        {entity.description}
      </Text>

      <View style={styles.metricGrid}>
        <Metric label="Debates" value={String(entity.debateCount)} />
        <Metric label="Activos" value={String(entity.activeCount)} />
        <Metric label="Compartidos" value={String(entity.sharedCount)} />
        <Metric
          label="Participacion"
          value={String(entity.participationTotal)}
        />
      </View>

      <Meter
        label="Consenso"
        value={entity.consensusRate}
        valueLabel={`${Math.round(entity.consensusRate * 100)}%`}
        color={entity.accent}
      />
      <Meter
        label="Participacion relativa"
        value={entity.participationShare}
        valueLabel={`${Math.round(entity.participationShare * 100)}%`}
        color={entity.color}
      />
    </View>
  )
}

function Section({
  title,
  description,
  cards,
  emptyTitle,
}: {
  title: string
  description: string
  cards: VsDebateCard[]
  emptyTitle?: string
}) {
  const t = useTheme()

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, t.atoms.text]}>{title}</Text>
      <Text style={[styles.sectionDescription, t.atoms.text_contrast_medium]}>
        {description}
      </Text>

      {cards.length === 0 ? (
        <StateBlock
          title={emptyTitle || 'Todavia no hay actividad en esta seccion.'}
          description="Cuando entren mas debates y participacion, esta seccion empezara a mostrar actividad destacada."
        />
      ) : (
        <View style={styles.cardGrid}>
          {cards.map(card => (
            <DebateCard key={card.uri} card={card} />
          ))}
        </View>
      )}
    </View>
  )
}

function DebateCard({card}: {card: VsDebateCard}) {
  const t = useTheme()

  return (
    <View
      style={[
        styles.debateCard,
        t.atoms.bg,
        {borderColor: t.palette.contrast_100},
      ]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardCommunity}>
          <View
            style={[styles.smallDot, {backgroundColor: card.communityColor}]}
          />
          <Text style={[styles.cardCommunityText, t.atoms.text]}>
            {card.community}
          </Text>
        </View>
        <View
          style={[
            styles.phasePill,
            {
              backgroundColor: t.palette.contrast_25,
              borderColor: t.palette.contrast_100,
            },
          ]}>
          <Text style={[styles.phasePillText, t.atoms.text_contrast_medium]}>
            {card.phaseLabel}
          </Text>
        </View>
      </View>

      <Text style={[styles.cardTitle, t.atoms.text]} numberOfLines={2}>
        {card.title}
      </Text>
      <Text
        style={[styles.cardBody, t.atoms.text_contrast_medium]}
        numberOfLines={3}>
        {card.description}
      </Text>

      <View style={styles.metricRow}>
        <Metric label="Votos" value={String(card.totalVotes)} compact />
        <Metric
          label="Posiciones"
          value={String(card.totalPositions)}
          compact
        />
        <Metric label="Consenso" value={card.consensusLabel} compact />
      </View>

      <Meter
        label={`Lider: ${card.leadingLabel}`}
        value={card.consensusRate}
        valueLabel={card.leadingMetricLabel}
        color={card.communityColor}
      />

      <View style={styles.footerRow}>
        <View style={styles.pillRow}>
          {card.relevantEntities.map(name => (
            <View
              key={`${card.uri}-${name}`}
              style={[
                styles.footerPill,
                {
                  backgroundColor: t.palette.contrast_25,
                  borderColor: t.palette.contrast_100,
                },
              ]}>
              <Text
                style={[styles.footerPillText, t.atoms.text_contrast_medium]}>
                {name}
              </Text>
            </View>
          ))}
        </View>
        <Text style={[styles.dateLabel, t.atoms.text_contrast_low]}>
          {card.createdLabel}
        </Text>
      </View>
    </View>
  )
}

function Metric({
  label,
  value,
  compact,
}: {
  label: string
  value: string
  compact?: boolean
}) {
  const t = useTheme()
  return (
    <View style={[styles.metricItem, compact && styles.metricItemCompact]}>
      <Text style={[styles.metricValue, t.atoms.text]}>{value}</Text>
      <Text style={[styles.metricLabel, t.atoms.text_contrast_medium]}>
        {label}
      </Text>
    </View>
  )
}

function Meter({
  label,
  value,
  valueLabel,
  color,
}: {
  label: string
  value: number
  valueLabel: string
  color: string
}) {
  const t = useTheme()
  const clamped = Math.max(0, Math.min(1, value))

  return (
    <View style={styles.meterBlock}>
      <View style={styles.meterHeader}>
        <Text style={[styles.meterLabel, t.atoms.text_contrast_medium]}>
          {label}
        </Text>
        <Text style={[styles.meterValueLabel, t.atoms.text]}>{valueLabel}</Text>
      </View>
      <View
        style={[styles.meterTrack, {backgroundColor: t.palette.contrast_50}]}>
        <View
          style={[
            styles.meterFill,
            {
              width: `${clamped * 100}%`,
              backgroundColor: color,
            },
          ]}
        />
      </View>
    </View>
  )
}

function StateBlock({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  const t = useTheme()
  return (
    <View
      style={[
        styles.stateBlock,
        t.atoms.bg,
        {borderColor: t.palette.contrast_100},
      ]}>
      <Text style={[styles.stateTitle, t.atoms.text]}>{title}</Text>
      <Text style={[styles.stateDescription, t.atoms.text_contrast_medium]}>
        {description}
      </Text>
      {action ? <View style={styles.stateAction}>{action}</View> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  headerShell: {
    borderBottomWidth: 1,
  },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
  },
  appBarSpacer: {
    width: 28,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  headerCenter: {
    paddingHorizontal: 16,
    paddingBottom: 18,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 14,
  },
  topicRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  topicChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  topicChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 16,
    width: '100%',
  },
  heroStack: {
    flexDirection: 'column',
  },
  compactHero: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  compactEntity: {
    flex: 1,
  },
  compactEntityRight: {
    alignItems: 'flex-end',
  },
  compactAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  compactAvatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  compactEntityName: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  compactEntitySubtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  compactTextRight: {
    textAlign: 'right',
  },
  compactVsBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactVsText: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  compactVsMeta: {
    fontSize: 11,
    marginTop: 2,
  },
  vsColumn: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  vsText: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 1,
  },
  vsMeta: {
    fontSize: 12,
    marginTop: 6,
  },
  entityPanel: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
    minHeight: 280,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },
  entityName: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  entitySubtitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  entityDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    marginBottom: 10,
  },
  metricItem: {
    width: '50%',
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  metricItemCompact: {
    width: '33.33%',
    paddingVertical: 0,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  metricLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  meterBlock: {
    marginTop: 8,
  },
  meterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  meterLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  meterValueLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  meterTrack: {
    height: 10,
    borderRadius: 999,
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    borderRadius: 999,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 48,
  },
  bodyCenter: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  section: {
    marginBottom: 28,
    width: '100%',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  debateCard: {
    width: CARD_COLUMNS === 2 ? '50%' : '100%',
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    minHeight: 230,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardCommunity: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    paddingRight: 8,
  },
  smallDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  cardCommunityText: {
    fontSize: 13,
    fontWeight: '700',
  },
  phasePill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  phasePillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
    marginBottom: 8,
  },
  cardBody: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
    minHeight: 54,
  },
  metricRow: {
    flexDirection: 'row',
    marginHorizontal: -4,
    marginBottom: 10,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    gap: 8,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
  },
  footerPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  footerPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  dateLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  stateBlock: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: 'center',
  },
  stateTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 10,
    textAlign: 'center',
  },
  stateDescription: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 560,
  },
  stateAction: {
    marginTop: 16,
  },
  retryButton: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
})
