import {useCallback, useMemo, useState} from 'react'
import {ScrollView, StyleSheet, TouchableOpacity, View} from 'react-native'
import {Trans} from '@lingui/react/macro'

import {
  type CommonNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {
  useCabildeoQuery,
  useDelegateCabildeoVoteMutation,
  useDelegationCandidatesQuery,
} from '#/state/queries/cabildeo'
import {useTheme} from '#/alf'
import * as Layout from '#/components/Layout'
import {ListMaybePlaceholder} from '#/components/Lists'
import {Text} from '#/components/Typography'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'DelegateVote'>

/**
 * Calculate quadratic voting power: √(N+1)
 * +1 because the representative also votes for themselves
 */
function calcQuadraticPower(delegationCount: number): number {
  return Math.sqrt(delegationCount + 1)
}

export function DelegateVoteScreen({route, navigation}: Props) {
  const t = useTheme()
  const {cabildeoUri} = route.params
  const {
    data: cabildeo = null,
    isFetched,
    isLoading,
    isError,
    refetch,
  } = useCabildeoQuery(cabildeoUri)
  const {
    data: candidates = [],
    isLoading: isCandidatesLoading,
    isError: isCandidatesError,
    refetch: refetchCandidates,
  } = useDelegationCandidatesQuery({
    cabildeoUri,
    communityId: cabildeo?.community,
  })
  const delegateMutation = useDelegateCabildeoVoteMutation()

  const [selectedRep, setSelectedRep] = useState<string | null>(null)

  const handleDelegate = useCallback(async () => {
    if (!selectedRep || !cabildeoUri) return
    try {
      await delegateMutation.mutateAsync({
        cabildeoUri,
        delegateTo: selectedRep,
      })
    } catch {
      // Error state is rendered from the mutation below.
    }
  }, [cabildeoUri, delegateMutation, selectedRep])

  const selectedRepData = useMemo(
    () => candidates.find(r => r.did === selectedRep),
    [candidates, selectedRep],
  )
  const hasDelegated =
    Boolean(cabildeo?.userContext?.hasDelegatedTo) ||
    delegateMutation.isSuccess

  if (!cabildeo && (isLoading || !isFetched || isError)) {
    return (
      <Layout.Screen testID="delegateVoteScreen">
        <Layout.Header.Outer noBottomBorder>
          <Layout.Header.BackButton />
          <Layout.Header.Content>
            <Layout.Header.TitleText>
              <Trans>Delegar Voto</Trans>
            </Layout.Header.TitleText>
          </Layout.Header.Content>
        </Layout.Header.Outer>
        <ListMaybePlaceholder
          isLoading={isLoading || !isFetched}
          isError={isError}
          onRetry={refetch}
          emptyType="page"
          emptyMessage="Estamos cargando el cabildeo para delegación."
        />
      </Layout.Screen>
    )
  }

  if (!cabildeo) {
    return (
      <Layout.Screen testID="delegateVoteScreen">
        <Layout.Header.Outer noBottomBorder>
          <Layout.Header.BackButton />
          <Layout.Header.Content>
            <Layout.Header.TitleText>
              <Trans>Delegar Voto</Trans>
            </Layout.Header.TitleText>
          </Layout.Header.Content>
        </Layout.Header.Outer>
        <ListMaybePlaceholder
          isLoading={false}
          isError={false}
          emptyType="page"
          emptyTitle="Cabildeo no disponible"
          emptyMessage="No se puede delegar porque este cabildeo ya no está disponible."
        />
      </Layout.Screen>
    )
  }

  return (
    <Layout.Screen testID="delegateVoteScreen">
      <Layout.Header.Outer noBottomBorder>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Delegar Voto</Trans>
          </Layout.Header.TitleText>
          <Layout.Header.SubtitleText>
            {cabildeo.community}
          </Layout.Header.SubtitleText>
        </Layout.Header.Content>
      </Layout.Header.Outer>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}>
        <Layout.Center style={styles.center}>
          {/* Explainer */}
          <View
            style={[
              styles.explainer,
              {
                backgroundColor: '#FF9500' + '10',
                borderColor: '#FF9500' + '30',
              },
            ]}>
            <Text style={[styles.explainerTitle, {color: '#FF9500'}]}>
              √ Votación Cuadrática
            </Text>
            <Text style={[styles.explainerText, t.atoms.text_contrast_medium]}>
              Tu voto directo vale{' '}
              <Text style={[{fontWeight: '900'}, t.atoms.text]}>1.0</Text>.
              {'\n'}Al delegar, el poder de tu representante crece como{' '}
              <Text style={[{fontWeight: '900'}, t.atoms.text]}>√N</Text> —
              incentivando la participación personal.
            </Text>
          </View>

          {/* Power Comparison Visual */}
          <View style={[styles.powerComparison, t.atoms.bg_contrast_25]}>
            <Text style={[styles.powerTitle, t.atoms.text]}>
              Comparación de poder efectivo
            </Text>
            <View style={styles.powerRow}>
              <View style={styles.powerItem}>
                <Text style={[styles.powerValue, {color: '#34C759'}]}>1.0</Text>
                <Text style={[styles.powerLabel, t.atoms.text_contrast_medium]}>
                  Tu voto directo
                </Text>
              </View>
              <View
                style={[
                  styles.powerDivider,
                  {backgroundColor: t.palette.contrast_100},
                ]}
              />
              <View style={styles.powerItem}>
                <Text style={[styles.powerValue, {color: '#FF9500'}]}>
                  {selectedRepData
                    ? calcQuadraticPower(
                        selectedRepData.activeDelegationCount,
                      ).toFixed(1)
                    : '—'}
                </Text>
                <Text style={[styles.powerLabel, t.atoms.text_contrast_medium]}>
                  Poder del delegado
                </Text>
              </View>
              <View
                style={[
                  styles.powerDivider,
                  {backgroundColor: t.palette.contrast_100},
                ]}
              />
              <View style={styles.powerItem}>
                <Text style={[styles.powerValue, {color: '#AF52DE'}]}>
                  {selectedRepData
                    ? (
                        (1.0 /
                          calcQuadraticPower(
                            selectedRepData.activeDelegationCount,
                          )) *
                        100
                      ).toFixed(0) + '%'
                    : '—'}
                </Text>
                <Text style={[styles.powerLabel, t.atoms.text_contrast_medium]}>
                  Tu peso relativo
                </Text>
              </View>
            </View>

            {/* √N Visual Scale */}
            <View style={styles.scaleContainer}>
              {[1, 4, 9, 16, 25, 36, 49].map(n => {
                const power = Math.sqrt(n)
                const barHeight = (power / 7) * 60
                const isHighlighted =
                  selectedRepData &&
                  Math.abs(selectedRepData.activeDelegationCount + 1 - n) < 5

                return (
                  <View key={n} style={styles.scaleItem}>
                    <View
                      style={[
                        styles.scaleBar,
                        {
                          height: barHeight,
                          backgroundColor: isHighlighted
                            ? '#FF9500'
                            : t.palette.contrast_200,
                        },
                      ]}
                    />
                    <Text style={[styles.scaleN, t.atoms.text_contrast_medium]}>
                      {n}
                    </Text>
                    <Text
                      style={[
                        styles.scalePower,
                        {
                          color: isHighlighted
                            ? '#FF9500'
                            : t.palette.contrast_300,
                        },
                      ]}>
                      √{power.toFixed(1)}
                    </Text>
                  </View>
                )
              })}
            </View>
            <Text style={[styles.scaleCaption, t.atoms.text_contrast_medium]}>
              N delegaciones → √N poder efectivo
            </Text>
          </View>

          {/* Representative Selection */}
          <Text style={[styles.sectionTitle, t.atoms.text]}>
            Elegir representante
          </Text>

          {hasDelegated ? (
            <View
              style={[
                styles.delegatedConfirm,
                {borderColor: '#34C759' + '40'},
              ]}>
              <Text style={[styles.delegatedTitle, {color: '#34C759'}]}>
                ✅ Voto delegado exitosamente
              </Text>
              <Text style={[styles.delegatedSub, t.atoms.text_contrast_medium]}>
                {(selectedRepData?.displayName ||
                  selectedRepData?.handle ||
                  cabildeo.userContext?.hasDelegatedTo) ??
                  'Tu representante'}{' '}
                votará por ti.
              </Text>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => navigation.goBack()}
                style={[styles.revokeButton, {borderColor: '#FF3B30' + '40'}]}>
                <Text style={[styles.revokeText, {color: '#FF3B30'}]}>
                  Volver al cabildeo
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {isCandidatesLoading || isCandidatesError ? (
                <ListMaybePlaceholder
                  isLoading={isCandidatesLoading}
                  isError={isCandidatesError}
                  onRetry={refetchCandidates}
                  emptyType="results"
                  emptyMessage="Estamos buscando representantes disponibles para este cabildeo."
                />
              ) : candidates.length === 0 ? (
                <ListMaybePlaceholder
                  isLoading={false}
                  isError={false}
                  emptyType="results"
                  emptyTitle="No hay representantes disponibles"
                  emptyMessage="Esta comunidad todavía no tiene representantes o miembros con roles delegables."
                />
              ) : (
              <View style={styles.repList}>
                {candidates.map(rep => {
                  const isSelected = selectedRep === rep.did
                  const power = calcQuadraticPower(rep.activeDelegationCount)
                  const newPower = calcQuadraticPower(
                    rep.activeDelegationCount + 1,
                  )
                  const displayName = rep.displayName || rep.handle || rep.did

                  return (
                    <TouchableOpacity
                      accessibilityRole="button"
                      key={rep.did}
                      onPress={() => setSelectedRep(rep.did)}
                      activeOpacity={0.8}
                      style={[
                        styles.repCard,
                        t.atoms.bg_contrast_25,
                        isSelected && {
                          borderColor: t.palette.primary_500,
                          borderWidth: 2,
                        },
                      ]}>
                      {/* Avatar placeholder */}
                      <View
                        style={[
                          styles.repAvatar,
                          {backgroundColor: t.palette.primary_500 + '20'},
                        ]}>
                        <Text style={{fontSize: 20}}>
                          {displayName.charAt(0)}
                        </Text>
                      </View>

                      <View style={styles.repInfo}>
                        <Text style={[styles.repName, t.atoms.text]}>
                          {displayName}
                        </Text>
                        <Text
                          style={[
                            styles.repHandle,
                            t.atoms.text_contrast_medium,
                          ]}>
                          {rep.handle ? `@${rep.handle}` : rep.did}
                        </Text>
                        <Text
                          style={[styles.repBio, t.atoms.text_contrast_medium]}>
                          {rep.description ||
                            rep.roles?.join(' · ') ||
                            'Representante comunitario'}
                        </Text>
                      </View>

                      <View style={styles.repStats}>
                        {/* Current delegations */}
                        <View style={styles.repStatItem}>
                          <Text style={[styles.repStatValue, t.atoms.text]}>
                            {rep.activeDelegationCount}
                          </Text>
                          <Text
                            style={[
                              styles.repStatLabel,
                              t.atoms.text_contrast_medium,
                            ]}>
                            delegaciones
                          </Text>
                        </View>

                        {/* Power */}
                        <View style={styles.repStatItem}>
                          <Text
                            style={[styles.repStatValue, {color: '#FF9500'}]}>
                            √{power.toFixed(1)}
                          </Text>
                          <Text
                            style={[
                              styles.repStatLabel,
                              t.atoms.text_contrast_medium,
                            ]}>
                            poder actual
                          </Text>
                        </View>

                        {/* Power if you delegate */}
                        <View style={styles.repStatItem}>
                          <Text
                            style={[styles.repStatValue, {color: '#34C759'}]}>
                            →√{newPower.toFixed(1)}
                          </Text>
                          <Text
                            style={[
                              styles.repStatLabel,
                              t.atoms.text_contrast_medium,
                            ]}>
                            con tu voto
                          </Text>
                        </View>

                        {/* Compass */}
                        <View
                          style={[
                            styles.compassBadge,
                            {backgroundColor: t.palette.contrast_50},
                          ]}>
                          <Text
                            style={[
                              styles.compassBadgeText,
                              t.atoms.text_contrast_medium,
                            ]}>
                            {rep.hasVoted ? 'Ya votó' : 'Sin voto registrado'}
                          </Text>
                        </View>
                      </View>

                      {/* Selection radio */}
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
                    </TouchableOpacity>
                  )
                })}
              </View>
              )}

              {/* Delegate Button */}
              <TouchableOpacity
                accessibilityRole="button"
                onPress={handleDelegate}
                disabled={!selectedRep || delegateMutation.isPending}
                style={[
                  styles.delegateBtn,
                  {
                    backgroundColor: selectedRep && !delegateMutation.isPending
                      ? '#FF9500'
                      : t.palette.contrast_200,
                  },
                ]}>
                <Text style={styles.delegateBtnText}>
                  {delegateMutation.isPending
                    ? 'Delegando...'
                    : '🤝 Delegar mi voto'}
                </Text>
                {selectedRepData && (
                  <Text style={styles.delegateBtnSub}>
                    a{' '}
                    {selectedRepData.displayName ||
                      selectedRepData.handle ||
                      selectedRepData.did}{' '}
                    · nuevo poder: √
                    {calcQuadraticPower(
                      selectedRepData.activeDelegationCount + 1,
                    ).toFixed(1)}
                  </Text>
                )}
              </TouchableOpacity>
              {delegateMutation.isError ? (
                <Text style={[styles.errorText, {color: '#FF3B30'}]}>
                  No se pudo registrar la delegación. Intenta otra vez.
                </Text>
              ) : null}

              {/* Or vote directly */}
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => navigation.goBack()}
                style={[styles.directBtn, t.atoms.bg_contrast_25]}>
                <Text style={[styles.directBtnText, t.atoms.text]}>
                  ← Mejor voto directo (peso 1.0)
                </Text>
              </TouchableOpacity>
            </>
          )}
        </Layout.Center>
      </ScrollView>
    </Layout.Screen>
  )
}

