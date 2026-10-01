alter table private.hotline_pairs add column active_caller_hash text, add column caller_candidates jsonb not null default '[]', add column receiver_candidates jsonb not null default '[]';
create table private.hotline_visitors(site_id uuid not null references public.sites(id),token_hash text primary key,receiver_hash text not null,created_at timestamptz not null default now(),expires_at timestamptz not null default now()+interval '12 hours');
alter table private.hotline_visitors enable row level security;
revoke all on private.hotline_visitors from public,anon,authenticated;
create index hotline_visitors_site_created on private.hotline_visitors(site_id,created_at);
create function public.prepare_public_hotline(p_site_slug text) returns text language plpgsql security definer set search_path='' as $$
declare sid uuid; rh text; key text;
begin
 select p.site_id,p.receiver_hash into sid,rh from private.hotline_pairs p join public.sites s on s.id=p.site_id where s.slug=p_site_slug and s.public_delivery_enabled for update of p;
 if sid is null then raise exception 'The line is being set up. Please try again shortly.';end if;
 delete from private.hotline_visitors where expires_at<now();
 if (select count(*) from private.hotline_visitors where site_id=sid and created_at>now()-interval '1 minute')>=40 then raise exception 'Please wait a moment and try again.';end if;
 key:=replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-','');
 insert into private.hotline_visitors(site_id,receiver_hash,token_hash)values(sid,rh,encode(sha256(convert_to(key,'UTF8')),'hex'));
 return key;
end $$;
revoke all on function public.prepare_public_hotline(text) from public;
grant execute on function public.prepare_public_hotline(text) to anon,authenticated;
create or replace function public.hotline_exchange(p_site_slug text,p_token text,p_action text,p_payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare pair private.hotline_pairs; sid uuid; role_name text; h text;
begin
 if p_token is null or p_token !~ '^[a-f0-9]{64}$' or octet_length(p_payload::text)>96000 then raise exception 'Invalid private link' using errcode='42501'; end if;
 select id into sid from public.sites where slug=p_site_slug and public_delivery_enabled;
 select * into pair from private.hotline_pairs where site_id=sid for update;
 h:=encode(sha256(convert_to(p_token,'UTF8')),'hex');
 if h=pair.caller_hash then role_name:='caller'; elsif exists(select 1 from private.hotline_visitors v where v.site_id=sid and v.token_hash=h and v.receiver_hash=pair.receiver_hash and v.expires_at>now()) then role_name:='caller'; elsif h=pair.receiver_hash then role_name:='receiver'; else raise exception 'Invalid or revoked private link' using errcode='42501'; end if;
 if pair.state in ('ringing','connected') and pair.expires_at<now() then pair.state:='ended';pair.offer:=null;pair.answer:=null;end if;
 if role_name='receiver' then pair.receiver_seen:=now();end if;
 if role_name='caller' and pair.state in ('ringing','connected') and pair.active_caller_hash is distinct from h then
 if p_action<>'status' then raise exception 'The line is busy';end if;
 return jsonb_build_object('role','caller','state','busy','callId',null,'receiverOnline',coalesce(pair.receiver_seen>now()-interval '20 seconds',false));
 end if;
 if p_action='start' then
  if role_name<>'caller' then raise exception 'Only her link can start a call' using errcode='42501';end if;
  if pair.state in ('ringing','connected') then raise exception 'The line is busy';end if;
  if pair.started_at>now()-interval '10 seconds' then raise exception 'Please wait before calling again';end if;
  if p_payload->'offer'->>'type'<>'offer' or length(coalesce(p_payload->'offer'->>'sdp',''))<10 then raise exception 'Invalid offer';end if;
  pair.active_caller_hash:=h;pair.caller_candidates:='[]'::jsonb;pair.receiver_candidates:='[]'::jsonb;pair.call_id:=gen_random_uuid();pair.state:='ringing';pair.offer:=p_payload->'offer';pair.answer:=null;pair.expires_at:=now()+interval '60 seconds';pair.started_at:=now();
 elsif p_action in ('answer','end','connected','candidate') then
  if pair.call_id is null or p_payload->>'callId' is distinct from pair.call_id::text then raise exception 'Call has changed';end if;
  if p_action='candidate' then
   if pair.state not in ('ringing','connected') then raise exception 'Call ended';end if;
   if jsonb_typeof(p_payload->'candidate') is distinct from 'object' or length(coalesce(p_payload->'candidate'->>'candidate',''))>4096 then raise exception 'Invalid candidate';end if;
   if role_name='caller' and jsonb_array_length(pair.caller_candidates)<64 then pair.caller_candidates:=pair.caller_candidates||jsonb_build_array(p_payload->'candidate');
   elsif role_name='receiver' and jsonb_array_length(pair.receiver_candidates)<64 then pair.receiver_candidates:=pair.receiver_candidates||jsonb_build_array(p_payload->'candidate');end if;
  elsif p_action='answer' then
   if role_name<>'receiver' or pair.state<>'ringing' then raise exception 'Call cannot be answered';end if;
   if p_payload->'answer'->>'type'<>'answer' or length(coalesce(p_payload->'answer'->>'sdp',''))<10 then raise exception 'Invalid answer';end if;
   pair.answer:=p_payload->'answer';pair.state:='connected';pair.expires_at:=now()+interval '90 seconds';
  elsif p_action='end' then pair.state:='ended';pair.offer:=null;pair.answer:=null;
  elsif pair.state='connected' then pair.expires_at:=now()+interval '90 seconds';end if;
 elsif p_action<>'status' then raise exception 'Invalid action';end if;
 update private.hotline_pairs set active_caller_hash=pair.active_caller_hash,caller_candidates=pair.caller_candidates,receiver_candidates=pair.receiver_candidates,receiver_seen=pair.receiver_seen,call_id=pair.call_id,state=pair.state,offer=pair.offer,answer=pair.answer,expires_at=pair.expires_at,started_at=pair.started_at where site_id=sid;
 return jsonb_build_object('role',role_name,'callId',pair.call_id,'state',pair.state,'offer',case when role_name='receiver' then pair.offer else null end,'answer',case when role_name='caller' then pair.answer else null end,'candidates',case when role_name='caller' then pair.receiver_candidates else pair.caller_candidates end,'receiverOnline',coalesce(pair.receiver_seen>now()-interval '20 seconds',false));
end $$;
revoke all on function public.hotline_exchange(text,text,text,jsonb) from public;
grant execute on function public.hotline_exchange(text,text,text,jsonb) to anon,authenticated;
