-- Optional seed: 3 starter pins on the Boston 1924 map.
--
-- Run once in the dashboard SQL Editor if you want the map populated before
-- you start placing pins yourself. Coords match the old mock list
-- (src/mocks/pins.ts) — image-local pixels on boston-map-1924.jpg
-- (top-left origin, 7803×11702). Nudge them in edit mode once the map is up.
--
-- Idempotent-ish: uses fixed titles so re-running won't duplicate IF you add
-- the guard below. As written it inserts unconditionally — run only once.

insert into wiki.pins (x, y, title, description, label) values
  (3280, 3745, 'Hale Manor',
   'Siedziba profesora Victora Hale''a (centrum miasta). Patrz [[Mapa Bostonu 1924]].',
   'siedziba'),
  (3360, 3870, 'Whitlock House',
   'Dom doktora Edwarda Whitlocka — dwie ulice od Hale Manor.',
   'dom NPC'),
  (1100, 2200, 'Cmentarz Mount Auburn',
   'Najstarszy cmentarz ogrodowy Bostonu (na NW od Bostonu, w okolicy Cambridge/Watertown — może być poza wycinkiem mapy).',
   'cmentarz');

-- Verify:
select id, title, x, y, label from wiki.pins order by title;
