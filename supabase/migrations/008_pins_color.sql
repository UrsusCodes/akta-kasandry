-- 008 — add a color column to wiki.pins.
--
-- Pins can be colour-coded (10 palette options in src/lib/pinColors.ts).
-- Nullable — the app treats null as the default gold (#c89b3c).
-- Run in the dashboard SQL Editor (same as 001..007).

alter table wiki.pins add column if not exists color text;

-- existing rows default to gold so they don't render colourless
update wiki.pins set color = '#c89b3c' where color is null;

notify pgrst, 'reload schema';
