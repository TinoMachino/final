import {useCallback, useMemo, useState} from 'react'
import {ScrollView, StyleSheet, TouchableOpacity, View} from 'react-native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'
import {useFocusEffect, useNavigation} from '@react-navigation/native'

import {getVoteBreakdownByParty} from '#/lib/cabildeo-party-alignment'
import {
  getPartyNinthId,
  PARTY_COMPASS_PROFILE_BY_ID,
} from '#/lib/compass/party-distributions'
import {
  NINTH_NAME_TO_COMPASS_ID,
  POLITICAL_AFFILIATION_OPTIONS,
  type PoliticalAffiliation,
} from '#/lib/political-affiliations'
import {type NavigationProp} from '#/lib/routes/types'
import {useCabildeosQuery} from '#/state/queries/cabildeo'
import {usePoliticalAffiliation} from '#/state/shell/political-affiliation'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {CompassMini} from '#/components/CompassMini'
import {TimesLarge_Stroke2_Corner0_Rounded as XIcon} from '#/components/icons/Times'
import {Header, Screen} from '#/components/Layout'
import {PieChart} from '#/components/PieChart'
import {Text} from '#/components/Typography'

// ─────────────────────────────────────────────────────────────────────────────
// VoteAnalysis — pie chart + voted policies list
// ─────────────────────────────────────────────────────────────────────────────

