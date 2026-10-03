alter table public.media_assets add column byte_size bigint not null default 0;
alter table public.media_assets add column status text not null default 'pending' check(status in ('pending','ready'));
alter table public.media_assets add column archived_at timestamptz;
alter table public.media_assets add constraint media_size_valid check(byte_size between 0 and 52428800);
alter table public.media_assets add constraint media_dimensions_valid check((width is null or width between 1 and 20000) and (height is null or height between 1 and 20000) and (duration_ms is null or duration_ms between 0 and 86400000));
create index media_assets_site_created_idx on public.media_assets(site_id,created_at desc);
revoke delete on public.media_assets from authenticated;

-- Media identity and object paths cannot be repointed after reservation.
create function private.guard_media_identity() returns trigger language plpgsql set search_path='' as $$
begin
 if tg_op='INSERT' then
  if new.storage_path<>new.site_id::text||'/'||new.id::text||'/original' then raise exception 'Invalid media path';end if;
 elsif new.id<>old.id or new.site_id<>old.site_id or new.kind<>old.kind or new.storage_path<>old.storage_path or new.mime_type is distinct from old.mime_type or new.byte_size<>old.byte_size then
  raise exception 'Media identity is immutable';
 end if;
 if tg_op='UPDATE' and old.status='ready' and (new.status<>old.status or new.width is distinct from old.width or new.height is distinct from old.height or new.duration_ms is distinct from old.duration_ms or new.metadata is distinct from old.metadata) then raise exception 'Verified media is immutable';end if;
 if jsonb_typeof(new.metadata)<>'object' or (new.metadata ? 'variants' and (jsonb_typeof(new.metadata->'variants')<>'array' or not new.metadata->'variants' <@ '[480,960,1600]'::jsonb)) then raise exception 'Invalid variants';end if;
 if length(new.filename) not between 1 and 255 or coalesce(length(new.alt_text),0)>2000 then raise exception 'Invalid media metadata';end if;
 if not ((new.kind='image' and new.mime_type in ('image/jpeg','image/png','image/webp','image/gif') and new.byte_size between 1 and 8388608)
 or (new.kind='video' and new.mime_type in ('video/mp4','video/webm') and new.byte_size between 1 and 52428800)
 or (new.kind='audio' and new.mime_type in ('audio/mpeg','audio/mp4','audio/wav','audio/ogg') and new.byte_size between 1 and 26214400)) then raise exception 'Invalid media type or size';end if;
 return new;
end $$;
revoke all on function private.guard_media_identity() from public,anon,authenticated;
create trigger guard_media_identity before insert or update on public.media_assets for each row execute function private.guard_media_identity();

-- Only assets referenced by the CURRENT published snapshot are deliverable anonymously.
-- This narrow privileged lookup never returns drafts or inventory.
create function public.get_published_media(site_slug text,asset_id uuid) returns jsonb
language sql stable security definer set search_path='' as $$
 select jsonb_build_object('path',m.storage_path,'kind',m.kind,'mime',m.mime_type,'variants',coalesce(m.metadata->'variants','[]'::jsonb))
 from public.media_assets m join public.sites s on s.id=m.site_id
 where m.id=asset_id and s.slug=site_slug and s.public_delivery_enabled and m.status='ready'
 and exists(select 1 from public.pages p join public.page_versions v on v.id=p.published_version_id and v.page_id=p.id and v.status='published'
 where p.site_id=s.id and exists(select 1 from jsonb_array_elements(v.document->'nodes') n where n->'props'->>'mediaAssetId'=m.id::text)) limit 1;
$$;
revoke all on function public.get_published_media(text,uuid) from public;
grant execute on function public.get_published_media(text,uuid) to anon,authenticated;

create function public.archive_media(asset_id uuid,archive boolean) returns void
language plpgsql security invoker set search_path='' as $$
begin
 if not private.has_admin_role(array['owner','editor']::public.admin_role[]) then raise exception 'Not authorized';end if;
 update public.media_assets set archived_at=case when archive then now() else null end where id=asset_id;
 if not found then raise exception 'Media not found';end if;
