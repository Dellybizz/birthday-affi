begin;
insert into private.hotline_pairs(site_id,caller_hash,receiver_hash)
select id,encode(sha256(convert_to(repeat('a',64),'UTF8')),'hex'),encode(sha256(convert_to(repeat('b',64),'UTF8')),'hex') from public.sites where slug='wiffeyyyy-os'
on conflict(site_id)do update set caller_hash=excluded.caller_hash,receiver_hash=excluded.receiver_hash,call_id=null,state='idle',started_at=null;
set local role anon;
do $$
declare c jsonb; r jsonb; cid text; denied boolean;
begin
 c:=public.hotline_exchange('wiffeyyyy-os',repeat('a',64),'status');
 if c->>'role'<>'caller' then raise exception 'caller role failed';end if;
 r:=public.hotline_exchange('wiffeyyyy-os',repeat('b',64),'status');
 if r->>'role'<>'receiver' then raise exception 'receiver role failed';end if;
 denied:=false;begin perform public.hotline_exchange('wiffeyyyy-os',repeat('c',64),'status');exception when insufficient_privilege then denied:=true;end;
 if not denied then raise exception 'invalid token accepted';end if;
 denied:=false;begin perform public.hotline_exchange('wiffeyyyy-os',repeat('b',64),'start');exception when insufficient_privilege then denied:=true;end;
 if not denied then raise exception 'receiver started a call';end if;
 c:=public.hotline_exchange('wiffeyyyy-os',repeat('a',64),'start','{"offer":{"type":"offer","sdp":"test offer long enough"}}');cid:=c->>'callId';
 r:=public.hotline_exchange('wiffeyyyy-os',repeat('b',64),'status');
 if r->>'state'<>'ringing' or r->'offer'->>'type'<>'offer' then raise exception 'receiver did not receive offer';end if;
 denied:=false;begin perform public.hotline_exchange('wiffeyyyy-os',repeat('a',64),'answer',jsonb_build_object('callId',cid));exception when others then denied:=true;end;
 if not denied then raise exception 'caller answered own call';end if;
 r:=public.hotline_exchange('wiffeyyyy-os',repeat('b',64),'answer',jsonb_build_object('callId',cid,'answer',jsonb_build_object('type','answer','sdp','test answer long enough')));
 if r->>'state'<>'connected' then raise exception 'answer failed';end if;
 c:=public.hotline_exchange('wiffeyyyy-os',repeat('a',64),'status');if c->'answer'->>'type'<>'answer' then raise exception 'caller did not receive answer';end if;
 denied:=false;begin perform public.hotline_exchange('wiffeyyyy-os',repeat('a',64),'end','{"callId":"wrong"}');exception when others then denied:=true;end;
 if not denied then raise exception 'stale end accepted';end if;
 c:=public.hotline_exchange('wiffeyyyy-os',repeat('a',64),'end',jsonb_build_object('callId',cid));if c->>'state'<>'ended' then raise exception 'end failed';end if;
 denied:=false;begin perform 1 from private.hotline_pairs;exception when insufficient_privilege then denied:=true;end;
 if not denied then raise exception 'table exposed';end if;
end $$;
rollback;
