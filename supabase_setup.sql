-- ============================================================
-- ArtTech Precios — Setup SQL para Supabase
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================

-- ---- Tabla: devices ----
create table if not exists devices (
  id            bigint primary key generated always as identity,
  user_id       uuid references auth.users(id) on delete cascade not null,
  name          text not null,
  ram           text default '',
  rom           text default '',
  memory        text default '',
  condition     text default 'GRADO A',
  description   text default '',
  final_price   numeric not null,
  initial_pct   numeric default 30,
  initial_amt   numeric default 0,
  installments  int default 6,
  install_amt   numeric default 0,
  period        text default 'QUINCENALES',
  available     boolean default true,
  msg           text default '',
  created_at    timestamptz default now()
);

alter table devices enable row level security;

create policy "owner_select" on devices for select using (auth.uid() = user_id);
create policy "owner_insert" on devices for insert with check (auth.uid() = user_id);
create policy "owner_update" on devices for update using (auth.uid() = user_id);
create policy "owner_delete" on devices for delete using (auth.uid() = user_id);
create policy "public_select" on devices for select using (auth.uid() is null and available = true);


-- ---- Tabla: price_lists ----
create table if not exists price_lists (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references auth.users(id) on delete cascade not null,
  name              text not null,
  title             text not null,
  footer            text default '',
  filter_condition  text default '',
  filter_brand      text default '',
  show_initial      boolean default true,
  show_cuotas       boolean default true,
  created_at        timestamptz default now()
);

alter table price_lists enable row level security;

create policy "owner_all"   on price_lists for all    using (auth.uid() = user_id);
create policy "public_read" on price_lists for select using (true);


-- ---- Tabla: profiles ----
create table if not exists profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  whatsapp      text default '',
  display_name  text default '',
  updated_at    timestamptz default now()
);

alter table profiles enable row level security;

create policy "owner_all" on profiles for all using (auth.uid() = id);

-- Acceso público para leer el WhatsApp del vendedor (necesario para lista pública)
create policy "public_read" on profiles for select using (true);


-- ---- Trigger: crear perfil al registrarse ----
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();


-- ============================================================
-- Storage: bucket "product-images"
-- Crear manualmente en Supabase Dashboard > Storage > New bucket
--   Name: product-images
--   Public: SÍ
-- Luego ejecutar las policies de abajo:
-- ============================================================

create policy "public_read" on storage.objects
  for select using (bucket_id = 'product-images');

create policy "owner_write" on storage.objects
  for insert with check (
    bucket_id = 'product-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "owner_delete" on storage.objects
  for delete using (
    bucket_id = 'product-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
