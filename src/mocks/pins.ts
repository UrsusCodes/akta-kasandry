import type { Pin } from '@/types'

/**
 * Mock pins on the Boston OSM tile map. Coords are real WGS84 lat/lng. Stage E
 * proper will replace with `select * from wiki.pins` + edit mode. The locations
 * for "Hale Manor" and "Whitlock House" are placed on real downtown streets as
 * fictional addresses for the campaign; "Mount Auburn Cemetery" is real.
 */
export const pins: Pin[] = [
  {
    id: 'hale-manor',
    lat: 42.358,
    lng: -71.0598,
    title: 'Hale Manor',
    label: 'siedziba',
    description:
      'Siedziba profesora Victora Hale\'a (centrum miasta). Patrz [[Mapa Bostonu 1924]].',
  },
  {
    id: 'whitlock-house',
    lat: 42.3593,
    lng: -71.062,
    title: 'Whitlock House',
    label: 'dom NPC',
    description: 'Dom doktora Edwarda Whitlocka — dwie ulice od Hale Manor.',
  },
  {
    id: 'mount-auburn',
    lat: 42.371,
    lng: -71.144,
    title: 'Cmentarz Mount Auburn',
    label: 'cmentarz',
    description: 'Najstarszy cmentarz ogrodowy Bostonu (północny zachód).',
  },
]
