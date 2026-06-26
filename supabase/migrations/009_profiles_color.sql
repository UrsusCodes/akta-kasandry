-- 009 — player identity colour on wiki.profiles.
-- One of the 16 hex values in src/lib/playerColors.ts. MG sets it in /admin.
-- RLS: profiles_self_update (migration 002) already lets a user update their
-- own row except role; colour is therefore self-settable. MG can also set it
-- via the admin UI (MG updates are allowed by the same own-row rule when acting
-- on their own row; cross-profile colour assignment by MG uses a service path —
-- for v1 the player picks their own colour, MG seeds it at account creation).
alter table wiki.profiles add column if not exists color text;
