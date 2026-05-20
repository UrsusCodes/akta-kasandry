import type { CharacterSheetData } from '../components/CharacterSheet'
import type { StabilitySource, MainPosition, AdditionalPosition, ContactV2, Backstory } from '../types/character'
import { DRIVES } from '../data/drivePillars'

/**
 * Shape consumed by the new offline back card (window.setCardBackData).
 * Mirrors the API spec in new_char_sheet/INTEGRATION.md §3.2.
 */
export interface CardBackData {
  appearance_description?: string
  pillars?: string
  sources?: string
  drive?: string
  injuries?: string
  tomes?: string
  encounters?: string
  spending_level?: string
  cash?: string
  journal?: string[]
  friends?: { badacz?: string; gracz?: string; relacja?: string }[]
  ekwipunek?: string[]
  dobytek?: string[]
  pozycja?: string[]
  kontakty?: string[]
  wydatki?: string
}

const STAR_CATEGORIES: Record<string, string> = {
  person: 'Osoba',
  place: 'Miejsce',
  organization: 'Organizacja',
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function starsBadge(weight: number | string): string {
  return (
    '<span class="stars">' +
    `<span class="num">${escapeHtml(String(weight))}</span>` +
    '<span class="ico">★</span>' +
    '</span>'
  )
}

function formatDrive(backstory: Backstory | Record<string, unknown>): string {
  const driveId = (backstory as Backstory).drive
  const detail = (backstory as Backstory).drive_detail
  if (!driveId) return ''
  const driveObj = DRIVES.find((d) => d.id === driveId)
  const name = driveObj?.name ?? String(driveId)
  if (detail) return `${name}: ${detail}`
  if (driveObj?.description) return `${name}: ${driveObj.description}`
  return name
}

function formatPillars(backstory: Backstory | Record<string, unknown>): string {
  const p = (backstory as Backstory).pillars
  if (!Array.isArray(p)) return ''
  return p.filter(Boolean).map((line) => `• ${line}`).join('\n')
}

function formatSources(backstory: Backstory | Record<string, unknown>): string {
  const s = (backstory as Backstory).sources as StabilitySource[] | undefined
  if (!Array.isArray(s)) return ''
  return s
    .filter((src) => src && (src.name || src.description))
    .map((src) => {
      const cat = STAR_CATEGORIES[src.category] ?? src.category ?? ''
      const name = src.name ?? ''
      const head = cat ? `${name}, ${cat}` : name
      return src.description ? `• ${head}: ${src.description}` : `• ${head}`
    })
    .join('\n')
}

interface ParsedEquipment {
  ekwipunek: string[]
  dobytek: string[]
  pozycja: string[]
  weapons: string[]
}

/** Split character.equipment[] into the four buckets the new back card expects. */
function parseEquipment(items: string[]): ParsedEquipment {
  const ekwipunek: string[] = []
  const dobytek: string[] = []
  const pozycja: string[] = []
  const weapons: string[] = []

  for (const raw of items) {
    const stripped = raw.replace(/^\[.*?\]\s*/, '')
    if (raw.startsWith('[Lokum]') || raw.startsWith('[Mieszkanie]')) {
      dobytek.push(stripped)
      continue
    }
    if (raw.startsWith('[Transport]')) {
      dobytek.push(stripped)
      continue
    }
    if (raw.startsWith('[Dobytek]')) {
      dobytek.push(stripped)
      continue
    }
    if (raw.startsWith('[Lifestyle]') || raw.startsWith('[Styl życia]')) {
      pozycja.push(`Styl życia: ${stripped}`)
      continue
    }
    if (raw.startsWith('[Broń]') || raw.startsWith('[Czarny rynek]') || raw.startsWith('[Wojsko]')) {
      weapons.push(stripped)
      continue
    }
    if (raw.startsWith('[Ekwipunek]')) {
      ekwipunek.push(stripped)
      continue
    }
    ekwipunek.push(raw)
  }

  // Group duplicates (same as PDF export does)
  const grouped: string[] = []
  const counts = new Map<string, number>()
  for (const it of ekwipunek) {
    if (/\[x\d+\]$/.test(it)) { grouped.push(it); continue }
    counts.set(it, (counts.get(it) ?? 0) + 1)
  }
  for (const [item, count] of counts) {
    grouped.push(count > 1 ? `${item} [x${count}]` : item)
  }

  return { ekwipunek: grouped, dobytek, pozycja, weapons }
}

function formatMainPosition(mp: MainPosition | null | undefined): string | null {
  if (!mp || !mp.option_name) return null
  const head = `${mp.option_name} [${mp.organization_size}]`
  const pct = mp.strength_percent ? ` ${mp.strength_percent}%` : ''
  return `<strong>${escapeHtml(head)}</strong>${escapeHtml(pct)}`
}

function formatAdditionalPosition(p: AdditionalPosition): string | null {
  if (!p || !p.option_name) return null
  const weight = Math.max(1, Math.min(3, p.weight ?? 1))
  return `${starsBadge(weight)} ${escapeHtml(p.option_name)} [${p.roll_value ?? 0}%]${
    p.pending_st_approval ? ' <em>[ST]</em>' : ''
  }`
}

function formatContact(c: ContactV2): string | null {
  const name = c.subcategory_name || c.custom_name || ''
  if (!name) return null
  const strength = Math.max(1, Math.min(3, c.strength ?? 1))
  const synergy = c.synergy_bonus > 0 ? ' ✨' : ''
  return `${starsBadge(strength)} ${escapeHtml(name)} [${c.roll_value ?? 0}%]${synergy}${
    c.pending_st_approval ? ' <em>[ST]</em>' : ''
  }`
}

/* WYDATKI = free-form notes (e.g. "$5/dzień: jedzenie, drobne łapówki").
   Aktualnie nie tracimy ich w DB — zostawiamy pusto, gracz uzupełnia. */
function formatExpenses(): string {
  return ''
}

/**
 * Map character → cardBackData for the new HTML back card. Pure function;
 * intentionally produces empty strings/arrays for sections we don't track yet
 * (journal, friends, injuries, tomes, encounters, expenses notes) so the
 * iframe receives a complete payload and can clear stale state on re-render.
 */
export function characterToCardBackData(char: CharacterSheetData): CardBackData {
  const backstory = char.backstory ?? {}
  const equipment = parseEquipment(char.equipment ?? [])

  const positions: string[] = []
  const lifestyleLine = equipment.pozycja[0]
  if (lifestyleLine) positions.push(escapeHtml(lifestyleLine))
  const mainPos = formatMainPosition(char.main_position)
  if (mainPos) positions.push(mainPos)
  for (const ap of char.additional_positions ?? []) {
    const line = formatAdditionalPosition(ap)
    if (line) positions.push(line)
  }

  const contacts: string[] = []
  for (const c of char.contacts_v2 ?? []) {
    const line = formatContact(c)
    if (line) contacts.push(line)
  }

  /* Defensive: spending_level may be "$50", "50", "50$", or empty. Wealth v2
     stores it under `spending_free` instead. Normalize to "$X" so the box
     always has the $ sign. */
  const spendingDisplay = (() => {
    const extended = char as unknown as { spending_free?: string }
    const raw = (char.spending_level || extended.spending_free || '').toString().trim()
    if (!raw) return ''
    const cleaned = raw.replace(/^\$/, '').replace(/\$$/, '').trim()
    return cleaned ? `$${cleaned}` : ''
  })()

  const cashDisplay = (() => {
    if (!char.cash) return ''
    // Legacy: "Gotówka: $125 | Inny: X" → "$125". Modern: just "$125".
    const m = char.cash.match(/Gotówka:\s*(.+?)(?:\s*\||$)/)
    const raw = (m ? m[1].trim() : char.cash).replace(/\s+/g, ' ').trim()
    return raw
  })()

  return {
    appearance_description:
      String(backstory.appearance_description ?? char.appearance ?? ''),
    pillars: formatPillars(backstory),
    sources: formatSources(backstory),
    drive: formatDrive(backstory),
    injuries: '',
    tomes: '',
    encounters: '',
    spending_level: spendingDisplay,
    cash: cashDisplay,
    journal: char.sessions ?? [],
    friends: [],
    ekwipunek: equipment.ekwipunek,
    dobytek: equipment.dobytek,
    pozycja: positions,
    kontakty: contacts,
    wydatki: formatExpenses(),
  }
}
