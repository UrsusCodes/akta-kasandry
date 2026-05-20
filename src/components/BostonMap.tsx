import { useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { pins } from '@/mocks/pins'

/**
 * Interactive Boston map. OpenStreetMap tiles (no API key, free tier),
 * Leaflet pan/zoom/popups — Google-Maps-style UX. Pins are lat/lng on real
 * WGS84 streets. Edit mode (click-add, drag-move) waits for auth + Supabase
 * pin storage (stage D + E proper).
 *
 * Note for stage F: when a historical (1924) tile layer is available, swap
 * the TileLayer URL — every other piece (pins, popups, CRS) stays the same.
 */

const BOSTON_CENTER: L.LatLngTuple = [42.3601, -71.0589]
const DEFAULT_ZOOM = 13

const pinIcon = L.divIcon({
  className: 'akta-pin',
  html:
    '<span style="display:inline-block;width:16px;height:16px;border-radius:9999px;' +
    'background:#c89b3c;border:2px solid #2d1b14;box-shadow:0 0 0 2px rgba(13,40,40,0.8);"></span>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

export function BostonMap() {
  const markers = useMemo(
    () =>
      pins.map((pin) => (
        <Marker key={pin.id} position={[pin.lat, pin.lng]} icon={pinIcon}>
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
        center={BOSTON_CENTER}
        zoom={DEFAULT_ZOOM}
        style={{ height: '70vh', background: '#0a1f1f' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {markers}
      </MapContainer>
    </div>
  )
}
