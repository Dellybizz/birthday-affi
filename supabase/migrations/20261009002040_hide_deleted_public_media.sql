-- Filter live delivery without rewriting drafts or historical snapshots.
create function private.live_media_document(doc jsonb, p_site uuid) returns jsonb
language plpgsql stable security invoker set search_path='' as $$
declare node jsonb; props jsonb; result jsonb='[]'::jsonb; prop record; asset text; unavailable boolean;
begin
 for node in select value from jsonb_array_elements(doc->'nodes') loop
  props=node->'props';unavailable=false;
  for prop in select key,value from jsonb_each_text(props) where key in ('src','poster','voiceSrc','introSrc') loop
   asset=substring(prop.value from '^/media/([a-fA-F0-9-]{36})(?:[?].*)?$');
   if asset is not null and not exists(select 1 from public.media_assets m join storage.objects o on o.bucket_id='wiffeyyyy-'||m.kind and o.name=m.storage_path where m.id::text=lower(asset) and m.site_id=p_site and m.status='ready' and m.archived_at is null) then
    props=jsonb_set(props,array[prop.key],'""'::jsonb);
    if prop.key='src' then unavailable=true;props=props-'mediaAssetId'-'mediaWidth'-'mediaHeight'-'variantWidths';end if;
   end if;
  end loop;
  node=jsonb_set(node,'{props}',props);
  if unavailable and node->>'component' in ('image','video','audio','movie-scene','radio-track','hotline-message') then node=jsonb_set(node,'{visible}','false'::jsonb);end if;
  result=result||jsonb_build_array(node);
 end loop;
 return jsonb_set(doc,'{nodes}',result);
end $$;
revoke all on function private.live_media_document(jsonb,uuid) from public,anon,authenticated;

create or replace function private.public_page_info(p_site_slug text,p_slug text) returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('slug',p.slug,'metadata',v.metadata,'document',private.live_media_document(v.document,s.id))
 from public.sites s join public.pages p on p.site_id=s.id join public.page_versions v on v.id=p.published_version_id and v.page_id=p.id and v.status='published'
 where s.slug=p_site_slug and s.public_delivery_enabled and coalesce(p.settings->>'archived','false')<>'true'
 and (p.slug=p_slug or p.id=(select r.page_id from public.page_redirects r where r.site_id=s.id and r.old_slug=p_slug)) limit 1
$$;
