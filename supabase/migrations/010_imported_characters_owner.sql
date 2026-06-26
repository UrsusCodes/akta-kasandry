-- 010 — link an imported character to the player account that "owns" it.
-- Set by MG in /admin/import-characters. Drives the speaker picker
-- ("my characters"). Nullable: unassigned characters simply aren't pickable.
alter table wiki.imported_characters
  add column if not exists owner_profile_id uuid references wiki.profiles(id);

create index if not exists imported_characters_owner_idx
  on wiki.imported_characters (owner_profile_id);

-- RLS unchanged: imported_anon_read (select true) exposes the new column;
-- imported_mg_write already covers updates to it.
