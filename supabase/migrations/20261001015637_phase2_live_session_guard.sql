-- Replayed JWTs must not retain CMS access after sign-out.
begin;
create or replace function private.session_is_active()
returns boolean language sql stable security definer set search_path = ''
as $$ select auth.uid() is not null and exists (
  select 1 from auth.sessions s
  where s.id = nullif(auth.jwt()->>'session_id', '')::uuid
    and s.user_id = auth.uid()
    and (s.not_after is null or s.not_after > now())
); $$;
revoke all on function private.session_is_active() from public,anon,authenticated;
grant execute on function private.session_is_active() to authenticated;

create or replace function private.has_admin_role(allowed public.admin_role[])
returns boolean language sql stable security definer set search_path = ''
as $$ select private.session_is_active() and exists (
  select 1 from public.admin_users where id = auth.uid() and role = any(allowed)
); $$;
revoke all on function private.has_admin_role(public.admin_role[]) from public,anon,authenticated;
grant execute on function private.has_admin_role(public.admin_role[]) to authenticated;

alter policy admin_self_read on public.admin_users
using (id = (select auth.uid()) and (select private.session_is_active()));
commit;
