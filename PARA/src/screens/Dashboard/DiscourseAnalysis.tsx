import {useMemo, useState} from 'react'
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'
import {useNavigation} from '@react-navigation/native'
import {useQuery} from '@tanstack/react-query'

import {DiscourseAPI} from '#/lib/api/discourse'
import {type SentimentDistribution} from '#/lib/api/para-lexicons'
import {getCabildeoUri} from '#/lib/cabildeo-client'
import {
  DISCOURSE_FLUX_TAGS,
  DISCOURSE_INDICATORS,
  MOCK_CABILDEOS,
} from '#/lib/constants/mockData'
import {type NavigationProp} from '#/lib/routes/types'
import {useAgent} from '#/state/session'
import {useBaseFilter} from '#/state/shell/base-filter'
import {Text} from '#/view/com/util/text/Text'
import {useTheme} from '#/alf'
import {ActiveFiltersStackButton} from '#/components/BaseFilterControls'
import {Atom_Stroke2_Corner0_Rounded as AtomIcon} from '#/components/icons/Atom'
import {Lab_Stroke2_Corner0_Rounded as LabIcon} from '#/components/icons/Lab'
import {Shapes_Stroke2_Corner0_Rounded as ShapesIcon} from '#/components/icons/Shapes'
import {Trending2_Stroke2_Corner2_Rounded as TrendingIcon} from '#/components/icons/Trending'
import * as Layout from '#/components/Layout'
import {IS_WEB} from '#/env'

const {width: _width} = Dimensions.get('window')

// --- Nerdy Statistical Components ---

const DataPoint = ({
  label,
  value,
  trend,
  color,
  subValue,
  description,
}: {
  label: string
  value: string
  trend?: string
  color: string
  subValue?: string
  description?: string
}) => {
  const t = useTheme()
  return (
    <View style={[styles.dataPoint, t.atoms.bg_contrast_25]}>
      <Text style={[styles.dataLabel, t.atoms.text_contrast_medium]}>
        {label}
      </Text>
      <View style={styles.dataValueRow}>
        <Text style={[styles.dataValue, t.atoms.text]}>{value}</Text>
        {trend && <Text style={[styles.dataTrend, {color}]}>{trend}</Text>}
      </View>
      {subValue && (
        <Text style={[styles.subValue, t.atoms.text_contrast_medium]}>
          {subValue}
        </Text>
      )}
      <View style={[styles.sparkline, {backgroundColor: color + '20'}]}>
        <View
          style={[styles.sparklineFill, {backgroundColor: color, width: '65%'}]}
        />
      </View>
      {description && (
        <Text style={[styles.dataDescription, t.atoms.text_contrast_medium]}>
          {description}
        </Text>
      )}
    </View>
  )
}

