import MapView, {Marker, Polygon} from 'react-native-maps'

import {MapScreenImpl, type Props} from './MapScreen.shared'

export function MapScreen(props: Props) {
  return (
    <MapScreenImpl
      {...props}
      MapViewComponent={MapView}
      MarkerComponent={Marker}
      PolygonComponent={Polygon}
    />
  )
}
