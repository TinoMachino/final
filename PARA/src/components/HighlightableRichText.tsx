/**
 * HighlightableRichText - Native implementation
 * Uses TextInput's onSelectionChange to capture partial text selection
 */
import {memo, useCallback, useEffect, useRef, useState} from 'react'
import {Pressable, StyleSheet, Text, TextInput, View} from 'react-native'
import {type RichText as RichTextAPI} from '@atproto/api'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'

import {
  useHighlightMode,
  useHighlights,
  useIsHighlightModeActive,
} from '#/state/highlights'
import {
  HIGHLIGHT_COLORS,
  type HighlightColor,
  type HighlightData,
} from '#/state/highlights/highlightTypes'
import {useSession} from '#/state/session'
import {useTheme} from '#/alf'
import {HighlightOptionsModal} from '#/components/HighlightOptionsModal'
import {RichText} from '#/components/RichText'

interface HighlightableRichTextProps {
  postUri: string
  text: string
  richText: RichTextAPI
  style?: object
  numberOfLines?: number
  selectable?: boolean
  enableTags?: boolean
  authorHandle?: string
}

let HighlightableRichText = ({
  postUri,
  text,
  richText,
  style,
  numberOfLines,
  selectable,
  enableTags,
  authorHandle,
}: HighlightableRichTextProps): React.ReactNode => {
  const t = useTheme()
  const {_} = useLingui()
  const {currentAccount} = useSession()
  const isHighlightMode = useIsHighlightModeActive(postUri)
  const {enterHighlightMode, exitHighlightMode} = useHighlightMode()
  const {highlights, addHighlight, removeHighlight, updateHighlightData} =
    useHighlights(postUri)
  const inputRef = useRef<TextInput>(null)

  // Selection state
  const [selection, setSelection] = useState<{
    start: number
    end: number
  } | null>(null)
  const [hasSelection, setHasSelection] = useState(false)

  // Modal state
  const [modalVisible, setModalVisible] = useState(false)
  const [pendingSelection, setPendingSelection] = useState<{
    start: number
    end: number
  } | null>(null)
  const [editingHighlight, setEditingHighlight] =
    useState<HighlightData | null>(null)

  // Cleanup: exit highlight mode when component unmounts
  useEffect(() => {
    return () => {
      if (isHighlightMode) {
        exitHighlightMode()
      }
    }
  }, [isHighlightMode, exitHighlightMode])

  // Handle selection change
  const onSelectionChange = useCallback(
    (event: {nativeEvent: {selection: {start: number; end: number}}}) => {
      const {start, end} = event.nativeEvent.selection
      setSelection({start, end})
      setHasSelection(start !== end)
    },
    [],
  )

  // Handle "Save Selection" button press
  const onSaveSelection = useCallback(() => {
    if (selection && selection.start !== selection.end) {
      setPendingSelection({
        start: Math.min(selection.start, selection.end),
        end: Math.max(selection.start, selection.end),
      })
      setModalVisible(true)
    }
  }, [selection])

  // Handle tap on existing highlight
  const onTapHighlight = useCallback((highlight: HighlightData) => {
    setEditingHighlight(highlight)
    setModalVisible(true)
  }, [])

  // Save new highlight
  const handleSave = useCallback(
    async (color: HighlightColor, isPublic: boolean, tag?: string) => {
      if (editingHighlight) {
        await updateHighlightData(editingHighlight.id, {color, isPublic, tag})
      } else if (pendingSelection) {
        const highlightText = text.slice(
          pendingSelection.start,
          pendingSelection.end,
        )
        await addHighlight(
          pendingSelection.start,
          pendingSelection.end,
          color,
          isPublic,
          highlightText,
          tag,
        )
      }
      setPendingSelection(null)
      setEditingHighlight(null)
      setSelection(null)
      setHasSelection(false)
      setModalVisible(false)
      exitHighlightMode()
    },
    [
      addHighlight,
      editingHighlight,
      pendingSelection,
      exitHighlightMode,
      text,
      updateHighlightData,
    ],
  )

  // Highlight more text
  const handleHighlightMore = useCallback(async () => {
    if (pendingSelection) {
      const highlightText = text.slice(
        pendingSelection.start,
        pendingSelection.end,
      )
      await addHighlight(
        pendingSelection.start,
        pendingSelection.end,
        HIGHLIGHT_COLORS.yellow,
        false, // isPublic default false for quick highlight
        highlightText,
      )
    }
    setPendingSelection(null)
    setEditingHighlight(null)
    setModalVisible(false)
    // Stay in highlight mode, reset selection
    setSelection(null)
    setHasSelection(false)
    // Re-enter highlight mode to allow more selections
    enterHighlightMode(postUri)
    // Refocus TextInput to allow new selections
    setTimeout(() => {
      inputRef.current?.focus()
    }, 100)
  }, [addHighlight, pendingSelection, enterHighlightMode, postUri, text])

  // Delete existing highlight
  const handleDelete = useCallback(async () => {
    if (editingHighlight) {
      await removeHighlight(editingHighlight.id)
    }
    setEditingHighlight(null)
    setModalVisible(false)
  }, [editingHighlight, removeHighlight])

  // Close modal
  const handleClose = useCallback(() => {
    setPendingSelection(null)
    setEditingHighlight(null)
    setModalVisible(false)
    if (!editingHighlight) {
      exitHighlightMode()
    }
  }, [editingHighlight, exitHighlightMode])

  // Cancel highlight mode
  const handleCancel = useCallback(() => {
    setSelection(null)
    setHasSelection(false)
    exitHighlightMode()
  }, [exitHighlightMode])

  // If not in highlight mode and no highlights, use regular RichText
  if (!isHighlightMode && highlights.length === 0) {
    return (
      <RichText
        value={richText}
        style={style}
        numberOfLines={numberOfLines}
        selectable={selectable}
        enableTags={enableTags}
        authorHandle={authorHandle}
      />
    )
  }

  // Render text with existing highlights as styled spans
  const renderTextWithHighlights = () => {
    if (highlights.length === 0) {
      return text
    }

    // Sort highlights by start position
    const sortedHighlights = [...highlights].sort((a, b) => a.start - b.start)
    const parts: React.ReactNode[] = []
    let lastEnd = 0

    sortedHighlights.forEach((highlight, index) => {
      // Text before this highlight
      if (highlight.start > lastEnd) {
        parts.push(text.slice(lastEnd, highlight.start))
      }

      // The highlighted text (shown as styled text, tappable when not in edit mode)
      if (!isHighlightMode) {
        parts.push(
          <Text
            key={`hl-${index}`}
            onPress={() => onTapHighlight(highlight)}
            style={{backgroundColor: highlight.color}}>
            {text.slice(highlight.start, highlight.end)}
          </Text>,
        )
      } else {
        // In highlight mode, just show the background color
        parts.push(
          <Text key={`hl-${index}`} style={{backgroundColor: highlight.color}}>
            {text.slice(highlight.start, highlight.end)}
          </Text>,
        )
      }

      lastEnd = highlight.end
    })

    // Remaining text after last highlight
    if (lastEnd < text.length) {
      parts.push(text.slice(lastEnd))
    }

    return parts
  }

  // In highlight mode, show editable TextInput for selection
  if (isHighlightMode) {
    return (
      <View>
        {/* Instructions */}
        {/* TextInput for selection */}
        <TextInput
          ref={inputRef}
          multiline
          editable={false}
          value={text}
          onSelectionChange={onSelectionChange}
          selection={selection || undefined}
          accessibilityLabel={_(msg`Post text for selection`)}
          accessibilityHint={_(msg`Select text here to create a highlight`)}
          style={[
            styles.textInput,
            style,
            {
              color: t.atoms.text.color,
              backgroundColor: 'rgba(255, 235, 59, 0.1)',
              borderColor: 'rgba(255, 235, 59, 0.5)',
            },
          ]}
          selectTextOnFocus={false}
        />

        {/* Instructions */}
        <View style={styles.highlightModeIndicator}>
          <Text style={[styles.highlightModeText, {color: t.atoms.text.color}]}>
            ✨ Select text below, then tap "Save"
          </Text>
          <View style={styles.buttonRow}>
            {hasSelection && (
              <Pressable
                accessibilityRole="button"
                onPress={onSaveSelection}
                style={styles.saveButton}>
                <Text style={styles.saveButtonText}>Save</Text>
              </Pressable>
            )}
            <Pressable
              accessibilityRole="button"
              onPress={handleCancel}
              style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          </View>
        </View>

        {/* Options modal */}
        <HighlightOptionsModal
          visible={modalVisible}
          onClose={handleClose}
          onSave={(color, isPublic, tag) => {
            void handleSave(color, isPublic, tag)
          }}
          onHighlightMore={() => {
            void handleHighlightMore()
          }}
          onDelete={
            editingHighlight &&
            (!editingHighlight.creatorDid ||
              editingHighlight.creatorDid === currentAccount?.did)
              ? () => {
                  void handleDelete()
                }
              : undefined
          }
          existingTag={editingHighlight?.tag}
          existingColor={editingHighlight?.color}
          existingIsPublic={editingHighlight?.isPublic}
        />
      </View>
    )
  }

  // Display mode: show text with highlight backgrounds
  return (
    <View>
      <Text
        style={[style, {color: t.atoms.text.color}]}
        numberOfLines={numberOfLines}
        selectable={selectable}>
        {renderTextWithHighlights()}
      </Text>

      {/* Options modal for editing existing highlights */}
      <HighlightOptionsModal
        visible={modalVisible}
        onClose={handleClose}
        onSave={(color, isPublic, tag) => {
          void handleSave(color, isPublic, tag)
        }}
        onHighlightMore={() => {
          void handleHighlightMore()
        }}
        onDelete={
          editingHighlight &&
          (!editingHighlight.creatorDid ||
            editingHighlight.creatorDid === currentAccount?.did)
            ? () => {
                void handleDelete()
              }
            : undefined
        }
        existingTag={editingHighlight?.tag}
        existingColor={editingHighlight?.color}
        existingIsPublic={editingHighlight?.isPublic}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  highlightModeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 8,
    backgroundColor: 'rgba(255, 235, 59, 0.2)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 235, 59, 0.5)',
  },
  highlightModeText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  saveButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  cancelButton: {
    backgroundColor: 'rgba(158, 158, 158, 0.3)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
  },
  selectionPreview: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  previewLabel: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  textInput: {
    fontSize: 16,
    lineHeight: 22,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    textAlignVertical: 'top',
    minHeight: 80,
  },
})

HighlightableRichText = memo(HighlightableRichText)
export {HighlightableRichText}
