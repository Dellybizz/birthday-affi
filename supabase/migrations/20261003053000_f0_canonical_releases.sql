-- F0 canonical release manifests.
-- This migration is additive only: it snapshots existing published pointers and never changes
-- page/configuration/navigation drafts or published pointers.

create table public.site_releases(
 id uuid primary key default gen_random_uuid(),
 site_id uuid not null references public.sites(id) on delete cascade,
 release_number bigint not null check(release_number>0),
 configuration_version_id uuid references public.site_configuration_versions(id),
 navigation_version_id uuid references public.navigation_versions(id),
 note text not null default '' check(length(note)<=500),
 created_at timestamptz not null default now(),
 created_by uuid references auth.users(id),
 unique(site_id,release_number)
);

create table public.site_release_pages(
 release_id uuid not null references public.site_releases(id) on delete cascade,
 page_id uuid not null references public.pages(id),
 page_version_id uuid not null references public.page_versions(id),
 slug text not null,
 title text not null,
 settings jsonb not null default '{}',
 primary key(release_id,page_id),
 unique(release_id,page_version_id)
);

alter table public.site_releases enable row level security;
alter table public.site_release_pages enable row level security;

create policy site_releases_read on public.site_releases for select to authenticated
 using(private.has_admin_role(array['owner','editor','viewer']::public.admin_role[]));
create policy site_release_pages_read on public.site_release_pages for select to authenticated
 using(private.has_admin_role(array['owner','editor','viewer']::public.admin_role[]));

revoke all on public.site_releases,public.site_release_pages from anon,authenticated;
grant select on public.site_releases,public.site_release_pages to authenticated;

create function private.capture_site_release(p_site uuid,p_note text default '') returns uuid
language plpgsql security definer set search_path='' as $$
declare
 new_release_id uuid;
 next_number bigint;
 configuration_version uuid;
 navigation_version uuid;
begin
 if not private.has_admin_role(array['owner']::public.admin_role[]) then
  raise exception 'Owner required' using errcode='42501';
 end if;
 if p_note is null or length(p_note)>500 then raise exception 'Invalid release note';end if;
 perform 1 from public.sites where id=p_site for update;
 if not found then raise exception 'Site not found';end if;

 select published_id into configuration_version from public.site_configurations where site_id=p_site;
 select published_id into navigation_version from public.site_navigation where site_id=p_site;
 select coalesce(max(release_number),0)+1 into next_number from public.site_releases where site_id=p_site;

 insert into public.site_releases(site_id,release_number,configuration_version_id,navigation_version_id,note,created_by)
 values(p_site,next_number,configuration_version,navigation_version,p_note,auth.uid())
 returning id into new_release_id;

 insert into public.site_release_pages(release_id,page_id,page_version_id,slug,title,settings)
 select new_release_id,p.id,p.published_version_id,p.slug,p.title,p.settings
 from public.pages p
 join public.page_versions v on v.id=p.published_version_id and v.page_id=p.id and v.status='published'
 where p.site_id=p_site and coalesce(p.settings->>'archived','false')<>'true';

 return new_release_id;
end $$;

revoke all on function private.capture_site_release(uuid,text) from public,anon,authenticated;
grant execute on function private.capture_site_release(uuid,text) to authenticated;

create function public.capture_site_release(p_site uuid,p_note text default '') returns uuid
language sql security invoker set search_path='' as $$
 select private.capture_site_release(p_site,p_note)
$$;
revoke all on function public.capture_site_release(uuid,text) from public,anon;
grant execute on function public.capture_site_release(uuid,text) to authenticated;
