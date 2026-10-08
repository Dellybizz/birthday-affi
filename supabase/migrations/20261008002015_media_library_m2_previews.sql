alter table public.media_assets add column poster_ready boolean not null default false;
alter table public.media_assets add constraint video_poster_only check(not poster_ready or (kind='video' and status='ready'));
-- Original uploads still require a pending reservation. Only the exact video
-- sidecar may be appended after verification; storage has no UPDATE grant.
create or replace function private.can_upload_media_object(bucket text,path text) returns boolean
language sql stable security invoker set search_path='' as $$
 select private.has_admin_role(array['owner','editor']::public.admin_role[]) and exists(
 select 1 from public.media_assets m where m.archived_at is null and bucket='wiffeyyyy-'||m.kind
 and ((m.status='pending' and (path=m.storage_path or (m.kind='image' and path in (m.site_id::text||'/'||m.id::text||'/480.webp',m.site_id::text||'/'||m.id::text||'/960.webp',m.site_id::text||'/'||m.id::text||'/1600.webp'))))
 or (m.kind='video' and m.status='ready' and not m.poster_ready and path=m.site_id::text||'/'||m.id::text||'/poster.webp')));
$$;
revoke all on function private.can_upload_media_object(text,text) from public;
grant execute on function private.can_upload_media_object(text,text) to authenticated;
create or replace function public.configure_media_storage() returns void
language plpgsql security invoker set search_path='' as $$
begin
 if to_regclass('storage.objects') is null or to_regclass('storage.buckets') is null then raise exception 'Supabase Storage has not been provisioned';end if;
 execute $config$insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('wiffeyyyy-image','wiffeyyyy-image',false,8388608,array['image/jpeg','image/png','image/webp','image/gif']),
 ('wiffeyyyy-video','wiffeyyyy-video',false,52428800,array['video/mp4','video/webm','image/webp']),
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
 else raise warning 'Media poster storage activation pending: provider Storage tables are absent';end if;
end $$;