end $$;
revoke all on function public.archive_media(uuid,boolean) from public;
grant execute on function public.archive_media(uuid,boolean) to authenticated;

create or replace function private.assert_page_document(doc jsonb) returns void
language plpgsql immutable set search_path='' as $$
declare n jsonb; prop record; ids text[]='{}'; seen text[]='{}'; queue jsonb; item jsonb; target jsonb; child jsonb; count_nodes integer;
begin
 if doc is null or jsonb_typeof(doc)<>'object' or doc->>'schemaVersion' is distinct from '2'
 or jsonb_typeof(doc->'nodes') is distinct from 'array' or jsonb_typeof(doc->'rootIds') is distinct from 'array'
 or octet_length(doc::text)>1000000 then raise exception 'Invalid page document'; end if;
 count_nodes:=jsonb_array_length(doc->'nodes');
 if count_nodes>500 then raise exception 'Document exceeds node limit'; end if;
 for n in select value from jsonb_array_elements(doc->'nodes') loop
  if jsonb_typeof(n)<>'object' or coalesce(n->>'id','') !~ '^[a-zA-Z0-9_-]{1,100}$' or (n->>'id')=any(ids)
  or (((n->>'type'='section' and n->>'component'='section') or (n->>'type'='block' and n->>'component' in ('heading','text','image','video','audio','app-grid'))) is not true)
  or jsonb_typeof(n->'visible') is distinct from 'boolean'
  or ((n->'parentId'='null'::jsonb or (jsonb_typeof(n->'parentId')='string' and n->>'parentId' ~ '^[a-zA-Z0-9_-]{1,100}$')) is not true)
  or jsonb_typeof(n->'children') is distinct from 'array' or jsonb_typeof(n->'props') is distinct from 'object'
  then raise exception 'Invalid node'; end if;
  if n ? 'label' and (jsonb_typeof(n->'label')<>'string' or length(n->>'label')>200) then raise exception 'Invalid label'; end if;
  ids:=array_append(ids,n->>'id');
  if n->>'type'='block' and jsonb_array_length(n->'children')>0 then raise exception 'Blocks cannot contain children'; end if;
  for prop in select key,value from jsonb_each(n->'props') loop
   if jsonb_typeof(prop.value) not in ('string','number','boolean','null') or (jsonb_typeof(prop.value)='string' and length(prop.value#>>'{}')>20000) then raise exception 'Invalid property'; end if;
   if prop.key in ('text','alt','className') and jsonb_typeof(prop.value)<>'string' then raise exception 'Invalid text'; end if;
   if prop.key in ('background','color') and (jsonb_typeof(prop.value)<>'string' or prop.value#>>'{}' !~ '^(#[0-9a-fA-F]{3,8}|transparent)$') then raise exception 'Invalid color'; end if;
   if prop.key='align' and prop.value#>>'{}' not in ('left','center','right') then raise exception 'Invalid alignment'; end if;
   if prop.key in ('padding','margin','radius','opacity','size','weight','columns','gap','focalX','focalY','displayHeight') then
    if jsonb_typeof(prop.value)<>'number' then raise exception 'Invalid numeric style'; end if;
    if (prop.value#>>'{}')::numeric < (case prop.key when 'size' then 10 when 'weight' then 100 when 'columns' then 1 else 0 end)
    or (prop.value#>>'{}')::numeric > (case prop.key when 'radius' then 64 when 'opacity' then 1 when 'size' then 72 when 'weight' then 900 when 'columns' then 4 when 'focalX' then 100 when 'focalY' then 100 when 'displayHeight' then 1200 else 96 end)
    or (prop.key='columns' and (prop.value#>>'{}')::numeric<>trunc((prop.value#>>'{}')::numeric)) then raise exception 'Invalid style range'; end if;
   end if;
   if prop.key='objectFit' and prop.value#>>'{}' not in ('cover','contain') then raise exception 'Invalid image fit';end if;
   if prop.key='mediaAssetId' and prop.value<>'null'::jsonb and (jsonb_typeof(prop.value)<>'string' or prop.value#>>'{}' !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$') then raise exception 'Invalid media asset';end if;
   if prop.key in ('mediaWidth','mediaHeight') and prop.value<>'null'::jsonb then
    if jsonb_typeof(prop.value)<>'number' then raise exception 'Invalid media dimensions';end if;
    if (prop.value#>>'{}')::numeric not between 1 and 20000 or (prop.value#>>'{}')::numeric<>trunc((prop.value#>>'{}')::numeric) then raise exception 'Invalid media dimensions';end if;
   end if;
   if prop.key='variantWidths' and (jsonb_typeof(prop.value)<>'string' or prop.value#>>'{}' !~ '^(|480|960|1600|480,960|480,1600|960,1600|480,960,1600)$') then raise exception 'Invalid image variants';end if;
   if prop.key='src' and (jsonb_typeof(prop.value)<>'string' or not (
    prop.value#>>'{}'='' or prop.value#>>'{}' ~ '^/($|[^/\\[:space:]][^\\[:space:]]*)$'
    or prop.value#>>'{}' ~ '^https://[^/@[:space:]\\]+(/[^[:space:]\\]*)?$')) then raise exception 'Unsafe image URL'; end if;
  end loop;
  if n->'props'->>'mediaAssetId' is not null and n->'props'->>'src' is distinct from '/media/'||(n->'props'->>'mediaAssetId') then raise exception 'Media source must match asset';end if;
 end loop;
 if doc ? 'theme' then
  if jsonb_typeof(doc->'theme')<>'object' then raise exception 'Invalid theme'; end if;
  for prop in select key,value from jsonb_each(doc->'theme') loop
   if prop.key='radius' then
    if jsonb_typeof(prop.value)<>'number' then raise exception 'Invalid theme radius'; end if;
    if (prop.value#>>'{}')::numeric not between 0 and 64 then raise exception 'Invalid theme radius'; end if;
   elsif prop.key not in ('primary','background','surface','text','muted') or jsonb_typeof(prop.value)<>'string' or prop.value#>>'{}' !~ '^(#[0-9a-fA-F]{3,8}|transparent)$' then raise exception 'Invalid theme color'; end if;
  end loop;
 end if;
 queue:='[]'::jsonb;
 for child in select value from jsonb_array_elements(doc->'rootIds') loop
  queue:=queue||jsonb_build_array(jsonb_build_object('id',child,'parent',null,'depth',0));
 end loop;
 while jsonb_array_length(queue)>0 loop
  item:=queue->0;queue:=queue-0;
  if jsonb_typeof(item->'id')<>'string' or (item->>'id')=any(seen) or (item->>'depth')::integer>20 then raise exception 'Invalid tree'; end if;
  select value into target from jsonb_array_elements(doc->'nodes') where value->>'id'=item->>'id';
  if target is null or target->'parentId' is distinct from item->'parent' or (item->'parent'='null'::jsonb and target->>'type'<>'section') then raise exception 'Invalid tree relationship'; end if;
  seen:=array_append(seen,item->>'id');
  for child in select value from jsonb_array_elements(target->'children') loop
   queue:=queue||jsonb_build_array(jsonb_build_object('id',child,'parent',item->'id','depth',(item->>'depth')::integer+1));
  end loop;
 end loop;
 if coalesce(array_length(seen,1),0)<>count_nodes then raise exception 'Unreachable nodes'; end if;
end $$;

-- Reject missing, cross-site, pending, or mismatched assets at the saved-version boundary.
create function private.guard_document_media() returns trigger language plpgsql set search_path='' as $$
declare n jsonb; m public.media_assets; target_site uuid; document jsonb;
begin
 if tg_table_name='pages' then target_site:=new.site_id;document:=new.draft_document;
 else select site_id into target_site from public.pages where id=new.page_id;document:=new.document;end if;
 for n in select value from jsonb_array_elements(document->'nodes') loop
  if n->'props'->>'mediaAssetId' is not null then
   select * into m from public.media_assets where id=(n->'props'->>'mediaAssetId')::uuid and site_id=target_site and status='ready';
   if not found or m.kind is distinct from n->>'component' or n->'props'->>'src' is distinct from '/media/'||m.id::text then raise exception 'Media asset is unavailable for this page';end if;
   if coalesce(n->'props'->>'variantWidths','')<>coalesce((select string_agg(value,',' order by value::int) from jsonb_array_elements_text(coalesce(m.metadata->'variants','[]'::jsonb))),'') then raise exception 'Media variants do not match';end if;
  end if;
 end loop;
 return new;
end $$;
revoke all on function private.guard_document_media() from public,anon,authenticated;
create trigger guard_document_media before insert or update of draft_document on public.pages for each row execute function private.guard_document_media();
create trigger guard_document_media before insert on public.page_versions for each row execute function private.guard_document_media();

create function public.is_published_media_object(bucket text,path text) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.media_assets m join public.sites s on s.id=m.site_id
 where bucket='wiffeyyyy-'||m.kind and m.status='ready'
 and (path=m.storage_path or exists(select 1 from jsonb_array_elements_text(coalesce(m.metadata->'variants','[]'::jsonb)) v where path=m.site_id::text||'/'||m.id::text||'/'||v||'.webp'))
 and public.get_published_media(s.slug,m.id) is not null);
$$;
revoke all on function public.is_published_media_object(text,text) from public;
grant execute on function public.is_published_media_object(text,text) to anon,authenticated;
create function private.can_upload_media_object(bucket text,path text) returns boolean
language sql stable security invoker set search_path='' as $$
 select private.has_admin_role(array['owner','editor']::public.admin_role[]) and exists(
 select 1 from public.media_assets m where m.status='pending' and m.archived_at is null and bucket='wiffeyyyy-'||m.kind
 and (path=m.storage_path or (m.kind='image' and path in (m.site_id::text||'/'||m.id::text||'/480.webp',m.site_id::text||'/'||m.id::text||'/960.webp',m.site_id::text||'/'||m.id::text||'/1600.webp'))));
$$;
revoke all on function private.can_upload_media_object(text,text) from public;
grant execute on function private.can_upload_media_object(text,text) to authenticated;

-- Storage is provider-managed: never synthesize its internal tables.
-- Keep this privileged setup function available for the one-time activation once
-- the provider initializes storage.buckets/storage.objects. It is not a client RPC.
create function public.configure_media_storage() returns void
language plpgsql security invoker set search_path='' as $$
begin
 if to_regclass('storage.objects') is null or to_regclass('storage.buckets') is null then raise exception 'Supabase Storage has not been provisioned';end if;
 execute $config$insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('wiffeyyyy-image','wiffeyyyy-image',false,8388608,array['image/jpeg','image/png','image/webp','image/gif']),
 ('wiffeyyyy-video','wiffeyyyy-video',false,52428800,array['video/mp4','video/webm']),
 ('wiffeyyyy-audio','wiffeyyyy-audio',false,26214400,array['audio/mpeg','audio/mp4','audio/wav','audio/ogg'])
 on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types$config$;
 execute 'drop policy if exists wiffeyyyy_admin_media_read on storage.objects';
 execute 'drop policy if exists wiffeyyyy_published_media_read on storage.objects';
 execute 'drop policy if exists wiffeyyyy_media_insert on storage.objects';
 execute $policy$create policy wiffeyyyy_admin_media_read on storage.objects for select to authenticated using(bucket_id in ('wiffeyyyy-image','wiffeyyyy-video','wiffeyyyy-audio') and private.has_admin_role(array['owner','editor','viewer']::public.admin_role[]))$policy$;
 execute $policy$create policy wiffeyyyy_published_media_read on storage.objects for select to anon,authenticated using(public.is_published_media_object(bucket_id,name))$policy$;
 execute $policy$create policy wiffeyyyy_media_insert on storage.objects for insert to authenticated with check(private.can_upload_media_object(bucket_id,name))$policy$;
end $$;
revoke all on function public.configure_media_storage() from public,anon,authenticated;
do $$begin
 if to_regclass('storage.objects') is not null and to_regclass('storage.buckets') is not null then perform public.configure_media_storage();
 else raise warning 'Phase 6 storage activation pending: provider Storage tables are absent';end if;
end $$;
