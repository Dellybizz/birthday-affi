-- F2 atomic whole-site publishing and release rollback.
-- A release is created only after every participating page, site configuration and navigation
-- draft validates inside the same transaction. Draft page documents are never overwritten by
-- rollback; rollback restores published pointers only.

create or replace function private.publish_site_release(p_site uuid,p_note text default '') returns jsonb
language plpgsql security definer set search_path='' as $$
declare
 cfg public.site_configurations%rowtype;
 nav public.site_navigation%rowtype;
 page_row public.pages%rowtype;
 current_page public.page_versions%rowtype;
 page_version uuid;
 page_number integer;
 config_version uuid;
 nav_version uuid;
 release_id uuid;
 release_number bigint;
 changed_pages integer:=0;
 changed_config boolean:=false;
 changed_nav boolean:=false;
begin
 if not private.has_admin_role(array['owner']::public.admin_role[]) then
  raise exception 'Owner required' using errcode='42501';
 end if;
 if p_note is null or length(p_note)>500 then raise exception 'Invalid release note';end if;
 perform 1 from public.sites where id=p_site for update;
 if not found then raise exception 'Site not found';end if;

 select * into cfg from public.site_configurations where site_id=p_site for update;
 if not found then raise exception 'Site configuration missing';end if;
 perform private.assert_site_document(cfg.draft);
 select id into config_version from public.site_configuration_versions
  where id=cfg.published_id and site_id=p_site and document=cfg.draft;
 if not found then
  insert into public.site_configuration_versions(site_id,document,created_by)
  values(p_site,cfg.draft,auth.uid()) returning id into config_version;
  update public.site_configurations set published_id=config_version where site_id=p_site;
  changed_config:=true;
 end if;

 select * into nav from public.site_navigation where site_id=p_site for update;
 if not found then raise exception 'Navigation missing';end if;
 perform private.assert_navigation(nav.draft,p_site,true);
 select id into nav_version from public.navigation_versions
  where id=nav.published_id and site_id=p_site and document=nav.draft;
 if not found then
  insert into public.navigation_versions(site_id,document) values(p_site,nav.draft) returning id into nav_version;
  update public.site_navigation set published_id=nav_version where site_id=p_site;
  changed_nav:=true;
 end if;

 -- Lock every page up-front so an individual page publication cannot interleave with this release.
 perform 1 from public.pages where site_id=p_site order by id for update;
 for page_row in
  select * from public.pages
  where site_id=p_site and coalesce(settings->>'archived','false')<>'true'
  order by id
 loop
  perform private.assert_page_document(page_row.draft_document);
  if jsonb_array_length(page_row.draft_document->'nodes')=0 then
   raise exception 'Cannot publish empty page: %',page_row.slug;
  end if;
  select * into current_page from public.page_versions
   where id=page_row.published_version_id and page_id=page_row.id and status='published'
    and document=page_row.draft_document
    and metadata=jsonb_build_object('title',page_row.title,'description',coalesce(page_row.settings->>'description',''));
  if not found then
   select coalesce(max(version_number),0)+1 into page_number from public.page_versions where page_id=page_row.id;
   insert into public.page_versions(page_id,version_number,status,document,created_by)
   values(page_row.id,page_number,'published',page_row.draft_document,auth.uid())
   returning id into page_version;
   update public.pages set published_version_id=page_version where id=page_row.id;
   changed_pages:=changed_pages+1;
  end if;
 end loop;

 release_id:=private.capture_site_release(p_site,p_note);
 select r.release_number into release_number from public.site_releases r where r.id=release_id;
 return jsonb_build_object(
  'releaseId',release_id,
  'releaseNumber',release_number,
  'changedPages',changed_pages,
  'changedConfiguration',changed_config,
  'changedNavigation',changed_nav
 );
end $$;

create or replace function private.rollback_site_release(p_site uuid,p_release uuid,p_note text default '') returns jsonb
language plpgsql security definer set search_path='' as $$
declare
 source_release public.site_releases%rowtype;
 source_page record;
 new_release_id uuid;
 new_release_number bigint;
 restored_pages integer:=0;
begin
 if not private.has_admin_role(array['owner']::public.admin_role[]) then
  raise exception 'Owner required' using errcode='42501';
 end if;
 if p_note is null or length(p_note)>500 then raise exception 'Invalid release note';end if;
 perform 1 from public.sites where id=p_site for update;
 if not found then raise exception 'Site not found';end if;
 select * into source_release from public.site_releases where id=p_release and site_id=p_site;
 if not found then raise exception 'Release not found';end if;

 if source_release.configuration_version_id is not null and not exists(
  select 1 from public.site_configuration_versions where id=source_release.configuration_version_id and site_id=p_site
 ) then raise exception 'Release configuration is unavailable';end if;
 if source_release.navigation_version_id is not null and not exists(
  select 1 from public.navigation_versions where id=source_release.navigation_version_id and site_id=p_site
 ) then raise exception 'Release navigation is unavailable';end if;

 perform 1 from public.pages where site_id=p_site order by id for update;
 update public.site_configurations set published_id=source_release.configuration_version_id where site_id=p_site;
 update public.site_navigation set published_id=source_release.navigation_version_id where site_id=p_site;
 -- Pages not present in the target release are removed from live delivery, but their drafts stay intact.
 update public.pages set published_version_id=null where site_id=p_site;
 for source_page in
  select rp.page_id,rp.page_version_id from public.site_release_pages rp where rp.release_id=p_release order by rp.page_id
 loop
  if not exists(
   select 1 from public.page_versions v where v.id=source_page.page_version_id and v.page_id=source_page.page_id and v.status='published'
  ) then raise exception 'Release page version is unavailable';end if;
  update public.pages set published_version_id=source_page.page_version_id
   where id=source_page.page_id and site_id=p_site;
  if not found then raise exception 'Release page is unavailable';end if;
  restored_pages:=restored_pages+1;
 end loop;

 new_release_id:=private.capture_site_release(
  p_site,
  left(case when btrim(p_note)<>'' then p_note else 'Rollback to release #'||source_release.release_number end,500)
 );
 select release_number into new_release_number from public.site_releases where id=new_release_id;
 return jsonb_build_object(
  'releaseId',new_release_id,
  'releaseNumber',new_release_number,
  'restoredFrom',source_release.release_number,
  'restoredPages',restored_pages
 );
end $$;

revoke all on function private.publish_site_release(uuid,text),private.rollback_site_release(uuid,uuid,text) from public,anon,authenticated;
grant execute on function private.publish_site_release(uuid,text),private.rollback_site_release(uuid,uuid,text) to authenticated;

create or replace function public.publish_site_release(p_site uuid,p_note text default '') returns jsonb
language sql security invoker set search_path='' as $$select private.publish_site_release(p_site,p_note)$$;
create or replace function public.rollback_site_release(p_site uuid,p_release uuid,p_note text default '') returns jsonb
language sql security invoker set search_path='' as $$select private.rollback_site_release(p_site,p_release,p_note)$$;
revoke all on function public.publish_site_release(uuid,text),public.rollback_site_release(uuid,uuid,text) from public,anon;
grant execute on function public.publish_site_release(uuid,text),public.rollback_site_release(uuid,uuid,text) to authenticated;
