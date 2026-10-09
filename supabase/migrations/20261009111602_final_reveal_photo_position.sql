-- Optional crop focus preserves old drafts and immutable release history.
alter function private.assert_base_site_document(jsonb) rename to assert_base_site_document_before_photo_position;
create function private.assert_base_site_document(doc jsonb) returns void language plpgsql set search_path='' as $$
declare position jsonb;axis text;
begin
 if doc->'cinematic'->'reel' ? 'photoPosition' then
  position:=doc->'cinematic'->'reel'->'photoPosition';
  if jsonb_typeof(position) is distinct from 'object' then raise exception 'Invalid photo position';end if;
  if (select array_agg(key order by key) from jsonb_object_keys(position) key) is distinct from array['x','y'] then raise exception 'Invalid photo position';end if;
  foreach axis in array array['x','y'] loop
   if jsonb_typeof(position->axis) is distinct from 'number' then raise exception 'Invalid photo position';end if;
   if (position->>axis)::numeric not between 0 and 100 then raise exception 'Photo position must be between 0 and 100';end if;
  end loop;
  perform private.assert_base_site_document_before_photo_position(doc #- '{cinematic,reel,photoPosition}');
 else
  perform private.assert_base_site_document_before_photo_position(doc);
 end if;
end $$;
revoke all on function private.assert_base_site_document(jsonb),private.assert_base_site_document_before_photo_position(jsonb) from public,anon,authenticated;
