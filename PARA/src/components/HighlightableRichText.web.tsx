/**
 * HighlightableRichText - Web implementation using window.getSelection()
 * Provides text selection functionality for web platform
 */
import {memo, useCallback, useEffect, useRef, useState} from 'react'
import {View} from 'react-native'
import {type RichText as RichTextAPI} from '@atproto/api'

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
  const {currentAccount} = useSession()
  const containerRef = useRef<View>(null)
  const isHighlightMode = useIsHighlightModeActive(postUri)
  const {enterHighlightMode, exitHighlightMode} = useHighlightMode()
  const {highlights, addHighlight, removeHighlight, updateHighlightData} =
    useHighlights(postUri)

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

  // Handle text selection on web
  const handleMouseUp = useCallback(() => {
    if (!isHighlightMode) return

    const selection = window.getSelection()
    if (!selection || selection.isCollapsed) return

    const selectedText = selection.toString()
    if (!selectedText.trim()) return

    // Find the start index by locating the selected text in the original text
    const startIndex = text.indexOf(selectedText)
    if (startIndex === -1) return

    setPendingSelection({
      start: startIndex,
      end: startIndex + selectedText.length,
    })
    setModalVisible(true)

    // Clear browser selection
    selection.removeAllRanges()
  }, [isHighlightMode, text])

  // Set up event listener for selection
  useEffect(() => {
    if (isHighlightMode) {
      document.addEventListener('mouseup', handleMouseUp)
      return () => document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isHighlightMode, handleMouseUp])

  // Handle click on existing highlight
  const handleHighlightClick = useCallback((highlight: HighlightData) => {
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
      setModalVisible(false)
      exitHighlightMode()
    },
    [
      pendingSelection,
      addHighlight,
      editingHighlight,
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
        false, // isPublic default false
        highlightText,
      )
    }
    setPendingSelection(null)
    setEditingHighlight(null)
    setModalVisible(false)
    // Re-enter highlight mode to allow more selections
    enterHighlightMode(postUri)
  }, [pendingSelection, addHighlight, enterHighlightMode, postUri, text])

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

  // If no highlights and not in highlight mode, use regular RichText
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

  // Render text with highlights
  const renderHighlightedText = () => {
    if (highlights.length === 0) {
      return (
        <RichText
          value={richText}
          style={style}
          numberOfLines={numberOfLines}
          selectable={isHighlightMode || selectable}
          enableTags={enableTags}
          authorHandle={authorHandle}
        />
      )
    }

    // Sort highlights by start position
    const sortedHighlights = [...highlights].sort((a, b) => a.start - b.start)

    const parts: React.ReactNode[] = []
    let lastEnd = 0

    sortedHighlights.forEach((highlight, index) => {
      // Add unhighlighted text before this highlight
      if (highlight.start > lastEnd) {
        parts.push(
          <span key={`text-${index}`}>
            {text.slice(lastEnd, highlight.start)}
          </span>,
        )
      }

      // Add highlighted text
      parts.push(
        <span
          key={`highlight-${index}`}
          onClick={() => handleHighlightClick(highlight)}
          style={{
            backgroundColor: highlight.color,
            cursor: 'pointer',
            borderRadius: 2,
            padding: '0 2px',
          }}>
          {text.slice(highlight.start, highlight.end)}
        </span>,
      )

      lastEnd = highlight.end
    })

    // Add remaining text
    if (lastEnd < text.length) {
      parts.push(<span key="text-end">{text.slice(lastEnd)}</span>)
    }

    return (
      <div
        style={{
          color: t.atoms.text.color,
          cursor: isHighlightMode ? 'text' : 'default',
          userSelect: isHighlightMode ? 'text' : 'auto',
        }}>
        {parts}
      </div>
    )
  }

  return (
    <View ref={containerRef}>
      {renderHighlightedText()}

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

HighlightableRichText = memo(HighlightableRichText)
export {HighlightableRichText}
