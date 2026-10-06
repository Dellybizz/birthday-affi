-- B2 pages, publication metadata and configurable navigation. No live pointers change.
create function private.page_metadata(p_title text,p_settings jsonb) returns jsonb language sql immutable set search_path='' as $$
 select jsonb_build_object('title',p_title,'description',coalesce(p_settings->>'description',''))
 || case when coalesce(p_settings->>'seoTitle','')<>'' then jsonb_build_object('seoTitle',p_settings->>'seoTitle') else '{}'::jsonb end
 || case when coalesce(p_settings->>'seoDescription','')<>'' then jsonb_build_object('seoDescription',p_settings->>'seoDescription') else '{}'::jsonb end
 || case when coalesce(p_settings->>'socialImage','')<>'' then jsonb_build_object('socialImage',p_settings->>'socialImage') else '{}'::jsonb end
 || case when p_settings->>'noIndex'='true' then '{"noIndex":true}'::jsonb else '{}'::jsonb end $$;
revoke all on function private.page_metadata(text,jsonb) from public,anon;
grant execute on function private.page_metadata(text,jsonb) to authenticated;
create or replace function private.version_metadata()returns trigger language plpgsql set search_path='' as $$begin
 if new.metadata<>'{}'::jsonb then return new;end if;
 select private.page_metadata(p.title,p.settings) into new.metadata from public.pages p where p.id=new.page_id;
 return new;end $$;
create function private.validate_page_seo()returns trigger language plpgsql set search_path='' as $$begin
 if (new.settings ? 'seoTitle' and (jsonb_typeof(new.settings->'seoTitle')<>'string' or length(new.settings->>'seoTitle')>70))
 or (new.settings ? 'seoDescription' and (jsonb_typeof(new.settings->'seoDescription')<>'string' or length(new.settings->>'seoDescription')>160))
 or (new.settings ? 'noIndex' and jsonb_typeof(new.settings->'noIndex')<>'boolean')
 or (new.settings ? 'socialImage' and (jsonb_typeof(new.settings->'socialImage')<>'string' or length(new.settings->>'socialImage')>2048 or (new.settings->>'socialImage'<>'' and new.settings->>'socialImage' !~ '^(https://[^/@[:space:]]+(/[^[:space:]]*)?|/([^/[:space:]][^[:space:]]*)?)$'))) then raise exception 'Invalid SEO metadata';end if;
 return new;end $$;
revoke all on function private.validate_page_seo() from public,anon,authenticated;
create trigger validate_page_seo before insert or update on public.pages for each row execute function private.validate_page_seo();
create or replace function private.assert_navigation(doc jsonb,site uuid,publishing boolean)returns void language plpgsql set search_path='' as $$
declare item jsonb;parent text;seen text[];depth integer;begin
 if doc is null or jsonb_typeof(doc)<>'array' or jsonb_array_length(doc)>50 then raise exception 'Invalid navigation';end if;
 if (select count(distinct value->>'id') from jsonb_array_elements(doc))<>jsonb_array_length(doc) then raise exception 'Duplicate navigation IDs';end if;
 for item in select value from jsonb_array_elements(doc) loop
 if jsonb_typeof(item)<>'object' or (select count(*)from jsonb_object_keys(item - 'placement' - 'runtimeSlug'))<>8 or not item ?& array['id','parentId','pageId','label','icon','description','visible','startHere'] or item->>'id' !~ '^[a-zA-Z0-9_-]{1,100}$' or jsonb_typeof(item->'id')<>'string' then raise exception 'Invalid navigation fields';end if;
 if jsonb_typeof(item->'label')<>'string' or length(btrim(item->>'label'))=0 or length(item->>'label')>120 or jsonb_typeof(item->'icon')<>'string' or length(item->>'icon')>24 or jsonb_typeof(item->'description')<>'string' or length(item->>'description')>300 or jsonb_typeof(item->'visible')<>'boolean' or jsonb_typeof(item->'startHere')<>'boolean' then raise exception 'Invalid labels';end if;
 if item->'parentId'<>'null'::jsonb and jsonb_typeof(item->'parentId')<>'string' then raise exception 'Invalid parent';end if;
 if item ? 'placement' and (jsonb_typeof(item->'placement')<>'string' or item->>'placement' not in ('grid','dock','journey')) then raise exception 'Invalid navigation placement';end if;
 if item ? 'runtimeSlug' and (jsonb_typeof(item->'runtimeSlug')<>'string' or item->>'runtimeSlug' not in ('camera','vault','pieces') or item->'pageId'<>'null'::jsonb) then raise exception 'Invalid runtime destination';end if;
 parent:=item->>'parentId';seen:=array[item->>'id'];depth:=0;
 while parent is not null loop
 if parent=any(seen) or depth>=3 or not exists(select 1 from jsonb_array_elements(doc)n where n->>'id'=parent) then raise exception 'Invalid menu hierarchy';end if;
 seen:=array_append(seen,parent);depth:=depth+1;select n->>'parentId' into parent from jsonb_array_elements(doc)n where n->>'id'=parent;
 end loop;
 if item->'pageId'<>'null'::jsonb then
 if jsonb_typeof(item->'pageId')<>'string' or not exists(select 1 from public.pages p where p.id=(item->>'pageId')::uuid and p.site_id=site and coalesce(p.settings->>'archived','false')<>'true' and (not publishing or p.published_version_id is not null or p.slug in ('memories-archive','welcome','home','reasons','hotline','adventure','movie','kiss-shop','radio'))) then raise exception 'Navigation destination unavailable';end if;
 end if;
 end loop;
