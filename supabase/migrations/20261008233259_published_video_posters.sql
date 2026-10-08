-- Posters follow the same publication boundary as their verified original.
create or replace function private.get_published_media(site_slug text,asset_id uuid) returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('path',m.storage_path,'kind',m.kind,'mime',m.mime_type,'filename',m.filename,'posterReady',m.poster_ready,'variants',coalesce(m.metadata->'variants','[]'::jsonb)) from public.media_assets m join public.sites s on s.id=m.site_id
 where m.id=asset_id and s.slug=site_slug and s.public_delivery_enabled and m.status='ready' and (
 exists(select 1 from public.pages p join public.page_versions v on v.id=p.published_version_id and v.page_id=p.id and v.status='published' where p.site_id=s.id and private.document_uses_media(v.document,m.id))
 or exists(select 1 from public.site_configurations c join public.site_configuration_versions v on v.id=c.published_id and v.site_id=c.site_id where c.site_id=s.id and private.document_uses_media(v.document,m.id))) limit 1;
$$;
create or replace function private.is_published_media_object(bucket text,path text) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.media_assets m join public.sites s on s.id=m.site_id
 where bucket='wiffeyyyy-'||m.kind and m.status='ready'
 and (path=m.storage_path or exists(select 1 from jsonb_array_elements_text(coalesce(m.metadata->'variants','[]'::jsonb)) v where path=m.site_id::text||'/'||m.id::text||'/'||v||'.webp')
 or (m.kind='video' and m.poster_ready and path=m.site_id::text||'/'||m.id::text||'/poster.webp'))
 and private.get_published_media(s.slug,m.id) is not null);
$$;
