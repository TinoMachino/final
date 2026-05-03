import {type ComponentType} from 'react'
import MapView, {Marker, Polygon} from 'react-native-maps'

import {
  MapScreenImpl,
  type MapViewProps,
  type MarkerProps,
  type PolygonProps,
  type Props,
} from './MapScreen.shared'

export function MapScreen(props: Props) {
  return (
    <MapScreenImpl
      {...props}
      MapViewComponent={MapView as unknown as ComponentType<MapViewProps>}
      MarkerComponent={Marker as unknown as ComponentType<MarkerProps>}
      PolygonComponent={Polygon as unknown as ComponentType<PolygonProps>}
    />
  )
}
