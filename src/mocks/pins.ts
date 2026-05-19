import type { Pin } from '@/types'

/**
 * Mock pins for the Boston map. Coordinates are in the image's local CRS
 * (0..1000 horizontal, 0..1500 vertical, matching public/maps/boston-placeholder.svg).
 * Stage E proper will replace with `select * from wiki.pins` and add edit mode.
 */
export const pins: Pin[] = [
  {
    id: 'beacon-hill',
    x: 410,
    y: 580,
    title: 'Beacon Hill',
    label: 'dzielnica',
    description: 'Brahminowie i ich sekrety. Patrz strona [[Beacon Hill]].',
  },
  {
    id: 'north-end',
    x: 600,
    y: 460,
    title: 'North End',
    label: 'dzielnica',
    description: 'Włoska enklawa, prohibicyjne piwnice. Patrz [[North End]].',
  },
  {
    id: 'whitcomb',
    x: 380,
    y: 620,
    title: 'Antykwariat Whitcomba',
    label: 'lokacja',
    description: 'Louisburg Square 12. Tu zaczyna się sesja 2.',
  },
]
