create table if not exists public.app_content_items(id uuid primary key default gen_random_uuid(),site_id uuid not null references public.sites(id) on delete cascade,app_slug text not null,item_type text not null,position integer not null default 0,title text,body text,media_asset_id uuid references public.media_assets(id) on delete set null,metadata jsonb not null default '{}'::jsonb,enabled boolean not null default true,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(site_id,app_slug,item_type,position));
create index if not exists app_content_items_site_app_idx on public.app_content_items(site_id,app_slug,position);
alter table public.app_content_items enable row level security;
create policy "public enabled app content items readable" on public.app_content_items for select using(enabled or public.is_admin());
create policy "admins manage app content items" on public.app_content_items for all using(public.is_admin()) with check(public.is_admin());
create table if not exists public.site_settings(id uuid primary key default gen_random_uuid(),site_id uuid not null unique references public.sites(id) on delete cascade,theme jsonb not null default '{}'::jsonb,personalization jsonb not null default '{}'::jsonb,feature_flags jsonb not null default '{}'::jsonb,updated_at timestamptz not null default now());
alter table public.site_settings enable row level security;
create policy "public site settings readable" on public.site_settings for select using(true);
create policy "admins manage site settings" on public.site_settings for all using(public.is_admin()) with check(public.is_admin());
