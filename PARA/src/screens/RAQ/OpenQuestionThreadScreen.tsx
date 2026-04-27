import {Fragment} from 'react'
import {ScrollView, View} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {Trans} from '@lingui/react/macro'
import {type RouteProp, useRoute} from '@react-navigation/native'

import {OPEN_QUESTIONS as MOCK_OPEN_QUESTIONS} from '#/lib/mock-data'
import {type CommonNavigatorParams} from '#/lib/routes/types'
import * as Layout from '#/components/Layout'
import {Text} from '#/components/Typography'
import {
  OpenQuestionAnchor,
  OpenQuestionReply,
  type OpenQuestionReplyData,
} from './components/OpenQuestionItem'

// Mock comments data
const MOCK_COMMENTS: OpenQuestionReplyData[] = [
  {
    id: 'c1',
    text: 'This is a critical issue. We need better infrastructure first.',
    author: {handle: 'user1', avatar: ''},
    votes: 12,
    replies: [
      {
        id: 'c1-1',
        text: 'Agreed. Public transport is key.',
        author: {handle: 'transit_fan', avatar: ''},
        votes: 5,
      },
    ],
  },
  {
    id: 'c2',
    text: "I think it's more about zoning laws.",
    author: {handle: 'urbanist_pro', avatar: ''},
    votes: 8,
  },
]

export default function OpenQuestionThreadScreen() {
  const route =
    useRoute<RouteProp<CommonNavigatorParams, 'OpenQuestionThread'>>()
  const {id} = route.params
  const insets = useSafeAreaInsets()

  const question = MOCK_OPEN_QUESTIONS.find(q => q.id === id)

  if (!question) {
    return (
      <Layout.Screen>
        <Layout.Header.Outer>
          <Layout.Header.BackButton />
          <Layout.Header.Content>
            <Layout.Header.TitleText>
              <Trans>Error</Trans>
            </Layout.Header.TitleText>
          </Layout.Header.Content>
        </Layout.Header.Outer>
        <Layout.Center>
          <View style={{padding: 16}}>
            <Text>
              <Trans>Question not found</Trans>
            </Text>
          </View>
        </Layout.Center>
      </Layout.Screen>
    )
  }

  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans context="description">Thread</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
      </Layout.Header.Outer>
      <ScrollView
        contentContainerStyle={{
          minHeight: '100%',
          paddingBottom: insets.bottom + 40,
        }}>
        <Layout.Center>
          {/* Main Question Post - Using OpenQuestionAnchor */}
          <OpenQuestionAnchor question={question} />

          {/* Comments Section - Using OpenQuestionReply */}
          <View>
            {MOCK_COMMENTS.map((comment, index) => (
              <Fragment key={comment.id}>
                <OpenQuestionReply
                  reply={comment}
                  isFirst={index === 0}
                  showChildReplyLine={
                    comment.replies && comment.replies.length > 0
                  }
                />
                {/* Nested replies */}
                {comment.replies?.map(nestedReply => (
                  <OpenQuestionReply key={nestedReply.id} reply={nestedReply} />
                ))}
              </Fragment>
            ))}
          </View>
        </Layout.Center>
      </ScrollView>
    </Layout.Screen>
  )
}
