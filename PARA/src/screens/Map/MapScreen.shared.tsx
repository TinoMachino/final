import {
  type ComponentType,
  type ReactNode,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'

import {
  buildSearchIndex,
  computeCentroid,
  filterSearchIndex,
} from '#/lib/constants/mapHelpers'
import {normalizeMexicoStateName} from '#/lib/constants/mexico'
import {getCitiesWithCoordinatesForState} from '#/lib/constants/mexicoCityCoordinates'
import {type CityData, MEXICO_CITY_DATA} from '#/lib/constants/mexicoCityData'
import * as MexicoGeoJSON from '#/lib/constants/mexicoGeoJSON.json'
import {type CommonNavigatorParams} from '#/lib/routes/types'
import {POST_FLAIRS, type PostFlair} from '#/lib/tags'
import {atoms as a, useBreakpoints, useTheme, web} from '#/alf'
import {FlairSelectionList} from '#/components/FlairSelectionList'
import {Filter_Stroke2_Corner0_Rounded as FilterIcon} from '#/components/icons/Filter'
import {Header, Screen} from '#/components/Layout'
import {Text} from '#/components/Typography'
import {
  BigCitiesDataOverlay,
  DistrictsDataOverlay,
  type MapLayer,
  MapLayersPanel,
  MapSearchControls,
  SelectedStateOverlay,
} from './MapComponents'

export type Props = NativeStackScreenProps<CommonNavigatorParams, 'Map'>

export const INITIAL_REGION = {
  latitude: 23.6345,
  longitude: -102.5528,
  latitudeDelta: 25,
  longitudeDelta: 25,
}

type Coordinate = {
  latitude: number
  longitude: number
}

export type MapViewProps = {
  style?: unknown
  initialRegion?: MapRegion
  provider?: string | null
  onRegionChangeComplete?: (region: MapRegion) => void
  onPress?: () => void
  children?: ReactNode
}

export type MarkerProps = {
  coordinate: Coordinate
  title?: string
  description?: string
  anchor?: {x: number; y: number}
  tappable?: boolean
  tracksViewChanges?: boolean
  zIndex?: number
  onPress?: () => void
  children?: ReactNode
}

export type MarkerClustererProps = {
  region: MapRegion
  children?: ReactNode
}

export type PolygonProps = {
  coordinates: Coordinate[]
  fillColor?: string
  strokeColor?: string
  strokeWidth?: number
  tappable?: boolean
  zIndex?: number
  onPress?: () => void
}

export type MapViewRef = {
  fitToCoordinates?: (
    coordinates: Coordinate[],
    options?: {edgePadding?: unknown; animated?: boolean},
  ) => void
  animateToRegion?: (region: MapRegion, duration?: number) => void
  animateCamera?: (camera: {
    center?: Coordinate
    zoom?: number
    altitude?: number
  }) => void
  getCamera?: () => Promise<{zoom?: number; altitude?: number}>
}

type GeoFeature = {
  geometry?: {
    type?: string
    coordinates?: unknown[]
  }
  properties: {
    state_name?: string
    name?: string
  }
}

type MapScreenImplProps = Props & {
  MapViewComponent?: ComponentType<MapViewProps>
  PolygonComponent?: ComponentType<PolygonProps>
  MarkerComponent?: ComponentType<MarkerProps>
  MarkerClustererComponent?: ComponentType<MarkerClustererProps>
  unavailableMessage?: string
}

type MapRegion = typeof INITIAL_REGION

type PreparedStateFeature = {
  name: string
  normalizedName: string
  centroid: Coordinate
  coordinates: Coordinate[]
  polygons: Array<{
    key: string
    coordinates: Coordinate[]
  }>
}

type CityMarkerDatum = CityData & {
  stateName: string
  coordinate: Coordinate
}

function featureName(feature: GeoFeature) {
  return feature.properties.state_name || feature.properties.name || 'Unknown'
}

function getFeatureCoordinates(feature: GeoFeature): Coordinate[][] {
  const geometry = feature.geometry
  if (!geometry?.coordinates) return []

  if (geometry.type === 'Polygon') {
    return [
      geometry.coordinates[0].map((c: number[]) => ({
        longitude: c[0],
        latitude: c[1],
      })),
    ]
  }

  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.map((polygonCoords: number[][][]) =>
      polygonCoords[0].map((c: number[]) => ({
        longitude: c[0],
        latitude: c[1],
      })),
    )
  }

  return []
}

