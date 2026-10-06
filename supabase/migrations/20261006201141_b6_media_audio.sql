-- Editorial fields are mutable; verified object identity remains immutable.
alter table public.media_assets add column caption text not null default '' check(length(caption)<=500), add column transcript text not null default '' check(length(transcript)<=20000), add column captions text not null default '' check(length(captions)<=20000);
alter function private.assert_site_document(jsonb) rename to assert_site_document_before_audio;
create function private.assert_site_document(doc jsonb) returns void language plpgsql set search_path='' as $$
declare a jsonb;t jsonb;ids text[]:=array[]::text[];begin
 perform private.assert_site_document_before_audio(doc-'audio');if not doc ? 'audio' then return;end if;a:=doc->'audio';
 if jsonb_typeof(a)<>'object' or (select count(*) from jsonb_object_keys(a))<>5 or not a ?& array['tracks','defaultTrack','loop','background','interruption'] or jsonb_typeof(a->'tracks')<>'array' or jsonb_array_length(a->'tracks')>50 or jsonb_typeof(a->'loop')<>'boolean' or jsonb_typeof(a->'background')<>'string' or jsonb_typeof(a->'interruption')<>'string' or a->>'background' not in ('continue','home-only') or a->>'interruption'<>'pause' then raise exception 'Invalid audio settings';end if;
 for t in select value from jsonb_array_elements(a->'tracks') loop
 if jsonb_typeof(t)<>'object' or (select count(*) from jsonb_object_keys(t))<>3 or not t ?& array['assetId','title','transcript'] or jsonb_typeof(t->'assetId')<>'string' or t->>'assetId' !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' or t->>'assetId'=any(ids) or jsonb_typeof(t->'title')<>'string' or length(btrim(t->>'title')) not between 1 and 120 or jsonb_typeof(t->'transcript')<>'string' or length(t->>'transcript')>20000 then raise exception 'Invalid soundtrack track';end if;ids:=array_append(ids,t->>'assetId');end loop;
 if a->'defaultTrack'<>'null'::jsonb and (jsonb_typeof(a->'defaultTrack')<>'string' or not (a->>'defaultTrack'=any(ids))) or cardinality(ids)>0 and a->'defaultTrack'='null'::jsonb then raise exception 'Invalid default track';end if;
end $$;
revoke all on function private.assert_site_document(jsonb),private.assert_site_document_before_audio(jsonb) from public,anon,authenticated;
create function private.guard_audio_assets() returns trigger language plpgsql set search_path='' as $$
declare doc jsonb;track jsonb;begin
 if tg_table_name='site_configurations' then doc:=new.draft;else doc:=new.document;end if;
 for track in select value from jsonb_array_elements(coalesce(doc->'audio'->'tracks','[]'::jsonb)) loop
 if not exists(select 1 from public.media_assets where site_id=new.site_id and id=(track->>'assetId')::uuid and kind='audio' and status='ready') then raise exception 'Soundtrack audio is unavailable';end if;end loop;return new;
end $$;
revoke all on function private.guard_audio_assets() from public,anon,authenticated;
create trigger guard_audio_assets before insert or update of draft on public.site_configurations for each row execute function private.guard_audio_assets();
create trigger guard_audio_assets before insert on public.site_configuration_versions for each row execute function private.guard_audio_assets();
-- Exact JSON string values cover media IDs and every compatible picker URL field.
create function private.document_uses_media(doc jsonb,asset uuid) returns boolean language sql immutable set search_path='' as $$
 select coalesce(jsonb_path_exists(doc,'$.** ? (@ == $id || @ == $url)',jsonb_build_object('id',asset::text,'url','/media/'||asset::text)),false);
$$;
revoke all on function private.document_uses_media(jsonb,uuid) from public,anon,authenticated;
create or replace function private.get_published_media(site_slug text,asset_id uuid) returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('path',m.storage_path,'kind',m.kind,'mime',m.mime_type,'variants',coalesce(m.metadata->'variants','[]'::jsonb)) from public.media_assets m join public.sites s on s.id=m.site_id
 where m.id=asset_id and s.slug=site_slug and s.public_delivery_enabled and m.status='ready' and (
 exists(select 1 from public.pages p join public.page_versions v on v.id=p.published_version_id and v.page_id=p.id and v.status='published' where p.site_id=s.id and private.document_uses_media(v.document,m.id))
 or exists(select 1 from public.site_configurations c join public.site_configuration_versions v on v.id=c.published_id and v.site_id=c.site_id where c.site_id=s.id and private.document_uses_media(v.document,m.id))) limit 1;
