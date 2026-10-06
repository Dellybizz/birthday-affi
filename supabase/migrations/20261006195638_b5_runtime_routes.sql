-- Runtime app drafts have built-in route contracts, including page-ID navigation destinations.
create or replace function private.page_lifecycle()returns trigger language plpgsql security definer set search_path='' as $$begin
 perform 1 from public.sites where id=new.site_id for update;
 if (new.settings ? 'description' and jsonb_typeof(new.settings->'description')<>'string') or length(new.title)>120 or length(coalesce(new.settings->>'description',''))>300 then raise exception 'Invalid page metadata';end if;
 if new.slug !~ '^[a-z][a-z0-9-]{0,63}$' then raise exception 'Invalid page slug';end if;
 if tg_op='INSERT' then if exists(select 1 from public.page_redirects where site_id=new.site_id and old_slug=new.slug)then raise exception 'Slug reserved by redirect';end if;return new;end if;
 if new.slug !~ '^[a-z][a-z0-9-]{0,63}$' then raise exception 'Invalid page slug';end if;
 if new.slug<>old.slug and old.slug in ('welcome','home','reasons','hotline','adventure','movie','kiss-shop','radio','camera','vault','pieces') then raise exception 'Built-in route protected';end if;
 if new.settings->>'archived'='true' and (old.slug in ('welcome','home','reasons','hotline','adventure','movie','kiss-shop','radio','camera','vault','pieces') or exists(select 1 from public.site_navigation n left join public.navigation_versions v on v.id=n.published_id where n.site_id=new.site_id and exists(select 1 from jsonb_array_elements(n.draft||coalesce(v.document,'[]'))e where e->>'pageId'=new.id::text)))then raise exception 'Remove navigation references before archiving';end if;
 if old.published_version_id is not null and (new.slug<>old.slug or new.settings->>'archived' is distinct from old.settings->>'archived') and not private.has_admin_role(array['owner']::public.admin_role[])then raise exception 'Owner required' using errcode='42501';end if;
 if new.slug<>old.slug then
 if exists(select 1 from public.page_redirects where site_id=new.site_id and old_slug=new.slug and page_id<>new.id)then raise exception 'Slug reserved by redirect';end if;
 delete from public.page_redirects where site_id=new.site_id and old_slug=new.slug and page_id=new.id;
 insert into public.page_redirects values(new.site_id,old.slug,new.id)on conflict(site_id,old_slug)do update set page_id=excluded.page_id;
 end if;
 return new;end $$;

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
 if jsonb_typeof(item->'pageId')<>'string' or not exists(select 1 from public.pages p where p.id=(item->>'pageId')::uuid and p.site_id=site and coalesce(p.settings->>'archived','false')<>'true' and (not publishing or p.published_version_id is not null or p.slug in ('memories-archive','welcome','home','reasons','hotline','adventure','movie','kiss-shop','radio','camera','vault','pieces'))) then raise exception 'Navigation destination unavailable';end if;
 end if;
 end loop;
end $$;
create or replace function private.public_navigation(p_slug text)returns jsonb language sql stable security definer set search_path='' as $$
select case when exists(select 1 from public.site_navigation nav join public.sites st on st.id=nav.site_id where st.slug=p_slug and st.public_delivery_enabled and nav.published_id is not null) then coalesce(jsonb_agg(e.value||jsonb_build_object('href',case when e.value->>'runtimeSlug' in ('camera','vault','pieces') then '/app/'||(e.value->>'runtimeSlug') when p.slug='memories-archive' then '/' when p.slug='home' then '/home' when p.slug='welcome' then '/' when p.slug in ('reasons','hotline','adventure','movie','kiss-shop','radio','camera','vault','pieces') then '/app/'||p.slug when p.id is not null then '/pages/'||p.slug else null end)order by e.ordinality),'[]'::jsonb) else null end from public.sites s join public.site_navigation n on n.site_id=s.id join public.navigation_versions v on v.id=n.published_id cross join lateral jsonb_array_elements(v.document)with ordinality e(value,ordinality) left join public.pages p on p.id=(e.value->>'pageId')::uuid and p.site_id=s.id where s.slug=p_slug and s.public_delivery_enabled$$;
