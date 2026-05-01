import {type ComponentType} from 'react'

import {MapScreenImpl, type Props} from './MapScreen.shared'

let MapViewComponent: ComponentType<any>
let MarkerComponent: ComponentType<any>
let MarkerClustererComponent: ComponentType<any>
let PolygonComponent: ComponentType<any>
let unavailableMessage = ''

try {
  const Maps = require('react-native-maps')
  MapViewComponent = Maps.default || Maps.MapView || Maps
  MarkerComponent = Maps.Marker
  MarkerClustererComponent = Maps.MarkerClusterer
  PolygonComponent = Maps.Polygon
} catch (e: unknown) {
  unavailableMessage =
    (e as Error)?.message ||
    'react-native-maps is not linked into the current native build.'
}

export function MapScreen(props: Props) {
  return (
    <MapScreenImpl
      {...props}
      MapViewComponent={MapViewComponent}
      MarkerComponent={MarkerComponent}
      MarkerClustererComponent={MarkerClustererComponent}
      PolygonComponent={PolygonComponent}
      unavailableMessage={unavailableMessage}
    />
  )
}
