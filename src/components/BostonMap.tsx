import { useEffect, useMemo, useState } from 'react'
import { MapContainer, ImageOverlay, Marker, Popup, useMapEvents } from 'react-leaflet'
import L, { CRS, type LatLngBoundsExpression, type LeafletMouseEvent } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { usePinsStore } from '@/stores/pins'
import { useIsMG } from '@/stores/auth'
import { PIN_COLORS, DEFAULT_PIN_COLOR } from '@/lib/pinColors'

/**
 * Interactive Boston 1924 map. The map graphic (Rand McNally, 7803×11702,
 * ~13 MB) is staged into /vault-attachments/by-name/boston-map-1924.jpg by
 * `npm run build-content`. Leaflet's CRS.Simple gives pan + zoom + popups over
 * the static image.
 *
 * Pin coords are image-local pixels (top-left origin in Pin.x/Pin.y). CRS.Simple
 * measures Y from the *bottom*, so we mirror: leaflet [lat, lng] = [H - y, x].
 *
 * Edit mode (MG only): toggle on → click empty map to add a pin (overlay form
 * with colour picker), drag markers to move, delete from the popup. Writes go
 * to wiki.pins; RLS enforces MG-only at the DB level too. Double-click zoom is
 * disabled in edit mode so a stray double-click doesn't pan the map mid-place.
 */

const IMG_WIDTH = 7803
const IMG_HEIGHT = 11702
const IMG_URL = '/vault-attachments/by-name/boston-map-1924.jpg'

const BOUNDS: LatLngBoundsExpression = [
  [0, 0],
  [IMG_HEIGHT, IMG_WIDTH],
]