function getCitiesForState(stateName: string) {
  const match = Object.entries(MEXICO_CITY_DATA).find(
    ([candidate]) =>
      normalizeMexicoStateName(candidate) ===
      normalizeMexicoStateName(stateName),
  )
  return match?.[1] || []
}

function getPartyColor(party: string) {
  switch (party) {
    case 'Morena':
      return '#8B1538'
    case 'PAN':
      return '#003087'
    case 'PRI':
      return '#00923F'
    case 'MC':
      return '#FF6B00'
    case 'PVEM':
      return '#228B22'
    case 'PT':
      return '#FF0000'
    case 'PRD':
      return '#FFD700'
    default:
      return '#5B6B84'
  }
}

function getLayerFillColor({
  activeLayer,
  isSelected,
  selectedDiscourseItem,
  stateName,
  theme,
}: {
  activeLayer: MapLayer
  isSelected: boolean
  selectedDiscourseItem: string
  stateName: string
  theme: ReturnType<typeof useTheme>
}) {
  if (selectedDiscourseItem && selectedDiscourseItem !== 'Any') {
    const seed = `${stateName}:${selectedDiscourseItem}:${activeLayer}`
    let hash = 0

    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash)
    }

    const intensity = Math.abs(hash) % 140
    const alpha = (95 + intensity).toString(16).padStart(2, '0')
    return `#FF5A36${alpha}`
  }

  if (isSelected) {
    return `${theme.palette.primary_500}7A`
  }

  if (activeLayer === 'districts') {
    return `${theme.palette.primary_500}24`
  }

  if (activeLayer === 'cities') {
    return `${theme.palette.primary_500}20`
  }

  return `${theme.palette.primary_500}3A`
}

function MapUnavailable({message}: {message: string}) {
  const t = useTheme()

  return (
    <View
      style={[
        a.flex_1,
        a.align_center,
        a.justify_center,
        a.px_xl,
        t.atoms.bg_contrast_25,
      ]}>
      <View
        style={[
          a.w_full,
          a.p_lg,
          a.rounded_xl,
          a.border,
          t.atoms.border_contrast_low,
          t.atoms.bg,
          {maxWidth: 520},
        ]}>
        <Text style={[a.text_xs, a.font_bold, t.atoms.text_contrast_medium]}>
          MAP UNAVAILABLE
        </Text>
        <Text style={[a.text_2xl, a.font_bold, t.atoms.text, a.mt_sm]}>
          <Trans>The native map binary is not available in this build.</Trans>
        </Text>
        <Text style={[a.text_sm, t.atoms.text_contrast_medium, a.mt_md]}>
          {message}
        </Text>
      </View>
    </View>
  )
}