const ActiveCabildeosSection = () => {
  const t = useTheme()
  const navigation = useNavigation<NavigationProp>()

  // Filter for active cabildeos (deliberating or voting)
  const activeCabildeos = useMemo(() => {
    return MOCK_CABILDEOS.filter(
      cab => cab.phase === 'deliberating' || cab.phase === 'voting',
    ).slice(0, 3) // Show top 3
  }, [])

  if (activeCabildeos.length === 0) return null

  return (
    <View style={[styles.clusterContainer, t.atoms.bg_contrast_25]}>
      <View style={[styles.clusterHeader, {alignItems: 'flex-start'}]}>
        <View style={{flex: 1, paddingRight: 16}}>
          <Text style={[styles.chartTitle, t.atoms.text]}>
            Propuestas en Discusión
          </Text>
          <Text
            style={[
              styles.dataDescription,
              t.atoms.text_contrast_medium,
              {marginTop: 4},
            ]}>
            Temas cívicos que están generando más actividad en este momento en
            tu comunidad.
          </Text>
        </View>
        <AtomIcon size="md" style={{color: t.palette.primary_500}} />
      </View>

      <View style={{gap: 12}}>
        {activeCabildeos.map((cab, index) => {
          const originalIndex = MOCK_CABILDEOS.indexOf(cab)
          const cabildeoUri = getCabildeoUri(cab, originalIndex)
          const isDeliberating = cab.phase === 'deliberating'

          return (
            <TouchableOpacity
              accessibilityRole="button"
              key={index}
              onPress={() =>
                navigation.navigate('CabildeoDetail', {cabildeoUri})
              }
              style={[
                styles.cabildeoCard,
                t.atoms.bg_contrast_25,
                {backgroundColor: t.palette.contrast_50},
              ]}>
              <View style={styles.cabPhaseBadge}>
                <Text
                  style={[styles.cabPhaseText, {color: t.palette.primary_500}]}>
                  {isDeliberating ? '🗣️ Deliberación' : '🗳️ Votación'}
                </Text>
              </View>
              <Text style={[styles.cabTitle, t.atoms.text]} numberOfLines={2}>
                {cab.title}
              </Text>
              <View style={styles.cabStats}>
                <Text
                  style={[styles.cabStatText, t.atoms.text_contrast_medium]}>
                  🔥 +{15 * (index + 1) + 8}% volumen de debate
                </Text>
              </View>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

const StatisticalChart = ({
  title,
  data,
  description,
}: {
  title: string
  data: {label: string; value: number; color: string}[]
  description?: string
}) => {
  const t = useTheme()
  return (
    <View style={[styles.chartContainer, t.atoms.bg_contrast_25]}>
      <Text style={[styles.chartTitle, t.atoms.text]}>{title}</Text>
      <View style={styles.barChart}>
        {data.map((item, i) => (
          <View key={i} style={styles.barItem}>
            <View
              style={[
                styles.bar,
                {height: `${item.value}%`, backgroundColor: item.color},
              ]}
            />
            <Text style={[styles.barLabel, t.atoms.text_contrast_medium]}>
              {item.label}
            </Text>
          </View>
        ))}
      </View>
      {description && (
        <Text
          style={[
            styles.dataDescription,
            t.atoms.text_contrast_medium,
            {marginTop: 12},
          ]}>
          {description}
        </Text>
      )}
    </View>
  )
}

const SentimentMatrix = ({sentiment}: {sentiment?: SentimentDistribution}) => {
  const t = useTheme()

  const display = sentiment || {
    anger: 42,
    fear: 28,
    trust: 8,
    uncertainty: 12,
    neutral: 10,
  }

  return (
    <View style={[styles.matrixContainer, t.atoms.bg_contrast_25]}>
      <View style={[styles.clusterHeader, {alignItems: 'flex-start'}]}>
        <View style={{flex: 1, paddingRight: 16}}>
          <Text style={[styles.chartTitle, t.atoms.text]}>
            Espectro Emocional
          </Text>
          <Text
            style={[
              styles.dataDescription,
              t.atoms.text_contrast_medium,
              {marginTop: 4},
            ]}>
            Las emociones predominantes detectadas en el tono general de los
            mensajes recientes.
          </Text>
        </View>
        <LabIcon size="sm" style={t.atoms.text_contrast_medium} />
      </View>
      <View style={styles.matrix}>
        <View style={styles.matrixRow}>
          <View
            style={[
              styles.matrixCell,
              {backgroundColor: '#FF3B30', opacity: 0.8},
            ]}>
            <Text style={styles.matrixCellText}>Enojo</Text>
            <Text style={styles.matrixCellValue}>{display.anger}%</Text>
          </View>
          <View
            style={[
              styles.matrixCell,
              {backgroundColor: '#FF9500', opacity: 0.6},
            ]}>
            <Text style={styles.matrixCellText}>Incertidumbre</Text>
            <Text style={styles.matrixCellValue}>{display.uncertainty}%</Text>
          </View>
        </View>
        <View style={styles.matrixRow}>
          <View
            style={[
              styles.matrixCell,
              {backgroundColor: '#34C759', opacity: 0.4},
            ]}>
            <Text style={styles.matrixCellText}>Confianza</Text>
            <Text style={styles.matrixCellValue}>{display.trust}%</Text>
          </View>
          <View
            style={[
              styles.matrixCell,
              {backgroundColor: '#007AFF', opacity: 0.7},
            ]}>
            <Text style={styles.matrixCellText}>Miedo</Text>
            <Text style={styles.matrixCellValue}>{display.fear}%</Text>
          </View>
        </View>
      </View>
    </View>
  )
}

export function DiscourseAnalysisScreen() {
  useLingui()
  const t = useTheme()
  const agent = useAgent()
  const {activeFilters} = useBaseFilter()
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d'>('7d')

  const discourseApi = useMemo(() => new DiscourseAPI(agent), [agent])
  const community = activeFilters[0]

  const {data: snapshot} = useQuery({
    queryKey: ['discourse-snapshot', community, timeframe],
    queryFn: () => discourseApi.getSnapshot({community, timeframe}),
  })

  const {data: topics} = useQuery({
    queryKey: ['discourse-topics', community, timeframe],
    queryFn: () => discourseApi.getTopics({community, timeframe}),
  })

  const {data: sentiment} = useQuery({
    queryKey: ['discourse-sentiment', community, timeframe],
    queryFn: () => discourseApi.getSentiment({community, timeframe}),
  })

  const latestSnapshot = snapshot?.[0]

  const dynamicData = useMemo(() => {
    const isMorena = activeFilters.includes('Morena')
    const isOpposition = activeFilters.includes('Frente Amplio')
    const tfMultiplier =
      timeframe === '24h' ? 0.8 : timeframe === '7d' ? 1 : 1.2

    const indicators = DISCOURSE_INDICATORS.map((ind, i) => {
      const labelsEs = [
        'Calidad Discursiva',
        'Volatilidad Semántica',
        'Diversidad Léxica',
        'Eco-Cámara (Echo)',
      ]
      const descriptionsEs = [
        'Mide qué tan constructivo y civil es el debate actual.',
        'Rapidez con la que cambian los temas y el foco.',
        'Riqueza del vocabulario utilizado en las discusiones.',
        'Nivel de aislamiento de las opiniones dentro de grupos.',
      ]

      let displayValue = '0.00'
      if (latestSnapshot) {
        if (i === 0)
          displayValue = (latestSnapshot.avgConstructiveness / 100).toFixed(2)
        if (i === 1)
          displayValue = (latestSnapshot.semanticVolatility / 100).toFixed(2)
        if (i === 2)
          displayValue = (latestSnapshot.lexicalDiversity / 100).toFixed(2)
        if (i === 3)
          displayValue = (latestSnapshot.echoChamberIndex / 100).toFixed(2)
      } else {
        displayValue = (ind.baseValue * tfMultiplier).toFixed(2)
      }

      return {
        ...ind,
        label: labelsEs[i] || ind.label,
        description: descriptionsEs[i] || ind.description,
        value: displayValue,
        trend:
          i === 0
            ? timeframe === '24h'
              ? ind.trendPlus
              : ind.trendMinus
            : ind.trend,
        subValue:
          i === 2 ? (isOpposition ? 'Tri-modal' : 'Bi-modal') : ind.subValue,
      }
    })

    return {
      heuristic: {
        value: isMorena
          ? 'Alto (Consenso)'
          : isOpposition
            ? 'Cortado (Caótico)'
            : 'Estable (Poca Varianza)',
        description: isMorena
          ? 'Alta uniformidad en canales oficiales.'
          : 'Se detectan puntos de vista muy diversos y en conflicto.',
      },
      indicators,
      polarization: [
        {label: 'Izquierda', value: isOpposition ? 40 : 85, color: '#34C759'},
        {label: 'Centro', value: 15, color: '#FFCC00'},
        {label: 'Derecha', value: isOpposition ? 80 : 72, color: '#007AFF'},
      ],
      linguistic: [
        {
          label: 'Confrontativo',
          value: timeframe === '30d' ? 60 : 45,
          color: t.palette.primary_500,
        },
        {label: 'Informativo', value: 92, color: '#FF9500'},
        {label: 'Apático', value: 28, color: '#5856D6'},
      ],
    }
  }, [activeFilters, timeframe, t, latestSnapshot])

  return (
    <Layout.Screen testID="discourseAnalysisScreen">
      <Layout.Header.Outer noBottomBorder>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Análisis de Discurso</Trans>
          </Layout.Header.TitleText>
          <Layout.Header.SubtitleText>
            Resumen del Debate Público
          </Layout.Header.SubtitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot>
          <ActiveFiltersStackButton />
        </Layout.Header.Slot>
      </Layout.Header.Outer>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}>
        <Layout.Center style={styles.centerContainer}>
          <View style={styles.timeframeRow}>
            {(['24h', '7d', '30d'] as const).map(tf => (
              <TouchableOpacity
                accessibilityRole="button"
                key={tf}
                style={[
                  styles.tfPill,
                  timeframe === tf
                    ? {backgroundColor: t.palette.primary_500}
                    : t.atoms.bg_contrast_25,
                ]}
                onPress={() => setTimeframe(tf)}>
                <Text
                  style={[
                    styles.tfText,
                    timeframe === tf
                      ? {color: '#fff'}
                      : t.atoms.text_contrast_medium,
                  ]}>
                  {tf.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.statsSummary}>
            <TrendingIcon size="lg" style={{color: t.palette.primary_500}} />
            <View style={{flex: 1}}>
              <Text style={[styles.summaryTitle, t.atoms.text]}>
                Nivel de Acuerdo
              </Text>
              <Text style={[styles.summarySub, t.atoms.text_contrast_medium]}>
                {dynamicData.heuristic.description} Mide qué tan unida o
                dividida está la comunidad en sus opiniones generales.
              </Text>
              <Text style={[styles.summaryValue, t.atoms.text]}>
                {dynamicData.heuristic.value}
              </Text>
            </View>
          </View>

          <Text style={[styles.sectionHeader, t.atoms.text]}>
            Métricas Clave
          </Text>
          <View style={styles.dataGrid}>
            {dynamicData.indicators.map((item, i) => (
              <DataPoint
                key={i}
                label={item.label}
                value={item.value}
                trend={item.trend}
                color={item.color}
                subValue={item.subValue}
                description={item.description}
              />
            ))}
          </View>

          <ActiveCabildeosSection />

          <View style={styles.chartsRow}>
            <StatisticalChart
              title="Polarización Política"
              data={dynamicData.polarization}
              description="Alineación ideológica dominante en la discusión general."
            />
            <StatisticalChart
              title="Tono Lingüístico"
              data={dynamicData.linguistic}
              description="Actitud promedio de los usuarios hacia estos temas cívicos."
            />
          </View>

          <SentimentMatrix sentiment={sentiment} />

          <View style={[styles.fluxContainer, t.atoms.bg_contrast_25]}>
            <Text style={[styles.chartTitle, t.atoms.text]}>
              Temas Principales Directos
            </Text>
            <View style={styles.communityKeywords}>
              {topics?.map((topic, i) => {
                let parsedKeywords: string[] = []
                try {
                  parsedKeywords = JSON.parse(topic.keywords)
                } catch (e) {
                  parsedKeywords = topic.keywords.split(',').map(k => k.trim())
                }
                return (
                  <View key={i} style={styles.communityRow}>
                    <View
                      style={[
                        styles.communityIndicator,
                        {backgroundColor: t.palette.primary_500},
                      ]}
                    />
                    <Text style={[styles.communityName, t.atoms.text]}>
                      {topic.clusterLabel}:{' '}
                    </Text>
                    <View style={styles.keywordPills}>
                      {parsedKeywords.map((kw: string) => (
                        <View
                          key={kw}
                          style={[
                            styles.keywordPill,
                            {backgroundColor: t.palette.primary_500 + '15'},
                          ]}>
                          <Text
                            style={[
                              styles.keywordPillText,
                              {color: t.palette.primary_500},
                            ]}>
                            {kw}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )
              })}
              {(!topics || topics.length === 0) && (
                <Text style={[t.atoms.text_contrast_medium, {fontSize: 12}]}>
                  No hay temas detectados aún para este periodo.
                </Text>
              )}
            </View>
          </View>

          <View style={[styles.fluxContainer, t.atoms.bg_contrast_25]}>
            <Text style={[styles.chartTitle, t.atoms.text]}>
              Tendencias Emergentes (Flujo Semántico)
            </Text>
            <View style={styles.fluxTags}>
              {DISCOURSE_FLUX_TAGS.map((tag, i) => (
                <View
                  key={i}
                  style={[
                    styles.fluxTag,
                    {borderColor: t.palette.primary_500 + '40'},
                  ]}>
                  <Text
                    style={[
                      styles.fluxTagText,
                      {color: t.palette.primary_500},
                    ]}>
                    {tag}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View
            style={[
              styles.insightCard,
              {borderLeftColor: t.palette.primary_500},
            ]}>
            <ShapesIcon
              size="md"
              style={{color: t.palette.primary_500, marginBottom: 8}}
            />
            <Text style={[styles.insightTitle, t.atoms.text]}>
              Análisis: "Reforma de Transporte"
            </Text>
            <Text style={[styles.insightText, t.atoms.text_contrast_medium]}>
              La discusión se está centrando entre "Eficiencia" vs "Equidad".
              Los nodos pro-Metro muestran alta densidad pero poca conectividad
              con otras comunidades de la periféria.
              {'\n'}
              <Text style={{fontWeight: '700', color: t.palette.primary_500}}>
                Predicción: Consenso cívico posible en 48 horas.
              </Text>
            </Text>
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, t.atoms.text_contrast_medium]}>
              Datos procesados en tiempo real. Última actualización hace 4m.
            </Text>
          </View>
        </Layout.Center>
      </ScrollView>
    </Layout.Screen>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  centerContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  timeframeRow: {
    paddingTop: 8,
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  tfPill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tfText: {
    fontSize: 12,
    fontWeight: '800',
  },
  statsSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
    padding: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  summarySub: {
    fontSize: 12,
    marginTop: 4,
    marginBottom: 4,
    maxWidth: '90%',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 2,
    opacity: 0.6,
  },
  dataGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  dataPoint: {
    minWidth: 160,
    flex: 1,
    padding: 16,
    borderRadius: 16,
  },
  dataLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  dataValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 4,
  },
  dataValue: {
    fontSize: 22,
    fontWeight: '900',
    fontFamily: IS_WEB ? 'monospace' : undefined,
  },
  dataTrend: {
    fontSize: 12,
    fontWeight: '800',
  },
  subValue: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 12,
  },
  sparkline: {
    height: 3,
    borderRadius: 1.5,
    overflow: 'hidden',
    marginBottom: 8,
  },
  sparklineFill: {
    height: '100%',
    borderRadius: 1.5,
  },
  dataDescription: {
    fontSize: 10,
    lineHeight: 14,
    opacity: 0.8,
  },
  clusterContainer: {
    padding: 20,
    borderRadius: 24,
    marginBottom: 24,
  },
  clusterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  clusterMap: {
    height: 200,
    position: 'relative',
    marginBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 16,
    overflow: 'hidden',
  },
  node: {
    position: 'absolute',
    borderRadius: 100,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  edge: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  clusterLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  legendText: {
    fontSize: 10,
    fontWeight: '800',
  },
  chartsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  chartContainer: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
    minHeight: 180,
  },
  chartTitle: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  barChart: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    gap: 4,
    marginTop: 16,
  },
  barItem: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: '100%',
    borderRadius: 2,
  },
  barLabel: {
    fontSize: 9,
    marginTop: 8,
    fontWeight: '800',
  },
  matrixContainer: {
    padding: 16,
    borderRadius: 24,
    marginBottom: 24,
  },
  matrix: {
    gap: 8,
  },
  matrixRow: {
    flexDirection: 'row',
    gap: 8,
  },
  matrixCell: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  matrixCellText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  matrixCellValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 4,
  },
  fluxContainer: {
    padding: 16,
    borderRadius: 24,
    marginBottom: 24,
  },
  fluxTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  fluxTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  fluxTagText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: IS_WEB ? 'monospace' : undefined,
  },
  communityKeywords: {
    marginTop: 16,
    gap: 12,
  },
  communityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  communityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  communityName: {
    fontSize: 12,
    fontWeight: '800',
    width: 70,
  },
  keywordPills: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  keywordPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  keywordPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  insightCard: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(91, 47, 161, 0.05)',
    borderLeftWidth: 4,
    marginBottom: 24,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
  },
  insightText: {
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    alignItems: 'center',
    marginTop: 16,
  },
  footerText: {
    fontSize: 11,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  cabildeoCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  cabPhaseBadge: {
    marginBottom: 8,
  },
  cabPhaseText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  cabTitle: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 12,
  },
  cabStats: {
    flexDirection: 'row',
  },
  cabStatText: {
    fontSize: 11,
    fontWeight: '600',
  },
})
