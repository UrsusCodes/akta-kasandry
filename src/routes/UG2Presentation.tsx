import { useRef } from 'react'
import { Link } from 'react-router-dom'

/**
 * Embeds the self-contained cinematic presentation (public/prezentacja/ug2/) in
 * a framed 16:9 box on the site, with a fullscreen button. The presentation is
 * plain HTML/CSS/JS served as a static asset; we reuse it via an <iframe> rather
 * than reimplementing the engine. BASE_URL keeps the src correct under the
 * /akta-kasandry/ production base and at the dev root.
 */
const SRC = import.meta.env.BASE_URL + 'prezentacja/ug2/index.html'

export function UG2Presentation() {
  const ref = useRef<HTMLIFrameElement>(null)

  function fullscreen() {
    const el = ref.current
    if (el && el.requestFullscreen) el.requestFullscreen()
  }

  return (
    <article className="prose-cthulhu bg-parchment p-4 sm:p-8">
      <h1>Urodzaj Grozy — prezentacja</h1>
      <p>
        Filmowa prezentacja sesji: slajdy z grafiką, muzyką i efektami. Kliknij{' '}
        <strong>▶ Rozpocznij</strong> w ramce, aby ruszyła wraz z dźwiękiem. Spacja
        pauzuje, strzałki przewijają w obie strony, <strong>F</strong> lub przycisk
        poniżej włącza pełny ekran.
      </p>

      <div
        className="relative w-full overflow-hidden rounded border-2 border-gold bg-black shadow-xl"
        style={{ aspectRatio: '16 / 9' }}
      >
        <iframe
          ref={ref}
          src={SRC}
          title="Urodzaj Grozy — prezentacja"
          className="absolute inset-0 h-full w-full"
          allow="autoplay; fullscreen"
          allowFullScreen
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-4">
        <button
          onClick={fullscreen}
          className="rounded bg-gold px-4 py-2 font-semibold text-teal-deep transition hover:brightness-110"
        >
          ⛶ Pełny ekran
        </button>
        <a href={SRC} target="_blank" rel="noreferrer" className="text-gold-dark underline">
          Otwórz w nowej karcie ↗
        </a>
        <Link to="/p/sprawy/02-urodzaj-grozy/00-hub" className="text-gold-dark underline">
          ← Wróć do sprawy (Urodzaj Grozy)
        </Link>
      </div>
    </article>
  )
}
