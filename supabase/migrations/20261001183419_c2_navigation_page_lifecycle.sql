create table public.site_navigation(site_id uuid primary key references public.sites(id),draft jsonb not null default '[]',revision bigint not null default 0,published_id uuid);
create table public.navigation_versions(id uuid primary key default gen_random_uuid(),site_id uuid not null references public.sites(id),document jsonb not null,created_at timestamptz not null default now());
alter table public.site_navigation add foreign key(published_id) references public.navigation_versions(id);
alter table public.site_navigation enable row level security;alter table public.navigation_versions enable row level security;
grant select on public.site_navigation,public.navigation_versions to authenticated;
create policy navigation_read on public.site_navigation for select to authenticated using(private.has_admin_role(array['owner','editor','viewer']::public.admin_role[]));
create policy navigation_versions_read on public.navigation_versions for select to authenticated using(private.has_admin_role(array['owner','editor','viewer']::public.admin_role[]));
insert into public.site_navigation(site_id,draft)select s.id,coalesce((select jsonb_agg(jsonb_build_object('id',p.slug,'parentId',null,'pageId',p.id,'label',p.title,'icon',case p.slug when 'reasons' then '💗' when 'hotline' then '☎️' when 'adventure' then '🧭' when 'movie' then '🎬' when 'kiss-shop' then '💋' else '📻' end,'description','','visible',true,'startHere',p.slug='hotline') order by case p.slug when 'reasons' then 1 when 'hotline' then 2 when 'adventure' then 3 when 'movie' then 4 when 'kiss-shop' then 5 else 6 end)from public.pages p where p.site_id=s.id and p.slug in ('reasons','hotline','adventure','movie','kiss-shop','radio')),'[]'::jsonb)from public.sites s;
create table public.page_redirects(site_id uuid references public.sites(id),old_slug text,page_id uuid references public.pages(id),primary key(site_id,old_slug));
alter table public.page_redirects enable row level security;
grant select on public.page_redirects to authenticated;
create policy redirect_read on public.page_redirects for select to authenticated using(private.has_admin_role(array['owner','editor','viewer']::public.admin_role[]));
alter table public.page_versions add column metadata jsonb not null default '{}';
create function private.version_metadata()returns trigger language plpgsql set search_path='' as $$begin
 if new.metadata<>'{}'::jsonb then return new;end if;
 select jsonb_build_object('title',p.title,'description',coalesce(p.settings->>'description',''))into new.metadata from public.pages p where p.id=new.page_id;
 return new;end $$;
create trigger version_metadata before insert on public.page_versions for each row execute function private.version_metadata();
create function private.assert_navigation(doc jsonb,site uuid,publishing boolean)returns void language plpgsql set search_path='' as $$
declare item jsonb;parent text;seen text[];depth integer;begin
 if doc is null or jsonb_typeof(doc)<>'array' or jsonb_array_length(doc)>50 then raise exception 'Invalid navigation';end if;
 if (select count(distinct value->>'id') from jsonb_array_elements(doc))<>jsonb_array_length(doc) then raise exception 'Duplicate navigation IDs';end if;
 for item in select value from jsonb_array_elements(doc) loop
 if jsonb_typeof(item)<>'object' or (select count(*)from jsonb_object_keys(item))<>8 or not item ?& array['id','parentId','pageId','label','icon','description','visible','startHere'] or item->>'id' !~ '^[a-zA-Z0-9_-]{1,100}$' or jsonb_typeof(item->'id')<>'string' then raise exception 'Invalid navigation fields';end if;
 if jsonb_typeof(item->'label')<>'string' or length(btrim(item->>'label'))=0 or length(item->>'label')>120 or jsonb_typeof(item->'icon')<>'string' or length(item->>'icon')>24 or jsonb_typeof(item->'description')<>'string' or length(item->>'description')>300 or jsonb_typeof(item->'visible')<>'boolean' or jsonb_typeof(item->'startHere')<>'boolean' then raise exception 'Invalid labels';end if;
 if item->'parentId'<>'null'::jsonb and jsonb_typeof(item->'parentId')<>'string' then raise exception 'Invalid parent';end if;
 parent:=item->>'parentId';seen:=array[item->>'id'];depth:=0;
 while parent is not null loop
 if parent=any(seen) or depth>=3 or not exists(select 1 from jsonb_array_elements(doc)n where n->>'id'=parent) then raise exception 'Invalid menu hierarchy';end if;
 seen:=array_append(seen,parent);depth:=depth+1;select n->>'parentId' into parent from jsonb_array_elements(doc)n where n->>'id'=parent;
 end loop;
 if item->'pageId'<>'null'::jsonb then
 if jsonb_typeof(item->'pageId')<>'string' or not exists(select 1 from public.pages p where p.id=(item->>'pageId')::uuid and p.site_id=site and coalesce(p.settings->>'archived','false')<>'true' and (not publishing or p.published_version_id is not null or p.slug in ('welcome','home','reasons','hotline','adventure','movie','kiss-shop','radio'))) then raise exception 'Navigation destination unavailable';end if;
 end if;
 end loop;
