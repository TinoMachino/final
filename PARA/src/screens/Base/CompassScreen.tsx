import {useEffect, useMemo, useRef, useState} from 'react'
import {
  Animated,
  Dimensions,
  PanResponder,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {LinearGradient} from 'expo-linear-gradient'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'

import {
  SIXTY_NINTHS_BY_ID,
  SIXTY_NINTHS_IDEOLOGIES,
  type SixtyNinthsIdeology,
} from '#/lib/compass/sixtyNinths'
import {type CommonNavigatorParams} from '#/lib/routes/types'
import {atoms as a, useBreakpoints, useTheme, web} from '#/alf'
import {ColorPalette_Stroke2_Corner0_Rounded as PaletteIcon} from '#/components/icons/ColorPalette'
import {Header, Screen} from '#/components/Layout'
import * as Prompt from '#/components/Prompt'
import {Text} from '#/components/Typography'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'Compass'>

type Quadrant = {
  id: string
  label: string
  color: string
  labelColor: string
  row: number
  col: number
  isBlank?: boolean
  gradientColors?: string[]
  gradientStart?: {x: number; y: number}
  gradientEnd?: {x: number; y: number}
}

type QuadrantConfig = Omit<Quadrant, 'color' | 'labelColor'>

type Palette = {
  id: string
  name: string
  colors: Record<string, string>
  labelColors?: Record<string, string>
}

const BASE_QUADRANTS: QuadrantConfig[] = [
  {id: 'auth-left', label: 'Auth Left', row: 0, col: 0},
  {id: 'auth-center', label: 'Auth Center', row: 0, col: 1},
  {id: 'auth-right', label: 'Auth Right', row: 0, col: 2},
  {id: 'center-left', label: 'Center Left', row: 1, col: 0},
  {id: 'center', label: 'Centrist', row: 1, col: 1},
  {id: 'center-right', label: 'Center Right', row: 1, col: 2},
  {id: 'lib-left', label: 'Lib Left', row: 2, col: 0},
  {id: 'lib-center', label: 'Lib Center', row: 2, col: 1},
  {id: 'lib-right', label: 'Lib Right', row: 2, col: 2},
]

const COLOR_PALETTES: Palette[] = [
  {
    id: 'classic',
    name: 'Classic',
    colors: {
      'auth-left': '#efb9bb',
      'auth-center': '#cda7d8',
      'auth-right': '#99d0ea',
      'center-left': '#d8d9be',
      center: '#efe7d6',
      'center-right': '#bfd7e8',
      'lib-left': '#c7e4c2',
      'lib-center': '#dfe498',
      'lib-right': '#f6efb3',
    },
    labelColors: {
      'auth-left': '#b05e68',
      'auth-center': '#845596',
      'auth-right': '#1c87b4',
      'center-left': '#7f7950',
      center: '#6f6758',
      'center-right': '#547d98',
      'lib-left': '#4faa57',
      'lib-center': '#8c8a1a',
      'lib-right': '#c8b600',
    },
  },
  {
    id: 'bold',
    name: 'Bold',
    colors: {
      'auth-left': '#d95a63',
      'auth-center': '#8d59c5',
      'auth-right': '#5e8ff0',
      'center-left': '#86b25f',
      center: '#f1ead9',
      'center-right': '#59bfad',
      'lib-left': '#2ebb71',
      'lib-center': '#c7df54',
      'lib-right': '#ecc84c',
    },
    labelColors: {
      'auth-left': '#ffe3e6',
      'auth-center': '#f0e5ff',
      'auth-right': '#eef5ff',
      'center-left': '#16310d',
      center: '#60584a',
      'center-right': '#11322b',
      'lib-left': '#ebfff2',
      'lib-center': '#384000',
      'lib-right': '#4f3900',
    },
  },
]

const CROSS_GRADIENTS: Record<
  string,
  {
    colors: (palette: Palette) => string[]
    start: {x: number; y: number}
    end: {x: number; y: number}
  }
> = {
  'auth-center': {
    colors: palette => [
      palette.colors['auth-left'],
      palette.colors['auth-right'],
    ],
    start: {x: 0, y: 0.5},
    end: {x: 1, y: 0.5},
  },
  'center-left': {
    colors: palette => [
      palette.colors['auth-left'],
      palette.colors['lib-left'],
    ],
    start: {x: 0.5, y: 0},
    end: {x: 0.5, y: 1},
  },
  'center-right': {
    colors: palette => [
      palette.colors['auth-right'],
      palette.colors['lib-right'],
    ],
    start: {x: 0.5, y: 0},
    end: {x: 0.5, y: 1},
  },
  'lib-center': {
    colors: palette => [
      palette.colors['lib-left'],
      palette.colors['lib-right'],
    ],
    start: {x: 0, y: 0.5},
    end: {x: 1, y: 0.5},
  },
}

const SIXTY_NINTHS_GRID_SIZE = 9

const hexToRgb = (hex: string) => {
  const normalized = hex.replace('#', '')
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  }
}

