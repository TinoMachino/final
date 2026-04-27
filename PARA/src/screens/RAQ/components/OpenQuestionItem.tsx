import {memo} from 'react'
import {View} from 'react-native'
import {Trans} from '@lingui/react/macro'

import {type OpenQuestion as OpenQuestionData} from '#/lib/mock-data'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {
  LINEAR_AVI_WIDTH,
  OUTER_SPACE,
  REPLY_LINE_WIDTH,
} from '#/screens/PostThread/const'
import {atoms as a, useTheme} from '#/alf'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import {RedditVoteButton} from '#/components/PostControls/VoteButton'
import {SubtleHover} from '#/components/SubtleHover'
import {Text} from '#/components/Typography'

export interface OpenQuestionReplyData {
  id: string
  text: string
  author: {
    handle: string
    avatar: string
  }
  votes: number
  replies?: OpenQuestionReplyData[]
}

/**
 * Anchor post for an Open Question thread.
 * Mirrors the visual structure of ThreadItemAnchor.
 */
export const OpenQuestionAnchor = memo(function OpenQuestionAnchor({
  question,
}: {
  question: OpenQuestionData
}) {
  const t = useTheme()

  return (
    <View
      testID={`openQuestionAnchor-${question.id}`}
      style={[
        {
          paddingHorizontal: OUTER_SPACE,
        },
        a.pt_lg,
      ]}>
      {/* Author row - matching ThreadItemAnchor layout */}
      <View style={[a.flex_row, a.gap_md, a.pb_md]}>
        <View collapsable={false}>
          <UserAvatar
            size={LINEAR_AVI_WIDTH}
            type="user"
            avatar={question.author.avatar}
          />
        </View>
        <View style={[a.flex_1]}>
          {/* First line: handle + user flair + dot + timestamp */}
          <View style={[a.flex_row, a.align_center, a.flex_wrap]}>
            <Text
              style={[a.text_md, a.font_semi_bold, a.leading_snug]}
              numberOfLines={1}>
              @{question.author.handle}
            </Text>
            {/* User Flair - inline like "Lib-Left" */}
            <View
              style={[
                a.ml_xs,
                a.px_xs,
                a.py_2xs,
                a.rounded_xs,
                {backgroundColor: '#dcfce7'},
              ]}>
              <Text style={[a.text_xs, a.font_bold, {color: '#166534'}]}>
                Urbanist
              </Text>
            </View>
            <Text
              style={[
                a.text_md,
                a.leading_snug,
                t.atoms.text_contrast_medium,
                a.ml_xs,
              ]}
              numberOfLines={1}>
              · {question.timestamp}
            </Text>
          </View>
        </View>
      </View>

      {/* Content area */}
      <View style={[a.pb_sm]}>
        {/* Question text - matching ThreadItemAnchor large text style */}
        <Text style={[a.flex_1, a.text_lg, a.pb_sm]}>{question.text}</Text>

        {/* Post Flair - below content like "Agenda Post" */}
        <View
          style={[
            a.self_start,
            a.rounded_xs,
            a.px_sm,
            a.py_xs,
            a.mb_md,
            {backgroundColor: '#ede9fe'},
          ]}>
          <Text style={[a.text_xs, a.font_bold, {color: '#7c3aed'}]}>
            Open Question
          </Text>
        </View>

        {/* Stats row - like ExpandedPostDetails */}
        <View
          style={[
            a.flex_row,
            a.align_center,
            a.gap_lg,
            a.border_t,
            a.border_b,
            a.py_md,
            t.atoms.border_contrast_low,
          ]}>
          <Text style={[a.text_md, t.atoms.text_contrast_medium]}>
            <Text style={[a.text_md, a.font_semi_bold, t.atoms.text]}>
              {question.replyCount}
            </Text>{' '}
            <Trans>replies</Trans>
          </Text>
        </View>

        {/* Controls row - matching ThreadItemAnchor PostControls area */}
        <View style={[a.pt_sm, a.pb_2xs, {marginLeft: -5}]}>
          <RedditVoteButton
            score={question.replyCount * 2}
            currentVote="none"
            hasBeenToggled={false}
            onUpvote={() => {}}
            onDownvote={() => {}}
          />
        </View>
      </View>
    </View>
  )
})

/**
 * Reply post for an Open Question thread.
 * Mirrors the visual structure of ThreadItemPost.
 */
