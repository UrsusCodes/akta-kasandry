import { getSkillDisplayName, getSkillBase } from '../data/skills'
import { CHARACTERISTIC_MAP } from '../data/characteristics'
import { OCCUPATIONS } from '../data/occupations'
import { DRIVES } from '../data/drivePillars'
import { type CharacteristicKey } from '../types/common'
import { halfValue, fifthValue } from '../lib/utils'
import { Badge } from './Badge'
import { CharacterDescriptions } from './CharacterDescriptions'
import type { StabilitySource, MainPosition, AdditionalPosition, ContactV2 } from '../types/character'

const CHAR_KEYS: CharacteristicKey[] = ['STR', 'CON', 'SIZ', 'DEX', 'APP', 'INT', 'POW', 'EDU']

const BACKSTORY_LABELS: Record<string, string> = {
  ideology: 'Ideologia / Przekonania',
  significant_people_who: 'Ważne osoby: Kto',
  significant_people_why: 'Ważne osoby: Dlaczego',
  meaningful_locations: 'Znaczące miejsca',
  treasured_possessions: 'Rzeczy osobiste',
  traits: 'Przymioty',
  appearance_description: 'Opis postaci',
  key_connection: 'Kluczowa więź',
}

export interface CharacterSheetData {
  id: string
  name: string
  age: number
  gender: string
  appearance: string
  characteristics: Record<string, number>
  luck: number
  derived: Record<string, unknown>
  occupation_id: string
  occupation_skill_points: Record<string, number>
  personal_skill_points: Record<string, number>
  backstory: Record<string, unknown>
  equipment: string[]
  cash: string
  assets: string
  spending_level: string
  era: string
  method: string
  status: string
  player_name?: string
  residence?: string
  birthplace?: string
  invite_code?: string
  admin_notes?: string
  main_position?: MainPosition | null
  additional_positions?: AdditionalPosition[]
  contacts_v2?: ContactV2[]
  portrait_url?: string
  art_prompt?: string
  art_gallery?: { url: string; label: string; created_at: string }[]
  portrait_crop_data?: { x: number; y: number; width: number; height: number } | null
  profile_portrait_url?: string
  card_portrait_url?: string
  card_portrait_crop_data?: { x: number; y: number; width: number; height: number } | null
  sessions?: string[]
  distinguisher?: string
}

interface CharacterSheetProps {
  character: CharacterSheetData
}

