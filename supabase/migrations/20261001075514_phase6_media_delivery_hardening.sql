-- Keep privileged publication lookups out of the exposed RPC schema.
alter function public.get_published_media(text,uuid) set schema private;
alter function public.is_published_media_object(text,text) set schema private;
grant usage on schema private to anon;
create function public.get_published_media(site_slug text,asset_id uuid) returns jsonb
language sql stable security invoker set search_path='' as $$select private.get_published_media(site_slug,asset_id)$$;
create function public.is_published_media_object(bucket text,path text) returns boolean
language sql stable security invoker set search_path='' as $$select private.is_published_media_object(bucket,path)$$;
revoke all on function public.get_published_media(text,uuid),public.is_published_media_object(text,text) from public;
grant execute on function public.get_published_media(text,uuid),public.is_published_media_object(text,text) to anon,authenticated;
-- The schema move retains the deliberately narrow anon/authenticated EXECUTE
-- grants. Other private auth/role helpers remain authenticated-only.
