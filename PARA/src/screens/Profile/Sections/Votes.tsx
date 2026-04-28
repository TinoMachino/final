import {forwardRef, useEffect, useImperativeHandle} from 'react'
import {findNodeHandle, View} from 'react-native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'

import {EmptyState} from '#/view/com/util/EmptyState'
import {List} from '#/view/com/util/List'
import {type ListRef} from '#/view/com/util/List'
import {atoms as a, useTheme} from '#/alf'
import {EditBig_Stroke1_Corner0_Rounded as EditIcon} from '#/components/icons/EditBig'
import {Text} from '#/components/Typography'
import {IS_IOS} from '#/env'
import {useProfileVotesQuery} from '#/state/queries/profile-votes'
import {type SectionRef} from './types'

interface Props {
  did?: string
  headerHeight: number
  scrollElRef: ListRef
  setScrollViewTag: (tag: number | null) => void
  isFocused: boolean
}

export const ProfileVotesSection = forwardRef<SectionRef, Props>(
  function ProfileVotesSection(
    {did, headerHeight, scrollElRef, setScrollViewTag, isFocused},
    ref,
  ) {
    const t = useTheme()
    const {_} = useLingui()
    const {data: votes = [], isLoading} = useProfileVotesQuery(did || '')

    useImperativeHandle(ref, () => ({
      scrollToTop: () => {
        scrollElRef.current?.scrollToOffset({
          offset: -headerHeight,
          animated: true,
        })
      },
    }))

    useEffect(() => {
      if (IS_IOS && isFocused && scrollElRef.current) {
        // @ts-ignore
        const nativeTag = findNodeHandle(scrollElRef.current)
        setScrollViewTag(nativeTag)
      }
    }, [isFocused, scrollElRef, setScrollViewTag])

    const renderItem = ({item}: {item: import('#/state/queries/profile-votes').ProfileVoteItem}) => {
      const voteColor =
        item.voteColor === 'positive'
          ? t.palette.positive_600
          : item.voteColor === 'negative'
            ? t.palette.negative_600
            : item.voteColor === 'warning'
              ? t.palette.yellow
              : t.atoms.text_contrast_medium.color

      return (
        <View style={[a.p_md, a.border_b, t.atoms.border_contrast_low]}>
          <Text style={[a.text_md, a.font_bold]} numberOfLines={2}>
            {item.subject || 'Vote'}
          </Text>
          <View style={[a.flex_row, a.justify_between, a.mt_xs]}>
            <Text style={[t.atoms.text_contrast_medium]}>
              Voted:{' '}
              <Text style={[a.font_bold, {color: voteColor}]}>
                {item.vote}
              </Text>
            </Text>
            <Text style={[t.atoms.text_contrast_low]}>
              {item.date
                ? new Date(item.date).toLocaleDateString()
                : ''}
            </Text>
          </View>
          {item.reason ? (
            <Text
              style={[
                a.text_sm,
                t.atoms.text_contrast_medium,
                a.mt_xs,
              ]}
              numberOfLines={2}>
              {item.reason}
            </Text>
          ) : null}
        </View>
      )
    }

    return (
      <List
        ref={scrollElRef}
        data={votes}
        renderItem={renderItem}
        keyExtractor={(item: import('#/state/queries/profile-votes').ProfileVoteItem) => item.id}
        headerOffset={headerHeight}
        refreshing={isLoading}
        ListEmptyComponent={
          <EmptyState
            icon={EditIcon}
            message={_(msg`No public votes yet`)}
            style={{width: '100%'}}
          />
        }
        contentContainerStyle={{
          minHeight: '100%',
          paddingBottom: 100,
        }}
      />
    )
  },
)
