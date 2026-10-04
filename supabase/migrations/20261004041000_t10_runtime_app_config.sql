create table public.runtime_app_configurations(
 site_id uuid not null references public.sites(id) on delete cascade,
 app_slug text not null check(app_slug in ('camera','vault','pieces')),
 draft jsonb not null,
 revision bigint not null default 0,
 published_id uuid,
 primary key(site_id,app_slug)
);
create table public.runtime_app_configuration_versions(
 id uuid primary key default gen_random_uuid(),
 site_id uuid not null references public.sites(id) on delete cascade,
 app_slug text not null check(app_slug in ('camera','vault','pieces')),
 document jsonb not null,
 created_at timestamptz not null default now(),
 created_by uuid references auth.users(id)
);
alter table public.runtime_app_configurations add foreign key(published_id) references public.runtime_app_configuration_versions(id);
alter table public.runtime_app_configurations enable row level security;
alter table public.runtime_app_configuration_versions enable row level security;
create policy runtime_app_config_read on public.runtime_app_configurations for select to authenticated using(private.has_admin_role(array['owner','editor','viewer']::public.admin_role[]));
create policy runtime_app_config_versions_read on public.runtime_app_configuration_versions for select to authenticated using(private.has_admin_role(array['owner','editor','viewer']::public.admin_role[]));
revoke all on public.runtime_app_configurations,public.runtime_app_configuration_versions from anon,authenticated;
grant select on public.runtime_app_configurations,public.runtime_app_configuration_versions to authenticated;

create function private.default_runtime_app_configuration(p_slug text) returns jsonb language plpgsql immutable set search_path='' as $$
begin
 case p_slug
 when 'camera' then return '{"schemaVersion":1,"slug":"camera","appTitle":"Clicksara","permissionTitle":"A little moment, captured.","permissionBody":"Photos and videos save automatically to the Camera album in Pardanasheen on this device.","enableLabel":"Enable camera","retryLabel":"Try again","openingLabel":"Opening camera…","photoLabel":"PHOTO","videoLabel":"VIDEO","galleryTitle":"Camera roll","galleryEmptyTitle":"Your moments start here.","galleryEmptyBody":"Take a photo and it will appear here and in Pardanasheen’s Camera album.","savedLabel":"Automatically saved to Pardanasheen · Camera","pardanasheenLabel":"Open in Pardanasheen ↗","gridDefault":true,"background":"#000000","surface":"#171717","text":"#ffffff","accent":"#ffd60a"}'::jsonb;
 when 'vault' then return '{"schemaVersion":1,"slug":"vault","eyebrow":"Private archive","title":"Vault","subtitle":"One memory unlocks what I kept here for you.","question":"Which little memory belongs to us?","placeholder":"Type the memory…","unlockLabel":"Unlock","unlockingLabel":"Unlocking…","errorLabel":"That memory did not unlock the vault. Try the way you remember it.","backLabel":"Back to Wiffeyyyy OS","footnote":"Only you should know the answer.","background":"#0b0a12","surface":"#171522","text":"#f8f4ff","accent":"#c8a8ff"}'::jsonb;
 when 'pieces' then return '{"schemaVersion":1,"slug":"pieces","appTitle":"Pieces of Us","subtitle":"Put the little pieces back together.","instructions":"Move the pieces until the picture feels whole again.","shuffleLabel":"Shuffle","resetLabel":"Reset","completionTitle":"You found us.","completionBody":"Somehow every little piece still leads back to you.","giftLabel":"Open your little reward","puzzleImage":"","background":"#f5eee8","surface":"#fffaf7","text":"#403532","accent":"#d86f91"}'::jsonb;
 else raise exception 'Unknown runtime app';
 end case;
end $$;
revoke all on function private.default_runtime_app_configuration(text) from public,anon,authenticated;

insert into public.runtime_app_configurations(site_id,app_slug,draft)
select s.id,x.slug,private.default_runtime_app_configuration(x.slug)
from public.sites s cross join (values('camera'),('vault'),('pieces')) x(slug)
on conflict do nothing;

