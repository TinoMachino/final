import {Modal, Pressable, View} from 'react-native'

import {Text} from '#/view/com/util/text/Text'
import {useTheme} from '#/alf'
import {ArrowsDiagonalOut_Stroke2_Corner2_Rounded as ExpandIcon} from '#/components/icons/ArrowsDiagonal'
import {Bubble_Stroke2_Corner2_Rounded as CommentIcon} from '#/components/icons/Bubble'
import {PageText_Stroke2_Corner0_Rounded as PageTextIcon} from '#/components/icons/PageText'
import {RedditVoteButton} from '#/components/PostControls/VoteButton'
import {ActionButton, MediaVisualMeta} from '../cardPrimitives'
import {buildSubmetaLabel} from '../helpers'
import {styles} from '../styles'
import {type MediaItem, type Mode} from '../types'

export function ExpandedMediaCardModal({
  item,
  mode,
  vote,
  onClose,
  onVoteChange,
}: {
  item: MediaItem | null
  mode: Mode
  vote: 1 | -1 | 0
  onClose: () => void
  onVoteChange: (vote: 1 | -1 | 0) => void
}) {
  const t = useTheme()

  if (!item) return null

  const score = item.votes + vote
  const voteState = vote === 1 ? 'upvote' : vote === -1 ? 'downvote' : 'none'
  const isMeme = mode === 'Memes'

  return (
    <Modal
      animationType="fade"
      transparent
      visible={Boolean(item)}
      onRequestClose={onClose}>
      <View style={styles.expandedModalOverlay}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cerrar vista expandida"
          accessibilityHint="Cierra la tarjeta expandida"
          onPress={onClose}
          style={styles.expandedModalDismiss}
        />

        <View style={[styles.expandedModalSheet, t.atoms.bg]}>
          <View style={[styles.expandedHandle, t.atoms.bg_contrast_100]} />

          <View
            style={[
              styles.expandedVisual,
              mode === 'Documents' && styles.documentVisual,
              {backgroundColor: item.color},
            ]}>
            <View style={styles.cardBadgeRow}>
              <Text style={styles.cardBadge}>
                {isMeme ? item.community : item.category}
              </Text>
              {!isMeme ? (
                <View style={styles.documentGlyph}>
                  <PageTextIcon size="sm" style={{color: '#FFFFFF'}} />
                </View>
              ) : null}
            </View>

            <View style={styles.cardVisualBottom}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <MediaVisualMeta item={item} mode={mode} />
            </View>
          </View>

          <View style={styles.expandedBody}>
            <Text style={[styles.cardMeta, t.atoms.text_contrast_medium]}>
              {item.party} · {item.state}
            </Text>
            <Text style={[styles.cardSubmeta, t.atoms.text_contrast_medium]}>
              {buildSubmetaLabel(item, mode)}
            </Text>

            <View style={styles.actionsRow}>
              <RedditVoteButton
                score={score}
                currentVote={voteState}
                hasBeenToggled={vote !== 0}
                onUpvote={() => onVoteChange(vote === 1 ? 0 : 1)}
                onDownvote={() => onVoteChange(vote === -1 ? 0 : -1)}
              />

              <ActionButton
                icon={<CommentIcon size="sm" style={t.atoms.text_contrast_medium} />}
                label={String(item.comments)}
                onPress={() => {}}
              />

              <ActionButton
                icon={<ExpandIcon size="sm" style={t.atoms.text_contrast_medium} />}
                label="Cerrar"
                onPress={onClose}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  )
}