export const OpenQuestionReply = memo(function OpenQuestionReply({
  reply,
  isFirst,
  showChildReplyLine,
}: {
  reply: OpenQuestionReplyData
  isFirst?: boolean
  showChildReplyLine?: boolean
}) {
  const t = useTheme()

  return (
    <SubtleHoverWrapper>
      <View
        style={[
          isFirst && [a.border_t, t.atoms.border_contrast_low],
          {paddingHorizontal: OUTER_SPACE},
          {paddingBottom: OUTER_SPACE / 2},
        ]}>
        {/* Parent reply line spacer - like ThreadItemPostParentReplyLine */}
        <View style={[a.flex_row, {height: 12}]}>
          <View style={{width: LINEAR_AVI_WIDTH}} />
        </View>

        {/* Reply content - like ThreadItemPostInner */}
        <View style={[a.flex_row, a.gap_md]}>
          <View>
            <View
              style={[
                {width: LINEAR_AVI_WIDTH, height: LINEAR_AVI_WIDTH},
                a.rounded_full,
                t.atoms.bg_contrast_25,
              ]}
            />

            {/* Child reply line */}
            {showChildReplyLine && (
              <View
                style={[
                  a.mx_auto,
                  a.mt_xs,
                  a.flex_1,
                  {
                    width: REPLY_LINE_WIDTH,
                    backgroundColor: t.atoms.border_contrast_low.borderColor,
                  },
                ]}
              />
            )}
          </View>

          <View style={[a.flex_1]}>
            {/* Meta row - matching PostMeta structure */}
            <View style={[a.flex_row, a.align_center, a.pb_xs, a.gap_xs]}>
              <Text style={[a.text_md, a.font_semi_bold]}>
                @{reply.author.handle}
              </Text>
            </View>

            {/* Reply text - matching RichText area */}
            <Text style={[a.flex_1, a.text_md, a.pb_xs]}>{reply.text}</Text>

            {/* Controls - matching PostControls */}
            <View style={[a.flex_row, a.align_center, a.gap_md, a.pb_sm]}>
              <RedditVoteButton
                score={reply.votes}
                currentVote="none"
                hasBeenToggled={false}
                onUpvote={() => {}}
                onDownvote={() => {}}
              />
              <Text style={[t.atoms.text_contrast_medium, a.text_sm]}>
                <Trans>Reply</Trans>
              </Text>
            </View>
          </View>
        </View>
      </View>
    </SubtleHoverWrapper>
  )
})

/**
 * Nested reply with indentation and reply lines.
 * Mirrors ThreadItemTreePost for nested view.
 */
export const OpenQuestionNestedReply = memo(function OpenQuestionNestedReply({
  reply,
  depth,
}: {
  reply: OpenQuestionReplyData
  depth: number
}) {
  const t = useTheme()
  const hasChildren = reply.replies && reply.replies.length > 0

  return (
    <>
      <View
        style={[
          a.flex_row,
          depth === 1 && [a.border_t, t.atoms.border_contrast_low],
        ]}>
        {/* Indent lines - matching ThreadItemTreePostOuterWrapper */}
        {Array.from(Array(Math.max(0, depth - 1))).map((_, n) => (
          <View
            key={`${reply.id}-indent-${n}`}
            style={[
              t.atoms.border_contrast_low,
              {
                borderRightWidth: REPLY_LINE_WIDTH,
                width: OUTER_SPACE + LINEAR_AVI_WIDTH / 2,
                left: 1,
              },
            ]}
          />
        ))}

        {/* Content area - matching ThreadItemTreePostInnerWrapper */}
        <View
          style={[
            a.flex_1,
            {
              paddingHorizontal: OUTER_SPACE,
              paddingTop: OUTER_SPACE / 2,
            },
            depth === 1 && {paddingTop: OUTER_SPACE / 1.5},
          ]}>
          {/* Corner line for nested replies */}
          {depth > 1 && (
            <View
              style={[
                a.absolute,
                t.atoms.border_contrast_low,
                {
                  left: -1,
                  top: 0,
                  height:
                    LINEAR_AVI_WIDTH / 2 +
                    REPLY_LINE_WIDTH / 2 +
                    OUTER_SPACE / 2,
                  width: OUTER_SPACE,
                  borderLeftWidth: REPLY_LINE_WIDTH,
                  borderBottomWidth: REPLY_LINE_WIDTH,
                  borderBottomLeftRadius: a.rounded_sm.borderRadius,
                },
              ]}
            />
          )}

          <View style={[a.flex_1]}>
            {/* Author + avatar row */}
            <View style={[a.flex_row, a.align_center, a.gap_xs, a.pb_xs]}>
              <View
                style={[
                  {width: 24, height: 24},
                  a.rounded_full,
                  t.atoms.bg_contrast_25,
                ]}
              />
              <Text style={[a.text_md, a.font_semi_bold]}>
                @{reply.author.handle}
              </Text>
            </View>

            {/* Content with child reply line */}
            <View style={[a.flex_row]}>
              {/* Child reply line area */}
              <View style={[a.relative, a.pt_2xs, {width: 24 + a.gap_xs.gap}]}>
                {hasChildren && (
                  <View
                    style={[
                      a.flex_1,
                      t.atoms.border_contrast_low,
                      {borderRightWidth: 2, width: '50%', left: -1},
                    ]}
                  />
                )}
              </View>

              <View style={[a.flex_1, a.pl_2xs]}>
                <Text style={[a.flex_1, a.text_md, a.pb_xs]}>{reply.text}</Text>

                <View style={[a.flex_row, a.align_center, a.gap_md, a.pb_sm]}>
                  <RedditVoteButton
                    score={reply.votes}
                    currentVote="none"
                    hasBeenToggled={false}
                    onUpvote={() => {}}
                    onDownvote={() => {}}
                  />
                  <Text style={[t.atoms.text_contrast_medium, a.text_sm]}>
                    <Trans>Reply</Trans>
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Nested replies */}
      {reply.replies?.map(nestedReply => (
        <OpenQuestionNestedReply
          key={nestedReply.id}
          reply={nestedReply}
          depth={depth + 1}
        />
      ))}
    </>
  )
})

function SubtleHoverWrapper({children}: {children: React.ReactNode}) {
  const {
    state: hover,
    onIn: onHoverIn,
    onOut: onHoverOut,
  } = useInteractionState()
  return (
    <View
      onPointerEnter={onHoverIn}
      onPointerLeave={onHoverOut}
      style={a.pointer}>
      <SubtleHover hover={hover} />
      {children}
    </View>
  )
}