export function MapScreenImpl({
  MapViewComponent,
  PolygonComponent,
  MarkerComponent,
  MarkerClustererComponent,
  unavailableMessage,
}: MapScreenImplProps) {
  const {_: translate} = useLingui()
  const t = useTheme()
  const {gtMobile} = useBreakpoints()
  const insets = useSafeAreaInsets()
  const mapRef = useRef<MapViewRef | null>(null)

  const [selectedState, setSelectedState] = useState<{name: string} | null>(
    null,
  )
  const [showCities, setShowCities] = useState(false)
  const [showDistricts, setShowDistricts] = useState(false)
  const [selectedDistrictId, setSelectedDistrictId] = useState<number | null>(
    null,
  )
  const [selectedCityName, setSelectedCityName] = useState<string | null>(null)
  const [searchExpanded, setSearchExpanded] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeLayer, setActiveLayer] = useState<MapLayer>('states')
  const [showDiscourseModal, setShowDiscourseModal] = useState(false)
  const [discourseType, setDiscourseType] = useState<'Matter' | 'Policy'>(
    'Matter',
  )
  const [selectedDiscourseItem, setSelectedDiscourseItem] = useState('')
  const [mapRegion, setMapRegion] = useState<MapRegion>(INITIAL_REGION)

  const geoFeatures = useMemo(
    () => ((MexicoGeoJSON as {features: GeoFeature[]}).features || []) as GeoFeature[],
    [],
  )

  const preparedStateFeatures = useMemo<PreparedStateFeature[]>(
    () =>
      geoFeatures.map((feature, index) => {
        const name = featureName(feature)
        const polygons = getFeatureCoordinates(feature).map(
          (coordinates, polygonIndex) => ({
            key: `${name}-${index}-${polygonIndex}`,
            coordinates,
          }),
        )

        return {
          name,
          normalizedName: normalizeMexicoStateName(name),
          centroid: computeCentroid(feature),
          coordinates: polygons.flatMap(polygon => polygon.coordinates),
          polygons,
        }
      }),
    [geoFeatures],
  )

  const searchIndex = useMemo(
    () => buildSearchIndex(geoFeatures),
    [geoFeatures],
  )
  const searchResults = useMemo(
    () => filterSearchIndex(searchIndex, searchQuery, 10),
    [searchIndex, searchQuery],
  )

  const stateFeaturesByName = useMemo(() => {
    const map = new Map<string, PreparedStateFeature>()

    for (const feature of preparedStateFeatures) {
      map.set(feature.normalizedName, feature)
    }

    return map
  }, [preparedStateFeatures])

  const selectedStateCities = useMemo<CityMarkerDatum[]>(() => {
    if (!selectedState) return []

    return getCitiesWithCoordinatesForState(
      selectedState.name,
      getCitiesForState(selectedState.name),
    ).map(city => ({
      ...city,
      stateName: selectedState.name,
    }))
  }, [selectedState])

  const focusCity = useCallback(
    (stateName: string, cityName: string) => {
      const cities = getCitiesWithCoordinatesForState(
        stateName,
        getCitiesForState(stateName),
      )
      const city = cities.find(item => item.name === cityName)
      const preparedState = stateFeaturesByName.get(
        normalizeMexicoStateName(stateName),
      )

      setSelectedState({name: preparedState?.name || stateName})
      setActiveLayer('cities')
      setShowCities(true)
      setShowDistricts(false)
      setSelectedDistrictId(null)
      setSelectedCityName(cityName)

      if (!city) {
        if (preparedState?.coordinates.length) {
          mapRef.current?.fitToCoordinates?.(preparedState.coordinates, {
            edgePadding: {top: 48, right: 48, bottom: 48, left: 48},
            animated: true,
          })
        }
        return
      }

      const region = {
        latitude: city.coordinate.latitude,
        longitude: city.coordinate.longitude,
        latitudeDelta: 1.2,
        longitudeDelta: 1.2,
      }

      mapRef.current?.animateToRegion?.(region, 500)
      mapRef.current?.animateCamera?.({
        center: city.coordinate,
        zoom: 9.5,
      })
    },
    [stateFeaturesByName],
  )

  const focusState = useCallback(
    (
      stateName: string,
      options: {
        openLayer?: MapLayer
        districtId?: number | null
      } = {},
    ) => {
      const feature = stateFeaturesByName.get(
        normalizeMexicoStateName(stateName),
      )
      const nextLayer = options.openLayer ?? activeLayer

      setSelectedState({name: feature?.name || stateName})
      setShowCities(nextLayer === 'cities')
      setShowDistricts(nextLayer === 'districts')
      setSelectedDistrictId(
        nextLayer === 'districts' ? (options.districtId ?? null) : null,
      )
      setSelectedCityName(null)

      if (!feature) return

      if (feature.coordinates.length) {
        mapRef.current?.fitToCoordinates?.(feature.coordinates, {
          edgePadding: {top: 48, right: 48, bottom: 48, left: 48},
          animated: true,
        })
      }

      mapRef.current?.animateCamera?.({
        center: feature.centroid,
        zoom: nextLayer === 'cities' ? 8 : 6.5,
      })
    },
    [activeLayer, stateFeaturesByName],
  )

  const handleZoom = useCallback((direction: 'in' | 'out') => {
    if (!mapRef.current?.getCamera) return

    mapRef.current
      .getCamera()
      .then((camera: {zoom?: number; altitude?: number}) => {
        if (typeof camera?.zoom === 'number') {
          mapRef.current?.animateCamera?.({
            zoom: direction === 'in' ? camera.zoom + 1 : camera.zoom - 1,
          })
          return
        }

        if (typeof camera?.altitude === 'number') {
          mapRef.current?.animateCamera?.({
            altitude:
              direction === 'in'
                ? camera.altitude * 0.6
                : camera.altitude * 1.6,
          })
        }
      })
      .catch(() => {})
  }, [])

  const handleRecenter = useCallback(() => {
    mapRef.current?.animateToRegion?.(INITIAL_REGION, 800)
    setActiveLayer('states')
    setSelectedState(null)
    setShowCities(false)
    setShowDistricts(false)
    setSelectedDistrictId(null)
    setSelectedCityName(null)
    setSearchQuery('')
    setSearchExpanded(false)
    setMapRegion(INITIAL_REGION)
  }, [])

  const renderedPolygons = useMemo(() => {
    if (!PolygonComponent) return null

    return preparedStateFeatures.flatMap(feature => {
      const isSelected = selectedState?.name === feature.name
      const fillColor = getLayerFillColor({
        activeLayer,
        isSelected,
        selectedDiscourseItem,
        stateName: feature.name,
        theme: t,
      })
      const strokeColor = isSelected
        ? t.palette.primary_500
        : `${t.palette.primary_500}CC`
      const strokeWidth = isSelected
        ? 1.6
        : activeLayer === 'states'
          ? 0.8
          : 0.6

      return feature.polygons.map(polygon => (
        <PolygonComponent
          key={polygon.key}
          coordinates={polygon.coordinates}
          fillColor={fillColor}
          strokeColor={strokeColor}
          strokeWidth={strokeWidth}
          tappable
          zIndex={isSelected ? 12 : 1}
          onPress={() => focusState(feature.name, {openLayer: activeLayer})}
        />
      ))
    })
  }, [
    PolygonComponent,
    activeLayer,
    focusState,
    preparedStateFeatures,
    selectedDiscourseItem,
    selectedState?.name,
    t,
  ])

  const rawCityMarkers = useMemo(() => {
    if (!MarkerComponent || !showCities || !selectedState) return []

    return selectedStateCities.map(city => {
      const partyColor = getPartyColor(city.dominantParty)
      const isSelected = selectedCityName === city.name

      return (
        <MarkerComponent
          key={`${city.stateName}:${city.name}`}
          coordinate={city.coordinate}
          title={city.name}
          description={`${city.population} · ${city.dominantParty}`}
          anchor={{x: 0.5, y: 0.5}}
          tappable
          tracksViewChanges={false}
          zIndex={isSelected ? 20 : 14}
          onPress={() => {
            setSelectedCityName(city.name)
            focusCity(city.stateName, city.name)
          }}>
          <View style={styles.cityMarkerWrap}>
            <View
              style={[
                styles.cityMarkerDot,
                {
                  backgroundColor: partyColor,
                  transform: [{scale: isSelected ? 1.18 : 1}],
                },
              ]}
            />
            <View
              style={[
                styles.cityMarkerLabel,
                t.atoms.bg,
                a.border,
                t.atoms.border_contrast_low,
              ]}>
              <Text style={[a.text_2xs, a.font_bold, t.atoms.text]}>
                {city.name}
              </Text>
            </View>
          </View>
        </MarkerComponent>
      )
    })
  }, [
    MarkerComponent,
    focusCity,
    selectedCityName,
    selectedState,
    selectedStateCities,
    showCities,
    t,
  ])

  const renderedCityMarkers = useMemo(() => {
    if (rawCityMarkers.length === 0) return null

    if (MarkerClustererComponent && rawCityMarkers.length > 8) {
      return (
        <MarkerClustererComponent region={mapRegion}>
          {rawCityMarkers}
        </MarkerClustererComponent>
      )
    }

    return rawCityMarkers
  }, [MarkerClustererComponent, mapRegion, rawCityMarkers])

  const webLeftMargin = {
    marginLeft: 'calc(50% - 300px)',
    minHeight: '100%',
  }

  return (
    <Screen hideBorders>
      <Header.Outer noBottomBorder>
        <Header.BackButton />
        <Header.Content>
          <Header.TitleText>{translate(msg`Mexico Map`)}</Header.TitleText>
        </Header.Content>
        <Header.Slot />
      </Header.Outer>

      <View style={[a.flex_1, gtMobile && web(webLeftMargin)]}>
        <View style={[a.flex_1, a.relative]}>
          {MapViewComponent && PolygonComponent ? (
            <MapViewComponent
              ref={mapRef as never}
              style={StyleSheet.absoluteFill}
              initialRegion={INITIAL_REGION}
              provider={web('google')}
              onRegionChangeComplete={(region: MapRegion) => {
                if (
                  region &&
                  Number.isFinite(region.latitude) &&
                  Number.isFinite(region.longitude) &&
                  Number.isFinite(region.latitudeDelta) &&
                  Number.isFinite(region.longitudeDelta)
                ) {
                  setMapRegion(region)
                }
              }}
              onPress={() => {
                setSelectedState(null)
                setShowCities(false)
                setShowDistricts(false)
                setSelectedDistrictId(null)
                setSelectedCityName(null)
              }}>
              {renderedPolygons}
              {renderedCityMarkers}
            </MapViewComponent>
          ) : (
            <MapUnavailable
              message={
                unavailableMessage ||
                'Map support is missing from the current build.'
              }
            />
          )}

          <MapSearchControls
            searchExpanded={searchExpanded}
            setSearchExpanded={setSearchExpanded}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchResults={searchResults}
            onSelect={result => {
              if (result.type === 'district') {
                setActiveLayer('districts')
                focusState(result.stateName, {
                  openLayer: 'districts',
                  districtId: result.districtId || null,
                })
              } else if (result.type === 'city') {
                focusCity(result.stateName, result.name)
              } else {
                focusState(result.stateName, {openLayer: activeLayer})
              }

              setSearchExpanded(false)
              setSearchQuery('')
            }}
          />

          <MapLayersPanel
            activeLayer={activeLayer}
            onSelectLayer={layer => {
              setActiveLayer(layer)
              if (selectedState) {
                setShowDistricts(layer === 'districts')
                setShowCities(layer === 'cities')
              } else {
                setShowDistricts(false)
                setShowCities(false)
              }
              if (layer !== 'districts') {
                setSelectedDistrictId(null)
              }
              if (layer !== 'cities') {
                setSelectedCityName(null)
              }
            }}
          />

          {!gtMobile && MapViewComponent && (
            <View
              style={[
                a.absolute,
                {right: 20, bottom: 60 + insets.bottom},
                a.gap_md,
                {zIndex: 20},
              ]}>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => handleZoom('in')}
                style={styles.floatingButton(t)}>
                <Text style={[a.text_2xl, a.font_bold, t.atoms.text]}>+</Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => handleZoom('out')}
                style={styles.floatingButton(t)}>
                <Text style={[a.text_2xl, a.font_bold, t.atoms.text]}>-</Text>
              </TouchableOpacity>
            </View>
          )}

          <View
            style={[a.absolute, {right: 20, top: 20}, a.gap_sm, {zIndex: 20}]}>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={handleRecenter}
              style={styles.floatingButton(t)}>
              <Text style={[a.text_md, a.font_bold, t.atoms.text]}>⌖</Text>
            </TouchableOpacity>

            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => setShowDiscourseModal(true)}
              style={[
                styles.floatingButton(t),
                selectedDiscourseItem && selectedDiscourseItem !== 'Any'
                  ? {borderColor: '#FF5A36'}
                  : null,
              ]}>
              <FilterIcon
                width={20}
                height={20}
                fill={
                  selectedDiscourseItem && selectedDiscourseItem !== 'Any'
                    ? '#FF5A36'
                    : t.atoms.text.color
                }
              />
            </TouchableOpacity>
          </View>

          {!searchExpanded &&
            selectedDiscourseItem &&
            selectedDiscourseItem !== 'Any' && (
              <View
                style={[
                  a.absolute,
                  {top: 20, right: 76},
                  a.p_md,
                  a.rounded_full,
                  t.atoms.bg_contrast_25,
                  web({backdropFilter: 'blur(12px)'}),
                  a.border,
                  {borderColor: '#FF5A36'},
                  a.shadow_sm,
                  a.flex_row,
                  a.align_center,
                  a.gap_sm,
                  {maxWidth: gtMobile ? 240 : 180},
                  {zIndex: 20},
                ]}>
                <Text style={[a.text_sm, a.font_bold, t.atoms.text]}>
                  Heatmap: {selectedDiscourseItem}
                </Text>
                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={() => setSelectedDiscourseItem('')}>
                  <Text
                    style={[
                      a.text_md,
                      a.font_bold,
                      t.atoms.text_contrast_medium,
                    ]}>
                    ✕
                  </Text>
                </TouchableOpacity>
              </View>
            )}

          <SelectedStateOverlay
            selectedState={selectedState}
            visible={
              !!selectedState &&
              activeLayer === 'states' &&
              !showCities &&
              !showDistricts
            }
            insets={insets}
            onClose={() => {
              setSelectedState(null)
              setShowCities(false)
              setShowDistricts(false)
              setSelectedDistrictId(null)
              setSelectedCityName(null)
            }}
            onShowCities={() => {
              setActiveLayer('cities')
              setShowCities(true)
              setShowDistricts(false)
              setSelectedDistrictId(null)
              setSelectedCityName(null)
            }}
            onShowDistricts={() => {
              setActiveLayer('districts')
              setShowDistricts(true)
              setShowCities(false)
              setSelectedDistrictId(null)
              setSelectedCityName(null)
            }}
          />

          <BigCitiesDataOverlay
            selectedState={selectedState}
            showCities={showCities}
            onClose={() => {
              setActiveLayer('states')
              setShowCities(false)
              setSelectedCityName(null)
            }}
          />

          <DistrictsDataOverlay
            selectedState={selectedState}
            showDistricts={showDistricts}
            selectedDistrictId={selectedDistrictId}
            onSelectDistrict={setSelectedDistrictId}
            onClose={() => {
              setActiveLayer('states')
              setShowDistricts(false)
              setSelectedDistrictId(null)
            }}
            onBackToState={() => {
              setActiveLayer('states')
              setShowDistricts(false)
              setSelectedDistrictId(null)
            }}
          />
        </View>
      </View>

      <Modal
        visible={showDiscourseModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDiscourseModal(false)}>
        <View
          style={[
            a.flex_1,
            a.justify_end,
            {backgroundColor: 'rgba(0, 0, 0, 0.4)'},
          ]}>
          <View
            style={[
              a.w_full,
              t.atoms.bg,
              {borderTopLeftRadius: 24, borderTopRightRadius: 24},
              a.p_lg,
              {height: '80%', padding: 0},
            ]}>
            <ScrollView contentContainerStyle={{padding: 16}}>
              <View
                style={[
                  a.rounded_full,
                  t.atoms.bg_contrast_200,
                  {
                    width: 40,
                    height: 4,
                    alignSelf: 'center',
                    marginBottom: 10,
                  },
                ]}
              />

              <View style={[a.mb_md]}>
                <Text
                  style={[
                    a.text_xs,
                    a.font_bold,
                    t.atoms.text_contrast_medium,
                  ]}>
                  DISCUSSION HEAT
                </Text>
                <Text style={[a.text_lg, a.font_bold, t.atoms.text, a.mt_xs]}>
                  <Trans>Choose a discourse lens</Trans>
                </Text>
                <Text
                  style={[a.text_sm, t.atoms.text_contrast_medium, a.mt_xs]}>
                  <Trans>
                    This is a visual layer only. It changes how states are
                    tinted across the map.
                  </Trans>
                </Text>
              </View>

              <View style={[a.flex_row, a.gap_sm, a.mb_md]}>
                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={() => setDiscourseType('Matter')}
                  style={[
                    styles.pillButton(t),
                    discourseType === 'Matter'
                      ? styles.pillButtonActive(t)
                      : null,
                  ]}>
                  <Text
                    style={[
                      a.text_sm,
                      discourseType === 'Matter'
                        ? [a.font_bold, {color: t.palette.primary_500}]
                        : t.atoms.text_contrast_medium,
                    ]}>
                    Matter
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={() => setDiscourseType('Policy')}
                  style={[
                    styles.pillButton(t),
                    discourseType === 'Policy'
                      ? styles.pillButtonActive(t)
                      : null,
                  ]}>
                  <Text
                    style={[
                      a.text_sm,
                      discourseType === 'Policy'
                        ? [a.font_bold, {color: t.palette.primary_500}]
                        : t.atoms.text_contrast_medium,
                    ]}>
                    Policy
                  </Text>
                </TouchableOpacity>
              </View>

              <FlairSelectionList
                selectedFlairs={
                  selectedDiscourseItem && selectedDiscourseItem !== 'Any'
                    ? Object.values(POST_FLAIRS).filter(
                        (f: PostFlair) => f.label === selectedDiscourseItem,
                      )
                    : []
                }
                setSelectedFlairs={(flairs: PostFlair[]) => {
                  if (flairs.length > 0) {
                    const flair = flairs[0]
                    setDiscourseType(
                      flair.id.startsWith('policy_') ? 'Policy' : 'Matter',
                    )
                    setSelectedDiscourseItem(flair.label)
                  } else {
                    setSelectedDiscourseItem('Any')
                  }
                  setShowDiscourseModal(false)
                }}
                mode={discourseType.toLowerCase() as 'matter' | 'policy'}
                onClose={() => setShowDiscourseModal(false)}
              />

              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => {
                  setSelectedDiscourseItem('')
                  setShowDiscourseModal(false)
                }}
                style={[a.mt_md, a.align_center]}>
                <Text
                  style={[
                    a.text_sm,
                    a.font_bold,
                    t.atoms.text_contrast_medium,
                  ]}>
                  <Trans>Clear heatmap</Trans>
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Screen>
  )
}

const styles = {
  floatingButton: (t: ReturnType<typeof useTheme>) => [
    t.atoms.bg_contrast_25,
    web({backdropFilter: 'blur(10px)'}),
    a.rounded_full,
    a.shadow_md,
    a.border,
    t.atoms.border_contrast_low,
    a.overflow_hidden,
    a.align_center,
    a.justify_center,
    {width: 44, height: 44},
  ],
  pillButton: (t: ReturnType<typeof useTheme>) => [
    a.px_md,
    a.py_sm,
    a.rounded_full,
    a.border,
    t.atoms.border_contrast_low,
  ],
  pillButtonActive: (t: ReturnType<typeof useTheme>) => [
    {borderColor: t.palette.primary_500, backgroundColor: '#ffffff10'},
  ],
  cityMarkerWrap: [a.align_center, a.justify_center],
  cityMarkerDot: {
    width: 12,
    height: 12,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: {width: 0, height: 3},
  },
  cityMarkerLabel: [a.mt_xs, a.px_sm, {paddingVertical: 3, borderRadius: 999}],
}
