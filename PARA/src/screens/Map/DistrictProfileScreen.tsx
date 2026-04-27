import {type ReactNode, useMemo, useState} from 'react'
import {ScrollView, TouchableOpacity, View} from 'react-native'
import {Trans} from '@lingui/react/macro'

import {
  type ElectoralDistrict,
  getDistrictById,
  getDistrictsByState,
} from '#/lib/constants/electoralDistrictsData'
import {normalizeMexicoStateName} from '#/lib/constants/mexico'
import {
  type DistrictRaqRecord,
  type DistrictScopedCabildeoRecord,
  MOCK_CABILDEOS,
  MOCK_DISTRICT_RAQS,
} from '#/lib/constants/mockData'
import {
  type CommonNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import * as Layout from '#/components/Layout'
import {Text} from '#/components/Typography'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'DistrictProfile'>
type DistrictTab = 'overview' | 'activity'

const PARTY_COLORS: Record<string, {bg: string; fg: string}> = {
  Morena: {bg: '#8B153820', fg: '#8B1538'},
  PAN: {bg: '#00308720', fg: '#003087'},
  PRI: {bg: '#00923F20', fg: '#00923F'},
  MC: {bg: '#FF6B0020', fg: '#FF6B00'},
  PVEM: {bg: '#228B2220', fg: '#228B22'},
  PT: {bg: '#FF000020', fg: '#FF0000'},
  PRD: {bg: '#FFD70030', fg: '#B8860B'},
}

function getPartyColors(party: string) {
  return PARTY_COLORS[party] || {bg: '#6B728020', fg: '#6B7280'}
}

function seededRandom(seed: number) {
  let state = seed
  return () => {
    state = (state * 48271) % 2147483647
    return state / 2147483647
  }
}

function generatePartyBreakdown(district: ElectoralDistrict) {
  const parties = ['Morena', 'PAN', 'PRI', 'MC', 'PVEM', 'PT', 'PRD']
  const rng = seededRandom(district.id * 97)
  const results: {party: string; pct: number}[] = []
  let remaining = 100

  const dominantPct = 37 + Math.floor(rng() * 18)
  results.push({party: district.dominantParty, pct: dominantPct})
  remaining -= dominantPct

  const others = parties.filter(party => party !== district.dominantParty).slice(0, 4)
  for (let index = 0; index < others.length; index++) {
    const isLast = index === others.length - 1
    const nextPct = isLast
      ? remaining
      : Math.max(5, Math.floor(rng() * Math.max(remaining / 2, 6)))
    results.push({party: others[index], pct: nextPct})
    remaining -= nextPct
  }

  return results.sort((left, right) => right.pct - left.pct)
}

export function DistrictProfileScreen({navigation, route}: Props) {
  const t = useTheme()
  const {gtMobile} = useBreakpoints()
  const districtId = Number(route.params?.districtId)
  const district = useMemo(() => getDistrictById(districtId), [districtId])
  const initialTab = route.params?.initialTab ?? 'overview'
  const [activeTab, setActiveTab] = useState<DistrictTab>(initialTab)

  const partyBreakdown = useMemo(
    () => (district ? generatePartyBreakdown(district) : []),
    [district],
  )

  const siblingDistricts = useMemo(
    () =>
      district
        ? getDistrictsByState(district.stateName).filter(
            sibling => sibling.id !== district.id,
          )
        : [],
    [district],
  )

  const districtCabildeos = useMemo(
    () =>
      district
        ? MOCK_CABILDEOS.filter(item =>
            item.districtKeys?.includes(district.districtKey),
          )
        : [],
    [district],
  )

  const stateCabildeos = useMemo(
    () =>
      district
        ? MOCK_CABILDEOS.filter(
            item =>
              normalizeMexicoStateName(item.region || '') ===
                normalizeMexicoStateName(district.stateName) &&
              !item.districtKeys?.includes(district.districtKey),
          )
        : [],
    [district],
  )

  const districtQuestions = useMemo(
    () =>
      district
        ? MOCK_DISTRICT_RAQS.filter(item =>
            item.districtKeys.includes(district.districtKey),
          )
        : [],
    [district],
  )

  const stateQuestions = useMemo(
    () =>
      district
        ? MOCK_DISTRICT_RAQS.filter(
            item =>
              normalizeMexicoStateName(item.stateName) ===
                normalizeMexicoStateName(district.stateName) &&
              !item.districtKeys.includes(district.districtKey),
          )
        : [],
    [district],
  )

  if (!district) {
    return (
      <Layout.Screen>
        <Layout.Header.Outer>
          <Layout.Header.BackButton />
          <Layout.Header.Content>
            <Layout.Header.TitleText>
              <Trans>District Not Found</Trans>
            </Layout.Header.TitleText>
          </Layout.Header.Content>
          <Layout.Header.Slot />
        </Layout.Header.Outer>
        <View style={[a.flex_1, a.align_center, a.justify_center, a.p_xl]}>
          <Text style={[a.text_lg, t.atoms.text_contrast_medium]}>
            <Trans>District not found.</Trans>
          </Text>
        </View>
      </Layout.Screen>
    )
  }

  const partyColors = getPartyColors(district.dominantParty)

  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            Distrito {district.districtNumber}
          </Layout.Header.TitleText>
          <Layout.Header.SubtitleText>
            {district.stateName}
          </Layout.Header.SubtitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>

      <ScrollView
        contentContainerStyle={[
          a.pb_5xl,
          gtMobile && {maxWidth: 640, alignSelf: 'center', width: '100%'},
        ]}>
        <View
          style={[
            a.mx_lg,
            a.mt_lg,
            a.p_xl,
            a.rounded_xl,
            {backgroundColor: district.accent + '12'},
            a.border,
            {borderColor: district.accent + '30'},
          ]}>
          <View style={[a.flex_row, a.justify_between, a.align_start]}>
            <View style={[a.flex_1]}>
              <Text
                style={[
                  a.text_xs,
                  a.font_bold,
                  {letterSpacing: 1.5, color: district.accent},
                  a.mb_xs,
                ]}>
                DISTRITO ELECTORAL FEDERAL
              </Text>
              <Text
                style={[a.text_3xl, a.font_bold, t.atoms.text, a.mb_2xs]}>
                {district.displayName}
              </Text>
              <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
                Clave estable: {district.districtKey}
              </Text>
            </View>
            <View
              style={[
                a.px_md,
                a.py_sm,
                a.rounded_lg,
                {backgroundColor: partyColors.bg},
              ]}>
              <Text style={[a.text_sm, a.font_bold, {color: partyColors.fg}]}>
                {district.dominantParty}
              </Text>
            </View>
          </View>
        </View>

        <View style={[a.flex_row, a.gap_sm, a.mx_lg, a.mt_md]}>
          <StatCard
            label="PADRÓN ELECTORAL"
            value={district.registeredVoters.toLocaleString()}
          />
          <StatCard label="PARTICIPACIÓN" value={`${district.turnout}%`} />
          <StatCard label="CABILDEOS" value={`${districtCabildeos.length}`} />
        </View>

        <View
          style={[
            a.mx_lg,
            a.mt_lg,
            a.p_lg,
            a.rounded_xl,
            t.atoms.bg_contrast_25,
            a.border,
            t.atoms.border_contrast_low,
          ]}>
          <Text
            style={[
              a.text_xs,
              a.font_bold,
              {letterSpacing: 1.5},
              t.atoms.text_contrast_medium,
              a.mb_sm,
            ]}>
            DIPUTADO FEDERAL
          </Text>
          <Text style={[a.text_xl, a.font_bold, t.atoms.text, a.mb_xs]}>
            {district.currentDeputy}
          </Text>
          <View style={[a.flex_row, a.align_center, a.gap_sm, a.flex_wrap]}>
            <View
              style={[
                a.px_sm,
                a.py_xs,
                a.rounded_full,
                {backgroundColor: getPartyColors(district.deputyParty).bg},
              ]}>
              <Text
                style={[
                  a.text_xs,
                  a.font_bold,
                  {color: getPartyColors(district.deputyParty).fg},
                ]}>
                {district.deputyParty}
              </Text>
            </View>
            <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
              Legislatura LXVI · 2024–2027
            </Text>
            <ActionChip
              label="Open Cabildeos"
              onPress={() => navigation.navigate('CabildeoList')}
            />
            <ActionChip
              label="Open RAQ"
              onPress={() => navigation.navigate('OpenQuestionsList')}
            />
          </View>
        </View>

        <View
          style={[
            a.flex_row,
            a.mx_lg,
            a.mt_xl,
            a.rounded_lg,
            t.atoms.bg_contrast_25,
            a.p_xs,
          ]}>
          <TabButton
            label="Panorama"
            active={activeTab === 'overview'}
            onPress={() => setActiveTab('overview')}
          />
          <TabButton
            label="Actividad Cívica"
            active={activeTab === 'activity'}
            onPress={() => setActiveTab('activity')}
          />
        </View>

        {activeTab === 'overview' ? (
          <View style={[a.mx_lg, a.mt_lg]}>
            <View
              style={[
                a.p_lg,
                a.rounded_xl,
                t.atoms.bg_contrast_25,
                a.border,
                t.atoms.border_contrast_low,
              ]}>
              <Text
                style={[
                  a.text_xs,
                  a.font_bold,
                  {letterSpacing: 1.5},
                  t.atoms.text_contrast_medium,
                  a.mb_md,
                ]}>
                DISTRIBUCIÓN PARTIDISTA
              </Text>
              {partyBreakdown.map(item => {
                const itemColors = getPartyColors(item.party)
                return (
                  <View key={item.party} style={[a.mb_sm]}>
                    <View
                      style={[
                        a.flex_row,
                        a.justify_between,
                        a.align_center,
                        a.mb_2xs,
                      ]}>
                      <Text style={[a.text_sm, a.font_bold, t.atoms.text]}>
                        {item.party}
                      </Text>
                      <Text
                        style={[
                          a.text_sm,
                          a.font_bold,
                          {color: itemColors.fg},
                        ]}>
                        {item.pct}%
                      </Text>
                    </View>
                    <View
                      style={[
                        a.rounded_full,
                        {height: 8, backgroundColor: itemColors.bg},
                      ]}>
                      <View
                        style={[
                          a.rounded_full,
                          {
                            height: 8,
                            width: `${item.pct}%`,
                            backgroundColor: itemColors.fg,
                          },
                        ]}
                      />
                    </View>
                  </View>
                )
              })}
            </View>

            <View
              style={[
                a.mt_lg,
                a.p_lg,
                a.rounded_xl,
                t.atoms.bg_contrast_25,
                a.border,
                t.atoms.border_contrast_low,
              ]}>
              <Text
                style={[
                  a.text_xs,
                  a.font_bold,
                  {letterSpacing: 1.5},
                  t.atoms.text_contrast_medium,
                  a.mb_md,
                ]}>
                CONTEXTO CÍVICO
              </Text>
              <Text style={[a.text_sm, t.atoms.text_contrast_high]}>
                {districtCabildeos.length} cabildeo
                {districtCabildeos.length === 1 ? '' : 's'} etiquetado
                {districtQuestions.length} pregunta
                {districtQuestions.length === 1 ? '' : 's'} abierta
                {districtQuestions.length === 1 ? '' : 's'}.
              </Text>
              <Text style={[a.text_sm, t.atoms.text_contrast_medium, a.mt_sm]}>
                El mapa sigue siendo estatal, pero la navegación y la actividad
                ya usan la clave estable del distrito para que la futura capa de
                geometría no rompa esta pantalla.
              </Text>
            </View>

            {siblingDistricts.length > 0 && (
              <View
                style={[
                  a.mt_lg,
                  a.p_lg,
                  a.rounded_xl,
                  t.atoms.bg_contrast_25,
                  a.border,
                  t.atoms.border_contrast_low,
                ]}>
                <Text
                  style={[
                    a.text_xs,
                    a.font_bold,
                    {letterSpacing: 1.5},
                    t.atoms.text_contrast_medium,
                    a.mb_md,
                  ]}>
                  OTROS DISTRITOS EN {district.stateName.toUpperCase()}
                </Text>
                {siblingDistricts.slice(0, 6).map(sibling => {
                  const siblingColors = getPartyColors(sibling.dominantParty)
                  return (
                    <TouchableOpacity
                      key={sibling.id}
                      accessibilityRole="button"
                      onPress={() =>
                        navigation.push('DistrictProfile', {
                          districtId: sibling.id,
                        })
                      }
                      style={[
                        a.flex_row,
                        a.justify_between,
                        a.align_center,
                        a.py_sm,
                        a.border_b,
                        t.atoms.border_contrast_low,
                      ]}>
                      <View>
                        <Text style={[a.text_sm, a.font_bold, t.atoms.text]}>
                          Distrito {sibling.districtNumber}
                        </Text>
                        <Text
                          style={[
                            a.text_xs,
                            t.atoms.text_contrast_medium,
                            a.mt_2xs,
                          ]}>
                          {sibling.currentDeputy}
                        </Text>
                      </View>
                      <View style={[a.flex_row, a.align_center, a.gap_sm]}>
                        <View
                          style={[
                            a.px_sm,
                            a.py_xs,
                            a.rounded_full,
                            {backgroundColor: siblingColors.bg},
                          ]}>
                          <Text
                            style={[
                              a.text_xs,
                              a.font_bold,
                              {color: siblingColors.fg},
                            ]}>
                            {sibling.dominantParty}
                          </Text>
                        </View>
                        <Text style={[a.text_xs, t.atoms.text_contrast_medium]}>
                          {sibling.turnout}%
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )
                })}
              </View>
            )}
          </View>
        ) : (
          <View style={[a.mx_lg, a.mt_lg, a.gap_lg]}>
            <ActivitySection
              title="Cabildeos vinculados"
              emptyLabel="No hay cabildeos etiquetados directamente a este distrito."
              primaryItems={districtCabildeos}
              fallbackItems={stateCabildeos}
              fallbackLabel={`Contexto estatal de ${district.stateName}`}
              actionLabel="Ver Cabildeos"
              onAction={() => navigation.navigate('CabildeoList')}
              renderItem={item => <CabildeoPreviewCard item={item} />}
            />

            <ActivitySection
              title="Preguntas abiertas"
              emptyLabel="Aún no hay preguntas abiertas etiquetadas a este distrito."
              primaryItems={districtQuestions}
              fallbackItems={stateQuestions}
              fallbackLabel={`Preguntas abiertas en ${district.stateName}`}
              actionLabel="Ver RAQ"
              onAction={() => navigation.navigate('OpenQuestionsList')}
              renderItem={item => <RaqPreviewCard item={item} />}
            />
          </View>
        )}
      </ScrollView>
    </Layout.Screen>
  )
}

