create extension if not exists pgcrypto;

create type public.publish_status as enum ('draft','published','archived');
create type public.admin_role as enum ('owner','editor','viewer');

create table public.sites(
 id uuid primary key default gen_random_uuid(),
 name text not null,
 slug text not null unique,
 settings jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table public.admin_users(
 id uuid primary key references auth.users(id) on delete cascade,
 role public.admin_role not null default 'viewer',
 created_at timestamptz not null default now()
);

create table public.pages(
 id uuid primary key default gen_random_uuid(),
 site_id uuid not null references public.sites(id) on delete cascade,
 slug text not null,
 title text not null,
 settings jsonb not null default '{}'::jsonb,
 draft_document jsonb not null default '{"schemaVersion":1,"nodes":[]}'::jsonb,
 published_version_id uuid,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(site_id,slug)
);

create table public.page_versions(
 id uuid primary key default gen_random_uuid(),
 page_id uuid not null references public.pages(id) on delete cascade,
 version_number integer not null,
 status public.publish_status not null default 'draft',
 document jsonb not null,
 created_by uuid references auth.users(id),
 created_at timestamptz not null default now(),
 unique(page_id,version_number)
);

alter table public.pages add constraint pages_published_version_fk foreign key(published_version_id) references public.page_versions(id);

create table public.media_assets(
 id uuid primary key default gen_random_uuid(),
 site_id uuid not null references public.sites(id) on delete cascade,
 kind text not null check(kind in('image','video','audio')),
 storage_path text not null,
 filename text not null,
 mime_type text,
 width integer,
 height integer,
 duration_ms integer,
 alt_text text,
 metadata jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);

create table public.audit_logs(
 id bigint generated always as identity primary key,
 actor_id uuid references auth.users(id),
 action text not null,
 entity_type text not null,
 entity_id uuid,
 metadata jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);

create index pages_site_slug_idx on public.pages(site_id,slug);
create index versions_page_created_idx on public.page_versions(page_id,created_at desc);

alter table public.sites enable row level security;
alter table public.pages enable row level security;
alter table public.page_versions enable row level security;
alter table public.media_assets enable row level security;
alter table public.audit_logs enable row level security;
alter table public.admin_users enable row level security;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path=public
as $$ select exists(select 1 from public.admin_users where id=auth.uid()); $$;

create policy "published pages readable" on public.pages for select using(published_version_id is not null or public.is_admin());
create policy "admins manage pages" on public.pages for all using(public.is_admin()) with check(public.is_admin());
create policy "admins manage versions" on public.page_versions for all using(public.is_admin()) with check(public.is_admin());
create policy "admins manage media" on public.media_assets for all using(public.is_admin()) with check(public.is_admin());
create policy "admins read audit" on public.audit_logs for select using(public.is_admin());
create policy "admins write audit" on public.audit_logs for insert with check(public.is_admin());