$$;
create function public.get_media_usage(asset_id uuid) returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare m public.media_assets;result jsonb;begin
 if not private.has_admin_role(array['owner','editor','viewer']::public.admin_role[]) then raise exception 'Not authorized';end if;select * into m from public.media_assets where id=asset_id;if not found then raise exception 'Media not found';end if;
 select jsonb_build_object('drafts',(select count(*) from public.pages p where p.site_id=m.site_id and private.document_uses_media(p.draft_document,m.id)),
 'versions',(select count(*) from public.page_versions v join public.pages p on p.id=v.page_id where p.site_id=m.site_id and private.document_uses_media(v.document,m.id)),
 'releases',(select count(*) from public.site_releases r where r.site_id=m.site_id and (exists(select 1 from public.site_release_pages rp join public.page_versions v on v.id=rp.page_version_id where rp.release_id=r.id and private.document_uses_media(v.document,m.id)) or exists(select 1 from public.site_configuration_versions v where v.id=r.configuration_version_id and private.document_uses_media(v.document,m.id)))),
 'audioDraft',exists(select 1 from public.site_configurations c where c.site_id=m.site_id and private.document_uses_media(c.draft->'audio',m.id)),
 'audioPublished',exists(select 1 from public.site_configurations c join public.site_configuration_versions v on v.id=c.published_id where c.site_id=m.site_id and private.document_uses_media(v.document->'audio',m.id))) into result;return result;
end $$;
-- Helper reads only its supplied JSON; grant is needed by the invoker usage RPC.
grant execute on function private.document_uses_media(jsonb,uuid) to authenticated;
revoke all on function public.get_media_usage(uuid) from public,anon;
grant execute on function public.get_media_usage(uuid) to authenticated;
-- No DELETE grant or Storage DELETE policy: release media is preserved permanently.
create function private.guard_media_captions() returns trigger language plpgsql set search_path='' as $$
declare line text;cue text[];previous numeric:=-1;count_cues integer:=0;begin
 foreach line in array regexp_split_to_array(new.captions,E'\r?\n') loop
 if btrim(line)='' then continue;end if;count_cues:=count_cues+1;cue:=regexp_match(line,'^[[:space:]]*([0-9]+([.][0-9]+)?)[[:space:]]*[|][[:space:]]*([0-9]+([.][0-9]+)?)[[:space:]]*[|][[:space:]]*(.+)$');
 if cue is null or count_cues>200 then raise exception 'Invalid media captions';end if;
 if cue[1]::numeric<previous or cue[3]::numeric<=cue[1]::numeric or cue[3]::numeric>604800 or length(btrim(cue[5])) not between 1 and 500 then raise exception 'Invalid media caption times or text';end if;previous:=cue[1]::numeric;
 end loop;return new;
end $$;
revoke all on function private.guard_media_captions() from public,anon,authenticated;
create trigger guard_media_captions before insert or update of captions on public.media_assets for each row execute function private.guard_media_captions();
-- App blocks use media kinds, rather than their component names, at the picker boundary.
create or replace function private.guard_document_media() returns trigger language plpgsql set search_path='' as $$
declare n jsonb;m public.media_assets;target_site uuid;document jsonb;expected text;prop record;begin
 if tg_table_name='pages' then target_site:=new.site_id;document:=new.draft_document;else select site_id into target_site from public.pages where id=new.page_id;document:=new.document;end if;
 for n in select value from jsonb_array_elements(document->'nodes') loop
 expected:=case when n->>'component' in ('image','reason','kiss-gift','station') or n->>'component'='movie-scene' and n->'props'->>'mediaKind'='image' then 'image' when n->>'component' in ('audio','hotline-message','radio-track') then 'audio' when n->>'component' in ('video','movie-scene') then 'video' end;
 if n->'props'->>'mediaAssetId' is not null then
 select * into m from public.media_assets where id=(n->'props'->>'mediaAssetId')::uuid and site_id=target_site and status='ready';
 if not found or m.kind is distinct from expected or n->'props'->>'src' is distinct from '/media/'||m.id::text then raise exception 'Media asset is unavailable for this page';end if;
 if coalesce(n->'props'->>'variantWidths','')<>coalesce((select string_agg(value,',' order by value::int) from jsonb_array_elements_text(coalesce(m.metadata->'variants','[]'::jsonb))),'') then raise exception 'Media variants do not match';end if;end if;
 for prop in select key,value from jsonb_each_text(n->'props') where key in ('src','poster','avatar','voiceSrc','callerPhoto','introSrc') loop
 if prop.value ~* '^/media/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
 select * into m from public.media_assets where id=substring(prop.value from 8)::uuid and site_id=target_site and status='ready';
 if not found or (prop.key in ('poster','avatar','callerPhoto') and m.kind<>'image') or (prop.key in ('voiceSrc','introSrc') and m.kind<>'audio') or prop.key='src' and expected is not null and m.kind<>expected then raise exception 'Media field is unavailable or has the wrong type';end if;end if;end loop;
 end loop;return new;
end $$;