const rgbToHex = (r: number, g: number, b: number) => {
  const toHex = (value: number) =>
    Math.round(Math.max(0, Math.min(255, value)))
      .toString(16)
      .padStart(2, '0')

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

const mixColors = (left: string, right: string, ratio: number) => {
  const start = hexToRgb(left)
  const end = hexToRgb(right)
  return rgbToHex(
    start.r + (end.r - start.r) * ratio,
    start.g + (end.g - start.g) * ratio,
    start.b + (end.b - start.b) * ratio,
  )
}

const getReadableTextColor = (background: string) => {
  const {r, g, b} = hexToRgb(background)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.68 ? '#2b2b2b' : '#ffffff'
}

const buildQuadrantStats = (quadrant: Quadrant) => {
  const seed = `${quadrant.id}-${quadrant.row}-${quadrant.col}`
  const hash = seed.split('').reduce((total, char, index) => {
    return total + char.charCodeAt(0) * (index + 3)
  }, 0)

  return {
    users: (hash % 20) + 5,
    active: (hash % 500) + 50,
  }
}

const buildQuadrants9 = (palette: Palette): Quadrant[] => {
  return BASE_QUADRANTS.map(definition => {
    const gradient = CROSS_GRADIENTS[definition.id]
    const color = palette.colors[definition.id]

    return {
      ...definition,
      color,
      labelColor:
        palette.labelColors?.[definition.id] ?? getReadableTextColor(color),
      gradientColors: gradient?.colors(palette),
      gradientStart: gradient?.start,
      gradientEnd: gradient?.end,
    }
  })
}

const buildQuadrants25 = (palette: Palette): Quadrant[] => {
  const quadrants: Quadrant[] = []
  const quadrants9 = buildQuadrants9(palette)

  // Mapping from 5x5 to center positions (0,2,4 map to original 0,1,2)
  const centerMapping: Record<string, Quadrant> = {}
  quadrants9.forEach(q => {
    const key = `${q.row * 2}-${q.col * 2}`
    centerMapping[key] = q
  })

  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      const key = `${row}-${col}`
      const existing = centerMapping[key]

      if (existing) {
        quadrants.push({
          ...existing,
          row,
          col,
          gradientColors: undefined,
          gradientStart: undefined,
          gradientEnd: undefined,
        })
      } else {
        const rowPosition = row / 2
        const colPosition = col / 2
        const rowLow = Math.floor(rowPosition)
        const rowHigh = Math.ceil(rowPosition)
        const colLow = Math.floor(colPosition)
        const colHigh = Math.ceil(colPosition)
        const rowRatio = rowPosition - rowLow
        const colRatio = colPosition - colLow

        const topLeft = palette.colors[BASE_QUADRANTS[rowLow * 3 + colLow].id]
        const topRight = palette.colors[BASE_QUADRANTS[rowLow * 3 + colHigh].id]
        const bottomLeft =
          palette.colors[BASE_QUADRANTS[rowHigh * 3 + colLow].id]
        const bottomRight =
          palette.colors[BASE_QUADRANTS[rowHigh * 3 + colHigh].id]
        const topBlend = mixColors(topLeft, topRight, colRatio)
        const bottomBlend = mixColors(bottomLeft, bottomRight, colRatio)
        const color = mixColors(topBlend, bottomBlend, rowRatio)

        quadrants.push({
          id: `pos-${row}-${col}`,
          label: '',
          color,
          labelColor: getReadableTextColor(color),
          row,
          col,
        })
      }
    }
  }

  return quadrants
}

