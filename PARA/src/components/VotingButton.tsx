import {useMemo, useState} from 'react'
import {Platform, Pressable, StyleSheet} from 'react-native'
import {Gesture, GestureDetector} from 'react-native-gesture-handler'
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated'

import {useTheme} from '#/alf'
import {
  ArrowBottom_Stroke2_Corner0_Rounded as ArrowDown,
  ArrowTop_Stroke2_Corner0_Rounded as ArrowUp,
} from '#/components/icons/Arrow'

interface VotingButtonProps {
  initialVote?: number
  onVoteChange?: (vote: number) => void
}

type WebEventBoundary = {
  stopPropagation?: () => void
}

export function VotingButton({
  initialVote = 0,
  onVoteChange,
}: VotingButtonProps) {
  const t = useTheme()
  const [currentVote, setCurrentVote] = useState(initialVote)
  const translateY = useSharedValue(0)
  const scale = useSharedValue(1)
  const isActive = useSharedValue(false)

  const pan = Gesture.Pan()
    .onBegin(() => {
      isActive.value = true
      scale.value = withSpring(1.1)
    })
    .onUpdate(event => {
      // Limit visual movement to +/- 100px
      const clampedTranslation = Math.max(
        -100,
        Math.min(100, event.translationY),
      )
      translateY.value = clampedTranslation

      // Calculate potential vote for visual feedback only
      const dragDistance = -clampedTranslation
      const step = 30
      let newVote = 0
      if (Math.abs(dragDistance) > step / 2) {
        newVote = Math.round(dragDistance / step)
      }
      newVote = Math.max(-3, Math.min(3, newVote))

      // Update local state for visual feedback (colors/text)
      if (newVote !== currentVote) {
        runOnJS(setCurrentVote)(newVote)
      }
    })
    .onFinalize(() => {
      isActive.value = false
      translateY.value = withSpring(0)
      scale.value = withSpring(1)

      // Commit the vote here
      if (onVoteChange) {
        runOnJS(onVoteChange)(currentVote)
      }
    })

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{translateY: translateY.value}, {scale: scale.value}],
    }
  })

  const voteTextStyle = useAnimatedStyle(() => {
    const color =
      currentVote > 0
        ? '#4CAF50'
        : currentVote < 0
          ? '#FF4444'
          : t.atoms.text.color
    return {
      color: withTiming(color),
      fontWeight: 'bold',
      fontSize: 16,
    }
  })

  const upArrowStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(currentVote > 0 ? 1 : 0.3),
      transform: [{scale: withSpring(currentVote > 0 ? 1.2 : 1)}],
    }
  })

  const downArrowStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(currentVote < 0 ? 1 : 0.3),
      transform: [{scale: withSpring(currentVote < 0 ? 1.2 : 1)}],
    }
  })

  const webEventBlockers = useMemo(() => {
    if (Platform.OS !== 'web') return {}

    const stopPropagation = (event: WebEventBoundary) => {
      event.stopPropagation?.()
    }

    return {
      onClickCapture: stopPropagation,
      onMouseDown: stopPropagation,
      onMouseUp: stopPropagation,
      onPointerDown: stopPropagation,
      onPointerUp: stopPropagation,
      onStartShouldSetResponder: () => true,
      onResponderTerminationRequest: () => false,
    }
  }, [])

  return (
    <Pressable 
      style={styles.container} 
      {...webEventBlockers}
      onPress={(e) => {
        if (e && e.stopPropagation) {
          e.stopPropagation()
        }
      }}
    >
      <GestureDetector gesture={pan}>
        <Animated.View
          style={[
            styles.control,
            animatedStyle,
            {
              backgroundColor: t.palette.contrast_25 + '30',
              borderColor: t.palette.contrast_50 + '40',
            },
          ]}>
          <Animated.View style={upArrowStyle}>
            <ArrowUp
              size="sm"
              style={{color: currentVote > 0 ? '#4CAF50' : t.atoms.text.color}}
            />
          </Animated.View>

          <Animated.Text style={[styles.voteText, voteTextStyle]}>
            {currentVote > 0 ? `+${currentVote}` : currentVote}
          </Animated.Text>

          <Animated.View style={downArrowStyle}>
            <ArrowDown
              size="sm"
              style={{color: currentVote < 0 ? '#FF4444' : t.atoms.text.color}}
            />
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  control: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 20,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  voteText: {
    fontSize: 16,
    textAlign: 'center',
    minWidth: 24,
  },
})