function StatCard({label, value}: {label: string; value: string}) {
  const t = useTheme()
  return (
    <View
      style={[
        a.flex_1,
        a.p_md,
        t.atoms.bg_contrast_25,
        a.rounded_lg,
        a.align_center,
        a.border,
        t.atoms.border_contrast_low,
      ]}>
      <Text style={[a.text_xl, a.font_bold, t.atoms.text, a.mb_2xs]}>
        {value}
      </Text>
      <Text
        style={[
          a.text_2xs,
          a.font_bold,
          {letterSpacing: 1},
          t.atoms.text_contrast_medium,
        ]}
        numberOfLines={1}>
        {label}
      </Text>
    </View>
  )
}

function TabButton({
  label,
  active,
  onPress,
}: {
  label: string
  active: boolean
  onPress: () => void
}) {
  const t = useTheme()
  return (
    <TouchableOpacity
      accessibilityRole="button"
      onPress={onPress}
      style={[
        a.flex_1,
        a.py_sm,
        a.rounded_md,
        a.align_center,
        active && t.atoms.bg,
        active && a.shadow_sm,
      ]}>
      <Text
        style={[
          a.text_sm,
          a.font_bold,
          active ? t.atoms.text : t.atoms.text_contrast_medium,
        ]}>
        {label}
      </Text>
    </TouchableOpacity>
  )
}