const getInterpolatedColor = (
  palette: Palette,
  row: number,
  col: number,
  gridSize: number,
) => {
  const rowPosition = (row / (gridSize - 1)) * 2
  const colPosition = (col / (gridSize - 1)) * 2
  const rowLow = Math.floor(rowPosition)
  const rowHigh = Math.ceil(rowPosition)
  const colLow = Math.floor(colPosition)
  const colHigh = Math.ceil(colPosition)
  const rowRatio = rowPosition - rowLow
  const colRatio = colPosition - colLow

  const topLeft = palette.colors[BASE_QUADRANTS[rowLow * 3 + colLow].id]
  const topRight = palette.colors[BASE_QUADRANTS[rowLow * 3 + colHigh].id]
  const bottomLeft = palette.colors[BASE_QUADRANTS[rowHigh * 3 + colLow].id]
  const bottomRight = palette.colors[BASE_QUADRANTS[rowHigh * 3 + colHigh].id]
  const topBlend = mixColors(topLeft, topRight, colRatio)
  const bottomBlend = mixColors(bottomLeft, bottomRight, colRatio)
  return mixColors(topBlend, bottomBlend, rowRatio)
}

const buildQuadrants69 = (palette: Palette): Quadrant[] => {
  const quadrants: Quadrant[] = []
  const ideologiesByPosition = new Map(
    SIXTY_NINTHS_IDEOLOGIES.map(item => [`${item.row}-${item.col}`, item]),
  )

  for (let row = 0; row < SIXTY_NINTHS_GRID_SIZE; row++) {
    for (let col = 0; col < SIXTY_NINTHS_GRID_SIZE; col++) {
      const ideology = ideologiesByPosition.get(`${row}-${col}`)
      if (ideology?.kind === 'center') {
        quadrants.push({
          id: `blank-${row}-${col}`,
          label: '',
          color: 'transparent',
          labelColor: 'transparent',
          row,
          col,
          isBlank: true,
        })
      } else if (ideology) {
        const isMainBoard = ideology.kind === 'main'
        const color = isMainBoard
          ? getInterpolatedColor(palette, row, col, 8)
          : '#f6f4ef'
        quadrants.push({
          id: ideology.id,
          label: ideology.label,
          color,
          labelColor: '#111111',
          row,
          col,
          isBlank: ideology.kind !== 'main' ? false : undefined,
        })
      } else {
        quadrants.push({
          id: `blank-${row}-${col}`,
          label: '',
          color: 'transparent',
          labelColor: 'transparent',
          row,
          col,
          isBlank: true,
        })
      }
    }
  }

  return quadrants
}

const INITIAL_SCALE = 1
const MIN_SCALE = 0.5
const MAX_SCALE = 3

