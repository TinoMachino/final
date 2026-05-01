import {useEffect, useMemo, useState} from 'react'
import {Platform, Pressable, StyleSheet, View} from 'react-native'
import {Gesture, GestureDetector} from 'react-native-gesture-handler'
import Animated, {
  interpolateColor,
  runOnJS,
  useAnimatedProps,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSequence,
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
  
  // Base scales for the arrows (shared values for smooth combining)
  const upBaseScale = useSharedValue(initialVote > 0 ? 1.2 : 1)
  const downBaseScale = useSharedValue(initialVote < 0 ? 1.2 : 1)
  
  // Flash animations for clicks
  const upFlash = useSharedValue(0)
  const downFlash = useSharedValue(0)

  // Update base scales when currentVote changes
  useEffect(() => {
    upBaseScale.value = withSpring(currentVote > initialVote ? 1.2 : 1)
    downBaseScale.value = withSpring(currentVote < initialVote ? 1.2 : 1)
  }, [currentVote, initialVote, upBaseScale, downBaseScale])

  const pan = Gesture.Pan()
    .onBegin(() => {
      isActive.value = true
      scale.value = withSpring(1.1)
    })
    .onUpdate(event => {
      const clampedTranslation = Math.max(
        -15,
        Math.min(40, event.translationY),
      )
      translateY.value = clampedTranslation

      const dragDistance = -clampedTranslation
      const step = 12
      let delta = 0
      if (Math.abs(dragDistance) > step / 2) {
        delta = Math.round(dragDistance / step)
      }
      delta = Math.max(-1, Math.min(1, delta))
      
      const newVote = Math.max(-3, Math.min(3, initialVote + delta))
      if (newVote !== currentVote) {
        runOnJS(setCurrentVote)(newVote)
      }
    })
    .onFinalize(() => {
      isActive.value = false
      translateY.value = withSpring(0)
      scale.value = withSpring(1)
      if (onVoteChange) {
        runOnJS(onVoteChange)(currentVote)
      }
    })

  const onVoteUp = () => {
    const newVote = Math.min(3, currentVote + 1)
    upFlash.value = withSequence(
      withTiming(1, {duration: 100}),
      withTiming(0, {duration: 200})
    )
    if (newVote !== currentVote) {
      setCurrentVote(newVote)
      onVoteChange?.(newVote)
    }
  }

  const onVoteDown = () => {
    const newVote = Math.max(-3, currentVote - 1)
    downFlash.value = withSequence(
      withTiming(1, {duration: 100}),
      withTiming(0, {duration: 200})
    )
    if (newVote !== currentVote) {
      setCurrentVote(newVote)
      onVoteChange?.(newVote)
    }
  }

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

  const upFlashStyle = useAnimatedStyle(() => {
    return {
      position: 'absolute',
      top: 0,
      left: 0,
      opacity: upFlash.value,
    }
  })

  const downFlashStyle = useAnimatedStyle(() => {
    return {
      position: 'absolute',
      top: 0,
      left: 0,
      opacity: downFlash.value,
    }
  })

  const upScale = useDerivedValue(() => {
    return upBaseScale.value + upFlash.value * 0.4
  })

  const downScale = useDerivedValue(() => {
    return downBaseScale.value + downFlash.value * 0.4
  })


  const upArrowStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(currentVote > initialVote ? 1 : 0.3),
      transform: [{scale: upScale.value}],
    }
  })

  const downArrowStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(currentVote < initialVote ? 1 : 0.3),
      transform: [{scale: downScale.value}],
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
      onPress={e => e.stopPropagation()}>
      <GestureDetector gesture={pan}>
        <Animated.View
          style={[
            styles.control,
            animatedStyle,
            {
              backgroundColor: t.palette.contrast_25 + '30',
              borderColor: t.palette.contrast_50 + '40',
            },
            Platform.OS === 'web' && {
              cursor: isActive.value ? 'grabbing' : 'grab',
              userSelect: 'none',
              touchAction: 'none',
            },
          ]}>
          <Pressable 
            onPress={onVoteUp} 
            hitSlop={8}
            style={({pressed}) => ({opacity: pressed ? 0.7 : 1})}
          >
            <Animated.View style={upArrowStyle}>
              <ArrowUp size="sm" style={{color: currentVote > initialVote ? '#4CAF50' : t.atoms.text.color}} />
              <Animated.View style={upFlashStyle} pointerEvents="none">
                <ArrowUp size="sm" style={{color: '#FFFFFF'}} />
              </Animated.View>
            </Animated.View>
          </Pressable>

          <View style={styles.textWrapper}>
            <Animated.Text style={[styles.voteText, voteTextStyle]}>
              {currentVote > 0 ? `+${currentVote}` : `${currentVote}`}
            </Animated.Text>
          </View>

          <Pressable 
            onPress={onVoteDown} 
            hitSlop={8}
            style={({pressed}) => ({opacity: pressed ? 0.7 : 1})}
          >
            <Animated.View style={downArrowStyle}>
              <ArrowDown size="sm" style={{color: currentVote < initialVote ? '#FF4444' : t.atoms.text.color}} />
              <Animated.View style={downFlashStyle} pointerEvents="none">
                <ArrowDown size="sm" style={{color: '#FFFFFF'}} />
              </Animated.View>
            </Animated.View>
          </Pressable>

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
    height: 80,
    marginTop: 4,
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
  textWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  voteText: {
    fontSize: 16,
    textAlign: 'center',
    minWidth: 24,
  },
})
