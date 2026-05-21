import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useIsMG, useAuthStore } from '@/stores/auth'
import { useCharactersStore, type SourceCharacter } from '@/stores/characters'
import { useContentStore } from '@/stores/content'

const PLAYER_NAMES_KEY = 'akta-player-names'

function loadPlayerNames(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(PLAYER_NAMES_KEY) ?? '{}')
  } catch {
    return {}
  }
}
function savePlayerNames(map: Record<string, string>) {
  localStorage.setItem(PLAYER_NAMES_KEY, JSON.stringify(map))
}

const shortId = (uuid: string | null) => (uuid ? uuid.slice(0, 8) : 'brak-gracza')

export function AdminImport() {
  const isMG = useIsMG()
  const ready = useAuthStore((s) => s.ready)
  const enabled = useAuthStore((s) => s.enabled)

  const { loading, error, sources, imported, load, importOne, remove, stateFor } =
    useCharactersStore()

  const [playerNames, setPlayerNames] = useState<Record<string, string>>(loadPlayerNames)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    if (isMG) void load()
  }, [isMG, load])

  // Seed player-name inputs from already-imported rows (so re-opening shows them).
  useEffect(() => {
    const fromImports: Record<string, string> = {}
    for (const meta of Object.values(imported)) {
      const src = sources.find((s) => s.id === meta.source_id)
      if (src?.player_id && meta.player_name) fromImports[src.player_id] = meta.player_name
    }
    if (Object.keys(fromImports).length > 0) {
      setPlayerNames((prev) => ({ ...fromImports, ...prev }))
    }
  }, [imported, sources])

  const groups = useMemo(() => {
    const byPlayer = new Map<string, SourceCharacter[]>()
    for (const c of sources) {
      const key = c.player_id ?? '∅'
      const arr = byPlayer.get(key) ?? []
      arr.push(c)
      byPlayer.set(key, arr)
    }
    return [...byPlayer.entries()]
      .map(([playerId, chars]) => ({
        playerId: playerId === '∅' ? null : playerId,
        chars: chars.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '', 'pl')),
      }))
      .sort((a, b) => (a.playerId ?? '').localeCompare(b.playerId ?? ''))
  }, [sources])

  if (!ready) {
    return <p className="font-body text-parchment/70">Ładowanie…</p>
  }

  if (!enabled || !isMG) {
    return (
      <article>
        <h1 className="font-display text-4xl uppercase tracking-widest text-parchment">
          Import postaci
        </h1>
        <p className="font-body mt-4 italic text-parchment/80">
          Ta sekcja jest dostępna tylko dla MG.{' '}
          {enabled && (
            <Link to="/login" className="text-gold underline">
              Zaloguj się
            </Link>
          )}
        </p>
      </article>
    )
  }

  const setName = (playerId: string | null, name: string) => {
    const key = playerId ?? '∅'
    const next = { ...playerNames, [key]: name }
    setPlayerNames(next)
    savePlayerNames(next)
  }

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const importSelected = async () => {
    setBusy(true)
    setMsg(null)
    let ok = 0
    const errors: string[] = []
    for (const src of sources) {
      if (!selected.has(src.id)) continue
      const playerName = playerNames[src.player_id ?? '∅'] ?? ''
      const { error: e } = await importOne(src, playerName)
      if (e) errors.push(`${src.name}: ${e}`)
      else ok++
    }
    setBusy(false)
    setSelected(new Set())
    setMsg(
      errors.length === 0
        ? `Zaimportowano ${ok} postaci.`
        : `Zaimportowano ${ok}, błędy: ${errors.join('; ')}`,
    )
    // Refresh the content tree so the new pages appear under BADACZE/.
    void useContentStore.getState().load()
  }

  const removeAndRefresh = async (id: string) => {
    await remove(id)
    void useContentStore.getState().load()
  }

  return (
    <article>
      <header className="flex items-baseline justify-between">
        <h1 className="font-display text-4xl uppercase tracking-widest text-parchment">
          Import postaci
        </h1>
        <button
          type="button"
          onClick={() => void load()}
          className="font-mono border border-gold-muted px-3 py-1 text-xs text-parchment hover:border-gold hover:text-gold"
        >
          Odśwież
        </button>
      </header>
      <p className="font-body mt-2 italic text-parchment/80">
        Postacie z coc-creator. Zaznacz które zaimportować, wpisz imię gracza na grupę, kliknij
        „Importuj zaznaczone". Ponowny import nadpisuje snapshot.
      </p>

      {error && (
        <p className="font-mono mt-4 border-l-2 border-gold bg-gold/10 px-3 py-2 text-sm text-parchment">
          {error}
        </p>
      )}
      {msg && (
        <p className="font-body mt-4 border-l-2 border-gold bg-gold/10 px-3 py-2 text-sm text-parchment">
          {msg}
        </p>
      )}

      {loading && <p className="font-body mt-4 text-parchment/70">Ładowanie postaci…</p>}

      {!loading && sources.length === 0 && !error && (
        <p className="font-body mt-4 italic text-parchment/60">
          Brak postaci w coc-creator (albo brak dostępu przez anon policy).
        </p>
      )}

      <div className="mt-6 space-y-5">
        {groups.map((g) => {
          const key = g.playerId ?? '∅'
          return (
            <section key={key} className="border border-gold-muted/50 bg-teal-dark/30 p-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-display text-sm uppercase tracking-wider text-gold">
                  Gracz #{shortId(g.playerId)}
                </span>
                <span className="font-mono text-xs text-parchment/40">
                  {g.chars.length} {g.chars.length === 1 ? 'postać' : 'postaci'}
                </span>
                <input
                  placeholder="Imię gracza"
                  value={playerNames[key] ?? ''}
                  onChange={(e) => setName(g.playerId, e.target.value)}
                  className="font-body ml-auto w-48 border border-gold-muted bg-parchment-warm px-2 py-1 text-sm text-ink outline-none focus:border-gold"
                />
              </div>

              <ul className="mt-3 space-y-1">
                {g.chars.map((c) => {
                  const st = stateFor(c)
                  return (
                    <li
                      key={c.id}
                      className="flex items-center gap-3 border-l-2 border-transparent py-1 pl-2 hover:border-gold-muted"
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(c.id)}
                        onChange={() => toggle(c.id)}
                        className="accent-gold"
                      />
                      {(c.card_portrait_url || c.profile_portrait_url || c.portrait_url) && (
                        <img
                          src={c.card_portrait_url ?? c.profile_portrait_url ?? c.portrait_url ?? ''}
                          alt=""
                          className="h-8 w-8 rounded-full border border-gold-muted object-cover"
                        />
                      )}
                      <span className="font-body text-parchment">
                        {c.name || <em className="text-parchment/50">(bez nazwy)</em>}
                      </span>
                      <span className="font-mono text-xs text-parchment/40">
                        {[c.occupation_id, c.era, c.status].filter(Boolean).join(' · ')}
                      </span>
                      <span className="ml-auto flex items-center gap-2">
                        <StateBadge state={st} />
                        {st !== 'not-imported' && (
                          <button
                            type="button"
                            onClick={() => void removeAndRefresh(c.id)}
                            className="font-mono text-xs text-gold-dark hover:text-gold"
                          >
                            usuń z wiki
                          </button>
                        )}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </section>
          )
        })}
      </div>

      {sources.length > 0 && (
        <div className="mt-6 flex items-center gap-4">
          <button
            type="button"
            disabled={busy || selected.size === 0}
            onClick={() => void importSelected()}
            className="font-display border border-gold bg-teal-dark px-4 py-2 uppercase tracking-wider text-gold transition hover:bg-gold hover:text-teal-deep disabled:opacity-50"
          >
            {busy ? 'Importowanie…' : `Importuj zaznaczone (${selected.size})`}
          </button>
          <span className="font-mono text-xs text-parchment/50">
            Zaimportowanych: {Object.keys(imported).length}
          </span>
        </div>
      )}
    </article>
  )
}

function StateBadge({ state }: { state: 'not-imported' | 'current' | 'stale' }) {
  const map = {
    'not-imported': { text: 'nie zaimportowana', cls: 'text-parchment/40' },
    current: { text: 'zaimportowana', cls: 'text-gold' },
    stale: { text: 'nieaktualna', cls: 'text-gold-dark' },
  } as const
  const { text, cls } = map[state]
  return <span className={`font-mono text-xs ${cls}`}>{text}</span>
}
