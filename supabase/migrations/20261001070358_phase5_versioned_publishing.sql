begin;
alter table public.pages add column draft_revision bigint not null default 0;
alter table public.pages alter column draft_document set default '{"schemaVersion":2,"nodes":[],"rootIds":[]}'::jsonb;
-- Version records are append-only. Editors may create draft snapshots, never publications.
revoke update, delete on public.page_versions from authenticated;
drop policy admin_insert on public.page_versions;
create policy version_insert on public.page_versions for insert to authenticated with check (
 private.has_admin_role(array['owner']::public.admin_role[]) or
 (status='draft' and created_by=auth.uid() and private.has_admin_role(array['editor']::public.admin_role[]))
);
create or replace function private.track_draft_revision() returns trigger
language plpgsql set search_path='' as $$ begin
 new.draft_revision := old.draft_revision + case when new.draft_document is distinct from old.draft_document then 1 else 0 end;
 new.updated_at := clock_timestamp();
 return new;
end $$;
revoke all on function private.track_draft_revision() from public,anon,authenticated;
create trigger track_draft_revision before update on public.pages for each row execute function private.track_draft_revision();

-- Database boundary protects RPC callers as well as validated server actions.
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
  or (((n->>'type'='section' and n->>'component'='section') or (n->>'type'='block' and n->>'component' in ('heading','text','image','app-grid'))) is not true)
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
   if prop.key in ('padding','margin','radius','opacity','size','weight','columns','gap') then
    if jsonb_typeof(prop.value)<>'number' then raise exception 'Invalid numeric style'; end if;
    if (prop.value#>>'{}')::numeric < (case prop.key when 'size' then 10 when 'weight' then 100 when 'columns' then 1 else 0 end)
    or (prop.value#>>'{}')::numeric > (case prop.key when 'radius' then 64 when 'opacity' then 1 when 'size' then 72 when 'weight' then 900 when 'columns' then 4 else 96 end)
    or (prop.key='columns' and (prop.value#>>'{}')::numeric<>trunc((prop.value#>>'{}')::numeric)) then raise exception 'Invalid style range'; end if;
   end if;
   if prop.key='src' and (jsonb_typeof(prop.value)<>'string' or not (
    prop.value#>>'{}'='' or prop.value#>>'{}' ~ '^/($|[^/\\[:space:]][^\\[:space:]]*)$'
    or prop.value#>>'{}' ~ '^https://[^/@[:space:]\\]+(/[^[:space:]\\]*)?$')) then raise exception 'Unsafe image URL'; end if;
  end loop;
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
revoke all on function private.assert_page_document(jsonb) from public;
grant execute on function private.assert_page_document(jsonb) to authenticated;

create or replace function public.save_page_draft(p_page_id uuid,p_document jsonb,p_expected_revision bigint)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare p public.pages%rowtype; v uuid; num integer;
begin
 if not private.has_admin_role(array['owner','editor']::public.admin_role[]) then raise exception 'Not authorized' using errcode='42501'; end if;
 perform private.assert_page_document(p_document);
 select * into p from public.pages where id=p_page_id for update;
 if not found then raise exception 'Page not found'; end if;
 if p_expected_revision is null or p.draft_revision<>p_expected_revision then raise exception 'DRAFT_CONFLICT' using errcode='40001'; end if;
 if p.draft_document=p_document then return jsonb_build_object('revision',p.draft_revision,'changed',false); end if;
 select coalesce(max(version_number),0)+1 into num from public.page_versions where page_id=p_page_id;
 insert into public.page_versions(page_id,version_number,status,document,created_by) values(p_page_id,num,'draft',p_document,auth.uid()) returning id into v;
 update public.pages set draft_document=p_document where id=p_page_id returning draft_revision into p.draft_revision;
 return jsonb_build_object('revision',p.draft_revision,'versionId',v,'versionNumber',num,'changed',true);
end $$;
create or replace function public.publish_page(p_page_id uuid,p_expected_revision bigint)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare p public.pages%rowtype; v uuid; num integer;
begin
 if not private.has_admin_role(array['owner']::public.admin_role[]) then raise exception 'Not authorized' using errcode='42501'; end if;
 select * into p from public.pages where id=p_page_id for update;
 if not found then raise exception 'Page not found'; end if;
 if p_expected_revision is null or p.draft_revision<>p_expected_revision then raise exception 'DRAFT_CONFLICT' using errcode='40001'; end if;
 perform private.assert_page_document(p.draft_document);
 if jsonb_array_length(p.draft_document->'nodes')=0 then raise exception 'Cannot publish an empty page'; end if;
 select id,version_number into v,num from public.page_versions where id=p.published_version_id and document=p.draft_document;
 if found then return jsonb_build_object('versionId',v,'versionNumber',num,'revision',p.draft_revision,'changed',false); end if;
 select coalesce(max(version_number),0)+1 into num from public.page_versions where page_id=p_page_id;
 insert into public.page_versions(page_id,version_number,status,document,created_by) values(p_page_id,num,'published',p.draft_document,auth.uid()) returning id into v;
 update public.pages set published_version_id=v where id=p_page_id;
 return jsonb_build_object('versionId',v,'versionNumber',num,'revision',p.draft_revision,'changed',true);
end $$;
create or replace function public.rollback_page(p_page_id uuid,p_version_id uuid,p_expected_revision bigint)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare p public.pages%rowtype; source public.page_versions%rowtype; v uuid; num integer;
begin
 if not private.has_admin_role(array['owner']::public.admin_role[]) then raise exception 'Not authorized' using errcode='42501'; end if;
 select * into p from public.pages where id=p_page_id for update;
 if not found then raise exception 'Page not found'; end if;
 if p_expected_revision is null or p.draft_revision<>p_expected_revision then raise exception 'DRAFT_CONFLICT' using errcode='40001'; end if;
 select * into source from public.page_versions where id=p_version_id and page_id=p_page_id and status='published';
 if not found then raise exception 'Published version not found for this page'; end if;
 perform private.assert_page_document(source.document);
 select coalesce(max(version_number),0)+1 into num from public.page_versions where page_id=p_page_id;
 insert into public.page_versions(page_id,version_number,status,document,created_by) values(p_page_id,num,'published',source.document,auth.uid()) returning id into v;
 update public.pages set published_version_id=v where id=p_page_id;
 return jsonb_build_object('versionId',v,'versionNumber',num,'revision',p.draft_revision);
end $$;
revoke all on function public.save_page_draft(uuid,jsonb,bigint),public.publish_page(uuid,bigint),public.rollback_page(uuid,uuid,bigint) from public,anon;
grant execute on function public.save_page_draft(uuid,jsonb,bigint),public.publish_page(uuid,bigint),public.rollback_page(uuid,uuid,bigint) to authenticated;
commit;
