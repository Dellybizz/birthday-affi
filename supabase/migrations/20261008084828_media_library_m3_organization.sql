alter table public.media_assets add column tags text[] not null default '{}', add column favourite boolean not null default false, add column content_sha256 text check(content_sha256 is null or (status='ready' and content_sha256 ~ '^[0-9a-f]{64}$'));
alter table public.media_assets add constraint media_assets_id_site_unique unique(id,site_id);
create index media_assets_tags_idx on public.media_assets using gin(tags);
create index media_assets_fingerprint_idx on public.media_assets(site_id,content_sha256) where content_sha256 is not null;
create table public.media_collections(id uuid primary key default gen_random_uuid(),site_id uuid not null references public.sites(id),name text not null check(length(btrim(name)) between 1 and 80 and name=btrim(name) and name !~ '[[:cntrl:]]'),created_at timestamptz not null default now(),unique(id,site_id));
create unique index media_collections_site_name_idx on public.media_collections(site_id,lower(name));
create table public.media_collection_assets(site_id uuid not null,collection_id uuid not null,asset_id uuid not null,primary key(collection_id,asset_id),foreign key(collection_id,site_id) references public.media_collections(id,site_id) on delete cascade,foreign key(asset_id,site_id) references public.media_assets(id,site_id));
create index media_collection_assets_asset_idx on public.media_collection_assets(asset_id,site_id);
alter table public.media_collections enable row level security;
alter table public.media_collection_assets enable row level security;
create policy media_collections_read on public.media_collections for select to authenticated using(private.has_admin_role(array['owner','editor','viewer']::public.admin_role[]));
create policy media_collections_write on public.media_collections for all to authenticated using(private.has_admin_role(array['owner','editor']::public.admin_role[])) with check(private.has_admin_role(array['owner','editor']::public.admin_role[]));
create policy media_collection_assets_read on public.media_collection_assets for select to authenticated using(private.has_admin_role(array['owner','editor','viewer']::public.admin_role[]));
create policy media_collection_assets_write on public.media_collection_assets for all to authenticated using(private.has_admin_role(array['owner','editor']::public.admin_role[])) with check(private.has_admin_role(array['owner','editor']::public.admin_role[]));
revoke all on public.media_collections,public.media_collection_assets from public,anon,authenticated;
grant select,insert,update,delete on public.media_collections,public.media_collection_assets to authenticated;
create function private.valid_media_tags(tags text[]) returns boolean language sql immutable set search_path='' as $$
 select tags is not null and cardinality(tags)<=20 and coalesce(array_ndims(tags),1)=1 and cardinality(tags)=(select count(distinct tag) from unnest(tags) tag) and not exists(select 1 from unnest(tags) tag where tag is null or length(tag) not between 1 and 40 or tag<>btrim(tag) or tag !~ '[^[:space:]]' or tag ~ '[[:cntrl:],]');
$$;
revoke all on function private.valid_media_tags(text[]) from public,anon,authenticated;
create function private.guard_media_organization() returns trigger language plpgsql set search_path='' as $$begin
 if not private.valid_media_tags(new.tags) then raise exception 'Invalid media tags';end if;
 if tg_op='UPDATE' and old.content_sha256 is not null and new.content_sha256 is distinct from old.content_sha256 then raise exception 'Media fingerprint is immutable';end if;return new;
end $$;
revoke all on function private.guard_media_organization() from public,anon,authenticated;
create trigger guard_media_organization before insert or update on public.media_assets for each row execute function private.guard_media_organization();
create function public.save_media_organization(p_asset uuid,p_tags text[],p_favourite boolean,p_collections uuid[]) returns void language plpgsql security invoker set search_path='' as $$
declare m public.media_assets;begin
 if not private.has_admin_role(array['owner','editor']::public.admin_role[]) then raise exception 'Not authorized';end if;
 if p_favourite is null or not private.valid_media_tags(p_tags) or p_collections is null or cardinality(p_collections)>100 or cardinality(p_collections)<>(select count(distinct id) from unnest(p_collections) id) then raise exception 'Invalid organization';end if;
 select * into m from public.media_assets where id=p_asset for update;if not found then raise exception 'Media not found';end if;
 if (select count(*) from public.media_collections where id=any(p_collections) and site_id=m.site_id)<>cardinality(p_collections) then raise exception 'Collection is unavailable in this site';end if;
 update public.media_assets set tags=p_tags,favourite=p_favourite where id=p_asset;
 delete from public.media_collection_assets where asset_id=p_asset;
 insert into public.media_collection_assets(site_id,collection_id,asset_id) select m.site_id,id,p_asset from unnest(p_collections) id;
