import {useCallback} from 'react'
import {withSpring} from 'react-native-reanimated'
import {useFocusEffect} from '@react-navigation/native'

import {
  type CommonNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {makeRecordUri} from '#/lib/strings/url-helpers'
import {useMinimalShellMode} from '#/state/shell'
import {PostThread} from '#/screens/PostThread'
import * as Layout from '#/components/Layout'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'PostThread'>
export function PostThreadScreen({route}: Props) {
  const {headerMode} = useMinimalShellMode()
  const showHeader = useCallback(() => {
    'worklet'
    headerMode.set(() => withSpring(0, {overshootClamping: true}))
  }, [headerMode])

  const {name, rkey} = route.params
  const uri = makeRecordUri(name, 'app.bsky.feed.post', rkey)

  useFocusEffect(
    useCallback(() => {
      showHeader()
    }, [showHeader]),
  )

  return (
    <Layout.Screen testID="postThreadScreen">
      <PostThread uri={uri} />
    </Layout.Screen>
  )
}