create function private.assert_runtime_app_configuration(p_slug text,doc jsonb) returns void language plpgsql set search_path='' as $$
declare required text[];key text;expected_count integer;
begin
 if p_slug not in ('camera','vault','pieces') or doc is null or jsonb_typeof(doc)<>'object' then raise exception 'Invalid runtime app settings';end if;
 if doc->>'slug'<>p_slug or doc->'schemaVersion'<>'1'::jsonb then raise exception 'Invalid runtime app identity';end if;
 if p_slug='camera' then
  required:=array['schemaVersion','slug','appTitle','permissionTitle','permissionBody','enableLabel','retryLabel','openingLabel','photoLabel','videoLabel','galleryTitle','galleryEmptyTitle','galleryEmptyBody','savedLabel','pardanasheenLabel','gridDefault','background','surface','text','accent'];expected_count:=20;
  if jsonb_typeof(doc->'gridDefault')<>'boolean' then raise exception 'Invalid camera settings';end if;
 elsif p_slug='vault' then
  required:=array['schemaVersion','slug','eyebrow','title','subtitle','question','placeholder','unlockLabel','unlockingLabel','errorLabel','backLabel','footnote','background','surface','text','accent'];expected_count:=16;
 elsif p_slug='pieces' then
  required:=array['schemaVersion','slug','appTitle','subtitle','instructions','shuffleLabel','resetLabel','completionTitle','completionBody','giftLabel','puzzleImage','background','surface','text','accent'];expected_count:=15;
 end if;
 if (select count(*) from jsonb_object_keys(doc))<>expected_count or not doc ?& required then raise exception 'Unknown or missing runtime app settings';end if;
 foreach key in array required loop
  if key in ('schemaVersion','gridDefault') then continue;end if;
  if jsonb_typeof(doc->key)<>'string' or length(doc->>key)>1000 then raise exception 'Invalid runtime app text';end if;
 end loop;
 foreach key in array array['background','surface','text','accent'] loop if doc->>key !~ '^#[0-9a-fA-F]{6}$' then raise exception 'Invalid runtime app color';end if;end loop;
 if p_slug='pieces' and doc->>'puzzleImage'<>'' and doc->>'puzzleImage' !~ '^(/|https://)' then raise exception 'Invalid puzzle image';end if;
end $$;
revoke all on function private.assert_runtime_app_configuration(text,jsonb) from public,anon,authenticated;

create function private.change_runtime_app_configuration(p_site uuid,p_app_slug text,p_document jsonb,p_revision bigint,p_publish boolean) returns jsonb language plpgsql security definer set search_path='' as $$
declare cfg public.runtime_app_configurations;version_id uuid;
begin
 if not private.has_admin_role(array['owner']::public.admin_role[]) then raise exception 'Owner required' using errcode='42501';end if;
 select * into cfg from public.runtime_app_configurations where site_id=p_site and app_slug=p_app_slug for update;
 if not found then raise exception 'Runtime app settings not found';end if;
 if p_publish is null or p_revision is null or cfg.revision<>p_revision then raise exception 'Settings changed; reload' using errcode='40001';end if;
 if p_publish then
  perform private.assert_runtime_app_configuration(p_app_slug,cfg.draft);
  insert into public.runtime_app_configuration_versions(site_id,app_slug,document,created_by) values(p_site,p_app_slug,cfg.draft,auth.uid()) returning id into version_id;
  update public.runtime_app_configurations set published_id=version_id where site_id=p_site and app_slug=p_app_slug;
 else
  perform private.assert_runtime_app_configuration(p_app_slug,p_document);
  update public.runtime_app_configurations set draft=p_document,revision=revision+1 where site_id=p_site and app_slug=p_app_slug;
 end if;
 return jsonb_build_object('revision',cfg.revision+case when p_publish then 0 else 1 end);
end $$;
revoke all on function private.change_runtime_app_configuration(uuid,text,jsonb,bigint,boolean) from public,anon,authenticated;
create function public.change_runtime_app_configuration(p_site uuid,p_app_slug text,p_document jsonb,p_revision bigint,p_publish boolean) returns jsonb language sql security invoker set search_path='' as $$select private.change_runtime_app_configuration(p_site,p_app_slug,p_document,p_revision,p_publish)$$;
revoke all on function public.change_runtime_app_configuration(uuid,text,jsonb,bigint,boolean) from public,anon;
grant execute on function public.change_runtime_app_configuration(uuid,text,jsonb,bigint,boolean) to authenticated;

create function private.published_runtime_app_configuration(p_site_slug text,p_app_slug text) returns jsonb language sql stable security definer set search_path='' as $$
select v.document from public.sites s join public.runtime_app_configurations c on c.site_id=s.id and c.app_slug=p_app_slug join public.runtime_app_configuration_versions v on v.id=c.published_id and v.site_id=s.id and v.app_slug=c.app_slug where s.slug=p_site_slug and s.public_delivery_enabled
$$;
revoke all on function private.published_runtime_app_configuration(text,text) from public;
create function public.get_published_runtime_app_configuration(p_site_slug text,p_app_slug text) returns jsonb language sql stable security invoker set search_path='' as $$select private.published_runtime_app_configuration(p_site_slug,p_app_slug)$$;
revoke all on function public.get_published_runtime_app_configuration(text,text) from public;
grant execute on function public.get_published_runtime_app_configuration(text,text) to anon,authenticated;