end $$;
create function private.change_navigation(p_site uuid,p_document jsonb,p_revision bigint,p_publish boolean)returns bigint language plpgsql security definer set search_path='' as $$
declare cfg public.site_navigation;v uuid;begin
 if not private.has_admin_role(array['owner']::public.admin_role[])then raise exception 'Owner required' using errcode='42501';end if;
 perform 1 from public.sites where id=p_site for update;
 select * into cfg from public.site_navigation where site_id=p_site for update;
 if not found or p_revision is null or p_publish is null or cfg.revision<>p_revision then raise exception 'Navigation conflict' using errcode='40001';end if;
 perform private.assert_navigation(case when p_publish then cfg.draft else p_document end,p_site,p_publish);
 if p_publish then insert into public.navigation_versions(site_id,document)values(p_site,cfg.draft)returning id into v;update public.site_navigation set published_id=v where site_id=p_site;return cfg.revision;
 else update public.site_navigation set draft=p_document,revision=revision+1 where site_id=p_site;return cfg.revision+1;end if;end $$;
create function public.change_navigation(p_site uuid,p_document jsonb,p_revision bigint,p_publish boolean)returns bigint language sql security invoker set search_path='' as $$select private.change_navigation(p_site,p_document,p_revision,p_publish)$$;
create function private.page_lifecycle()returns trigger language plpgsql security definer set search_path='' as $$begin
 perform 1 from public.sites where id=new.site_id for update;
 if (new.settings ? 'description' and jsonb_typeof(new.settings->'description')<>'string') or length(new.title)>120 or length(coalesce(new.settings->>'description',''))>300 then raise exception 'Invalid page metadata';end if;
 if new.slug !~ '^[a-z][a-z0-9-]{0,63}$' then raise exception 'Invalid page slug';end if;
 if tg_op='INSERT' then if exists(select 1 from public.page_redirects where site_id=new.site_id and old_slug=new.slug)then raise exception 'Slug reserved by redirect';end if;return new;end if;
 if new.slug !~ '^[a-z][a-z0-9-]{0,63}$' then raise exception 'Invalid page slug';end if;
 if new.slug<>old.slug and old.slug in ('welcome','home','reasons','hotline','adventure','movie','kiss-shop','radio') then raise exception 'Built-in route protected';end if;
 if new.settings->>'archived'='true' and (old.slug in ('welcome','home','reasons','hotline','adventure','movie','kiss-shop','radio') or exists(select 1 from public.site_navigation n left join public.navigation_versions v on v.id=n.published_id where n.site_id=new.site_id and exists(select 1 from jsonb_array_elements(n.draft||coalesce(v.document,'[]'))e where e->>'pageId'=new.id::text)))then raise exception 'Remove navigation references before archiving';end if;
 if old.published_version_id is not null and (new.slug<>old.slug or new.settings->>'archived' is distinct from old.settings->>'archived') and not private.has_admin_role(array['owner']::public.admin_role[])then raise exception 'Owner required' using errcode='42501';end if;
 if new.slug<>old.slug then
 if exists(select 1 from public.page_redirects where site_id=new.site_id and old_slug=new.slug and page_id<>new.id)then raise exception 'Slug reserved by redirect';end if;
 delete from public.page_redirects where site_id=new.site_id and old_slug=new.slug and page_id=new.id;
 insert into public.page_redirects values(new.site_id,old.slug,new.id)on conflict(site_id,old_slug)do update set page_id=excluded.page_id;
 end if;
 return new;end $$;
