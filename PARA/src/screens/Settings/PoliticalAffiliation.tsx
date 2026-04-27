import {useCallback, useState} from 'react'
import {ActivityIndicator, ScrollView, View} from 'react-native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'
import {useFocusEffect} from '@react-navigation/native'

import {
  POLITICAL_AFFILIATION_OPTIONS,
  POLITICAL_AFFILIATION_TYPE_LABELS,
  type PoliticalAffiliation,
  type PoliticalAffiliationType,
  upsertPoliticalAffiliation,
} from '#/lib/political-affiliations'
import {
  type CommonNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {usePoliticalAffiliation} from '#/state/shell/political-affiliation'
import * as SettingsList from '#/screens/Settings/components/SettingsList'
import {atoms as a, useTheme} from '#/alf'
import {ColorStack} from '#/components/AvatarStack'
import {Check_Stroke2_Corner0_Rounded as CheckIcon} from '#/components/icons/Check'
import * as Layout from '#/components/Layout'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'

type Props = NativeStackScreenProps<
  CommonNavigatorParams,
  'PoliticalAffiliation'
>

export function PoliticalAffiliationScreen({}: Props) {
  const t = useTheme()
  const {_} = useLingui()
  const {affiliations, setAffiliations, isLoading} = usePoliticalAffiliation()
  const [localAffiliations, setLocalAffiliations] = useState<
    PoliticalAffiliation[]
  >([])

  useFocusEffect(
    useCallback(() => {
      setLocalAffiliations(affiliations)
    }, [affiliations]),
  )

  const handleSelect = async (option: PoliticalAffiliation) => {
    const existing = localAffiliations.find(item => item.type === option.type)
    const nextAffiliations =
      existing?.id === option.id
        ? localAffiliations.filter(item => item.type !== option.type)
        : upsertPoliticalAffiliation(localAffiliations, option)

    setLocalAffiliations(nextAffiliations)
    await setAffiliations(nextAffiliations)

    if (existing?.id === option.id) {
      Toast.show(`${POLITICAL_AFFILIATION_TYPE_LABELS[option.type]} cleared`)
    } else {
      Toast.show(
        `${POLITICAL_AFFILIATION_TYPE_LABELS[option.type]} set to ${option.name}`,
      )
    }
  }

  const handleClearAll = async () => {
    setLocalAffiliations([])
    await setAffiliations([])
    Toast.show(_(msg`Political affiliations cleared`))
  }

  const isSelected = (option: PoliticalAffiliation) =>
    localAffiliations.some(item => item.id === option.id)

  if (isLoading) {
    return (
      <View style={[a.flex_1, a.align_center, a.justify_center]}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Political Affiliation</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      <Layout.Content>
        <ScrollView>
          <SettingsList.Container>
            <View style={[a.px_lg, a.py_md]}>
              <Text
                style={[
                  a.text_sm,
                  a.leading_snug,
                  t.atoms.text_contrast_medium,
                ]}>
                <Trans>
                  Save up to one affiliation per type: one party, one 9th, and
                  one 25th. We only stack affiliations when they are different
                  types. Your selections are stored locally on this device.
                </Trans>
              </Text>
            </View>

            <SettingsList.Divider />

            <View style={[a.px_lg, a.py_md, a.gap_sm]}>
              <Text
                style={[
                  a.text_xs,
                  a.font_bold,
                  t.atoms.text_contrast_low,
                ]}>
                <Trans>Current Selection</Trans>
              </Text>
              {localAffiliations.length > 0 ? (
                <View style={[a.flex_row, a.align_center, a.gap_sm]}>
                  <ColorStack
                    items={localAffiliations.map(item => ({
                      id: item.id,
                      color: item.color,
                    }))}
                    size={22}
                  />
                  <View style={[a.gap_2xs, a.flex_1]}>
                    {localAffiliations.map(item => (
                      <Text key={item.id} style={[a.text_sm, t.atoms.text]}>
                        {POLITICAL_AFFILIATION_TYPE_LABELS[item.type]}: {item.name}
                      </Text>
                    ))}
                  </View>
                </View>
              ) : (
                <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
                  <Trans>No affiliations selected</Trans>
                </Text>
              )}
            </View>

            <SettingsList.Divider />

            <SettingsList.PressableItem
              label={_(msg`Clear all affiliations`)}
              onPress={() => void handleClearAll()}>
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: '#888888',
                  marginRight: 8,
                }}
              />
              <SettingsList.ItemText style={[a.flex_1]}>
                <Trans>None (Clear all affiliations)</Trans>
              </SettingsList.ItemText>
              {localAffiliations.length === 0 && (
                <CheckIcon size="md" style={[t.atoms.text]} />
              )}
            </SettingsList.PressableItem>

            <SettingsList.Divider />

            {(Object.entries(POLITICAL_AFFILIATION_OPTIONS) as Array<
              [PoliticalAffiliationType, PoliticalAffiliation[]]
            >).map(([type, options], sectionIndex) => (
              <View key={type} style={[a.py_sm]}>
                <Text
                  style={[
                    a.px_lg,
                    a.py_sm,
                    a.text_xs,
                    a.font_bold,
                    t.atoms.text_contrast_low,
                  ]}>
                  {POLITICAL_AFFILIATION_TYPE_LABELS[type].toUpperCase()}
                </Text>
                {options.map(option => (
                  <SettingsList.PressableItem
                    key={option.id}
                    label={option.name}
                    onPress={() => void handleSelect(option)}>
                    <View
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 6,
                        backgroundColor: option.color,
                        marginRight: 8,
                      }}
                    />
                    <SettingsList.ItemText style={[a.flex_1]}>
                      {option.name}
                    </SettingsList.ItemText>
                    {isSelected(option) && (
                      <CheckIcon size="md" style={[t.atoms.text]} />
                    )}
                  </SettingsList.PressableItem>
                ))}
                {sectionIndex <
                Object.keys(POLITICAL_AFFILIATION_OPTIONS).length - 1 ? (
                  <SettingsList.Divider />
                ) : null}
              </View>
            ))}
          </SettingsList.Container>
        </ScrollView>
      </Layout.Content>
    </Layout.Screen>
  )
}