function ActionChip({label, onPress}: {label: string; onPress: () => void}) {
  const t = useTheme()
  return (
    <TouchableOpacity
      accessibilityRole="button"
      onPress={onPress}
      style={[
        a.px_sm,
        a.py_xs,
        a.rounded_full,
        a.border,
        t.atoms.border_contrast_low,
      ]}>
      <Text style={[a.text_xs, a.font_bold, t.atoms.text]}>{label}</Text>
    </TouchableOpacity>
  )
}

function ActivitySection<T>({
  title,
  emptyLabel,
  primaryItems,
  fallbackItems,
  fallbackLabel,
  actionLabel,
  onAction,
  renderItem,
}: {
  title: string
  emptyLabel: string
  primaryItems: T[]
  fallbackItems: T[]
  fallbackLabel: string
  actionLabel: string
  onAction: () => void
  renderItem: (item: T) => ReactNode
}) {
  const t = useTheme()
  const items = primaryItems.length > 0 ? primaryItems : fallbackItems
  const usingFallback = primaryItems.length === 0 && fallbackItems.length > 0

  return (
    <View
      style={[
        a.p_lg,
        a.rounded_xl,
        t.atoms.bg_contrast_25,
        a.border,
        t.atoms.border_contrast_low,
      ]}>
      <View style={[a.flex_row, a.justify_between, a.align_center, a.mb_md]}>
        <View style={[a.flex_1, a.pr_md]}>
          <Text
            style={[
              a.text_xs,
              a.font_bold,
              {letterSpacing: 1.5},
              t.atoms.text_contrast_medium,
            ]}>
            {title.toUpperCase()}
          </Text>
          {usingFallback && (
            <Text style={[a.text_sm, t.atoms.text_contrast_medium, a.mt_xs]}>
              {fallbackLabel}
            </Text>
          )}
        </View>
        <ActionChip label={actionLabel} onPress={onAction} />
      </View>

      {items.length > 0 ? (
        <View style={[a.gap_md]}>{items.slice(0, 3).map(renderItem)}</View>
      ) : (
        <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
          {emptyLabel}
        </Text>
      )}
    </View>
  )
}

