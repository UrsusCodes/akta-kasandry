import { useMemo } from 'react'
import { MapContainer, ImageOverlay, Marker, Popup } from 'react-leaflet'
import L, { CRS, LatLngBoundsExpression } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { pins } from '@/mocks/pins'

const IMG_WIDTH = 1000
const IMG_HEIGHT = 1500
const IMG_URL = '/maps/boston-placeholder.svg'

const BOUNDS: LatLngBoundsExpression = [
  [0, 0],
  [IMG_HEIGHT, IMG_WIDTH],
]

/**
 * Custom marker icon — small gold circle, no default leaflet PNG (which 404s
 * when shipped from /node_modules through Vite's static handling).
 */
const pinIcon = L.divIcon({
  className: 'akta-pin',
  html:
    '<span style="display:inline-block;width:14px;height:14px;border-radius:9999px;' +
    'background:#c89b3c;border:2px solid #2d1b14;box-shadow:0 0 0 2px rgba(13,40,40,0.6);"></span>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
})

export function BostonMap() {
  const markers = useMemo(
    () =>
      pins.map((pin) => (
        <Marker
          key={pin.id}
          // ImageOverlay with CRS.Simple uses [y, x] where y measures from the top
          // of the image. Pin coords are top-left origin, so we mirror y vs IMG_HEIGHT.
          position={[IMG_HEIGHT - pin.y, pin.x]}
          icon={pinIcon}
        >
          <Popup>
            <div className="font-body text-ink">
              <strong className="font-display block uppercase tracking-wider text-gold-dark">
                {pin.title}
              </strong>
              <em className="font-mono block text-xs text-ink/70">{pin.label}</em>
              <p className="mt-1">{pin.description}</p>
            </div>
          </Popup>
        </Marker>
      )),
    [],
  )

  return (
    <div className="border border-gold-muted bg-ink">
      <MapContainer
        crs={CRS.Simple}
        bounds={BOUNDS}
        style={{ height: '70vh', background: '#0a1f1f' }}
        minZoom={-2}
        maxZoom={2}
      >
        <ImageOverlay url={IMG_URL} bounds={BOUNDS} />
        {markers}
      </MapContainer>
    </div>
  )
}