const iconCache = new Map<string, L.DivIcon>()
function pinIconFor(color: string): L.DivIcon {
  const c = color || DEFAULT_PIN_COLOR
  let icon = iconCache.get(c)
  if (!icon) {
    icon = L.divIcon({
      className: 'akta-pin',
      html:
        `<span style="display:inline-block;width:18px;height:18px;border-radius:9999px;` +
        `background:${c};border:3px solid #2d1b14;box-shadow:0 0 0 2px rgba(13,40,40,0.8);"></span>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    })
    iconCache.set(c, icon)
  }
  return icon
}

/** Leaflet [lat,lng] (CRS.Simple) → image-local pixel {x,y} (top-left origin). */
function latlngToXY(lat: number, lng: number): { x: number; y: number } {
  const clamp = (v: number, max: number) => Math.max(0, Math.min(max, Math.round(v)))
  return { x: clamp(lng, IMG_WIDTH), y: clamp(IMG_HEIGHT - lat, IMG_HEIGHT) }
}

/** Captures map clicks while in edit mode and reports image-local coords. */
function MapClickHandler({ onPick }: { onPick: (xy: { x: number; y: number }) => void }) {
  useMapEvents({
    click(e: LeafletMouseEvent) {
      onPick(latlngToXY(e.latlng.lat, e.latlng.lng))
    },
  })
  return null
}

type PendingPin = { x: number; y: number }

export function BostonMap() {
  const pins = usePinsStore((s) => s.pins)
  const source = usePinsStore((s) => s.source)
  const load = usePinsStore((s) => s.load)
  const addPin = usePinsStore((s) => s.addPin)
  const updatePin = usePinsStore((s) => s.updatePin)
  const deletePin = usePinsStore((s) => s.deletePin)
  const isMG = useIsMG()

  const [editMode, setEditMode] = useState(false)
  const [pending, setPending] = useState<PendingPin | null>(null)
  const [form, setForm] = useState({ title: '', label: '', description: '', color: DEFAULT_PIN_COLOR })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!isMG) setEditMode(false)
  }, [isMG])

  const canEdit = isMG && source === 'supabase'

  const resetForm = () => setForm({ title: '', label: '', description: '', color: DEFAULT_PIN_COLOR })

  const submitNewPin = async () => {
    if (!pending || !form.title.trim()) return
    setBusy(true)
    setErr(null)
    const { error } = await addPin({
      x: pending.x,
      y: pending.y,
      title: form.title.trim(),
      label: form.label.trim(),
      description: form.description.trim(),
      color: form.color,
    })
    setBusy(false)
    if (error) {
      setErr(error)
      return
    }
    setPending(null)
    resetForm()
  }

  const markers = useMemo(
    () =>
      pins.map((pin) => (
        <Marker
          key={pin.id}
          position={[IMG_HEIGHT - pin.y, pin.x]}
          icon={pinIconFor(pin.color)}
          draggable={editMode}
          eventHandlers={{
            dragend: (e) => {
              const m = e.target as L.Marker
              const { lat, lng } = m.getLatLng()
              void updatePin(pin.id, latlngToXY(lat, lng))
            },
          }}
        >
          <Popup>
            <div className="font-body text-ink">
              <strong className="font-display block uppercase tracking-wider text-gold-dark">
                {pin.title}
              </strong>
              {pin.label && <em className="font-mono block text-xs text-ink/70">{pin.label}</em>}
              {pin.description && <p className="mt-1">{pin.description}</p>}
              {editMode && (
                <button
                  type="button"
                  onClick={() => void deletePin(pin.id)}
                  className="font-mono mt-2 border border-gold-dark px-2 py-0.5 text-xs text-gold-dark hover:bg-gold-dark hover:text-parchment"
                >
                  Usuń pin
                </button>
              )}
            </div>
          </Popup>
        </Marker>
      )),
    [pins, editMode, deletePin, updatePin],
  )

  return (
    <div>
      {canEdit && (
        <div className="mb-3 flex items-center gap-4">
          <button
            type="button"
            onClick={() => {
              setEditMode((v) => !v)
              setPending(null)
              setErr(null)
            }}
            className={`font-display border px-3 py-1 text-sm uppercase tracking-wider transition ${
              editMode
                ? 'border-gold bg-gold text-teal-deep'
                : 'border-gold-muted text-parchment hover:border-gold hover:text-gold'
            }`}
          >
            {editMode ? 'Tryb edycji: WŁ' : 'Tryb edycji: WYŁ'}
          </button>
          {editMode && (
            <span className="font-mono text-xs text-parchment/70">
              Kliknij mapę by dodać pin · przeciągnij by przesunąć · usuń z popovera
            </span>
          )}
        </div>
      )}

      {/* Map container is `relative` so the new-pin form can float as an overlay
          instead of reflowing the layout (which used to shift the click point). */}
      <div className="relative border border-gold-muted bg-ink">
        <MapContainer
          crs={CRS.Simple}
          bounds={BOUNDS}
          style={{ height: '75vh', background: '#0a1f1f' }}
          minZoom={-4}
          maxZoom={2}
          scrollWheelZoom={true}
          doubleClickZoom={!editMode}
        >
          <ImageOverlay url={IMG_URL} bounds={BOUNDS} />
          {editMode && <MapClickHandler onPick={(xy) => setPending(xy)} />}
          {markers}
        </MapContainer>

        {editMode && pending && (
          <div className="absolute right-4 top-4 z-[1000] w-72 border border-gold bg-teal-dark/95 p-4 shadow-lg">
            <h3 className="font-display text-sm uppercase tracking-wider text-gold">
              Nowy pin ({pending.x}, {pending.y})
            </h3>
            <div className="mt-2 space-y-2">
              <input
                autoFocus
                placeholder="Tytuł (wymagany)"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="font-body w-full border border-gold-muted bg-parchment-warm px-2 py-1 text-ink outline-none focus:border-gold"
              />
              <input
                placeholder="Etykieta (np. lokacja)"
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                className="font-body w-full border border-gold-muted bg-parchment-warm px-2 py-1 text-ink outline-none focus:border-gold"
              />
              <textarea
                placeholder="Opis (wikilinki [[…]] działają w popoverze)"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="font-body w-full border border-gold-muted bg-parchment-warm px-2 py-1 text-ink outline-none focus:border-gold"
                rows={2}
              />
              <div>
                <span className="font-display block text-xs uppercase tracking-widest text-gold-muted">
                  Kolor
                </span>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {PIN_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      title={c.name}
                      onClick={() => setForm({ ...form, color: c.hex })}
                      style={{ background: c.hex }}
                      className={`h-6 w-6 rounded-full border-2 transition ${
                        form.color === c.hex
                          ? 'border-parchment ring-2 ring-gold'
                          : 'border-ink/50 hover:border-parchment'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
            {err && <p className="font-mono mt-2 text-xs text-gold">{err}</p>}
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                disabled={busy || !form.title.trim()}
                onClick={() => void submitNewPin()}
                className="font-display border border-gold bg-teal-deep px-3 py-1 text-sm uppercase tracking-wider text-gold transition hover:bg-gold hover:text-teal-deep disabled:opacity-50"
              >
                {busy ? 'Dodawanie…' : 'Dodaj'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setPending(null)
                  setErr(null)
                }}
                className="font-display border border-gold-muted px-3 py-1 text-sm uppercase tracking-wider text-parchment hover:text-gold"
              >
                Anuluj
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