function VoteAnalysis({navigation}: {navigation: NavigationProp}) {
  const t = useTheme()
  const {_} = useLingui()
  const {data: cabildeos = []} = useCabildeosQuery()

  const votedCabildeos = useMemo(
    () => cabildeos.filter(c => c.userContext?.viewerVoteOption !== undefined),
    [cabildeos],
  )

  const breakdown = useMemo(
    () => getVoteBreakdownByParty(votedCabildeos),
    [votedCabildeos],
  )

  const pieData = useMemo(
    () =>
      breakdown.map(b => ({
        label: b.party.name,
        value: b.count,
        color: b.party.color,
      })),
    [breakdown],
  )

  if (votedCabildeos.length === 0) {
    return (
      <View
        style={[
          a.p_lg,
          a.rounded_xl,
          t.atoms.bg_contrast_25,
          {borderWidth: 1, borderColor: t.palette.contrast_100},
        ]}>
        <Text style={[a.text_md, a.font_bold, t.atoms.text, a.mb_sm]}>
          <Trans>Vote Analysis</Trans>
        </Text>
        <Text style={[a.text_sm, t.atoms.text_contrast_medium, a.mb_md]}>
          <Trans>
            Vote on some policies to see which parties your decisions align
            with.
          </Trans>
        </Text>
        <Button
          variant="solid"
          color="primary"
          size="small"
          label={_(msg`Browse policies to vote`)}
          onPress={() => navigation.navigate('CabildeoList')}
          style={[a.w_full]}>
          <ButtonText>
            <Trans>Browse policies to vote →</Trans>
          </ButtonText>
        </Button>
      </View>
    )
  }

  return (
    <View
      style={[
        a.p_lg,
        a.rounded_xl,
        t.atoms.bg_contrast_25,
        {borderWidth: 1, borderColor: t.palette.contrast_100},
      ]}>
      <Text style={[a.text_md, a.font_bold, t.atoms.text, a.mb_md]}>
        <Trans>Vote Analysis</Trans>
      </Text>

      {/* Pie chart */}
      <View style={[a.align_center, a.mb_lg]}>
        <PieChart data={pieData} size={160} showLegend={false} />
      </View>

      {/* Breakdown stats */}
      <View style={[a.gap_sm, a.mb_lg]}>
        {breakdown.map(b => (
          <View key={b.party.id} style={[a.flex_row, a.align_center, a.gap_sm]}>
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: b.party.color,
              }}
            />
            <Text style={[a.text_sm, t.atoms.text, a.flex_1]}>
              {b.party.name}
            </Text>
            <Text
              style={[a.text_sm, a.font_bold, t.atoms.text_contrast_medium]}>
              {b.count} vote{b.count !== 1 ? 's' : ''}
            </Text>
          </View>
        ))}
      </View>

      {/* Voted policies list */}
      <Text style={[a.text_sm, a.font_bold, t.atoms.text, a.mb_sm]}>
        <Trans>Policies you voted on</Trans>
      </Text>
      <View style={[a.gap_sm]}>
        {votedCabildeos.slice(0, 6).map(c => {
          const aligned = getVoteBreakdownByParty([c])[0]?.party
          return (
            <TouchableOpacity
              key={c.uri}
              accessibilityRole="button"
              onPress={() =>
                navigation.navigate('PolicyDetails', {cabildeoUri: c.uri})
              }
              style={[
                a.p_sm,
                a.rounded_md,
                a.flex_row,
                a.align_center,
                a.gap_sm,
                {
                  backgroundColor: t.atoms.bg.backgroundColor,
                  borderWidth: 1,
                  borderColor: t.palette.contrast_100,
                },
              ]}>
              <View style={[a.flex_1]}>
                <Text
                  style={[a.text_sm, a.font_bold, t.atoms.text]}
                  numberOfLines={1}>
                  {c.title}
                </Text>
                <Text style={[a.text_xs, t.atoms.text_contrast_medium]}>
                  {c.community}
                </Text>
              </View>
              {aligned && (
                <View
                  style={[
                    a.p_xs,
                    a.rounded_md,
                    {backgroundColor: aligned.color + '20'},
                  ]}>
                  <Text
                    style={[a.text_xs, a.font_bold, {color: aligned.color}]}>
                    {aligned.name}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )
        })}
        {votedCabildeos.length > 6 && (
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => {
              ;(navigation as any).navigate('SeeVotes')
            }}>
            <Text
              style={[
                a.text_sm,
                a.font_bold,
                {color: t.palette.primary_500},
                a.align_center,
              ]}>
              <Trans>View all {votedCabildeos.length} votes →</Trans>
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────

export function MyAffiliationsScreen() {
  const {_} = useLingui()
  const t = useTheme()
  const navigation = useNavigation<NavigationProp>()
  const {affiliations, setAffiliations, isLoading} = usePoliticalAffiliation()
  const [pendingAffiliations, setPendingAffiliations] =
    useState<PoliticalAffiliation[]>(affiliations)
  const [isNinthManual, setIsNinthManual] = useState(false)
  const hasChanges = useMemo(
    () => JSON.stringify(pendingAffiliations) !== JSON.stringify(affiliations),
    [pendingAffiliations, affiliations],
  )

  // Sync pending with stored when screen gains focus (React Navigation keeps component mounted)
  useFocusEffect(
    useCallback(() => {
      setPendingAffiliations(affiliations)
      // Determine if stored ninth was manually set: it exists AND there's no party
      // (if party exists, ninth was likely auto-derived)
      const hasParty = affiliations.some(a => a.type === 'party')
      const hasNinth = affiliations.some(a => a.type === 'ninth')
      setIsNinthManual(hasNinth && !hasParty)
    }, [affiliations]),
  )

  const handleToggleParty = useCallback((party: PoliticalAffiliation) => {
    setPendingAffiliations(prev => {
      const exists = prev.find(p => p.id === party.id)
      if (exists) {
        return prev.filter(p => p.id !== party.id)
      }
      // Keep non-party/non-ninth affiliations, replace party and sync ninth
      const filtered = prev.filter(
        p => p.type !== 'party' && p.type !== 'ninth',
      )
      const next = [...filtered, party]
      setIsNinthManual(false)

      // Always sync ninth to the selected party's predominant position
      const ninthId = getPartyNinthId(party.id)
      if (ninthId) {
        const ninthName = Object.entries(NINTH_NAME_TO_COMPASS_ID).find(
          ([, id]) => id === ninthId,
        )?.[0]
        if (ninthName) {
          const ninthAff = POLITICAL_AFFILIATION_OPTIONS.ninth.find(
            n => n.name === ninthName,
          )
          if (ninthAff) {
            next.push(ninthAff)
          }
        }
      }

      return next
    })
  }, [])

  const handleSetNinth = useCallback((ninth: PoliticalAffiliation) => {
    setIsNinthManual(true)
    setPendingAffiliations(prev => {
      const filtered = prev.filter(p => p.type !== 'ninth')
      return [...filtered, ninth]
    })
  }, [])

  const handleRemoveNinth = useCallback(() => {
    setPendingAffiliations(prev => prev.filter(p => p.type !== 'ninth'))
  }, [])

  const handleSave = useCallback(async () => {
    await setAffiliations(pendingAffiliations)
    navigation.goBack()
  }, [pendingAffiliations, setAffiliations, navigation])

  const handleExploreCompass = useCallback(() => {
    const ninth = pendingAffiliations.find(p => p.type === 'ninth')
    const tf = pendingAffiliations.find(p => p.type === 'twentyFifth')
    const party = pendingAffiliations.find(p => p.type === 'party')
    let highlightNinth: string | undefined
    if (ninth) {
      highlightNinth = NINTH_NAME_TO_COMPASS_ID[ninth.name]
    } else if (tf) {
      const match = tf.id.match(/twenty-fifth-(\d+)-(\d+)/)
      if (match) {
        const row = parseInt(match[1], 10)
        const col = parseInt(match[2], 10)
        const parentRow = Math.floor(row / 2)
        const parentCol = Math.floor(col / 2)
        const ids = Object.values(NINTH_NAME_TO_COMPASS_ID)
        highlightNinth = ids[parentRow * 3 + parentCol]
      }
    } else if (party) {
      highlightNinth = getPartyNinthId(party.id) ?? undefined
    }
    navigation.navigate('Compass', {
      mode: 'affiliate',
      highlightNinth,
      initialZoom: '9ths',
    })
  }, [pendingAffiliations, navigation])

  const currentParty = pendingAffiliations.find(p => p.type === 'party')
  const currentNinth = pendingAffiliations.find(p => p.type === 'ninth')
  const partyProfile = currentParty
    ? PARTY_COMPASS_PROFILE_BY_ID[currentParty.id]
    : null

  return (
    <Screen>
      <Header.Outer noBottomBorder>
        <Header.BackButton />
        <Header.Content>
          <Header.TitleText>
            <Trans>My Affiliations</Trans>
          </Header.TitleText>
        </Header.Content>
        <Header.Slot>
          {hasChanges && (
            <Button
              size="small"
              variant="solid"
              color="primary"
              label={_(msg`Save`)}
              onPress={handleSave}
              disabled={isLoading}>
              <ButtonText>
                <Trans>Save</Trans>
              </ButtonText>
            </Button>
          )}
        </Header.Slot>
      </Header.Outer>

      <ScrollView
        style={[a.flex_1]}
        contentContainerStyle={[
          a.gap_lg,
          a.px_lg,
          a.py_lg,
          {paddingBottom: 120},
        ]}>
        {/* Compass Preview */}
        <View
          style={[
            a.p_lg,
            a.rounded_xl,
            t.atoms.bg_contrast_25,
            {borderWidth: 1, borderColor: t.palette.contrast_100},
          ]}>
          <Text style={[a.text_md, a.font_bold, t.atoms.text, a.mb_md]}>
            <Trans>Your position on the compass</Trans>
          </Text>
          <View style={[a.align_center, a.mb_md]}>
            <CompassMini
              affiliations={pendingAffiliations}
              onPress={handleExploreCompass}
              size={140}
            />
          </View>
          <Button
            variant="outline"
            color="primary"
            size="small"
            label={_(msg`Find my position in compass`)}
            onPress={handleExploreCompass}
            style={[a.w_full]}>
            <ButtonText>
              <Trans>Find my position in compass</Trans>
            </ButtonText>
          </Button>
        </View>

        {/* Current Position Detail */}
        {currentNinth && (
          <View
            style={[
              a.p_lg,
              a.rounded_xl,
              {backgroundColor: t.palette.primary_500 + '10'},
              {borderWidth: 1, borderColor: t.palette.primary_500 + '30'},
            ]}>
            <View style={[a.flex_row, a.align_center, a.gap_sm, a.mb_sm]}>
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: currentNinth.color,
                }}
              />
              <Text style={[a.text_md, a.font_bold, t.atoms.text]}>
                {currentNinth.name}
              </Text>
              <View style={{flex: 1}} />
              {isNinthManual ? (
                <View
                  style={[
                    a.px_sm,
                    a.py_xs,
                    a.rounded_md,
                    {backgroundColor: t.palette.primary_500 + '15'},
                  ]}>
                  <Text
                    style={[
                      a.text_xs,
                      a.font_bold,
                      {color: t.palette.primary_500},
                    ]}>
                    <Trans>Manual</Trans>
                  </Text>
                </View>
              ) : currentParty ? (
                <View
                  style={[
                    a.px_sm,
                    a.py_xs,
                    a.rounded_md,
                    {backgroundColor: partyProfile?.color + '15'},
                  ]}>
                  <Text
                    style={[
                      a.text_xs,
                      a.font_bold,
                      {color: partyProfile?.color},
                    ]}>
                    <Trans>Suggested by</Trans> {currentParty.name}
                  </Text>
                </View>
              ) : null}
              <TouchableOpacity
                accessibilityRole="button"
                onPress={handleRemoveNinth}
                style={[a.p_xs, a.rounded_full, t.atoms.bg_contrast_100]}>
                <XIcon size="xs" style={t.atoms.text_contrast_medium} />
              </TouchableOpacity>
            </View>
            {partyProfile && (
              <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
                <Trans>Most aligned with</Trans>{' '}
                <Text style={[a.font_bold, {color: partyProfile.color}]}>
                  {partyProfile.name}
                </Text>{' '}
                — {partyProfile.totalMembers.toLocaleString()} members, avg
                influence {partyProfile.avgInfluence}
              </Text>
            )}
          </View>
        )}

        {/* Party Section */}
        <View>
          <Text style={[a.text_md, a.font_bold, t.atoms.text, a.mb_md]}>
            <Trans>Political Party</Trans>
          </Text>
          <View style={[a.gap_sm]}>
            {POLITICAL_AFFILIATION_OPTIONS.party.map(party => {
              const isSelected = pendingAffiliations.some(
                a => a.id === party.id,
              )
              const profile = PARTY_COMPASS_PROFILE_BY_ID[party.id]
              return (
                <TouchableOpacity
                  key={party.id}
                  accessibilityRole="button"
                  accessibilityState={{selected: isSelected}}
                  onPress={() => handleToggleParty(party)}
                  style={[
                    a.p_md,
                    a.rounded_md,
                    a.flex_row,
                    a.align_center,
                    a.gap_md,
                    {
                      backgroundColor: isSelected
                        ? party.color + '15'
                        : t.atoms.bg_contrast_25.backgroundColor,
                      borderWidth: isSelected ? 2 : 1,
                      borderColor: isSelected
                        ? party.color
                        : t.palette.contrast_100,
                    },
                  ]}>
                  <View
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: 8,
                      backgroundColor: party.color,
                    }}
                  />
                  <View style={[a.flex_1]}>
                    <Text style={[a.font_bold, a.text_sm, t.atoms.text]}>
                      {party.name}
                    </Text>
                    {profile && (
                      <Text style={[a.text_xs, t.atoms.text_contrast_medium]}>
                        {profile.totalMembers.toLocaleString()} members •{' '}
                        {profile.descriptors.slice(0, 2).join(', ')}
                      </Text>
                    )}
                  </View>
                  {isSelected && (
                    <View
                      style={[
                        a.p_xs,
                        a.rounded_full,
                        {backgroundColor: party.color},
                      ]}>
                      <Text style={{color: '#fff', fontSize: 10}}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        {/* 9th Position Section */}
        <View>
          <Text style={[a.text_md, a.font_bold, t.atoms.text, a.mb_md]}>
            <Trans>Compass Position (9ths)</Trans>
          </Text>
          <View style={[styles.ninthGrid]}>
            {POLITICAL_AFFILIATION_OPTIONS.ninth.map(ninth => {
              const isSelected = pendingAffiliations.some(
                a => a.id === ninth.id,
              )
              return (
                <TouchableOpacity
                  key={ninth.id}
                  accessibilityRole="button"
                  accessibilityState={{selected: isSelected}}
                  onPress={() => handleSetNinth(ninth)}
                  style={[
                    styles.ninthPill,
                    {
                      backgroundColor: isSelected
                        ? ninth.color + '25'
                        : t.atoms.bg_contrast_25.backgroundColor,
                      borderColor: isSelected
                        ? ninth.color
                        : t.palette.contrast_100,
                      borderWidth: isSelected ? 2 : 1,
                    },
                  ]}>
                  <View
                    style={[styles.ninthDot, {backgroundColor: ninth.color}]}
                  />
                  <Text style={[a.text_sm, a.font_bold, t.atoms.text]}>
                    {ninth.name}
                  </Text>
                  {isSelected && (
                    <Text style={{color: ninth.color, fontSize: 10}}> ✓</Text>
                  )}
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        {/* Vote Analysis */}
        <VoteAnalysis navigation={navigation} />

        {/* Tip */}
        <View
          style={[
            a.p_md,
            a.rounded_md,
            {backgroundColor: t.palette.primary_500 + '08'},
          ]}>
          <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
            <Trans>
              Tap the compass above to explore where parties cluster and find
              your position visually.
            </Trans>
          </Text>
        </View>
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  ninthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ninthPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  ninthDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
})