end $$;
create or replace function private.public_navigation(p_slug text)returns jsonb language sql stable security definer set search_path='' as $$
select case when exists(select 1 from public.site_navigation nav join public.sites st on st.id=nav.site_id where st.slug=p_slug and st.public_delivery_enabled and nav.published_id is not null) then coalesce(jsonb_agg(e.value||jsonb_build_object('href',case when e.value->>'runtimeSlug' in ('camera','vault','pieces') then '/app/'||(e.value->>'runtimeSlug') when p.slug='memories-archive' then '/' when p.slug='home' then '/home' when p.slug='welcome' then '/' when p.slug in ('reasons','hotline','adventure','movie','kiss-shop','radio') then '/app/'||p.slug when p.id is not null then '/pages/'||p.slug else null end)order by e.ordinality),'[]'::jsonb) else null end from public.sites s join public.site_navigation n on n.site_id=s.id join public.navigation_versions v on v.id=n.published_id cross join lateral jsonb_array_elements(v.document)with ordinality e(value,ordinality) left join public.pages p on p.id=(e.value->>'pageId')::uuid and p.site_id=s.id where s.slug=p_slug and s.public_delivery_enabled$$;
create or replace function public.publish_page(p_page_id uuid,p_expected_revision bigint)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare p public.pages%rowtype; v uuid; num integer;
begin
 if not private.has_admin_role(array['owner']::public.admin_role[]) then raise exception 'Not authorized' using errcode='42501'; end if;
 select * into p from public.pages where id=p_page_id for update;
 if not found then raise exception 'Page not found'; end if;
 if p_expected_revision is null or p.draft_revision<>p_expected_revision then raise exception 'DRAFT_CONFLICT' using errcode='40001'; end if;
 if p.settings->>'archived'='true' then raise exception 'Restore archived page first';end if;
 perform private.assert_page_document(p.draft_document);
 if jsonb_array_length(p.draft_document->'nodes')=0 then raise exception 'Cannot publish an empty page'; end if;
 select id,version_number into v,num from public.page_versions where id=p.published_version_id and document=p.draft_document and metadata=private.page_metadata(p.title,p.settings);
 if found then return jsonb_build_object('versionId',v,'versionNumber',num,'revision',p.draft_revision,'changed',false); end if;
 select coalesce(max(version_number),0)+1 into num from public.page_versions where page_id=p_page_id;
 insert into public.page_versions(page_id,version_number,status,document,created_by) values(p_page_id,num,'published',p.draft_document,auth.uid()) returning id into v;
 update public.pages set published_version_id=v where id=p_page_id;
 return jsonb_build_object('versionId',v,'versionNumber',num,'revision',p.draft_revision,'changed',true);
end $$;

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
    and metadata=private.page_metadata(page_row.title,page_row.settings);
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

