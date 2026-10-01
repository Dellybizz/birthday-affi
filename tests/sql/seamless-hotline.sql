begin;
insert into private.hotline_pairs(site_id,caller_hash,receiver_hash)
select id,encode(sha256(convert_to(repeat('a',64),'UTF8')),'hex'),encode(sha256(convert_to(repeat('b',64),'UTF8')),'hex') from public.sites where slug='wiffeyyyy-os'
on conflict(site_id)do update set caller_hash=excluded.caller_hash,receiver_hash=excluded.receiver_hash,state='idle',call_id=null,started_at=null;
set local role anon;
do $$
declare first_key text; other_key text; c jsonb; r jsonb; denied boolean; cid text;
begin
 first_key:=public.prepare_public_hotline('wiffeyyyy-os');other_key:=public.prepare_public_hotline('wiffeyyyy-os');
 c:=public.hotline_exchange('wiffeyyyy-os',first_key,'status');if c->>'role'<>'caller' then raise exception 'public caller not prepared';end if;
 c:=public.hotline_exchange('wiffeyyyy-os',first_key,'start','{"offer":{"type":"offer","sdp":"offer without waiting for ICE"}}');cid:=c->>'callId';
 c:=public.hotline_exchange('wiffeyyyy-os',other_key,'status');if c->>'state'<>'busy' or c->>'callId' is not null or c ? 'candidates' then raise exception 'other visitor sees private call';end if;
 denied:=false;begin perform public.hotline_exchange('wiffeyyyy-os',other_key,'end',jsonb_build_object('callId',cid));exception when others then denied:=true;end;if not denied then raise exception 'other caller ended call';end if;
 perform public.hotline_exchange('wiffeyyyy-os',first_key,'candidate',jsonb_build_object('callId',cid,'candidate',jsonb_build_object('candidate','candidate:1 1 UDP 1 127.0.0.1 1234 typ host','sdpMid','0','sdpMLineIndex',0)));
 r:=public.hotline_exchange('wiffeyyyy-os',repeat('b',64),'status');if jsonb_array_length(r->'candidates')<>1 then raise exception 'trickle candidate missing';end if;
 perform public.hotline_exchange('wiffeyyyy-os',repeat('b',64),'answer',jsonb_build_object('callId',cid,'answer',jsonb_build_object('type','answer','sdp','answer without waiting for ICE')));
 perform public.hotline_exchange('wiffeyyyy-os',first_key,'end',jsonb_build_object('callId',cid));
end $$;
reset role;
update private.hotline_pairs set receiver_hash=repeat('d',64) where site_id=(select id from public.sites where slug='wiffeyyyy-os');
set local role anon;
do $$declare denied boolean:=false;begin
 begin perform public.hotline_exchange('wiffeyyyy-os',repeat('b',64),'status');exception when insufficient_privilege then denied:=true;end;
 if not denied then raise exception 'old receiver still accepted';end if;
end $$;
rollback;