function CabildeoPreviewCard({
  item,
}: {
  item: DistrictScopedCabildeoRecord
}) {
  const t = useTheme()
  return (
    <View
      style={[
        a.p_md,
        a.rounded_lg,
        t.atoms.bg,
        a.border,
        t.atoms.border_contrast_low,
      ]}>
      <View style={[a.flex_row, a.justify_between, a.align_center, a.mb_xs]}>
        <Text style={[a.text_sm, a.font_bold, t.atoms.text, a.flex_1]}>
          {item.title}
        </Text>
        <View
          style={[
            a.px_sm,
            a.py_xs,
            a.rounded_full,
            t.atoms.bg_contrast_100,
          ]}>
          <Text style={[a.text_2xs, a.font_bold, t.atoms.text]}>
            {item.phase}
          </Text>
        </View>
      </View>
      <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
        {item.description}
      </Text>
    </View>
  )
}

function RaqPreviewCard({item}: {item: DistrictRaqRecord}) {
  const t = useTheme()
  return (
    <View
      style={[
        a.p_md,
        a.rounded_lg,
        t.atoms.bg,
        a.border,
        t.atoms.border_contrast_low,
      ]}>
      <View style={[a.flex_row, a.justify_between, a.align_center, a.mb_xs]}>
        <Text style={[a.text_sm, a.font_bold, t.atoms.text, a.flex_1]}>
          {item.title}
        </Text>
        <View
          style={[
            a.px_sm,
            a.py_xs,
            a.rounded_full,
            t.atoms.bg_contrast_100,
          ]}>
          <Text style={[a.text_2xs, a.font_bold, t.atoms.text]}>
            {item.status}
          </Text>
        </View>
      </View>
      <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
        {item.summary}
      </Text>
    </View>
  )
}