export function CompassScreen({navigation: _}: Props) {
  const {_: translate} = useLingui()
  const t = useTheme()
  const insets = useSafeAreaInsets()
  const {gtMobile} = useBreakpoints()
  const ideologyPromptControl = Prompt.usePromptControl()
  const [paletteIndex, setPaletteIndex] = useState(0)
  const [show69ths, setShow69ths] = useState(false)

  // Custom darker background for cards to match user preference
  // Assuming hex colors for palette, adding alpha for transparency
  // 40 = 25% opacity, 80 = 50% opacity
  const cardBgColor = {
    backgroundColor: t.palette.contrast_25 + '30', // Very subtle dark background
    borderWidth: 1,
    borderColor: t.palette.contrast_50 + '40',
  }

  const [is25ths, setIs25ths] = useState(false)
  const [selectedQuadrant, setSelectedQuadrant] = useState<Quadrant | null>(
    null,
  )
  const [selectedIdeology, setSelectedIdeology] =
    useState<SixtyNinthsIdeology | null>(null)
  const [selectedQuadrantStats, setSelectedQuadrantStats] = useState<{
    users: number
    active: number
  } | null>(null)

  const palette = COLOR_PALETTES[paletteIndex]
  const quadrants9 = useMemo(() => buildQuadrants9(palette), [palette])
  const quadrants25 = useMemo(() => buildQuadrants25(palette), [palette])
  const quadrants69 = useMemo(() => buildQuadrants69(palette), [palette])
  const sixtyNinthsMainCells = useMemo(
    () =>
      quadrants69.filter(
        q =>
          !q.isBlank &&
          q.row < 8 &&
          q.col < 8 &&
          SIXTY_NINTHS_BY_ID[q.id]?.kind === 'main',
      ),
    [quadrants69],
  )
  const sixtyNinthsExtraCells = useMemo(
    () =>
      quadrants69.filter(
        q => !q.isBlank && SIXTY_NINTHS_BY_ID[q.id]?.kind === 'extra',
      ),
    [quadrants69],
  )
  const radicalCenter = SIXTY_NINTHS_BY_ID['radical-centrism']

  const currentQuadrants = show69ths
    ? quadrants69
    : is25ths
      ? quadrants25
      : quadrants9
  const gridDimension = show69ths ? SIXTY_NINTHS_GRID_SIZE : is25ths ? 5 : 3

  // Animated values stay stable for the lifetime of the screen.
  const pan = useMemo(() => new Animated.ValueXY(), [])
  const scale = useMemo(() => new Animated.Value(INITIAL_SCALE), [])

  // Track current scale for gesture calculations
  const currentScale = useRef(INITIAL_SCALE)
  useEffect(() => {
    const listenerId = scale.addListener(({value}) => {
      currentScale.current = value
    })

    return () => {
      scale.removeListener(listenerId)
    }
  }, [scale])

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          pan.extractOffset()
        },
        onPanResponderMove: Animated.event([null, {dx: pan.x, dy: pan.y}], {
          useNativeDriver: false,
        }),
        onPanResponderRelease: () => {
          pan.flattenOffset()
        },
      }),
    [pan],
  )

  const handleZoom = (factor: number) => {
    const newScale = Math.min(
      MAX_SCALE,
      Math.max(MIN_SCALE, currentScale.current * factor),
    )
    Animated.spring(scale, {
      toValue: newScale,
      useNativeDriver: false,
    }).start()
  }

  const handleRecenter = () => {
    Animated.parallel([
      Animated.spring(pan, {
        toValue: {x: 0, y: 0},
        useNativeDriver: false,
      }),
      Animated.spring(scale, {
        toValue: INITIAL_SCALE,
        useNativeDriver: false,
      }),
    ]).start()
    setSelectedQuadrant(null)
    setSelectedQuadrantStats(null)
  }

  const handleQuadrantPress = (quadrant: Quadrant) => {
    setSelectedQuadrant(quadrant)
    setSelectedQuadrantStats(buildQuadrantStats(quadrant))

    // Zoom to the selected quadrant
    const {width} = Dimensions.get('window')
    const gridSize = Math.min(width - 40, 350)
    const cellSize = gridSize / gridDimension
    const centerCol = (gridDimension - 1) / 2
    const centerRow = (gridDimension - 1) / 2
    const centerX = (centerCol - quadrant.col) * cellSize
    const centerY = (centerRow - quadrant.row) * cellSize

    Animated.parallel([
      Animated.spring(pan, {
        toValue: {x: centerX, y: centerY},
        useNativeDriver: false,
      }),
      Animated.spring(scale, {
        toValue: show69ths ? 3 : is25ths ? 2.5 : 2,
        useNativeDriver: false,
      }),
    ]).start()
  }

  const handleSixtyNinthsPress = (id: string) => {
    const ideology = SIXTY_NINTHS_BY_ID[id]
    if (!ideology) return
    setSelectedIdeology(ideology)
    ideologyPromptControl.open()
  }

  const webLeftMargin = {
    marginLeft: 'calc(50% - 300px)',
    minHeight: '100%',
  }

  const {width} = Dimensions.get('window')
  const gridSize = Math.min(width - 40, 350)
  const cellSize = gridSize / gridDimension
  const sixtyNinthsBoardSize = Math.min(width - (gtMobile ? 80 : -36), 432)
  const sixtyNinthsCellSize = sixtyNinthsBoardSize / 8
  const sixtyNinthsFrameWidth = sixtyNinthsBoardSize + sixtyNinthsCellSize
  const sixtyNinthsFrameHeight = sixtyNinthsBoardSize + sixtyNinthsCellSize

  return (
    <Screen hideBorders>
      <Header.Outer noBottomBorder>
        <Header.BackButton />
        <Header.Content>
          <Header.TitleText>
            {translate(msg`Political Compass`)}
          </Header.TitleText>
        </Header.Content>
        <Header.Slot />
      </Header.Outer>

      <View style={[a.flex_1, gtMobile && web(webLeftMargin)]}>
        <View style={[a.flex_1, a.relative, a.overflow_hidden]}>
          {/* Toggle Button */}
          <View
            style={[
              a.absolute,
              {left: 20, top: 20, zIndex: 10},
              gtMobile && {left: 80},
            ]}>
            <View style={[a.gap_sm]}>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => {
                  setIs25ths(!is25ths)
                  setShow69ths(false)
                  setSelectedQuadrant(null)
                  setSelectedIdeology(null)
                  ideologyPromptControl.close()
                  handleRecenter()
                }}
                style={[cardBgColor, a.px_md, a.py_sm, a.rounded_md]}>
                <Text style={[a.font_bold, t.atoms.text]}>
                  {is25ths ? <Trans>9ths</Trans> : <Trans>25ths</Trans>}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => {
                  setShow69ths(current => !current)
                  setSelectedQuadrant(null)
                  setSelectedQuadrantStats(null)
                  setSelectedIdeology(null)
                  ideologyPromptControl.close()
                  handleRecenter()
                }}
                style={[cardBgColor, a.px_md, a.py_sm, a.rounded_md]}>
                <Text style={[a.font_bold, t.atoms.text]}>
                  69ths: {show69ths ? translate(msg`On`) : translate(msg`Off`)}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {!show69ths ? (
            <>
              <Text
                style={[
                  styles.axisLabel,
                  t.atoms.text_contrast_medium,
                  {top: 10, alignSelf: 'center'},
                ]}>
                <Trans>Authoritarian</Trans>
              </Text>
              <Text
                style={[
                  styles.axisLabel,
                  t.atoms.text_contrast_medium,
                  {bottom: 60 + insets.bottom, alignSelf: 'center'},
                ]}>
                <Trans>Libertarian</Trans>
              </Text>
              <Text
                style={[
                  styles.axisLabel,
                  t.atoms.text_contrast_medium,
                  {left: 22, top: '50%', marginTop: -10},
                ]}>
                Left
              </Text>
              <Text
                style={[
                  styles.axisLabel,
                  t.atoms.text_contrast_medium,
                  {right: 22, top: '50%', marginTop: -10},
                ]}>
                Right
              </Text>
            </>
          ) : null}

          {/* Draggable Grid Container */}
          <Animated.View
            {...panResponder.panHandlers}
            style={[
              styles.gridContainer,
              {
                transform: [
                  {translateX: pan.x},
                  {translateY: pan.y},
                  {scale: scale},
                ],
              },
            ]}>
            {show69ths ? (
              <View
                style={[
                  styles.sixtyNinthsFrame,
                  {
                    width: sixtyNinthsFrameWidth,
                    height: sixtyNinthsFrameHeight,
                  },
                ]}>
                <Text
                  style={[
                    styles.sixtyNinthsAxisLabel,
                    t.atoms.text_contrast_medium,
                    {
                      top: -40,
                      left: sixtyNinthsBoardSize / 2 - 64,
                    },
                  ]}>
                  <Trans>Authoritarian</Trans>
                </Text>
                <Text
                  style={[
                    styles.sixtyNinthsAxisLabel,
                    t.atoms.text_contrast_medium,
                    {
                      bottom: -40,
                      left: sixtyNinthsBoardSize / 2 - 54,
                    },
                  ]}>
                  <Trans>Libertarian</Trans>
                </Text>
                <Text
                  style={[
                    styles.sixtyNinthsSideLabel,
                    t.atoms.text_contrast_medium,
                    {
                      left: -36,
                      top: sixtyNinthsBoardSize / 2 - 12,
                    },
                  ]}>
                  Left
                </Text>
                <Text
                  style={[
                    styles.sixtyNinthsSideLabel,
                    t.atoms.text_contrast_medium,
                    {
                      left: sixtyNinthsBoardSize + 10,
                      top: sixtyNinthsBoardSize / 2 - 12,
                    },
                  ]}>
                  Right
                </Text>

                <View
                  style={[
                    styles.sixtyNinthsBoard,
                    {
                      width: sixtyNinthsBoardSize,
                      height: sixtyNinthsBoardSize,
                    },
                  ]}>
                  {sixtyNinthsMainCells.map(quadrant => (
                    <TouchableOpacity
                      key={quadrant.id}
                      accessibilityRole="button"
                      accessibilityLabel={quadrant.label.replaceAll('\n', ' ')}
                      accessibilityHint={translate(
                        msg`Opens a brief ideology introduction.`,
                      )}
                      onPress={() => handleSixtyNinthsPress(quadrant.id)}
                      style={[
                        styles.sixtyNinthsCell,
                        {
                          left: quadrant.col * sixtyNinthsCellSize,
                          top: quadrant.row * sixtyNinthsCellSize,
                          width: sixtyNinthsCellSize,
                          height: sixtyNinthsCellSize,
                          backgroundColor: quadrant.color,
                        },
                      ]}>
                      <Text style={styles.sixtyNinthsCellLabel}>
                        {quadrant.label}
                      </Text>
                    </TouchableOpacity>
                  ))}

                  <View
                    pointerEvents="none"
                    style={[
                      styles.centerAxisVertical,
                      {
                        left: sixtyNinthsBoardSize / 2 - 1.5,
                        top: 0,
                        bottom: 0,
                      },
                    ]}
                  />
                  <View
                    pointerEvents="none"
                    style={[
                      styles.centerAxisHorizontal,
                      {
                        top: sixtyNinthsBoardSize / 2 - 1.5,
                        left: 0,
                        right: 0,
                      },
                    ]}
                  />
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={radicalCenter.title}
                    accessibilityHint={translate(
                      msg`Opens a brief ideology introduction.`,
                    )}
                    onPress={() => handleSixtyNinthsPress(radicalCenter.id)}
                    style={[
                      styles.radicalCenterWrap,
                      {
                        left:
                          sixtyNinthsBoardSize / 2 - sixtyNinthsCellSize * 0.55,
                        top:
                          sixtyNinthsBoardSize / 2 - sixtyNinthsCellSize * 0.55,
                        width: sixtyNinthsCellSize * 1.1,
                        height: sixtyNinthsCellSize * 1.1,
                      },
                    ]}>
                    <View style={styles.radicalCenterBox}>
                      <Text style={styles.radicalCenterText}>
                        Radical{'\n'}Centrism
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>

                {sixtyNinthsExtraCells.map(quadrant => (
                  <TouchableOpacity
                    key={quadrant.id}
                    accessibilityRole="button"
                    accessibilityLabel={quadrant.label.replaceAll('\n', ' ')}
                    accessibilityHint={translate(
                      msg`Opens a brief ideology introduction.`,
                    )}
                    onPress={() => handleSixtyNinthsPress(quadrant.id)}
                    style={[
                      styles.sixtyNinthsExtraCell,
                      {
                        left: quadrant.col * sixtyNinthsCellSize,
                        top: quadrant.row * sixtyNinthsCellSize,
                        width: sixtyNinthsCellSize,
                        height: sixtyNinthsCellSize,
                      },
                    ]}>
                    <Text style={styles.sixtyNinthsCellLabel}>
                      {quadrant.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={[styles.grid, {width: gridSize, height: gridSize}]}>
                {currentQuadrants.map(quadrant => (
                  <TouchableOpacity
                    key={quadrant.id}
                    accessibilityRole="button"
                    style={[
                      styles.cell,
                      {
                        width: cellSize,
                        height: cellSize,
                        borderWidth: 1,
                        borderColor: 'rgba(0,0,0,0.2)',
                      },
                    ]}
                    activeOpacity={0.8}
                    onPress={() => handleQuadrantPress(quadrant)}>
                    {quadrant.gradientColors ? (
                      <LinearGradient
                        colors={quadrant.gradientColors as unknown as readonly [string, string, ...string[]]}
                        start={quadrant.gradientStart}
                        end={quadrant.gradientEnd}
                        style={styles.cellFill}>
                        {quadrant.label ? (
                          <Text
                            style={[
                              styles.cellLabel,
                              {
                                color: quadrant.labelColor,
                                fontSize: is25ths ? 9 : 12,
                              },
                            ]}>
                            {quadrant.label}
                          </Text>
                        ) : null}
                      </LinearGradient>
                    ) : (
                      <View
                        style={[
                          styles.cellFill,
                          {
                            backgroundColor: quadrant.color,
                          },
                        ]}>
                        {quadrant.label ? (
                          <Text
                            style={[
                              styles.cellLabel,
                              {
                                color: quadrant.labelColor,
                                fontSize: is25ths ? 9 : 12,
                              },
                            ]}>
                            {quadrant.label}
                          </Text>
                        ) : null}
                      </View>
                    )}
                  </TouchableOpacity>
                ))}

                <View pointerEvents="none" style={styles.axisOverlay}>
                  <View
                    style={[
                      styles.gridAxisVertical,
                      {
                        left: gridSize / 2 - 1,
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.gridAxisHorizontal,
                      {
                        top: gridSize / 2 - 1,
                      },
                    ]}
                  />
                </View>
              </View>
            )}
          </Animated.View>

          {/* Zoom Controls */}
          {!gtMobile && (
            <View
              style={[
                a.absolute,
                {right: 20, bottom: 60 + insets.bottom},
                a.gap_md,
              ]}>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => handleZoom(1.5)}
                style={[
                  cardBgColor,
                  web({backdropFilter: 'blur(10px)'}),
                  a.rounded_full,
                  a.shadow_md,
                  a.border,
                  t.atoms.border_contrast_low,
                  a.align_center,
                  a.justify_center,
                  {width: 44, height: 44},
                ]}>
                <Text style={[a.text_2xl, a.font_bold, t.atoms.text]}>+</Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => handleZoom(0.67)}
                style={[
                  cardBgColor,
                  web({backdropFilter: 'blur(10px)'}),
                  a.rounded_full,
                  a.shadow_md,
                  a.align_center,
                  a.justify_center,
                  {width: 44, height: 44},
                ]}>
                <Text style={[a.text_2xl, a.font_bold, t.atoms.text]}>-</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Recenter Button */}
          <View
            style={[a.absolute, {right: 20, top: 20}, gtMobile && {right: 40}]}>
            <View style={[a.gap_sm]}>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={`${translate(msg`Palette`)}: ${palette.name}`}
                accessibilityHint={translate(
                  msg`Changes the compass color palette.`,
                )}
                onPress={() => {
                  setPaletteIndex(
                    current => (current + 1) % COLOR_PALETTES.length,
                  )
                  setSelectedQuadrant(null)
                  setSelectedQuadrantStats(null)
                }}
                style={[
                  cardBgColor,
                  a.align_center,
                  a.justify_center,
                  {width: 44, height: 44},
                ]}>
                <PaletteIcon
                  size="lg"
                  style={[{color: t.palette.primary_500}]}
                />
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={handleRecenter}
                style={[
                  cardBgColor,
                  a.align_center,
                  a.justify_center,
                  {width: 44, height: 44},
                ]}>
                <Text style={[a.text_md, a.font_bold, t.atoms.text]}>⌖</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Selected Quadrant Overlay */}
          {selectedQuadrant && !show69ths && (
            <View
              style={[
                a.absolute,
                {bottom: gtMobile ? 40 : 60 + insets.bottom, left: 20},
                gtMobile && {left: 40, width: 350},
                !gtMobile && {right: 20},
                a.p_lg,
                a.rounded_xl,
                t.atoms.bg_contrast_25, // Fallback? No, replace with cardBgColor?
                // Wait, in previous step I did NOT apply cardBgColor to Overlay!
                // Line 393 shows `t.atoms.bg_contrast_25`.
                // I need to replace it with cardBgColor AND remove border.
                cardBgColor,
                web({backdropFilter: 'blur(12px)'}),
                a.shadow_lg,
              ]}>
              <View
                style={[
                  a.flex_row,
                  a.justify_between,
                  a.align_center,
                  a.mb_md,
                ]}>
                <View style={[a.flex_row, a.align_center, a.gap_sm]}>
                  <View
                    style={[
                      {
                        width: 24,
                        height: 24,
                        borderRadius: 4,
                        backgroundColor: selectedQuadrant.color,
                      },
                    ]}
                  />
                  <Text style={[a.text_2xl, a.font_bold, t.atoms.text]}>
                    {selectedQuadrant.label ||
                      `Position ${selectedQuadrant.row}-${selectedQuadrant.col}`}
                  </Text>
                </View>
                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={() => setSelectedQuadrant(null)}>
                  <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
                    ✕
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={[a.text_md, t.atoms.text_contrast_high, a.mb_sm]}>
                <Trans>Top Parties:</Trans>{' '}
                <Text style={[a.font_bold]}>
                  PAN, PRI, Movimiento Ciudadano
                </Text>
              </Text>
              <Text style={[a.text_md, t.atoms.text_contrast_high, a.mb_sm]}>
                <Trans>Top Communities:</Trans>{' '}
                <Text style={[a.font_bold]}>r/Libertarios, r/CentroMX</Text>
              </Text>

              <View style={[a.flex_row, a.gap_sm, a.mt_sm]}>
                <View
                  style={[
                    a.flex_1,
                    a.p_sm,
                    t.atoms.bg_contrast_100,
                    a.rounded_md,
                    a.align_center,
                  ]}>
                  <Text style={[a.text_2xl, a.font_bold, t.atoms.text]}>
                    {selectedQuadrantStats?.users}%
                  </Text>
                  <Text style={[a.text_xs, t.atoms.text_contrast_medium]}>
                    <Trans>of Users</Trans>
                  </Text>
                </View>
                <View
                  style={[
                    a.flex_1,
                    a.p_sm,
                    t.atoms.bg_contrast_100,
                    a.rounded_md,
                    a.align_center,
                  ]}>
                  <Text style={[a.text_2xl, a.font_bold, t.atoms.text]}>
                    {selectedQuadrantStats?.active}
                  </Text>
                  <Text style={[a.text_xs, t.atoms.text_contrast_medium]}>
                    <Trans>Active</Trans>
                  </Text>
                </View>
              </View>
            </View>
          )}

          <Prompt.Outer
            control={ideologyPromptControl}
            nativeOptions={{preventExpansion: true}}>
            <Prompt.Content>
              {selectedIdeology ? (
                <>
                  <Prompt.TitleText>{selectedIdeology.title}</Prompt.TitleText>
                  <Prompt.DescriptionText>
                    {selectedIdeology.shortIntro}
                  </Prompt.DescriptionText>
                  {selectedIdeology.related?.length ? (
                    <View style={[a.gap_sm]}>
                      <Text style={[a.text_sm, a.font_bold, t.atoms.text]}>
                        <Trans>Related positions</Trans>
                      </Text>
                      <Text
                        style={[
                          a.text_sm,
                          a.leading_snug,
                          t.atoms.text_contrast_medium,
                        ]}>
                        {selectedIdeology.related
                          .map(id => SIXTY_NINTHS_BY_ID[id]?.title ?? id)
                          .join(', ')}
                      </Text>
                    </View>
                  ) : null}
                </>
              ) : null}
            </Prompt.Content>
          </Prompt.Outer>
        </View>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  axisLabel: {
    position: 'absolute',
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.7,
  },
  gridContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  sixtyNinthsFrame: {
    position: 'relative',
    overflow: 'visible',
  },
  sixtyNinthsBoard: {
    position: 'relative',
    backgroundColor: '#f7f2ea',
  },
  sixtyNinthsCell: {
    position: 'absolute',
    borderWidth: 1.25,
    borderColor: '#111111',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
    paddingVertical: 2,
  },
  sixtyNinthsExtraCell: {
    position: 'absolute',
    backgroundColor: '#f7f4ef',
    borderWidth: 1.25,
    borderColor: '#111111',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
    paddingVertical: 2,
  },
  sixtyNinthsCellLabel: {
    fontSize: 7.5,
    lineHeight: 8.5,
    textAlign: 'center',
    fontWeight: '500',
    color: '#111111',
  },
  sixtyNinthsAxisLabel: {
    position: 'absolute',
    fontSize: 14,
    fontWeight: '700',
    color: '#cfd5e0',
  },
  sixtyNinthsSideLabel: {
    position: 'absolute',
    fontSize: 11,
    fontWeight: '600',
    color: '#aeb6c7',
  },
  cell: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  cellFill: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  axisOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  centerAxisVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  centerAxisHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  gridAxisVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: 'rgba(30, 41, 59, 0.42)',
  },
  gridAxisHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(30, 41, 59, 0.42)',
  },
  ideologyOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  radicalCenterWrap: {
    position: 'absolute',
  },
  ideologyLabelBox: {
    position: 'absolute',
    minHeight: 24,
    paddingHorizontal: 6,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderWidth: 1,
    borderColor: 'rgba(70,70,70,0.25)',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 3,
    shadowOffset: {width: 0, height: 1},
    alignItems: 'center',
    justifyContent: 'center',
  },
  ideologyLabelText: {
    fontSize: 9,
    lineHeight: 10,
    color: '#2c2c2c',
    textAlign: 'center',
    fontWeight: '500',
  },
  radicalCenterBox: {
    flex: 1,
    backgroundColor: '#cfcfca',
    borderWidth: 2,
    borderColor: 'rgba(24,24,24,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  radicalCenterText: {
    fontSize: 10,
    lineHeight: 11,
    textAlign: 'center',
    fontWeight: '600',
    color: '#1e1e1e',
  },
  cellLabel: {
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 4,
    lineHeight: 12,
  },
})