const styles = StyleSheet.create({
  container: {flex: 1},
  content: {paddingBottom: 60},
  center: {paddingHorizontal: 16, paddingTop: 8},

  // Explainer
  explainer: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  explainerTitle: {fontSize: 14, fontWeight: '900', marginBottom: 6},
  explainerText: {fontSize: 13, lineHeight: 20},

  // Power Comparison
  powerComparison: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  powerTitle: {
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 12,
    textAlign: 'center',
  },
  powerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  powerItem: {flex: 1, alignItems: 'center'},
  powerValue: {fontSize: 28, fontWeight: '900'},
  powerLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  powerDivider: {width: 1, height: 40},

  // Scale
  scaleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 80,
    paddingHorizontal: 8,
    marginBottom: 6,
  },
  scaleItem: {alignItems: 'center', gap: 2},
  scaleBar: {width: 18, borderRadius: 4},
  scaleN: {fontSize: 9, fontWeight: '700'},
  scalePower: {fontSize: 8, fontWeight: '600'},
  scaleCaption: {fontSize: 10, textAlign: 'center', fontStyle: 'italic'},

  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 14,
    opacity: 0.7,
  },

  // Delegated confirmation
  delegatedConfirm: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 20,
  },
  delegatedTitle: {fontSize: 18, fontWeight: '900', marginBottom: 6},
  delegatedSub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 14,
  },
  revokeButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  revokeText: {fontSize: 13, fontWeight: '800'},
  errorText: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 10,
    textAlign: 'center',
  },

  // Rep List
  repList: {gap: 12, marginBottom: 16},
  repCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  repAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  repInfo: {marginBottom: 10},
  repName: {fontSize: 16, fontWeight: '800'},
  repHandle: {fontSize: 12, marginTop: 1},
  repBio: {fontSize: 12, marginTop: 4, lineHeight: 16},

  repStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  repStatItem: {alignItems: 'center'},
  repStatValue: {fontSize: 14, fontWeight: '900'},
  repStatLabel: {fontSize: 9, fontWeight: '600'},
  compassBadge: {paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6},
  compassBadgeText: {fontSize: 10, fontWeight: '700'},

  radioOuter: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {width: 12, height: 12, borderRadius: 6},

  // Buttons
  delegateBtn: {
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginBottom: 10,
  },
  delegateBtnText: {color: '#fff', fontSize: 16, fontWeight: '900'},
  delegateBtnSub: {color: '#ffffff90', fontSize: 11, marginTop: 2},

  directBtn: {
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  directBtnText: {fontSize: 14, fontWeight: '700'},
})
