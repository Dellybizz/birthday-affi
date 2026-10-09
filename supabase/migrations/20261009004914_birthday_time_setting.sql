alter function private.assert_base_site_document(jsonb) rename to assert_base_site_document_before_birthday_time;
create function private.assert_base_site_document(doc jsonb) returns void language plpgsql set search_path='' as $$
begin
 if doc ? 'birthtime' and (jsonb_typeof(doc->'birthtime')<>'string' or doc->>'birthtime' !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$') then raise exception 'Invalid birthday time';end if;
 perform private.assert_base_site_document_before_birthday_time(doc-'birthtime');
end $$;
revoke all on function private.assert_base_site_document(jsonb),private.assert_base_site_document_before_birthday_time(jsonb) from public,anon,authenticated;
