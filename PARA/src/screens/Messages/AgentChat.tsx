import {useState} from 'react'
import {
  Platform,
  Pressable,
  type ScrollView,
  TextInput,
  View,
} from 'react-native'
import {useKeyboardHandler} from 'react-native-keyboard-controller'
import Animated, {
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated'
import {RichText as RichTextAPI} from '@atproto/api'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {type RouteProp, useRoute} from '@react-navigation/native'

import {useHideBottomBarBorderForScreen} from '#/lib/hooks/useHideBottomBarBorder'
import {type CommonNavigatorParams} from '#/lib/routes/types'
import {useShellLayout} from '#/state/shell/shell-layout'
import {atoms as a, useTheme} from '#/alf'
import {Macintosh_Stroke2_Corner2_Rounded as MacintoshIcon} from '#/components/icons/Macintosh'
import {PaperPlane_Stroke2_Corner0_Rounded as SendIcon} from '#/components/icons/PaperPlane'
import * as Layout from '#/components/Layout'
import {RichText} from '#/components/RichText'
import {Text} from '#/components/Typography'

type AgentChatMessage = {
  id: string
  text: string
  sender: 'user' | 'agent'
  timestamp: Date
}

export function AgentChatScreen() {
  const t = useTheme()
  const route = useRoute<RouteProp<CommonNavigatorParams, 'AgentChat'>>()
  const {_} = useLingui()
  const {agentId} = route.params
  const {footerHeight} = useShellLayout()

  useHideBottomBarBorderForScreen()

  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<AgentChatMessage[]>([
    {
      id: '1',
      text: `Hola, soy ${agentId}. ¿En qué puedo ayudarte hoy?`,
      sender: 'agent',
      timestamp: new Date(),
    },
  ])

  const scrollViewRef = useAnimatedRef<ScrollView>()

  const onSendMessage = () => {
    if (!message.trim()) return

    const newUserMessage: AgentChatMessage = {
      id: Math.random().toString(),
      text: message.trim(),
      sender: 'user',
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, newUserMessage])
    setMessage('')

    setTimeout(() => {
      const agentResponse: AgentChatMessage = {
        id: Math.random().toString(),
        text: `Entiendo lo que dices sobre "${message.trim()}". Como tu asistente de comunidad, estoy analizando la situación.`,
        sender: 'agent',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, agentResponse])
    }, 1000)
  }

  // Sticky footer logic derived from MessagesList.tsx
  // This ensures the input bar accurately reflects the shell's footer (tab bar)
  // and moves smoothly with the keyboard.
  const keyboardHeight = useSharedValue(0)
  useKeyboardHandler({
    onMove: e => {
      'worklet'
      keyboardHeight.set(e.height)
    },
    onEnd: e => {
      'worklet'
      keyboardHeight.set(e.height)
    },
  })

  const animatedStickyViewStyle = useAnimatedStyle(() => ({
    transform: [
      {translateY: -Math.max(keyboardHeight.get(), footerHeight.get())},
    ],
  }))

  const animatedListStyle = useAnimatedStyle(() => ({
    marginBottom: Math.max(keyboardHeight.get(), footerHeight.get()),
  }))

  return (
    <Layout.Screen testID="agentChatScreen">
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <View style={[a.flex_row, a.align_center, a.gap_md]}>
            <View
              style={[
                {width: 34, height: 34},
                a.rounded_full,
                a.justify_center,
                a.align_center,
                t.atoms.bg_contrast_25,
              ]}>
              <MacintoshIcon style={{color: t.palette.primary_500}} size="sm" />
            </View>
            <View>
              <Layout.Header.TitleText>{agentId}</Layout.Header.TitleText>
            </View>
          </View>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>

      <Layout.Center style={[a.flex_1]}>
        <Animated.ScrollView
          ref={scrollViewRef as any}
          style={[a.flex_1, animatedListStyle]}
          contentContainerStyle={[a.px_md, a.pt_md, {paddingBottom: 20}]}
          onContentSizeChange={() =>
            (scrollViewRef.current as any)?.scrollToEnd({animated: true})
          }>
          {messages.map(chatMessage => {
            const isFromSelf = chatMessage.sender === 'user'
            const rt = new RichTextAPI({text: chatMessage.text})

            return (
              <View
                key={chatMessage.id}
                style={[a.mb_md, isFromSelf ? a.align_end : a.align_start]}>
                <View
                  style={[
                    a.py_sm,
                    a.px_md,
                    {
                      backgroundColor: isFromSelf
                        ? t.palette.primary_500
                        : t.palette.contrast_50,
                      borderRadius: 17,
                      maxWidth: '85%',
                    },
                    isFromSelf
                      ? {borderBottomRightRadius: 2}
                      : {borderBottomLeftRadius: 2},
                  ]}>
                  <RichText
                    value={rt}
                    style={[a.text_md, isFromSelf && {color: t.palette.white}]}
                  />
                </View>
                <Text
                  style={[a.text_xs, a.mt_2xs, t.atoms.text_contrast_medium]}>
                  {chatMessage.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            )
          })}
        </Animated.ScrollView>

        <Animated.View
          style={[
            a.px_md,
            a.pb_sm,
            a.pt_xs,
            t.atoms.bg,
            animatedStickyViewStyle,
            {
              borderTopWidth: 1,
              borderTopColor: t.palette.contrast_100,
            },
          ]}>
          <View
            style={[
              a.w_full,
              a.flex_row,
              t.atoms.bg_contrast_25,
              {
                padding: a.p_sm.padding - 2,
                paddingLeft: a.p_md.padding - 2,
                borderWidth: 1,
                borderRadius: 23,
                borderColor: 'transparent',
              },
            ]}>
            <TextInput
              accessibilityLabel="Text input field"
              accessibilityHint="Type your message to the AI agent"
              style={[
                a.flex_1,
                a.text_md,
                a.px_sm,
                t.atoms.text,
                {
                  maxHeight: 120,
                  paddingBottom: Platform.OS === 'ios' ? 5 : 0,
                },
              ]}
              placeholder={_(msg`Escribe un mensaje...`)}
              placeholderTextColor={t.palette.contrast_500}
              value={message}
              onChangeText={setMessage}
              multiline
              keyboardAppearance={t.scheme}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={_(msg`Send message`)}
              accessibilityHint="Sends your message to the AI agent"
              style={[
                a.rounded_full,
                a.align_center,
                a.justify_center,
                {
                  height: 30,
                  width: 30,
                  backgroundColor: t.palette.primary_500,
                },
              ]}
              onPress={onSendMessage}>
              <SendIcon
                fill={t.palette.white}
                style={[{position: 'relative', left: 1}]}
              />
            </Pressable>
          </View>
        </Animated.View>
      </Layout.Center>
    </Layout.Screen>
  )
}
