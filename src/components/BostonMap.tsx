import { useMemo } from 'react'
import { MapContainer, ImageOverlay, Marker, Popup } from 'react-leaflet'
import L, { CRS, type LatLngBoundsExpression } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { pins } from '@/mocks/pins'

/**
 * Interactive Boston 1924 map. The actual map graphic
 * (Rand McNally, 7803×11702, ~13 MB) is staged into
 * /vault-attachments/by-name/boston-map-1924.jpg by `npm run build-content`.
 * Leaflet's CRS.Simple gives Google-Maps-style pan + zoom + popups over the
 * static image. Pin coords are image-local pixels (top-left origin); we flip
 * Y for Leaflet here so the rest of the app keeps the natural orientation.
 *
 * If the JPG is missing (e.g. generator hasn't been run), the map area is
 * blank against the ink background. Re-run `npm run build-content`.
 */

const IMG_WIDTH = 7803
const IMG_HEIGHT = 11702
const IMG_URL = '/vault-attachments/by-name/boston-map-1924.jpg'

const BOUNDS: LatLngBoundsExpression = [
  [0, 0],
  [IMG_HEIGHT, IMG_WIDTH],
]

const pinIcon = L.divIcon({
  className: 'akta-pin',
  html:
    '<span style="display:inline-block;width:18px;height:18px;border-radius:9999px;' +
    'background:#c89b3c;border:3px solid #2d1b14;box-shadow:0 0 0 2px rgba(13,40,40,0.8);"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

export function BostonMap() {
  const markers = useMemo(
    () =>
      pins.map((pin) => (
        <Marker
          key={pin.id}
          // CRS.Simple uses [y, x] with y measured from the bottom of the image.
          // Pin coords are top-left origin, so mirror y.
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
        style={{ height: '75vh', background: '#0a1f1f' }}
        minZoom={-4}
        maxZoom={2}
        scrollWheelZoom={true}
      >
        <ImageOverlay url={IMG_URL} bounds={BOUNDS} />
        {markers}
      </MapContainer>
    </div>
  )
}
