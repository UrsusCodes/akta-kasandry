-- 006 — wiki-attachments bucket policies.
--
-- ⚠️ The BUCKET ITSELF is created via the Supabase dashboard:
--    Storage → New bucket → name "wiki-attachments", "Public bucket" ON.
-- After creating it, run THIS file to install the RLS policies.
--
-- Buckets store image attachments uploaded via the editor (stage D — not
-- yet wired). At runtime the player-facing site reads images from the
-- bucket; only MG can write.

-- Policy names are unique per bucket so we can re-run this file safely
-- without colliding with other projects' policies on storage.objects.

drop policy if exists "wiki-attachments anon read" on storage.objects;
drop policy if exists "wiki-attachments mg insert" on storage.objects;
drop policy if exists "wiki-attachments mg update" on storage.objects;
drop policy if exists "wiki-attachments mg delete" on storage.objects;

-- Read: anyone (the bucket is public; this policy is the second line of
-- defense + lets us pull via the SDK with the anon key).
create policy "wiki-attachments anon read"
  on storage.objects for select
  using (bucket_id = 'wiki-attachments');

-- Write: only signed-in MGs.
create policy "wiki-attachments mg insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'wiki-attachments'
    and exists (select 1 from wiki.profiles p where p.id = auth.uid() and p.role = 'mg')
  );

create policy "wiki-attachments mg update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'wiki-attachments'
    and exists (select 1 from wiki.profiles p where p.id = auth.uid() and p.role = 'mg')
  );

create policy "wiki-attachments mg delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'wiki-attachments'
    and exists (select 1 from wiki.profiles p where p.id = auth.uid() and p.role = 'mg')
  );
