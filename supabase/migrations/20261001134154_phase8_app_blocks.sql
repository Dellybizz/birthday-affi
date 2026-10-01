-- Six app item types share the existing hierarchical document/editor contracts.
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
  or (((n->>'type'='section' and n->>'component'='section') or (n->>'type'='block' and n->>'component' in ('heading','text','image','video','audio','app-grid','reason','hotline-message','adventure-choice','movie-scene','kiss-gift','radio-track'))) is not true)
  or jsonb_typeof(n->'visible') is distinct from 'boolean'
  or ((n->'parentId'='null'::jsonb or (jsonb_typeof(n->'parentId')='string' and n->>'parentId' ~ '^[a-zA-Z0-9_-]{1,100}$')) is not true)
  or jsonb_typeof(n->'children') is distinct from 'array' or jsonb_typeof(n->'props') is distinct from 'object'
  then raise exception 'Invalid node'; end if;
  if n ? 'label' and (jsonb_typeof(n->'label')<>'string' or length(n->>'label')>200) then raise exception 'Invalid label'; end if;
  ids:=array_append(ids,n->>'id');
  if n->>'type'='block' and jsonb_array_length(n->'children')>0 then raise exception 'Blocks cannot contain children'; end if;
  for prop in select key,value from jsonb_each(n->'props') loop
   if jsonb_typeof(prop.value) not in ('string','number','boolean','null') or (jsonb_typeof(prop.value)='string' and length(prop.value#>>'{}')>20000) then raise exception 'Invalid property'; end if;
   if prop.key in ('text','alt','className','title','body','category','price','invitation') and jsonb_typeof(prop.value)<>'string' then raise exception 'Invalid text'; end if;
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

create or replace function private.guard_document_media() returns trigger language plpgsql set search_path='' as $$
declare n jsonb; m public.media_assets; target_site uuid; document jsonb;
begin
 if tg_table_name='pages' then target_site:=new.site_id;document:=new.draft_document;
 else select site_id into target_site from public.pages where id=new.page_id;document:=new.document;end if;
 for n in select value from jsonb_array_elements(document->'nodes') loop
  if n->'props'->>'mediaAssetId' is not null then
   select * into m from public.media_assets where id=(n->'props'->>'mediaAssetId')::uuid and site_id=target_site and status='ready';
   if not found or m.kind is distinct from (case n->>'component' when 'reason' then 'image' when 'kiss-gift' then 'image' when 'hotline-message' then 'audio' when 'radio-track' then 'audio' when 'movie-scene' then 'video' else n->>'component' end) or n->'props'->>'src' is distinct from '/media/'||m.id::text then raise exception 'Media asset is unavailable for this page';end if;
   if coalesce(n->'props'->>'variantWidths','')<>coalesce((select string_agg(value,',' order by value::int) from jsonb_array_elements_text(coalesce(m.metadata->'variants','[]'::jsonb))),'') then raise exception 'Media variants do not match';end if;
  end if;
 end loop;
 return new;
end $$;
