-- Phase 2: server-verified admin roles, private drafts, and atomic audit records.
begin;
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create or replace function private.has_admin_role(allowed public.admin_role[])
returns boolean language sql stable security definer set search_path = ''
as $$ select auth.uid() is not null and exists (
  select 1 from public.admin_users where id = auth.uid() and role = any(allowed)
); $$;
revoke all on function private.has_admin_role(public.admin_role[]) from public;
grant execute on function private.has_admin_role(public.admin_role[]) to authenticated;

-- Remove permissive legacy policies (including draft fields on published pages).
do $$ declare item record; begin
  for item in select tablename, policyname from pg_policies where schemaname = 'public'
    and tablename in ('sites','admin_users','pages','page_versions','media_assets','audit_logs','recipient_profiles','app_content','app_content_items','site_settings')
  loop execute format('drop policy %I on public.%I', item.policyname, item.tablename); end loop;
end $$;
drop function public.is_admin();

create policy admin_self_read on public.admin_users for select to authenticated using (id = (select auth.uid()));
grant select on public.admin_users to authenticated;
revoke insert, update, delete on public.admin_users from anon, authenticated;

-- All roles can read the CMS; viewers cannot mutate; editors cannot publish/settings.
do $$ declare table_name text; begin
  foreach table_name in array array['sites','pages','page_versions','media_assets','recipient_profiles','app_content','app_content_items','site_settings'] loop
    execute format('revoke all on public.%I from anon, authenticated', table_name);
    execute format('grant select, insert, update, delete on public.%I to authenticated', table_name);
    execute format('create policy admin_read on public.%I for select to authenticated using (private.has_admin_role(array[''owner'',''editor'',''viewer'']::public.admin_role[]))', table_name);
    execute format('create policy admin_insert on public.%I for insert to authenticated with check (private.has_admin_role(array[''owner''%s]::public.admin_role[]))', table_name, case when table_name in ('sites','site_settings','page_versions') then '' else ',''editor''' end);
    execute format('create policy admin_update on public.%I for update to authenticated using (private.has_admin_role(array[''owner''%s]::public.admin_role[])) with check (private.has_admin_role(array[''owner''%s]::public.admin_role[]))', table_name, case when table_name in ('sites','site_settings','page_versions') then '' else ',''editor''' end, case when table_name in ('sites','site_settings','page_versions') then '' else ',''editor''' end);
    execute format('create policy admin_delete on public.%I for delete to authenticated using (private.has_admin_role(array[''owner''%s]::public.admin_role[]))', table_name, case when table_name in ('sites','site_settings','page_versions') then '' else ',''editor''' end);
  end loop;
end $$;

-- Editors can modify drafts, but changing the live pointer or deleting a live page requires owner.
create or replace function private.guard_live_page() returns trigger
language plpgsql set search_path = '' as $$
begin
  if current_user in ('anon','authenticated') then
    if (tg_op = 'INSERT' and new.published_version_id is not null)
      or (tg_op = 'UPDATE' and new.published_version_id is distinct from old.published_version_id)
      or (tg_op = 'DELETE' and old.published_version_id is not null) then
      if not private.has_admin_role(array['owner']::public.admin_role[]) then
        raise exception 'Only the owner can change a published page' using errcode = '42501';
      end if;
    end if;
  end if;
  if tg_op <> 'DELETE' and new.published_version_id is not null then
    if not exists (select 1 from public.page_versions where id = new.published_version_id and page_id = new.id and status = 'published') then
      raise exception 'Published version must belong to this page and be published';
    end if;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end $$;
create trigger guard_live_page before insert or update or delete on public.pages for each row execute function private.guard_live_page();

-- Anonymous readers never receive the pages row, draft fields, raw settings or media inventory.
-- Public delivery requires an explicit owner-controlled opt-in; default remains private.
alter table public.sites add column public_delivery_enabled boolean not null default false;
create or replace function public.get_published_document(site_slug text, page_slug text)
returns jsonb language sql stable security definer set search_path = ''
as $$ select v.document from public.sites s
  join public.pages p on p.site_id = s.id
  join public.page_versions v on v.id = p.published_version_id and v.page_id = p.id
  where s.slug = site_slug and p.slug = page_slug and s.public_delivery_enabled
    and v.status = 'published'
  limit 1; $$;
revoke all on function public.get_published_document(text,text) from public;
grant execute on function public.get_published_document(text,text) to anon, authenticated;

alter table public.audit_logs add column site_id uuid references public.sites(id) on delete set null;
create index audit_logs_site_created_idx on public.audit_logs(site_id,created_at desc);
revoke all on public.audit_logs from anon, authenticated;
grant select on public.audit_logs to authenticated;
create policy audit_admin_read on public.audit_logs for select to authenticated
  using(private.has_admin_role(array['owner','editor','viewer']::public.admin_role[]));

-- The trigger alone can append. No caller-supplied actor, content body or credentials are logged.
create or replace function private.audit_cms_mutation() returns trigger
language plpgsql security definer set search_path = '' as $$
declare item jsonb; target_site uuid;
begin
  item := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  if tg_table_name = 'sites' then target_site := (item->>'id')::uuid;
  elsif tg_table_name = 'page_versions' then
    select site_id into target_site from public.pages where id = (item->>'page_id')::uuid;
  else target_site := (item->>'site_id')::uuid; end if;
  -- Deleted sites can no longer be FK targets.
  if tg_table_name = 'sites' and tg_op = 'DELETE' then target_site := null; end if;
  if target_site is not null and not exists(select 1 from public.sites where id = target_site) then target_site := null; end if;
  insert into public.audit_logs(site_id,actor_id,action,entity_type,entity_id,metadata)
    values(target_site,auth.uid(),lower(tg_op),tg_table_name,(item->>'id')::uuid,'{}'::jsonb);
  if tg_op = 'DELETE' then return old; end if;
  return new;
end $$;
revoke all on function private.audit_cms_mutation() from public,anon,authenticated;
revoke all on function private.guard_live_page() from public,anon,authenticated;
do $$ declare table_name text; begin
  foreach table_name in array array['sites','pages','page_versions','media_assets','recipient_profiles','app_content','app_content_items','site_settings'] loop
    execute format('create trigger audit_cms_mutation after insert or update or delete on public.%I for each row execute function private.audit_cms_mutation()',table_name);
  end loop;
end $$;
commit;
