create table public.site_configurations(site_id uuid primary key references public.sites(id),draft jsonb not null default '{"schemaVersion":1,"name":"","nickname":"favourite person","birthdate":"","timezone":"Asia/Kolkata","siteTitle":"Wiffeyyyy OS","greeting":"Happy birthday","welcomeMessage":"A few little things to make you smile. A whole lot of love, tucked inside.","enterLabel":"Open your birthday world","background":"#fbf5ef","surface":"#fffaf7","text":"#403532","accent":"#a9476b","radius":24,"defaultVolume":1,"defaultMuted":false}'::jsonb,revision bigint not null default 0,published_id uuid);
create table public.site_configuration_versions(id uuid primary key default gen_random_uuid(),site_id uuid not null references public.sites(id),document jsonb not null,created_at timestamptz not null default now(),created_by uuid references auth.users(id));
alter table public.site_configurations add foreign key(published_id) references public.site_configuration_versions(id);
alter table public.site_configurations enable row level security;
alter table public.site_configuration_versions enable row level security;
create policy config_read on public.site_configurations for select to authenticated using(private.has_admin_role(array['owner','editor','viewer']::public.admin_role[]));
create policy config_versions_read on public.site_configuration_versions for select to authenticated using(private.has_admin_role(array['owner','editor','viewer']::public.admin_role[]));
revoke all on public.site_configurations,public.site_configuration_versions from anon,authenticated;
grant select on public.site_configurations,public.site_configuration_versions to authenticated;
insert into public.site_configurations(site_id)select id from public.sites;
create function private.assert_site_document(doc jsonb) returns void language plpgsql set search_path='' as $$
declare key text;allowed text[]:=array['schemaVersion','name','nickname','birthdate','timezone','siteTitle','greeting','welcomeMessage','enterLabel','background','surface','text','accent','radius','defaultVolume','defaultMuted'];begin
 if doc is null or jsonb_typeof(doc)<>'object' or (select count(*) from jsonb_object_keys(doc))<>16 or not doc ?& allowed or doc->'schemaVersion'<>'1'::jsonb then raise exception 'Invalid site settings';end if;
 foreach key in array array['name','nickname','birthdate','timezone','siteTitle','greeting','welcomeMessage','enterLabel','background','surface','text','accent'] loop
 if jsonb_typeof(doc->key)<>'string' or length(doc->>key)>(case when key='welcomeMessage' then 2000 else 120 end) then raise exception 'Invalid text setting';end if;end loop;
 if length(btrim(doc->>'nickname'))=0 or length(btrim(doc->>'siteTitle'))=0 then raise exception 'Missing title';end if;
 if doc->>'birthdate'<>'' then if doc->>'birthdate' !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' or (doc->>'birthdate')::date::text<>doc->>'birthdate' then raise exception 'Invalid birthday';end if;end if;
 if not exists(select 1 from pg_catalog.pg_timezone_names where name=doc->>'timezone') then raise exception 'Invalid timezone';end if;
 foreach key in array array['background','surface','text','accent'] loop if doc->>key !~ '^#[0-9a-fA-F]{6}$' then raise exception 'Invalid color';end if;end loop;
 if jsonb_typeof(doc->'radius')<>'number' or (doc->>'radius')::numeric not between 0 and 64 or jsonb_typeof(doc->'defaultVolume')<>'number' or (doc->>'defaultVolume')::numeric not between 0 and 1 or jsonb_typeof(doc->'defaultMuted')<>'boolean' then raise exception 'Invalid theme/audio';end if;
end $$;
revoke all on function private.assert_site_document(jsonb) from public,anon,authenticated;
create function private.change_site_configuration(p_site uuid,p_document jsonb,p_revision bigint,p_publish boolean) returns jsonb language plpgsql security definer set search_path='' as $$
declare cfg public.site_configurations;version_id uuid;begin
 if not private.has_admin_role(array['owner']::public.admin_role[]) then raise exception 'Owner required' using errcode='42501';end if;
 select * into cfg from public.site_configurations where site_id=p_site for update;
 if not found then raise exception 'Site not found';end if;
 if p_publish is null or p_revision is null or cfg.revision<>p_revision then raise exception 'Settings changed; reload' using errcode='40001';end if;
 if p_publish then
 perform private.assert_site_document(cfg.draft);
 insert into public.site_configuration_versions(site_id,document,created_by)values(p_site,cfg.draft,auth.uid())returning id into version_id;
 update public.site_configurations set published_id=version_id where site_id=p_site;
 else
 perform private.assert_site_document(p_document);
 update public.site_configurations set draft=p_document,revision=revision+1 where site_id=p_site;
 end if;
 return jsonb_build_object('revision',cfg.revision+case when p_publish then 0 else 1 end);
end $$;
revoke all on function private.change_site_configuration(uuid,jsonb,bigint,boolean) from public,anon,authenticated;
grant execute on function private.change_site_configuration(uuid,jsonb,bigint,boolean) to authenticated;
create function public.change_site_configuration(p_site uuid,p_document jsonb,p_revision bigint,p_publish boolean) returns jsonb language sql security invoker set search_path='' as $$select private.change_site_configuration(p_site,p_document,p_revision,p_publish)$$;
revoke all on function public.change_site_configuration(uuid,jsonb,bigint,boolean) from public,anon;
grant execute on function public.change_site_configuration(uuid,jsonb,bigint,boolean) to authenticated;
create function private.published_site_configuration(p_slug text) returns jsonb language sql stable security definer set search_path='' as $$
select v.document from public.sites s join public.site_configurations c on c.site_id=s.id join public.site_configuration_versions v on v.id=c.published_id and v.site_id=s.id where s.slug=p_slug and s.public_delivery_enabled$$;
revoke all on function private.published_site_configuration(text) from public;
grant execute on function private.published_site_configuration(text) to anon,authenticated;
create function public.get_published_site_configuration(p_slug text) returns jsonb language sql stable security invoker set search_path='' as $$select private.published_site_configuration(p_slug)$$;
revoke all on function public.get_published_site_configuration(text) from public;
grant execute on function public.get_published_site_configuration(text) to anon,authenticated;


