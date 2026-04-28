import React from 'react'
import {View} from 'react-native'

import {atoms as a} from '#/alf'
import {Text} from '#/components/Typography'

export type PartyShieldProps = {
  abbreviation: string
  color: string
  size?: 'sm' | 'md'
}

const SIZE_MAP = {
  sm: {height: 18, fontSize: 10, padH: 4, padV: 1},
  md: {height: 22, fontSize: 12, padH: 6, padV: 2},
} as const

/**
 * A shield-shaped party insignia rendered as a colored badge.
 * The bottom edge tapers to suggest a heraldic shield.
 */
export function PartyShield({
  abbreviation,
  color,
  size = 'sm',
}: PartyShieldProps) {
  const s = SIZE_MAP[size]

  return (
    <View
      style={[
        a.flex_row,
        a.align_center,
        a.justify_center,
        {
          height: s.height,
          paddingHorizontal: s.padH,
          paddingVertical: s.padV,
          backgroundColor: color,
          borderTopLeftRadius: 4,
          borderTopRightRadius: 4,
          borderBottomLeftRadius: 10,
          borderBottomRightRadius: 10,
          // Subtle inner shadow effect via border
          borderWidth: 0,
        },
      ]}>
      <Text
        style={[
          a.font_bold,
          {
            fontSize: s.fontSize,
            color: '#FFFFFF',
            lineHeight: s.fontSize * 1.2,
            textShadowColor: 'rgba(0,0,0,0.3)',
            textShadowOffset: {width: 0, height: 0.5},
            textShadowRadius: 1,
          },
        ]}>
        {abbreviation}
      </Text>
    </View>
  )
}