end $$;
grant execute on function private.valid_media_tags(text[]) to authenticated;
revoke all on function public.save_media_organization(uuid,text[],boolean,uuid[]) from public,anon;
grant execute on function public.save_media_organization(uuid,text[],boolean,uuid[]) to authenticated;
create function public.add_media_to_collection(p_site uuid,p_collection uuid,p_assets uuid[]) returns void language plpgsql security invoker set search_path='' as $$begin
 if not private.has_admin_role(array['owner','editor']::public.admin_role[]) then raise exception 'Not authorized';end if;
 if p_assets is null or cardinality(p_assets) not between 1 and 100 or cardinality(p_assets)<>(select count(distinct id) from unnest(p_assets) id) then raise exception 'Select between 1 and 100 files';end if;
 if not exists(select 1 from public.media_collections where id=p_collection and site_id=p_site) or (select count(*) from public.media_assets where id=any(p_assets) and site_id=p_site)<>cardinality(p_assets) then raise exception 'Files or collection are unavailable in this site';end if;
 insert into public.media_collection_assets(site_id,collection_id,asset_id) select p_site,p_collection,id from unnest(p_assets) id on conflict do nothing;
end $$;
revoke all on function public.add_media_to_collection(uuid,uuid,uuid[]) from public,anon;
grant execute on function public.add_media_to_collection(uuid,uuid,uuid[]) to authenticated;
-- Conservative string matching also retains media embedded in text and URLs
-- with query strings. Unused never authorizes deletion.
create function private.media_document_mentions(doc jsonb,asset uuid) returns boolean language sql immutable set search_path='' as $$select position(asset::text in coalesce(doc::text,''))>0$$;
revoke all on function private.media_document_mentions(jsonb,uuid) from public,anon;
grant execute on function private.media_document_mentions(jsonb,uuid) to authenticated;
create view public.media_library_assets with(security_invoker=true) as
 select m.*,
 coalesce((select array_agg(a.collection_id order by a.collection_id) from public.media_collection_assets a where a.asset_id=m.id and a.site_id=m.site_id),'{}'::uuid[]) as collection_ids,
 (not exists(select 1 from public.pages p where p.site_id=m.site_id and (private.media_document_mentions(p.draft_document,m.id) or private.media_document_mentions(p.settings,m.id)))
 and not exists(select 1 from public.page_versions v join public.pages p on p.id=v.page_id where p.site_id=m.site_id and (private.media_document_mentions(v.document,m.id) or private.media_document_mentions(v.metadata,m.id)))
 and not exists(select 1 from public.site_configurations c where c.site_id=m.site_id and private.media_document_mentions(c.draft,m.id))
 and not exists(select 1 from public.site_configuration_versions v where v.site_id=m.site_id and private.media_document_mentions(v.document,m.id))
 and not exists(select 1 from public.site_navigation n where n.site_id=m.site_id and private.media_document_mentions(n.draft,m.id))
 and not exists(select 1 from public.navigation_versions v where v.site_id=m.site_id and private.media_document_mentions(v.document,m.id))
 and not exists(select 1 from public.app_content a where a.site_id=m.site_id and private.media_document_mentions(a.content,m.id))
 and not exists(select 1 from public.app_content_items a where a.site_id=m.site_id and (a.media_asset_id=m.id or private.media_document_mentions(a.metadata,m.id)))) as is_unused,
 (case when m.content_sha256 is null then 0 else (select count(*) from public.media_assets d where d.site_id=m.site_id and d.content_sha256=m.content_sha256 and d.status='ready' and (d.archived_at is null)=(m.archived_at is null)) end)::int as duplicate_count
 from public.media_assets m;
revoke all on public.media_library_assets from public,anon,authenticated;
grant select on public.media_library_assets to authenticated;
create function public.get_media_organization(p_site uuid) returns jsonb language plpgsql stable security invoker set search_path='' as $$begin
 if not private.has_admin_role(array['owner','editor','viewer']::public.admin_role[]) then raise exception 'Not authorized';end if;
 return jsonb_build_object('collections',coalesce((select jsonb_agg(jsonb_build_object('id',id,'name',name) order by lower(name),id) from public.media_collections where site_id=p_site),'[]'::jsonb),'tags',coalesce((select jsonb_agg(tag order by tag) from (select distinct unnest(tags) as tag from public.media_assets where site_id=p_site) t),'[]'::jsonb));
end $$;
revoke all on function public.get_media_organization(uuid) from public,anon;
grant execute on function public.get_media_organization(uuid) to authenticated;
