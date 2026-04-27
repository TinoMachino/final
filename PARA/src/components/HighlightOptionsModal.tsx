/**
 * HighlightOptionsModal - React Native Modal for highlight color/tag selection
 * Uses standard Modal (NOT Dialog.Outer/BottomSheet) to avoid Reanimated crashes
 */
import {memo, useCallback, useEffect, useState} from 'react'
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Switch,
  TextInput,
  View,
} from 'react-native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'

import {
  HIGHLIGHT_COLORS,
  type HighlightColor,
  type HighlightColorKey,
} from '#/state/highlights/highlightTypes'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {Text} from '#/components/Typography'

interface HighlightOptionsModalProps {
  visible: boolean
  onClose: () => void
  onSave: (color: HighlightColor, isPublic: boolean, tag?: string) => void
  onHighlightMore: () => void
  onDelete?: () => void
  existingTag?: string
  existingColor?: HighlightColor
  existingIsPublic?: boolean
}

let HighlightOptionsModal = ({
  visible,
  onClose,
  onSave,
  onHighlightMore,
  onDelete,
  existingTag,
  existingColor,
  existingIsPublic,
}: HighlightOptionsModalProps): React.ReactNode => {
  const t = useTheme()
  const {_} = useLingui()
  const [selectedColor, setSelectedColor] = useState<HighlightColor>(
    existingColor ?? HIGHLIGHT_COLORS.yellow,
  )
  const [tag, setTag] = useState(existingTag ?? '')
  const [isPublic, setIsPublic] = useState(existingIsPublic ?? false)

  useEffect(() => {
    if (!visible) return
    setSelectedColor(existingColor ?? HIGHLIGHT_COLORS.yellow)
    setTag(existingTag ?? '')
    setIsPublic(existingIsPublic ?? false)
  }, [existingColor, existingIsPublic, existingTag, visible])

  const handleSave = useCallback(() => {
    onSave(selectedColor, isPublic, tag.trim() || undefined)
  }, [onSave, selectedColor, isPublic, tag])

  const colorKeys = Object.keys(HIGHLIGHT_COLORS) as HighlightColorKey[]

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[a.flex_1, a.justify_center, a.align_center]}>
        <Pressable
          accessibilityRole="button"
          style={[a.absolute, a.inset_0, {backgroundColor: 'rgba(0,0,0,0.5)'}]}
          onPress={onClose}
        />
        <View
          style={[
            a.rounded_md,
            a.p_lg,
            a.mx_lg,
            a.w_full,
            {
              maxWidth: 340,
              backgroundColor: t.atoms.bg.backgroundColor,
            },
          ]}>
          <Text style={[a.text_lg, a.font_bold, a.mb_md]}>
            <Trans>Highlight Options</Trans>
          </Text>

          {/* Color picker */}
          <Text style={[a.text_sm, a.mb_sm, t.atoms.text_contrast_medium]}>
            <Trans>Color</Trans>
          </Text>
          <View style={[a.flex_row, a.gap_sm, a.mb_lg, a.flex_wrap]}>
            {colorKeys.map(colorKey => {
              const color = HIGHLIGHT_COLORS[colorKey]
              const isSelected = selectedColor === color
              return (
                <Pressable
                  key={colorKey}
                  onPress={() => setSelectedColor(color)}
                  accessibilityLabel={_(msg`Select ${colorKey} color`)}
                  accessibilityHint={_(
                    msg`Sets the highlight color to ${colorKey}`,
                  )}
                  accessibilityRole="button"
                  style={[
                    a.rounded_full,
                    {
                      width: 40,
                      height: 40,
                      backgroundColor: color,
                      borderWidth: isSelected ? 3 : 1,
                      borderColor: isSelected
                        ? t.palette.primary_500
                        : t.atoms.border_contrast_low.borderColor,
                    },
                  ]}
                />
              )
            })}
          </View>

          {/* Tag input */}
          <Text style={[a.text_sm, a.mb_sm, t.atoms.text_contrast_medium]}>
            <Trans>Tag (optional)</Trans>
          </Text>
          <TextInput
            value={tag}
            onChangeText={setTag}
            placeholder={_(msg`Add a tag or note...`)}
            accessibilityLabel={_(msg`Highlight tag`)}
            accessibilityHint={_(
              msg`Optional tag to categorize your highlight`,
            )}
            placeholderTextColor={t.atoms.text_contrast_low.color}
            style={[
              a.rounded_sm,
              a.p_sm,
              a.mb_lg,
              a.text_md,
              {
                backgroundColor: t.atoms.bg_contrast_25.backgroundColor,
                color: t.atoms.text.color,
                borderWidth: 1,
                borderColor: t.atoms.border_contrast_low.borderColor,
              },
            ]}
            maxLength={50}
          />

          {/* Public/Private toggle */}
          <View
            style={[a.flex_row, a.justify_between, a.align_center, a.mb_lg]}>
            <View>
              <Text style={[a.text_sm, a.font_semi_bold]}>
                <Trans>Make Public</Trans>
              </Text>
              <Text style={[a.text_xs, t.atoms.text_contrast_medium]}>
                <Trans>Others can see this highlight</Trans>
              </Text>
            </View>
            <Switch
              value={isPublic}
              onValueChange={setIsPublic}
              trackColor={{
                false: t.atoms.bg_contrast_100.backgroundColor,
                true: t.palette.primary_500,
              }}
              thumbColor="#fff"
            />
          </View>

          {/* Action buttons */}
          <View style={[a.gap_sm]}>
            <Button
              label={_(msg`Save Highlight`)}
              onPress={handleSave}
              size="large"
              color="primary"
              variant="solid">
              <ButtonText>
                <Trans>Save Highlight</Trans>
              </ButtonText>
            </Button>

            <Button
              label={_(msg`Highlight More`)}
              onPress={onHighlightMore}
              size="large"
              color="secondary"
              variant="solid">
              <ButtonText>
                <Trans>Highlight More</Trans>
              </ButtonText>
            </Button>

            {onDelete && (
              <Button
                label={_(msg`Delete Highlight`)}
                onPress={onDelete}
                size="large"
                color="negative"
                variant="ghost">
                <ButtonText>
                  <Trans>Delete Highlight</Trans>
                </ButtonText>
              </Button>
            )}

            <Button
              label={_(msg`Cancel`)}
              onPress={onClose}
              size="large"
              color="secondary"
              variant="ghost">
              <ButtonText>
                <Trans>Cancel</Trans>
              </ButtonText>
            </Button>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

HighlightOptionsModal = memo(HighlightOptionsModal)
export {HighlightOptionsModal}
