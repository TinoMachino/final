import {View} from 'react-native'

import {Text} from '#/view/com/util/text/Text'
import {useTheme} from '#/alf'
import {Bubble_Stroke2_Corner2_Rounded as CommentIcon} from '#/components/icons/Bubble'
import {PageText_Stroke2_Corner0_Rounded as PageTextIcon} from '#/components/icons/PageText'
import {RedditVoteButton} from '#/components/PostControls/VoteButton'
import {ActionButton, MediaVisualMeta} from '../cardPrimitives'
import {buildSubmetaLabel} from '../helpers'
import {styles} from '../styles'
import {type MediaItem, type Mode} from '../types'

export function MediaBoardCard({
  item,
  mode,
  vote,
  onVoteChange,
  width,
}: {
  item: MediaItem
  mode: Mode
  vote: 1 | -1 | 0
  onVoteChange: (vote: 1 | -1 | 0) => void
  width?: number
}) {
  const t = useTheme()
  const isMeme = mode === 'Memes'
  const score = item.votes + vote
  const voteState = vote === 1 ? 'upvote' : vote === -1 ? 'downvote' : 'none'

  return (
    <View
      style={[
        styles.cardShell,
        t.atoms.bg_contrast_50,
        width ? {width} : null,
      ]}>
      <View
        style={[
          styles.cardVisual,
          mode === 'Documents' && styles.documentVisual,
          {backgroundColor: item.color, minHeight: 196},
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

      <View style={[styles.cardBody, t.atoms.bg_contrast_50]}>
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
        </View>
      </View>
    </View>
  )
}
