import React from 'react'
import {View, type ViewStyle} from 'react-native'

import {atoms as a} from '#/alf'

export type CommunityEstandarteProps = {
  /**
   * 1 to 3 colors that define the community's estandarte.
   * Minimum 1, maximum 3.
   */
  colors: string[]
  height?: number
  style?: ViewStyle
}

/**
 * A community estandarte — a horizontal heraldic banner
 * composed of 1–3 colored stripes.
 *
 * When 1 color: solid fill.
 * When 2 colors: equal vertical halves.
 * When 3 colors: equal vertical thirds.
 */
export function CommunityEstandarte({
  colors,
  height = 6,
  style,
}: CommunityEstandarteProps) {
  const safeColors = colors.slice(0, 3)
  if (safeColors.length === 0) {
    safeColors.push('#CCCCCC')
  }

  const flexBasis = `${100 / safeColors.length}%`

  return (
    <View
      style={[
        a.flex_row,
        a.overflow_hidden,
        {
          height,
          borderRadius: height / 2,
        },
        style,
      ]}>
      {safeColors.map((color, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            backgroundColor: color,
            // Slight separation between stripes
            marginLeft: i > 0 ? 1 : 0,
          }}
        />
      ))}
    </View>
  )
}
