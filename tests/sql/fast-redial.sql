begin;
insert into private.hotline_pairs(site_id,caller_hash,receiver_hash)
select id,encode(sha256(convert_to(repeat('a',64),'UTF8')),'hex'),encode(sha256(convert_to(repeat('b',64),'UTF8')),'hex') from public.sites where slug='wiffeyyyy-os'
on conflict(site_id)do update set caller_hash=excluded.caller_hash,receiver_hash=excluded.receiver_hash,state='idle',call_id=null,started_at=null;
set local role anon;
do $$declare c jsonb; denied boolean:=false;begin
 c:=public.hotline_exchange('wiffeyyyy-os',repeat('a',64),'start','{"offer":{"type":"offer","sdp":"fast redial test offer"}}');
 perform set_config('hotline.test.old_id',c->>'callId',true);
 perform public.hotline_exchange('wiffeyyyy-os',repeat('a',64),'end',jsonb_build_object('callId',c->>'callId'));
 begin perform public.hotline_exchange('wiffeyyyy-os',repeat('a',64),'start','{"offer":{"type":"offer","sdp":"fast redial test offer"}}');exception when others then if SQLERRM='Please wait before calling again' then denied:=true;else raise;end if;end;
 if not denied then raise exception 'Rapid-repeat limit missing';end if;
end $$;
reset role;
update private.hotline_pairs set started_at=now()-interval '2 seconds' where site_id=(select id from public.sites where slug='wiffeyyyy-os');
set local role anon;
do $$declare c jsonb; after_stale jsonb; denied boolean:=false;begin
 c:=public.hotline_exchange('wiffeyyyy-os',repeat('a',64),'start','{"offer":{"type":"offer","sdp":"fast redial test offer"}}');
 if c->>'state'<>'ringing' then raise exception 'Redial failed';end if;
 begin perform public.hotline_exchange('wiffeyyyy-os',repeat('a',64),'start','{"offer":{"type":"offer","sdp":"fast redial test offer"}}');exception when others then denied:=true;end;
 if not denied then raise exception 'Overlapping call accepted';end if;
 denied:=false;begin perform public.hotline_exchange('wiffeyyyy-os',repeat('a',64),'end',jsonb_build_object('callId',current_setting('hotline.test.old_id')));exception when others then if SQLERRM='Call has changed' then denied:=true;else raise;end if;end;
 if not denied then raise exception 'Stale hangup accepted';end if;
 after_stale:=public.hotline_exchange('wiffeyyyy-os',repeat('a',64),'status');
 if after_stale->>'callId'<>c->>'callId' or after_stale->>'state'<>'ringing' then raise exception 'Stale hangup affected redial';end if;
end $$;
reset role;
rollback;
select 'Fast redial, rapid-repeat, overlapping-call and stale-hangup checks passed' result;
