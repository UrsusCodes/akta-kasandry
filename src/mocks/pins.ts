import type { Pin } from '@/types'

/**
 * Mock pins on the Boston 1924 Rand McNally map. Coordinates are in image
 * pixels (origin = top-left, 7803×11702 source). These are *rough estimates*
 * — once the GM eyeballs the rendered map, they should be nudged in pins.ts
 * (stage E proper moves them into wiki.pins with drag-to-place edit mode).
 */
export const pins: Pin[] = [
  {
    id: 'hale-manor',
    x: 3280,
    y: 3745,
    title: 'Hale Manor',
    label: 'siedziba',
    color: '#c89b3c',
    description:
      'Siedziba profesora Victora Hale\'a (centrum miasta). Patrz [[Mapa Bostonu 1924]].',
  },
  {
    id: 'whitlock-house',
    x: 3360,
    y: 3870,
    title: 'Whitlock House',
    label: 'dom NPC',
    color: '#3a5a78',
    description: 'Dom doktora Edwarda Whitlocka — dwie ulice od Hale Manor.',
  },
  {
    id: 'mount-auburn',
    x: 1100,
    y: 2200,
    title: 'Cmentarz Mount Auburn',
    label: 'cmentarz',
    color: '#6b7551',
    description:
      'Najstarszy cmentarz ogrodowy Bostonu (na NW od Bostonu, w okolicy Cambridge/Watertown — może być poza wycinkiem mapy).',
  },
]
