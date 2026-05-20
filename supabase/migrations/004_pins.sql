-- 004 — wiki.pins + RLS.
--
-- Pin coordinates are in image-local pixels on boston-map-1924.jpg
-- (top-left origin, source 7803×11702). Read-only for everyone; only MG
-- can add / move / remove pins.

create table wiki.pins (
  id           uuid primary key default gen_random_uuid(),
  x            integer not null,
  y            integer not null,
  title        text not null,
  description  text,
  label        text,
  created_by   uuid references wiki.profiles(id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Tiny helper: bump updated_at on any UPDATE. Reused if we add another table
-- with the same pattern.
create or replace function wiki.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists pins_set_updated_at on wiki.pins;
create trigger pins_set_updated_at
  before update on wiki.pins
  for each row execute function wiki.set_updated_at();

alter table wiki.pins enable row level security;

-- Anyone reads.
create policy pins_anon_read on wiki.pins for select using (true);

-- MG-only writes (edit mode in the map UI is gated by Auth role).
create policy pins_mg_write on wiki.pins for all to authenticated
  using (exists (select 1 from wiki.profiles p where p.id = auth.uid() and p.role = 'mg'))
  with check (exists (select 1 from wiki.profiles p where p.id = auth.uid() and p.role = 'mg'));
