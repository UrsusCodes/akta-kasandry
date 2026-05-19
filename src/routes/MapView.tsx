import { BostonMap } from '@/components/BostonMap'

export function MapView() {
  return (
    <article>
      <h1 className="font-display text-4xl uppercase tracking-widest text-parchment">
        Mapa Bostonu — 1924
      </h1>
      <p className="font-body mt-2 italic text-parchment/80">
        Placeholder. Realna mapa zostanie wymieniona w stage E — gdy{' '}
        <code className="font-mono">public/maps/boston-map-1924.jpg</code> zostanie skopiowana z
        content vaulta (13 MB, świadomie nie commitowane w tej sesji).
      </p>
      <div className="mt-6">
        <BostonMap />
      </div>
      <p className="font-mono mt-3 text-xs text-parchment/60">
        Pinezki: kliknij, by zobaczyć popover. Edycja (drag, klik-dodaj, prawy klik-usuń)
        czeka na auth + Supabase pin storage.
      </p>
    </article>
  )
}
