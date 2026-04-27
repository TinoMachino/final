import {type ReactNode} from 'react'
import {Alert, Pressable, View} from 'react-native'

import {type Document as MediaDocument, type Meme} from '#/lib/mock-data/types'
import {Text} from '#/view/com/util/text/Text'
import {useTheme} from '#/alf'
import {ArrowsDiagonalOut_Stroke2_Corner2_Rounded as ExpandIcon} from '#/components/icons/ArrowsDiagonal'
import {Bubble_Stroke2_Corner2_Rounded as CommentIcon} from '#/components/icons/Bubble'
import {CalendarDays_Stroke2_Corner0_Rounded as CalendarIcon} from '#/components/icons/CalendarDays'
import {PageText_Stroke2_Corner0_Rounded as PageTextIcon} from '#/components/icons/PageText'
import {formatDateLabel} from './helpers'
import {styles} from './styles'
import {type MediaItem, type Mode} from './types'

export function ActionButton({
  icon,
  label,
  onPress,
}: {
  icon: ReactNode
  label: string
  onPress?: () => void
}) {
  const t = useTheme()

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.actionButton, t.atoms.bg_contrast_25]}>
      {icon}
      <Text style={[styles.actionButtonText, t.atoms.text]}>{label}</Text>
    </Pressable>
  )
}

export function CommentChip({
  comments,
  compact,
}: {
  comments: number
  compact?: boolean
}) {
  const t = useTheme()

  return (
    <View
      style={[
        styles.commentChip,
        compact ? styles.commentChipCompact : styles.commentChipFloating,
        t.atoms.bg_contrast_25,
      ]}>
      <CommentIcon size="sm" style={t.atoms.text_contrast_medium} />
      <Text style={[styles.commentChipText, t.atoms.text]}>{comments}</Text>
    </View>
  )
}

function MetaPill({label, icon}: {label: string; icon?: ReactNode}) {
  const t = useTheme()

  return (
    <View style={[styles.metaPill, t.atoms.bg_contrast_25]}>
      {icon}
      <Text
        numberOfLines={1}
        style={[styles.metaPillText, t.atoms.text_contrast_medium]}>
        {label}
      </Text>
    </View>
  )
}

export function MediaVisualMeta({
  item,
  mode,
}: {
  item: MediaItem
  mode: Mode
}) {
  const t = useTheme()

  if (mode === 'Documents') {
    const document = item as MediaDocument
    return (
      <View style={styles.metaPillRow}>
        <MetaPill
          label={document.size}
          icon={<PageTextIcon size="xs" style={t.atoms.text_contrast_medium} />}
        />
        <MetaPill
          label={formatDateLabel(document.date)}
          icon={<CalendarIcon size="xs" style={t.atoms.text_contrast_medium} />}
        />
      </View>
    )
  }

  const meme = item as Meme
  return (
    <View style={styles.metaPillRow}>
      <MetaPill label={meme.author} />
      <MetaPill label={meme.state} />
    </View>
  )
}

export function DeckExpandButton({
  onPress,
  placement,
}: {
  onPress: () => void
  placement: 'bottom-right' | 'top-left'
}) {
  const t = useTheme()

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Expandir tarjeta"
      accessibilityHint="Abre la tarjeta en vista completa"
      onPress={onPress}
      style={[
        styles.deckExpandButton,
        placement === 'bottom-right'
          ? styles.deckExpandButtonBottomRight
          : styles.deckExpandButtonTopLeft,
        t.atoms.bg_contrast_25,
        {borderColor: t.palette.contrast_200},
      ]}>
      <ExpandIcon size="sm" style={t.atoms.text} />
    </Pressable>
  )
}

export function DeckOptionsButton({onPress}: {onPress?: () => void}) {
  const t = useTheme()

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Más opciones"
      accessibilityHint="Muestra acciones para esta tarjeta"
      onPress={onPress}
      style={styles.deckOptionsButton}>
      <View style={styles.deckOptionsDots}>
        {[0, 1, 2].map(index => (
          <View
            key={index}
            style={[
              styles.deckOptionsDot,
              {backgroundColor: t.palette.contrast_900},
            ]}
          />
        ))}
      </View>
    </Pressable>
  )
}

export function showDeckOptionsAlert() {
  Alert.alert('Opciones', 'Funcionalidad en desarrollo')
}
