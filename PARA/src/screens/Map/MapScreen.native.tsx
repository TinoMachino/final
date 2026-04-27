import {MapScreenImpl, type Props} from './MapScreen.shared'

let MapViewComponent: any
let MarkerComponent: any
let MarkerClustererComponent: any
let PolygonComponent: any
let unavailableMessage = ''

try {
  const Maps = require('react-native-maps')
  MapViewComponent = Maps.default || Maps.MapView || Maps
  MarkerComponent = Maps.Marker
  MarkerClustererComponent = Maps.MarkerClusterer
  PolygonComponent = Maps.Polygon
} catch (e: any) {
  unavailableMessage =
    e?.message ||
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
