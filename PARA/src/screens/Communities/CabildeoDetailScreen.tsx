import {useEffect, useMemo, useState} from 'react'
import {ScrollView, StyleSheet, TouchableOpacity, View} from 'react-native'
import {Trans} from '@lingui/react/macro'
import {useNavigation} from '@react-navigation/native'

import {type CabildeoPhase} from '#/lib/api/para-lexicons'
import {
  type CommonNavigatorParams,
  type NativeStackScreenProps,
  type NavigationProp,
} from '#/lib/routes/types'
import {
  useCabildeoPositionsQuery,
  useCabildeoQuery,
  useVoteMutation,
} from '#/state/queries/cabildeo'
import {useTheme} from '#/alf'
import * as Layout from '#/components/Layout'
import {ListMaybePlaceholder} from '#/components/Lists'
import {Text} from '#/components/Typography'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'CabildeoDetail'>

const PHASE_ORDER: CabildeoPhase[] = [
  'draft',
  'open',
  'deliberating',
  'voting',
  'resolved',
]

function getPhaseMeta(t: ReturnType<typeof useTheme>): Record<
  CabildeoPhase,
  {label: string; icon: string; color: string}
> {
  return {
    draft: {label: 'Borrador', icon: '📝', color: t.palette.contrast_400},
    open: {label: 'Abierto', icon: '📖', color: t.palette.primary_500},
    deliberating: {label: 'Deliberando', icon: '🗣️', color: t.palette.yellow},
    voting: {label: 'Votación', icon: '🗳️', color: t.palette.positive_500},
    resolved: {label: 'Resuelto', icon: '✅', color: t.palette.primary_500},
  }
}

function getStanceColors(t: ReturnType<typeof useTheme>): Record<string, {bg: string; fg: string; label: string}> {
  return {
    for: {bg: t.palette.positive_500 + '20', fg: t.palette.positive_500, label: 'A favor'},
    against: {bg: t.palette.negative_500 + '20', fg: t.palette.negative_500, label: 'En contra'},
    amendment: {bg: t.palette.yellow + '20', fg: t.palette.yellow, label: 'Enmienda'},
  }
}

