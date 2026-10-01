-- Capability links authorize exactly one caller and one receiver. No table access.
create table private.hotline_pairs (
 site_id uuid primary key references public.sites(id),
 caller_hash text not null, receiver_hash text not null,
 receiver_seen timestamptz, call_id uuid, state text not null default 'idle',
 offer jsonb, answer jsonb, expires_at timestamptz, started_at timestamptz
);
alter table private.hotline_pairs enable row level security;
revoke all on private.hotline_pairs from public, anon, authenticated;
create function public.rotate_hotline_links(p_site uuid,p_caller_hash text,p_receiver_hash text)
returns void language plpgsql security definer set search_path='' as $$
begin
 if not private.has_admin_role(array['owner']::public.admin_role[]) then raise exception 'Owner required' using errcode='42501'; end if;
 if p_caller_hash !~ '^[a-f0-9]{64}$' or p_receiver_hash !~ '^[a-f0-9]{64}$' or p_caller_hash=p_receiver_hash then raise exception 'Invalid links'; end if;
 insert into private.hotline_pairs(site_id,caller_hash,receiver_hash)values(p_site,p_caller_hash,p_receiver_hash)
 on conflict(site_id)do update set caller_hash=excluded.caller_hash,receiver_hash=excluded.receiver_hash,call_id=null,state='idle',offer=null,answer=null,expires_at=null,receiver_seen=null;
end $$;
revoke all on function public.rotate_hotline_links(uuid,text,text) from public,anon;
grant execute on function public.rotate_hotline_links(uuid,text,text) to authenticated;
create function public.hotline_exchange(p_site_slug text,p_token text,p_action text,p_payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare pair private.hotline_pairs; sid uuid; role_name text; h text;
begin
 if p_token is null or p_token !~ '^[a-f0-9]{64}$' or octet_length(p_payload::text)>96000 then raise exception 'Invalid private link' using errcode='42501'; end if;
 select id into sid from public.sites where slug=p_site_slug and public_delivery_enabled;
 select * into pair from private.hotline_pairs where site_id=sid for update;
 h:=encode(sha256(convert_to(p_token,'UTF8')),'hex');
 if h=pair.caller_hash then role_name:='caller'; elsif h=pair.receiver_hash then role_name:='receiver'; else raise exception 'Invalid or revoked private link' using errcode='42501'; end if;
 if pair.state in ('ringing','connected') and pair.expires_at<now() then pair.state:='ended';pair.offer:=null;pair.answer:=null;end if;
 if role_name='receiver' then pair.receiver_seen:=now();end if;
 if p_action='start' then
  if role_name<>'caller' then raise exception 'Only her link can start a call' using errcode='42501';end if;
  if pair.state in ('ringing','connected') then raise exception 'The line is busy';end if;
  if pair.started_at>now()-interval '10 seconds' then raise exception 'Please wait before calling again';end if;
  if p_payload->'offer'->>'type'<>'offer' or length(coalesce(p_payload->'offer'->>'sdp',''))<10 then raise exception 'Invalid offer';end if;
  pair.call_id:=gen_random_uuid();pair.state:='ringing';pair.offer:=p_payload->'offer';pair.answer:=null;pair.expires_at:=now()+interval '60 seconds';pair.started_at:=now();
 elsif p_action in ('answer','end','connected') then
  if pair.call_id is null or p_payload->>'callId' is distinct from pair.call_id::text then raise exception 'Call has changed';end if;
  if p_action='answer' then
   if role_name<>'receiver' or pair.state<>'ringing' then raise exception 'Call cannot be answered';end if;
   if p_payload->'answer'->>'type'<>'answer' or length(coalesce(p_payload->'answer'->>'sdp',''))<10 then raise exception 'Invalid answer';end if;
   pair.answer:=p_payload->'answer';pair.state:='connected';pair.expires_at:=now()+interval '90 seconds';
  elsif p_action='end' then pair.state:='ended';pair.offer:=null;pair.answer:=null;
  elsif pair.state='connected' then pair.expires_at:=now()+interval '90 seconds';end if;
 elsif p_action<>'status' then raise exception 'Invalid action';end if;
 update private.hotline_pairs set receiver_seen=pair.receiver_seen,call_id=pair.call_id,state=pair.state,offer=pair.offer,answer=pair.answer,expires_at=pair.expires_at,started_at=pair.started_at where site_id=sid;
 return jsonb_build_object('role',role_name,'callId',pair.call_id,'state',pair.state,'offer',case when role_name='receiver' then pair.offer else null end,'answer',case when role_name='caller' then pair.answer else null end,'receiverOnline',coalesce(pair.receiver_seen>now()-interval '20 seconds',false));
end $$;
revoke all on function public.hotline_exchange(text,text,text,jsonb) from public;
grant execute on function public.hotline_exchange(text,text,text,jsonb) to anon,authenticated;