create trigger page_lifecycle before insert or update on public.pages for each row execute function private.page_lifecycle();
create function private.public_page_info(p_site_slug text,p_slug text)returns jsonb language sql stable security definer set search_path='' as $$
select jsonb_build_object('slug',p.slug,'metadata',v.metadata,'document',v.document) from public.sites s join public.pages p on p.site_id=s.id join public.page_versions v on v.id=p.published_version_id and v.page_id=p.id and v.status='published' where s.slug=p_site_slug and s.public_delivery_enabled and coalesce(p.settings->>'archived','false')<>'true' and (p.slug=p_slug or p.id=(select r.page_id from public.page_redirects r where r.site_id=s.id and r.old_slug=p_slug)) limit 1$$;
create function public.get_public_page_info(p_site_slug text,p_slug text)returns jsonb language sql stable security invoker set search_path='' as $$select private.public_page_info(p_site_slug,p_slug)$$;
create function private.public_navigation(p_slug text)returns jsonb language sql stable security definer set search_path='' as $$
select case when exists(select 1 from public.site_navigation nav join public.sites st on st.id=nav.site_id where st.slug=p_slug and st.public_delivery_enabled and nav.published_id is not null) then coalesce(jsonb_agg(e.value||jsonb_build_object('href',case when p.slug='home' then '/home' when p.slug='welcome' then '/' when p.slug in ('reasons','hotline','adventure','movie','kiss-shop','radio') then '/app/'||p.slug when p.id is not null then '/pages/'||p.slug else null end)order by e.ordinality),'[]'::jsonb) else null end from public.sites s join public.site_navigation n on n.site_id=s.id join public.navigation_versions v on v.id=n.published_id cross join lateral jsonb_array_elements(v.document)with ordinality e(value,ordinality) left join public.pages p on p.id=(e.value->>'pageId')::uuid and p.site_id=s.id where s.slug=p_slug and s.public_delivery_enabled$$;
create function public.get_public_navigation(p_slug text)returns jsonb language sql stable security invoker set search_path='' as $$select private.public_navigation(p_slug)$$;

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
 select id,version_number into v,num from public.page_versions where id=p.published_version_id and document=p.draft_document and metadata=jsonb_build_object('title',p.title,'description',coalesce(p.settings->>'description',''));
 if found then return jsonb_build_object('versionId',v,'versionNumber',num,'revision',p.draft_revision,'changed',false); end if;
 select coalesce(max(version_number),0)+1 into num from public.page_versions where page_id=p_page_id;
 insert into public.page_versions(page_id,version_number,status,document,created_by) values(p_page_id,num,'published',p.draft_document,auth.uid()) returning id into v;
 update public.pages set published_version_id=v where id=p_page_id;
 return jsonb_build_object('versionId',v,'versionNumber',num,'revision',p.draft_revision,'changed',true);
end $$;

create or replace function public.rollback_page(p_page_id uuid,p_version_id uuid,p_expected_revision bigint)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare p public.pages%rowtype; source public.page_versions%rowtype; v uuid; num integer;
begin
 if not private.has_admin_role(array['owner']::public.admin_role[]) then raise exception 'Not authorized' using errcode='42501'; end if;
 select * into p from public.pages where id=p_page_id for update;
 if not found then raise exception 'Page not found'; end if; if p.settings->>'archived'='true' then raise exception 'Restore archived page first';end if;
 if p_expected_revision is null or p.draft_revision<>p_expected_revision then raise exception 'DRAFT_CONFLICT' using errcode='40001'; end if;
 select * into source from public.page_versions where id=p_version_id and page_id=p_page_id and status='published';
 if not found then raise exception 'Published version not found for this page'; end if;
 perform private.assert_page_document(source.document);
 select coalesce(max(version_number),0)+1 into num from public.page_versions where page_id=p_page_id;
 insert into public.page_versions(page_id,version_number,status,document,created_by,metadata) values(p_page_id,num,'published',source.document,auth.uid(),source.metadata) returning id into v;
 update public.pages set published_version_id=v where id=p_page_id;
 return jsonb_build_object('versionId',v,'versionNumber',num,'revision',p.draft_revision);
end $$;

revoke all on function private.assert_navigation(jsonb,uuid,boolean) from public,anon,authenticated;
revoke all on function private.version_metadata() from public,anon,authenticated;
revoke all on function private.page_lifecycle() from public,anon,authenticated;
revoke all on function private.change_navigation(uuid,jsonb,bigint,boolean) from public,anon;grant execute on function private.change_navigation(uuid,jsonb,bigint,boolean) to authenticated;
revoke all on function public.change_navigation(uuid,jsonb,bigint,boolean) from public,anon;grant execute on function public.change_navigation(uuid,jsonb,bigint,boolean) to authenticated;
revoke all on function private.public_page_info(text,text) from public;grant execute on function private.public_page_info(text,text) to anon,authenticated;
revoke all on function public.get_public_page_info(text,text) from public;grant execute on function public.get_public_page_info(text,text) to anon,authenticated;
revoke all on function private.public_navigation(text) from public;grant execute on function private.public_navigation(text) to anon,authenticated;
revoke all on function public.get_public_navigation(text) from public;grant execute on function public.get_public_navigation(text) to anon,authenticated;

revoke delete on public.pages from authenticated;

create or replace function private.track_draft_revision()returns trigger language plpgsql set search_path='' as $$begin
 new.draft_revision:=old.draft_revision+case when new.draft_document is distinct from old.draft_document or new.settings is distinct from old.settings or new.title is distinct from old.title or new.slug is distinct from old.slug then 1 else 0 end;
 new.updated_at:=clock_timestamp();return new;end $$;