export function CabildeoDetailScreen({route}: Props) {
  const t = useTheme()
  const navigation = useNavigation<NavigationProp>()
  const {cabildeoUri} = route.params
  const {
    data: cabildeo = null,
    isFetched: isCabildeoFetched,
    isLoading: isCabildeoLoading,
    isError: isCabildeoError,
    refetch: refetchCabildeo,
  } = useCabildeoQuery(cabildeoUri)
  const {
    data: allPositions = [],
    isFetched: isPositionsFetched,
    isLoading: isPositionsLoading,
    isError: isPositionsError,
    refetch: refetchPositions,
  } = useCabildeoPositionsQuery(cabildeo?.uri)

  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [hasVoted, setHasVoted] = useState(false)
  const [localOptions, setLocalOptions] = useState(
    () => cabildeo?.options || [],
  )
  const [isGeneratingConsensus, setIsGeneratingConsensus] = useState<
    false | 'filtering' | 'synthesizing'
  >(false)
  const [hasDismissedGracePeriod, setHasDismissedGracePeriod] = useState(false)
  const [mountedAt] = useState(() => Date.now())
  const [positionFilter, setPositionFilter] = useState<
    'all' | 'for' | 'against' | 'amendment'
  >('all')
  const delegateEvent = cabildeo?.userContext?.delegateVoteEvent
  const {mutate: vote, isPending: isVoting} = useVoteMutation()

  useEffect(() => {
    if (!cabildeo) return
    setLocalOptions(cabildeo.options)
    setSelectedOption(cabildeo.userContext?.viewerVoteOption ?? null)
    setHasVoted(cabildeo.userContext?.viewerVoteOption !== undefined)
    setHasDismissedGracePeriod(false)
    setPositionFilter('all')
  }, [cabildeoUri])

  // Calculate 24h grace period remaining time
  const gracePeriodRemainingMs = useMemo(() => {
    if (!delegateEvent?.votedAt) return 0
    const votedTime = new Date(delegateEvent.votedAt).getTime()
    const expiryTime = votedTime + 24 * 60 * 60 * 1000 // 24 hours
    return Math.max(0, expiryTime - mountedAt)
  }, [delegateEvent, mountedAt])

  const hoursRemaining = Math.floor(gracePeriodRemainingMs / (1000 * 60 * 60))
  const minutesRemaining = Math.floor(
    (gracePeriodRemainingMs % (1000 * 60 * 60)) / (1000 * 60),
  )

  const isGracePeriodActive =
    gracePeriodRemainingMs > 0 && !hasVoted && !hasDismissedGracePeriod

  const positions = useMemo(() => {
    const all = allPositions
    if (positionFilter === 'all') return all
    return all.filter(p => p.stance === positionFilter)
  }, [allPositions, positionFilter])

  if (
    !cabildeo &&
    (isCabildeoLoading || !isCabildeoFetched || isCabildeoError)
  ) {
    return (
      <Layout.Screen testID="cabildeoDetailScreen">
        <Layout.Header.Outer noBottomBorder>
          <Layout.Header.BackButton />
          <Layout.Header.Content>
            <Layout.Header.TitleText>
              <Trans>Cabildeo</Trans>
            </Layout.Header.TitleText>
          </Layout.Header.Content>
        </Layout.Header.Outer>
        <ListMaybePlaceholder
          isLoading={isCabildeoLoading || !isCabildeoFetched}
          isError={isCabildeoError}
          onRetry={refetchCabildeo}
          emptyType="page"
          emptyMessage="Estamos cargando el cabildeo seleccionado."
        />
      </Layout.Screen>
    )
  }

  if (!cabildeo) {
    return (
      <Layout.Screen testID="cabildeoDetailScreen">
        <Layout.Header.Outer noBottomBorder>
          <Layout.Header.BackButton />
          <Layout.Header.Content>
            <Layout.Header.TitleText>
              <Trans>Cabildeo</Trans>
            </Layout.Header.TitleText>
          </Layout.Header.Content>
        </Layout.Header.Outer>
        <ListMaybePlaceholder
          isLoading={false}
          isError={false}
          emptyType="page"
          emptyTitle="Cabildeo no disponible"
          emptyMessage="Este cabildeo ya no está disponible o fue eliminado."
        />
      </Layout.Screen>
    )
  }

  const phase = getPhaseMeta(t)[cabildeo.phase]
  const isMultiCommunity =
    Boolean(cabildeo.communities?.length) && cabildeo.communities!.length > 0

  const phaseIndex = PHASE_ORDER.indexOf(cabildeo.phase)

  const handleVote = () => {
    if (selectedOption !== null && cabildeoUri) {
      vote(
        {cabildeoUri, selectedOption, isDirect: true},
        {
          onSuccess: () => setHasVoted(true),
        },
      )
    }
  }

  const handleConfirmDelegateVote = () => {
    if (delegateEvent && cabildeoUri) {
      setSelectedOption(delegateEvent.optionIndex)
      vote(
        {cabildeoUri, selectedOption: delegateEvent.optionIndex, isDirect: false},
        {
          onSuccess: () => setHasVoted(true),
        },
      )
    }
  }

  const handleOverrideVoteStart = () => {
    setHasDismissedGracePeriod(true) // Dismiss the banner
    // Keep user in voting phase so they can pick a new option and hit main vote button
  }

  return (
    <Layout.Screen testID="cabildeoDetailScreen">
      <Layout.Header.Outer noBottomBorder>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Cabildeo</Trans>
          </Layout.Header.TitleText>
          <Layout.Header.SubtitleText>
            {phase.icon} {phase.label}
          </Layout.Header.SubtitleText>
        </Layout.Header.Content>
      </Layout.Header.Outer>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}>
        <Layout.Center style={styles.center}>
          {/* ─── Phase Timeline ─── */}
          <View style={[styles.timeline, t.atoms.bg_contrast_25]}>
            {PHASE_ORDER.map((p, i) => {
              const meta = getPhaseMeta(t)[p]
              const isActive = i === phaseIndex
              const isPast = i < phaseIndex

              return (
                <View key={p} style={styles.timelineStep}>
                  <View
                    style={[
                      styles.timelineDot,
                      {
                        backgroundColor: isActive
                          ? meta.color
                          : isPast
                            ? meta.color + '60'
                            : t.palette.contrast_100,
                      },
                    ]}>
                    {isActive && (
                      <View
                        style={[
                          styles.timelinePulse,
                          {backgroundColor: meta.color + '30'},
                        ]}
                      />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.timelineLabel,
                      {
                        color: isActive
                          ? meta.color
                          : isPast
                            ? t.palette.contrast_500
                            : t.palette.contrast_200,
                        fontWeight: isActive ? '900' : '600',
                      },
                    ]}>
                    {meta.label}
                  </Text>
                  {i < PHASE_ORDER.length - 1 && (
                    <View
                      style={[
                        styles.timelineLine,
                        {
                          backgroundColor: isPast
                            ? meta.color + '40'
                            : t.palette.contrast_100,
                        },
                      ]}
                    />
                  )}
                </View>
              )
            })}
          </View>

          {/* ─── Title & Description ─── */}
          <Text style={[styles.title, t.atoms.text]}>{cabildeo.title}</Text>
          <Text style={[styles.desc, t.atoms.text_contrast_medium]}>
            {cabildeo.description}
          </Text>

          {/* ─── Community Tags ─── */}
          <View style={styles.communityRow}>
            <View
              style={[
                styles.communityPill,
                {backgroundColor: t.palette.primary_500 + '20'},
              ]}>
              <Text
                style={[
                  styles.communityPillText,
                  {color: t.palette.primary_500},
                ]}>
                {cabildeo.community}
              </Text>
            </View>
            {cabildeo.communities?.map((c, i) => (
              <View
                key={i}
                style={[
                  styles.communityPill,
                  {backgroundColor: t.palette.yellow + '20'},
                ]}>
                <Text style={[styles.communityPillText, {color: t.palette.yellow}]}>
                  {c}
                </Text>
              </View>
            ))}
            {isMultiCommunity && (
              <View
                style={[
                  styles.communityPill,
                  {backgroundColor: t.palette.primary_500 + '15'},
                ]}>
                <Text style={[styles.communityPillText, {color: t.palette.primary_500}]}>
                  √ Cuadrático
                </Text>
              </View>
            )}
            {cabildeo.geoRestricted && (
              <View
                style={[
                  styles.communityPill,
                  {backgroundColor: t.palette.negative_500 + '15'},
                ]}>
                <Text style={[styles.communityPillText, {color: t.palette.negative_500}]}>
                  🔒 Solo {cabildeo.region}
                </Text>
              </View>
            )}
          </View>

          {/* ─── Deadline ─── */}
          {cabildeo.phaseDeadline && (
            <View
              style={[styles.deadlineBar, {borderColor: phase.color + '30'}]}>
              <Text
                style={[styles.deadlineLabel, t.atoms.text_contrast_medium]}>
                Cierre de fase:
              </Text>
              <Text style={[styles.deadlineValue, {color: phase.color}]}>
                {new Date(cabildeo.phaseDeadline).toLocaleDateString('es-MX', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </Text>
            </View>
          )}

          {/* ─── Options / Voting ─── */}
          <Text style={[styles.sectionTitle, t.atoms.text]}>Opciones</Text>

          {localOptions.map((opt, i) => {
            const isSelected = selectedOption === i
            const isWinner = cabildeo.outcome?.winningOption === i

            // Calculate real-time bar width if voted or resolved
            let barWidth = 0
            let displayVotes = 0
            const showTally = cabildeo.outcome || hasVoted

            if (showTally) {
              if (cabildeo.outcome) {
                // Resolved phase
                const total = cabildeo.outcome.effectiveTotalPower
                displayVotes =
                  cabildeo.outcome.breakdown.find(b => b.optionIndex === i)
                    ?.effectiveVotes ?? 0
                barWidth = total > 0 ? (displayVotes / total) * 100 : 0
              } else {
                // Real-time voting phase
                const total = cabildeo.voteTotals.total
                displayVotes =
                  cabildeo.optionSummary.find(s => s.optionIndex === i)
                    ?.votes ?? 0
                barWidth = total > 0 ? (displayVotes / total) * 100 : 0
              }
            }

            return (
              <TouchableOpacity
                accessibilityRole="button"
                key={i}
                activeOpacity={0.8}
                disabled={cabildeo.phase !== 'voting' || hasVoted}
                onPress={() => setSelectedOption(i)}
                style={[
                  styles.optionCard,
                  t.atoms.bg_contrast_25,
                  isSelected && {
                    borderColor: t.palette.primary_500,
                    borderWidth: 2,
                  },
                  isWinner && {
                    borderColor: t.palette.positive_500,
                    borderWidth: 2,
                  },
                ]}>
                {/* Result bar background */}
                {showTally && (
                  <View
                    style={[
                      styles.resultBar,
                      {
                        width: `${barWidth}%`,
                        backgroundColor: isWinner
                          ? t.palette.positive_500 + '20'
                          : t.palette.primary_500 + '10',
                      },
                    ]}
                  />
                )}

                <View style={styles.optionContent}>
                  <View style={styles.optionHeader}>
                    {/* Selection indicator */}
                    {cabildeo.phase === 'voting' && (
                      <View
                        style={[
                          styles.radioOuter,
                          {
                            borderColor: isSelected
                              ? t.palette.primary_500
                              : t.palette.contrast_200,
                          },
                        ]}>
                        {isSelected && (
                          <View
                            style={[
                              styles.radioInner,
                              {backgroundColor: t.palette.primary_500},
                            ]}
                          />
                        )}
                      </View>
                    )}

                    {isWinner && <Text style={styles.winnerBadge}>🏆</Text>}

                    <View style={{flex: 1}}>
                      <View
                        style={{flexDirection: 'row', alignItems: 'center'}}>
                        {opt.isConsensus && (
                          <Text
                            style={{
                              color: t.palette.primary_500,
                              fontSize: 16,
                              marginRight: 4,
                            }}>
                            ✨{' '}
                          </Text>
                        )}
                        <Text
                          style={[
                            styles.optionLabel,
                            t.atoms.text,
                            opt.isConsensus && {color: t.palette.primary_500},
                          ]}
                          numberOfLines={2}>
                          {opt.label}
                        </Text>
                      </View>
                      {opt.description && (
                        <Text
                          style={[
                            styles.optionDesc,
                            t.atoms.text_contrast_medium,
                          ]}>
                          {opt.description}
                        </Text>
                      )}
                    </View>

                    {/* Vote percentage */}
                    {showTally && (
                      <View style={{alignItems: 'flex-end'}}>
                        <Text
                          style={[
                            styles.votePercent,
                            {
                              color: isWinner
                                ? t.palette.positive_500
                                : t.palette.contrast_500,
                            },
                          ]}>
                          {barWidth.toFixed(1)}%
                        </Text>
                        <Text
                          style={{
                            fontSize: 12,
                            color: t.palette.contrast_400,
                            marginTop: 2,
                          }}>
                          {displayVotes} votos
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            )
          })}

          {/* ─── Consensus Synthesizer (AI Mediation) ─── */}
          {cabildeo.phase === 'deliberating' &&
            !localOptions.some(o => o.isConsensus) && (
              <View
                style={[
                  styles.synthesizerCard,
                  t.atoms.bg_contrast_25,
                  {
                    borderColor: t.palette.primary_500 + '60',
                    backgroundColor: t.palette.primary_500 + '10',
                  },
                ]}>
                <View style={styles.synthesizerHeader}>
                  <Text
                    style={[
                      styles.synthesizerTitle,
                      {color: t.palette.primary_500},
                    ]}>
                    🤖 Mesa de Síntesis IA
                  </Text>
                </View>
                <Text
                  style={[
                    styles.synthesizerDesc,
                    t.atoms.text_contrast_medium,
                  ]}>
                  ¿La comunidad está estancada? Usa el WorldTensor para analizar
                  todas las posturas a favor y en contra, y generar una opción
                  de consenso neutral.
                </Text>

                <TouchableOpacity
                  accessibilityRole="button"
                  disabled={isGeneratingConsensus !== false}
                  onPress={() => {
                    setIsGeneratingConsensus('filtering')
                    setTimeout(() => {
                      setIsGeneratingConsensus('synthesizing')
                      setTimeout(() => {
                        setLocalOptions(prev => [
                          ...prev,
                          {
                            label: 'Enmienda de Consenso',
                            description:
                              'Propuesta generada por IA que extrae los valores subyacentes de ambas facciones para maximizar el acuerdo y mitigar las fricciones principales.',
                            isConsensus: true,
                          },
                        ])
                        setIsGeneratingConsensus(false)
                      }, 2000)
                    }, 1500)
                  }}
                  style={[
                    styles.synthesizerBtn,
                    {backgroundColor: t.palette.primary_500},
                    isGeneratingConsensus !== false && {opacity: 0.6},
                  ]}>
                  <Text
                    style={[
                      styles.synthesizerBtnText,
                      {color: t.palette.contrast_100},
                    ]}>
                    {isGeneratingConsensus === 'filtering'
                      ? '⚡ Filtrando argumentos constructivos...'
                      : isGeneratingConsensus === 'synthesizing'
                        ? '🤖 Extrayendo síntesis fundamental...'
                        : '✨ Generar Enmienda de Consenso'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

          {/* Grace Period Notification Banner */}
          {isGracePeriodActive && delegateEvent && (
            <View
              style={[
                styles.gracePeriodBanner,
                {
                  borderColor: t.palette.primary_500 + '40',
                  backgroundColor: t.palette.primary_500 + '10',
                },
              ]}>
              <View style={styles.gracePeriodHeader}>
                <Text style={styles.gracePeriodTitle}>
                  🔔 Tu delegado ha votado
                </Text>
                <Text
                  style={[
                    styles.gracePeriodTime,
                    {color: t.palette.primary_500},
                  ]}>
                  {hoursRemaining}h {minutesRemaining}m restantes
                </Text>
              </View>
              <Text style={[styles.gracePeriodDesc, t.atoms.text]}>
                Tu delegado (
                {cabildeo.userContext?.hasDelegatedTo?.split(':').pop()}) votó
                por:{'\n'}
                <Text style={{fontWeight: '900'}}>
                  {localOptions[delegateEvent.optionIndex]?.label}
                </Text>
              </Text>

              <View style={styles.gracePeriodActions}>
                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={handleConfirmDelegateVote}
                  disabled={isVoting}
                  style={[
                    styles.graceBtn,
                    {backgroundColor: t.palette.primary_500},
                    isVoting && {opacity: 0.6},
                  ]}>
                  <Text style={[styles.graceBtnText, {color: t.palette.contrast_100}]}>
                    {isVoting ? 'Confirmando...' : 'Confirmar (Peso 1.0)'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={handleOverrideVoteStart}
                  style={[
                    styles.graceBtn,
                    {borderWidth: 1, borderColor: t.palette.primary_500},
                  ]}>
                  <Text
                    style={[
                      styles.graceBtnText,
                      {color: t.palette.primary_500},
                    ]}>
                    Cambiar Voto
                  </Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => setHasDismissedGracePeriod(true)}
                style={styles.graceLinkBtn}>
                <Text
                  style={[styles.graceLinkText, t.atoms.text_contrast_medium]}>
                  Dejar así (Peso √N)
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Geo-restriction notice */}
          {cabildeo.geoRestricted && cabildeo.phase === 'voting' && (
            <View
              style={[
                styles.geoRestrictionBanner,
                {borderColor: t.palette.negative_500 + '30'},
              ]}>
              <Text style={[styles.geoRestrictionText, {color: t.palette.negative_500}]}>
                🔒 Solo residentes de {cabildeo.region} pueden votar
              </Text>
              <Text
                style={[
                  styles.geoRestrictionSub,
                  t.atoms.text_contrast_medium,
                ]}>
                Tu región verificada debe coincidir con {cabildeo.region}
              </Text>
            </View>
          )}

          {/* Vote Button */}
          {cabildeo.phase === 'voting' && !hasVoted && (
            <TouchableOpacity
              accessibilityRole="button"
              onPress={handleVote}
              disabled={selectedOption === null || isVoting}
              style={[
                styles.voteButton,
                {
                  backgroundColor:
                    selectedOption !== null && !isVoting
                      ? t.palette.primary_500
                      : t.palette.contrast_200,
                },
              ]}>
              <Text style={[styles.voteButtonText, {color: t.palette.contrast_100}]}>
                {isVoting ? '⏳ Votando...' : '🗳️ Votar Directamente'}
              </Text>
              <Text style={[styles.voteButtonSub, {color: t.palette.contrast_100 + '90'}]}>Peso: 1.0 (voto directo)</Text>
            </TouchableOpacity>
          )}

          {hasVoted && (
            <View
              style={[
                styles.votedConfirmation,
                {borderColor: t.palette.positive_500 + '40'},
              ]}>
              <Text style={[styles.votedText, {color: t.palette.positive_500}]}>
                ✅ Tu voto ha sido registrado
              </Text>
              <Text style={[styles.votedSub, t.atoms.text_contrast_medium]}>
                Peso efectivo: 1.0 (voto directo)
              </Text>
            </View>
          )}

          {/* Delegate Button */}
          {cabildeo.phase === 'voting' && !hasVoted && (
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => navigation.navigate('DelegateVote', {cabildeoUri})}
              style={[styles.delegateButton, t.atoms.bg_contrast_25]}>
              <Text style={[styles.delegateText, t.atoms.text]}>
                🤝 Delegar mi voto
              </Text>
              <Text style={[styles.delegateSub, t.atoms.text_contrast_medium]}>
                Tu representante votará por ti (√N weighting)
              </Text>
            </TouchableOpacity>
          )}

          {/* ─── Outcome Details ─── */}
          {cabildeo.outcome && (
            <View style={[styles.outcomeSection, t.atoms.bg_contrast_25]}>
              <Text style={[styles.sectionTitle, t.atoms.text]}>
                Resultado Final
              </Text>

              <View style={styles.outcomeGrid}>
                <View style={styles.outcomeMetric}>
                  <Text style={[styles.outcomeValue, t.atoms.text]}>
                    {cabildeo.outcome.totalParticipants}
                  </Text>
                  <Text
                    style={[
                      styles.outcomeMetricLabel,
                      t.atoms.text_contrast_medium,
                    ]}>
                    Participantes
                  </Text>
                </View>
                <View style={styles.outcomeMetric}>
                  <Text style={[styles.outcomeValue, t.atoms.text]}>
                    {cabildeo.outcome.directVoters}
                  </Text>
                  <Text
                    style={[
                      styles.outcomeMetricLabel,
                      t.atoms.text_contrast_medium,
                    ]}>
                    Directos
                  </Text>
                </View>
                <View style={styles.outcomeMetric}>
                  <Text style={[styles.outcomeValue, t.atoms.text]}>
                    {cabildeo.outcome.delegatedVoters}
                  </Text>
                  <Text
                    style={[
                      styles.outcomeMetricLabel,
                      t.atoms.text_contrast_medium,
                    ]}>
                    Delegados
                  </Text>
                </View>
                <View style={styles.outcomeMetric}>
                  <Text style={[styles.outcomeValue, {color: t.palette.primary_500}]}>
                    {cabildeo.outcome.effectiveTotalPower.toFixed(1)}
                  </Text>
                  <Text
                    style={[
                      styles.outcomeMetricLabel,
                      t.atoms.text_contrast_medium,
                    ]}>
                    Poder √
                  </Text>
                </View>
              </View>

              {/* Community Breakdown */}
              {cabildeo.outcome.communityBreakdown && (
                <>
                  <Text
                    style={[
                      styles.subsectionTitle,
                      t.atoms.text_contrast_medium,
                    ]}>
                    Desglose por comunidad
                  </Text>
                  {cabildeo.outcome.communityBreakdown.map((cb, i) => (
                    <View key={i} style={styles.communityBreakdownRow}>
                      <Text style={[styles.cbCommunity, t.atoms.text]}>
                        {cb.community}
                      </Text>
                      <Text style={[styles.cbOption, {color: t.palette.primary_500}]}>
                        {cabildeo.options[cb.dominantOption]?.label}
                      </Text>
                      <Text
                        style={[
                          styles.cbParticipation,
                          t.atoms.text_contrast_medium,
                        ]}>
                        {cb.participation}
                      </Text>
                    </View>
                  ))}
                </>
              )}
            </View>
          )}

          {/* ─── Positions / Deliberation ─── */}
          <View
            style={[styles.posHeaderRow, {marginTop: 24, marginBottom: 14}]}>
            <Text
              style={[styles.sectionTitle, t.atoms.text, {marginBottom: 0}]}>
              Posiciones
            </Text>
            {cabildeo.phase !== 'resolved' && (
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() =>
                  navigation.navigate('CreatePosition', {
                    cabildeoUri: cabildeo.uri,
                  })
                }
                style={[
                  styles.addPosBtn,
                  {borderColor: t.palette.primary_500},
                ]}>
                <Text
                  style={[styles.addPosText, {color: t.palette.primary_500}]}>
                  + Posición
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Position Filters */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.positionFilters}>
            {(
              [
                {key: 'all', label: 'Todas'},
                {key: 'for', label: '✅ A favor'},
                {key: 'against', label: '❌ En contra'},
                {key: 'amendment', label: '📝 Enmiendas'},
              ] as const
            ).map(f => (
              <TouchableOpacity
                accessibilityRole="button"
                key={f.key}
                onPress={() => setPositionFilter(f.key)}
                style={[
                  styles.posFilterPill,
                  positionFilter === f.key
                    ? {backgroundColor: t.palette.primary_500}
                    : t.atoms.bg_contrast_25,
                ]}>
                <Text
                  style={[
                    styles.posFilterText,
                    positionFilter === f.key
                      ? {color: '#FFFFFF'}
                      : t.atoms.text_contrast_medium,
                  ]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Position Cards */}
          <View style={styles.positionList}>
            {!positions.length ? (
              <ListMaybePlaceholder
                isLoading={isPositionsLoading || !isPositionsFetched}
                isError={isPositionsError}
                onRetry={refetchPositions}
                emptyType="results"
                emptyMessage="No hay posiciones publicadas todavía."
              />
            ) : (
              positions.map((pos, i) => {
                const stanceStyle = getStanceColors(t)[pos.stance]
                const score = pos.constructivenessScore ?? 1.0
                const isLowQuality = score <= 0.3
                const isHighQuality = score >= 0.8

                return (
                  <View
                    key={i}
                    style={[
                      styles.positionCard,
                      t.atoms.bg_contrast_25,
                      isLowQuality && {opacity: 0.5},
                    ]}>
                    <View style={styles.positionHeader}>
                      <View
                        style={[
                          styles.stanceBadge,
                          {backgroundColor: stanceStyle.bg},
                        ]}>
                        <Text
                          style={[
                            styles.stanceBadgeText,
                            {color: stanceStyle.fg},
                          ]}>
                          {stanceStyle.label}
                        </Text>
                      </View>
                      {pos.optionIndex !== undefined && (
                        <Text
                          style={[
                            styles.posOptionRef,
                            t.atoms.text_contrast_medium,
                          ]}>
                          → {cabildeo.options[pos.optionIndex]?.label}
                        </Text>
                      )}

                      <View style={{flex: 1}} />

                      {/* Constructiveness Badge */}
                      <View
                        style={[
                          styles.constructivenessBadge,
                          isHighQuality
                            ? {
                                backgroundColor: t.palette.positive_500 + '20',
                                borderColor: t.palette.positive_500 + '40',
                              }
                            : isLowQuality
                              ? {
                                  backgroundColor: t.palette.negative_500 + '20',
                                  borderColor: t.palette.negative_500 + '40',
                                }
                              : {
                                  backgroundColor: t.palette.contrast_50,
                                  borderColor: t.palette.contrast_200,
                                },
                        ]}>
                        <Text
                          style={[
                            styles.constructivenessBadgeText,
                            isHighQuality
                              ? {color: t.palette.positive_500}
                              : isLowQuality
                                ? {color: t.palette.negative_500}
                                : t.atoms.text_contrast_medium,
                          ]}>
                          {isHighQuality ? '✨' : isLowQuality ? '⚠️' : '📊'}{' '}
                          {Math.round(score * 100)}%
                        </Text>
                      </View>
                    </View>

                    <Text style={[styles.positionText, t.atoms.text]}>
                      {isLowQuality
                        ? 'Este comentario ha sido marcado como poco constructivo por la comunidad.'
                        : pos.text}
                    </Text>

                    {isLowQuality && (
                      <Text
                        style={[styles.lowQualityReason, {color: t.palette.negative_500}]}>
                        Score de constructividad demasiado bajo para ser
                        incluido en la síntesis IA.
                      </Text>
                    )}

                    <View style={styles.positionFooter}>
                      {pos.compassQuadrant && (
                        <View
                          style={[
                            styles.compassTag,
                            {backgroundColor: t.palette.contrast_50},
                          ]}>
                          <Text
                            style={[
                              styles.compassTagText,
                              t.atoms.text_contrast_medium,
                            ]}>
                            🧭 {pos.compassQuadrant}
                          </Text>
                        </View>
                      )}
                      <Text
                        style={[
                          styles.positionTime,
                          t.atoms.text_contrast_medium,
                        ]}>
                        {new Date(pos.createdAt).toLocaleString('es-MX', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                  </View>
                )
              })
            )}
          </View>
        </Layout.Center>
      </ScrollView>
    </Layout.Screen>
  )
}

const styles = StyleSheet.create({
  container: {flex: 1},
  content: {paddingBottom: 60},
  center: {paddingHorizontal: 16, paddingTop: 8},

  // Timeline
  timeline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  timelineStep: {
    alignItems: 'center',
    flex: 1,
    position: 'relative',
  },
  timelineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginBottom: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelinePulse: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  timelineLabel: {fontSize: 9, textAlign: 'center'},
  timelineLine: {
    position: 'absolute',
    height: 2,
    width: '100%',
    top: 6,
    left: '50%',
  },

  // Content
  title: {fontSize: 20, fontWeight: '900', lineHeight: 26, marginBottom: 8},
  desc: {fontSize: 14, lineHeight: 20, marginBottom: 16},

  communityRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  communityPill: {paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8},
  communityPillText: {fontSize: 12, fontWeight: '800'},

  deadlineBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  deadlineLabel: {fontSize: 12, fontWeight: '600'},
  deadlineValue: {fontSize: 14, fontWeight: '800'},

  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 14,
    opacity: 0.7,
  },
  posHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addPosBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  addPosText: {
    fontSize: 12,
    fontWeight: '800',
  },

  // Options
  optionCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  resultBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 14,
  },
  optionContent: {position: 'relative', zIndex: 1},
  optionHeader: {flexDirection: 'row', alignItems: 'center', gap: 10},
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {width: 12, height: 12, borderRadius: 6},
  winnerBadge: {fontSize: 20},
  optionLabel: {fontSize: 16, fontWeight: '800'},
  optionDesc: {fontSize: 12, marginTop: 2, lineHeight: 16},
  votePercent: {fontSize: 18, fontWeight: '900'},

  // Vote button
  voteButton: {
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 8,
  },
  voteButtonText: {fontSize: 16, fontWeight: '900'},
  voteButtonSub: {fontSize: 11, marginTop: 2},
  votedConfirmation: {
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    marginTop: 6,
    marginBottom: 8,
  },
  votedText: {fontSize: 16, fontWeight: '800'},
  votedSub: {fontSize: 12, marginTop: 2},

  // Grace Period Banner
  gracePeriodBanner: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
    marginTop: 8,
  },
  gracePeriodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  gracePeriodTitle: {fontSize: 16, fontWeight: '900'},
  gracePeriodTime: {fontSize: 12, fontWeight: '800'},
  gracePeriodDesc: {fontSize: 14, lineHeight: 20, marginBottom: 16},
  gracePeriodActions: {
    flexDirection: 'row',
    gap: 8,
  },
  graceBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  graceBtnText: {fontSize: 13, fontWeight: '800'},
  graceLinkBtn: {
    alignItems: 'center',
    marginTop: 12,
    padding: 8,
  },
  graceLinkText: {fontSize: 13, textDecorationLine: 'underline'},

  delegateButton: {
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  delegateText: {fontSize: 14, fontWeight: '800'},
  delegateSub: {fontSize: 11, marginTop: 2},

  // Outcome
  outcomeSection: {
    borderRadius: 16,
    padding: 16,
    marginTop: 10,
  },
  outcomeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  outcomeMetric: {
    flex: 1,
    minWidth: '40%',
    alignItems: 'center',
    padding: 12,
  },
  outcomeValue: {fontSize: 22, fontWeight: '900'},
  outcomeMetricLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'uppercase',
  },

  subsectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  communityBreakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  cbCommunity: {fontSize: 13, fontWeight: '800', width: 80},
  cbOption: {fontSize: 12, fontWeight: '700', flex: 1},
  cbParticipation: {fontSize: 12, fontWeight: '600'},

  // Positions
  positionFilters: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 8,
    marginBottom: 12,
  },
  posFilterPill: {paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16},
  posFilterText: {fontSize: 12, fontWeight: '700'},

  positionList: {gap: 10},
  positionCard: {
    borderRadius: 14,
    padding: 14,
  },
  positionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  stanceBadge: {paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6},
  stanceBadgeText: {fontSize: 10, fontWeight: '900'},
  posOptionRef: {fontSize: 11, fontWeight: '600'},
  constructivenessBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  constructivenessBadgeText: {fontSize: 10, fontWeight: '800'},
  compassTag: {paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4},
  compassTagText: {fontSize: 10, fontWeight: '600'},
  positionText: {fontSize: 14, lineHeight: 20, marginBottom: 6},
  lowQualityReason: {
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 16,
    marginBottom: 6,
  },
  positionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  positionTime: {fontSize: 11},

  // Geo restriction
  geoRestrictionBanner: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center' as const,
    marginTop: 6,
    marginBottom: 8,
  },
  geoRestrictionText: {fontSize: 14, fontWeight: '800' as const},
  geoRestrictionSub: {fontSize: 11, marginTop: 2, textAlign: 'center' as const},

  // Consensus Synthesizer
  synthesizerCard: {
    padding: 16,
    borderRadius: 16,
    marginTop: 12,
    borderWidth: 1,
  },
  synthesizerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  synthesizerTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  synthesizerDesc: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 16,
  },
  synthesizerBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  synthesizerBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
})