export function CharacterSheet({ character: char }: CharacterSheetProps) {
  const occupation = OCCUPATIONS.find((o) => o.id === char.occupation_id)
  const derived = char.derived as { hp: number; mp: number; san: number; db: string; build: number; move_rate: number; dodge: number }

  const allSkillPoints: Record<string, number> = { ...char.occupation_skill_points }
  for (const [id, pts] of Object.entries(char.personal_skill_points)) {
    allSkillPoints[id] = (allSkillPoints[id] ?? 0) + pts
  }

  const getBase = (skillId: string) => {
    const base = getSkillBase(skillId)
    if (base === 'half_dex') return Math.floor((char.characteristics['DEX'] ?? 0) / 2)
    if (base === 'edu') return char.characteristics['EDU'] ?? 0
    return base
  }

  return (
    <div className="space-y-4">
      {/* Portrait + Basic info — AKTA-KASANDRY LOCAL MODIFICATION (diverges from
          coc-creator source): large 3:4 portrait on the left, identity (age /
          gender / occupation) on the right at the same height. Era + method
          dropped per akta-kasandry UX. Re-vendoring overwrites this block —
          reapply it. */}
      <div className="flex items-start gap-4">
        {char.portrait_url && (
          <img
            src={char.portrait_url}
            alt="Portret"
            className="w-48 aspect-[3/4] shrink-0 rounded-lg border border-coc-border object-cover"
          />
        )}
        <div className="grid grid-cols-1 gap-1.5 pt-1 text-sm">
          <div><span className="text-coc-text-muted">Wiek:</span> {char.age}</div>
          <div><span className="text-coc-text-muted">Płeć:</span> {char.gender}</div>
          <div><span className="text-coc-text-muted">Zawód:</span> {occupation?.name ?? char.occupation_id}</div>
        </div>
      </div>
      {char.appearance && (
        <div className="text-sm">
          <span className="text-coc-text-muted">Wygląd:</span> {char.appearance}
        </div>
      )}

      {/* Characteristics */}
      <SectionHeader>Cechy</SectionHeader>
      <div className="grid grid-cols-4 gap-2">
        {CHAR_KEYS.map((key) => {
          const val = char.characteristics[key] ?? 0
          return (
            <div key={key} className="text-center bg-coc-surface-light rounded-lg p-2">
              <div className="text-xs text-coc-text-muted">{CHARACTERISTIC_MAP[key].abbreviation}</div>
              <div className="text-lg font-bold font-mono">{val}</div>
              <div className="text-xs text-coc-text-muted">{halfValue(val)} / {fifthValue(val)}</div>
            </div>
          )
        })}
      </div>

      {/* Derived */}
      {derived && (
        <>
          <SectionHeader>Atrybuty pochodne</SectionHeader>
          <div className="grid grid-cols-4 gap-2">
            <MiniStat label="PW" value={derived.hp} />
            <MiniStat label="PM" value={derived.mp} />
            <MiniStat label="PP" value={derived.san} />
            <MiniStat label="Szczęście" value={char.luck} />
            <MiniStat label="PO" value={derived.db} />
            <MiniStat label="Krzepa" value={derived.build} />
            <MiniStat label="Ruch" value={derived.move_rate} />
            <MiniStat label="Unik" value={derived.dodge + (allSkillPoints['unik'] ?? 0)} />
          </div>
        </>
      )}

      {/* Stat-derived narrative — only renders if any stat is in the tail buckets */}
      <CharacterDescriptions characteristics={char.characteristics} />

      {/* Skills */}
      <SectionHeader>Umiejętności</SectionHeader>
      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-sm max-h-[250px] overflow-y-auto">
        {Object.entries(allSkillPoints)
          .filter(([, pts]) => pts > 0)
          .sort(([a], [b]) => getSkillDisplayName(a).localeCompare(getSkillDisplayName(b), 'pl'))
          .map(([skillId, pts]) => {
            const base = getBase(skillId)
            return (
              <div key={skillId} className="flex justify-between py-0.5">
                <span className="text-coc-text-muted truncate">{getSkillDisplayName(skillId)}</span>
                <span className="font-mono font-bold ml-2">{base + pts}%</span>
              </div>
            )
          })}
      </div>

      {/* Backstory — Drive+Pillars variant or traditional */}
      {char.backstory.drive ? (
        <DrivePillarsDisplay backstory={char.backstory} />
      ) : (
        Object.keys(char.backstory).length > 0 && (
          <>
            <SectionHeader>Historia postaci</SectionHeader>
            <div className="space-y-2">
              {Object.entries(char.backstory).map(([key, value]) => {
                if (!value || typeof value !== 'string') return null
                return (
                  <div key={key}>
                    <div className="text-xs text-coc-text-muted">{BACKSTORY_LABELS[key] ?? key}</div>
                    <div className="text-sm whitespace-pre-wrap">{value}</div>
                  </div>
                )
              })}
            </div>
          </>
        )
      )}

      {/* Positions & Contacts */}
      <PositionsContactsDisplay
        mainPosition={char.main_position}
        additionalPositions={char.additional_positions}
        contacts={char.contacts_v2}
      />

      {/* Sessions */}
      {(char.sessions?.length ?? 0) > 0 && (
        <>
          <SectionHeader>Sesje</SectionHeader>
          <ul className="text-sm space-y-0.5">
            {char.sessions!.map((s, i) => (
              <li key={i} className="text-coc-text-muted">• {s}</li>
            ))}
          </ul>
        </>
      )}

      {/* Equipment */}
      {char.equipment.length > 0 && (
        <>
          <SectionHeader>Ekwipunek</SectionHeader>
          <div className="flex flex-wrap gap-2 mb-2">
            {char.cash && <Badge>Gotówka: {char.cash}</Badge>}
            {char.assets && <Badge>Dobytek: {char.assets}</Badge>}
            {char.spending_level && <Badge>Poziom życia: {char.spending_level}</Badge>}
          </div>
          <ul className="text-sm space-y-0.5">
            {(() => {
              const counts = new Map<string, number>()
              for (const item of char.equipment) {
                if (/\[x\d+\]$/.test(item)) { counts.set(item, 1); continue }
                counts.set(item, (counts.get(item) ?? 0) + 1)
              }
              return Array.from(counts.entries()).map(([item, count]) => (
                <li key={item} className="text-coc-text-muted">• {count > 1 ? `${item} [x${count}]` : item}</li>
              ))
            })()}
          </ul>
        </>
      )}
    </div>
  )
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return <h4 className="text-sm font-medium text-coc-text-muted uppercase tracking-wider">{children}</h4>
}

function MiniStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="text-center bg-coc-accent/10 rounded p-1.5">
      <div className="text-[10px] text-coc-text-muted">{label}</div>
      <div className="font-bold font-mono">{value}</div>
    </div>
  )
}

