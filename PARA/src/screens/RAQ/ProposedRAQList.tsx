import {FlatList, StyleSheet, View} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'

import {
  PROPOSED_QUESTIONS as MOCK_PROPOSED_QUESTIONS,
  type ProposedQuestion,
} from '#/lib/mock-data'
import {Text} from '#/view/com/util/text/Text'
import {useTheme} from '#/alf'
import * as Layout from '#/components/Layout'
import {RedditVoteButton} from '#/components/PostControls/VoteButton'
import {VotingButtonHorizontal} from '#/components/VotingButtonHorizontal'

export default function ProposedRAQListScreen() {
  const t = useTheme()
  useLingui()
  const insets = useSafeAreaInsets()

  const renderItem = ({item}: {item: ProposedQuestion}) => (
    <View style={[styles.itemCard, t.atoms.bg, t.atoms.border_contrast_low]}>
      <View style={styles.header}>
        <Text style={[styles.questionText, t.atoms.text]}>{item.text}</Text>
        {item.targetCommunity && (
          <Text style={[t.atoms.text_contrast_medium, styles.metaText]}>
            <Trans>Proposed for: {item.targetCommunity}</Trans>
          </Text>
        )}
      </View>

      <View style={styles.controlsRow}>
        {/* Promotion Vote */}
        <View style={styles.group}>
          <Text style={[t.atoms.text_contrast_medium, styles.label]}>
            <Trans>Promote:</Trans>
          </Text>
          <RedditVoteButton
            score={item.upvotes - item.downvotes}
            currentVote="none"
            hasBeenToggled={false}
            onUpvote={() => {}}
            onDownvote={() => {}}
          />
        </View>

        {/* Answer Vote */}
        <View style={styles.group}>
          <Text style={[t.atoms.text_contrast_medium, styles.label]}>
            <Trans>Your Answer:</Trans>
          </Text>
          <VotingButtonHorizontal initialVote={0} onVoteChange={() => {}} />
        </View>
      </View>
    </View>
  )

  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Proposed RAQs</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
      </Layout.Header.Outer>

      <Layout.Center style={{flex: 1}}>
        <FlatList
          data={MOCK_PROPOSED_QUESTIONS}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={[
            styles.list,
            {paddingBottom: insets.bottom + 20},
          ]}
        />
      </Layout.Center>
    </Layout.Screen>
  )
}

const styles = StyleSheet.create({
  list: {
    padding: 16,
    gap: 16,
  },
  itemCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  header: {
    gap: 4,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  metaText: {
    fontSize: 12,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: '#333', // Fallback, usually obscured by theme border
    paddingTop: 12,
  },
  group: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
  },
})