function PositionsContactsDisplay({ mainPosition, additionalPositions, contacts }: {
  mainPosition?: MainPosition | null
  additionalPositions?: AdditionalPosition[]
  contacts?: ContactV2[]
}) {
  const hasMain = !!mainPosition
  const hasAdditional = (additionalPositions?.length ?? 0) > 0
  const hasContacts = (contacts?.length ?? 0) > 0

  if (!hasMain && !hasAdditional && !hasContacts) return null

  return (
    <>
      {(hasMain || hasAdditional) && (
        <>
          <SectionHeader>Pozycje</SectionHeader>
          <div className="space-y-1.5">
            {mainPosition && (
              <div className="p-2 bg-coc-surface-light rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{mainPosition.option_name}</span>
                  <Badge variant="default">{mainPosition.organization_size}</Badge>
                  <span className="text-xs text-coc-text-muted">{mainPosition.strength_percent}%</span>
                </div>
                {mainPosition.custom_description && (
                  <p className="text-xs text-coc-text-muted mt-1">{mainPosition.custom_description}</p>
                )}
              </div>
            )}
            {additionalPositions?.map((pos, i) => (
              <div key={i} className="p-2 bg-coc-surface-light rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{pos.option_name}</span>
                  <Badge variant="default">{pos.organization_size}</Badge>
                  <span className="text-xs text-coc-text-muted">{'★'.repeat(pos.weight)}</span>
                  {pos.pending_st_approval && <Badge variant="warning">Do zatwierdzenia</Badge>}
                </div>
                {pos.custom_description && (
                  <p className="text-xs text-coc-text-muted mt-1">{pos.custom_description}</p>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {hasContacts && (
        <>
          <SectionHeader>Kontakty</SectionHeader>
          <div className="space-y-1.5">
            {contacts!.map((c, i) => (
              <div key={i} className="p-2 bg-coc-surface-light rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-coc-text-muted">{c.category_name}:</span>
                  <span className="text-sm font-medium">{c.custom_name || c.subcategory_name}</span>
                  <span className="text-xs">{'◆'.repeat(c.strength)}{'◇'.repeat(3 - c.strength)}</span>
                  {c.synergy_bonus > 0 && <span className="text-xs text-yellow-400">+{c.synergy_bonus}</span>}
                  {c.pending_st_approval && <Badge variant="warning">Do zatwierdzenia</Badge>}
                </div>
                {c.custom_description && (
                  <p className="text-xs text-coc-text-muted mt-1">{c.custom_description}</p>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </>
  )
}

const SOURCE_CATEGORY_LABELS: Record<string, string> = {
  person: 'Osoba',
  place: 'Miejsce',
  organization: 'Organizacja',
}

function DrivePillarsDisplay({ backstory }: { backstory: Record<string, unknown> }) {
  const driveId = backstory.drive as string
  const driveDetail = backstory.drive_detail as string | undefined
  const pillars = (backstory.pillars as string[]) ?? []
  const sources = (backstory.sources as StabilitySource[]) ?? []
  const otherTraits = backstory.other_traits as string | undefined
  const appearanceDesc = backstory.appearance_description as string | undefined

  const drive = DRIVES.find((d) => d.id === driveId)

  return (
    <>
      {appearanceDesc && (
        <>
          <SectionHeader>Opis postaci</SectionHeader>
          <div className="text-sm whitespace-pre-wrap">{appearanceDesc}</div>
        </>
      )}

      <SectionHeader>Motywacja</SectionHeader>
      <div className="text-sm">
        <span className="font-medium">{drive?.name ?? driveId}</span>
        {drive && <span className="text-coc-text-muted">: {drive.description}</span>}
        {driveDetail && <div className="text-coc-text-muted mt-1 italic">{driveDetail}</div>}
      </div>

      {pillars.length > 0 && (
        <>
          <SectionHeader>Filary Poczytalności</SectionHeader>
          <ul className="text-sm space-y-0.5">
            {pillars.map((p, i) => (
              <li key={i} className="text-coc-text-muted">• {p}</li>
            ))}
          </ul>
        </>
      )}

      {sources.length > 0 && (
        <>
          <SectionHeader>Źródła Stabilności</SectionHeader>
          <div className="space-y-2">
            {sources.map((s, i) => (
              <div key={i} className="text-sm">
                <span className="font-medium">{s.name}</span>
                <span className="text-coc-text-muted">, {SOURCE_CATEGORY_LABELS[s.category] ?? s.category}</span>
                {s.description && <span className="text-coc-text-muted">: {s.description}</span>}
              </div>
            ))}
          </div>
        </>
      )}

      {otherTraits && (
        <>
          <SectionHeader>Inne przymioty</SectionHeader>
          <div className="text-sm whitespace-pre-wrap">{otherTraits}</div>
        </>
      )}
    </>
  )
}
