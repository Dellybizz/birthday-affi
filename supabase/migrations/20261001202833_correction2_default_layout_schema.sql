-- Extend schema-v2 validation without weakening its tree, media or role checks.
do $$ declare definition text; begin
 definition:=pg_get_functiondef('private.assert_page_document(jsonb)'::regprocedure);
 definition:=replace(definition,'''movie-scene'',''kiss-gift'',''radio-track''','''movie-scene'',''kiss-gift'',''radio-track'',''action'',''invitation'',''chapter'',''station''');
 definition:=replace(definition,' if doc ? ''theme'' then',$validation$
 if doc ? 'layout' and (jsonb_typeof(doc->'layout')<>'object' or jsonb_typeof(doc->'layout'->'version') is distinct from 'number' or doc->'layout'->>'version' is distinct from '1' or coalesce(doc->'layout'->>'page','') not in ('welcome','home','reasons','hotline','adventure','movie','kiss-shop','radio')) then raise exception 'Invalid layout';end if;
 for n in select value from jsonb_array_elements(doc->'nodes') loop
  if n->'props' ? 'sectionKind' and (n->>'type'<>'section' or n->'props'->>'sectionKind' not in ('startup-greeting','welcome-hero','enter-action','keepsake-note','birthday-heading','date-widget','app-launcher','recent-app','intro','reason-deck','heartfelt-card','incoming-call','birthday-message','affection-keypad','text-versions','choice-group','invitation-reveal','movie-credits','movie-player','movie-chapters','birthday-ending','product-collection','gift-bag','gift-checkout','gift-receipt','redemption-note','station-selector','radio-player','dedication','track-list'))then raise exception 'Invalid section kind';end if;
  if n->'props' ? 'sectionKind' and exists(select 1 from jsonb_array_elements(n->'children') c join lateral jsonb_array_elements(doc->'nodes') t on t->>'id'=c#>>'{}' where not ('{"startup-greeting":["text"],"welcome-hero":["heading","text"],"enter-action":["action"],"keepsake-note":["text"],"birthday-heading":["heading","text"],"date-widget":["text"],"app-launcher":["app-grid"],"recent-app":["text"],"intro":["heading","text"],"reason-deck":["reason"],"heartfelt-card":["heading","text"],"incoming-call":[],"birthday-message":["hotline-message"],"affection-keypad":["hotline-message"],"text-versions":["text"],"choice-group":["adventure-choice"],"invitation-reveal":["invitation"],"movie-credits":["heading","text"],"movie-player":["movie-scene"],"movie-chapters":["chapter"],"birthday-ending":["heading","text"],"product-collection":["kiss-gift"],"gift-bag":[],"gift-checkout":[],"gift-receipt":[],"redemption-note":["text"],"station-selector":["station"],"radio-player":[],"dedication":["text"],"track-list":["radio-track"]}'::jsonb->(n->'props'->>'sectionKind') ? (t->>'component')))then raise exception 'Incompatible section block';end if;
  if n->>'component'='action' and coalesce(n->'props'->>'href','') not in ('/home','/') then raise exception 'Invalid action destination';end if;
  for prop in select key,value from jsonb_each(n->'props') loop
   if prop.key in ('sceneId','stationId') and prop.value#>>'{}'<>'' and not exists(select 1 from jsonb_array_elements(doc->'nodes') t where t->>'id'=prop.value#>>'{}' and t->>'component'=case prop.key when 'sceneId' then 'movie-scene' else 'station' end)then raise exception 'Missing layout reference';end if;
   if prop.key='introSrc' and (jsonb_typeof(prop.value)<>'string' or not (prop.value#>>'{}'='' or prop.value#>>'{}' ~ '^/($|[^/\\[:space:]][^\\[:space:]]*)$' or prop.value#>>'{}' ~ '^https://[^/@[:space:]\\]+(/[^[:space:]\\]*)?$'))then raise exception 'Unsafe intro URL';end if;
   if prop.key='digit' and prop.value#>>'{}' !~ '^[0-9]$' then raise exception 'Invalid keypad digit';end if;
  end loop;
  if n->'props'->>'sectionKind'='affection-keypad' and exists(select 1 from jsonb_array_elements(n->'children') c join lateral jsonb_array_elements(doc->'nodes') t on t->>'id'=c#>>'{}' where t->>'visible'<>'false' and t->'props' ? 'digit' group by t->'props'->>'digit' having count(*)>1)then raise exception 'Duplicate keypad digits';end if;
 end loop;
 if exists(select 1 from jsonb_array_elements(doc->'nodes') entry where entry->'props'->>'sectionKind' in ('incoming-call','birthday-message','affection-keypad','invitation-reveal','movie-player','movie-chapters','product-collection','gift-bag','gift-checkout','gift-receipt','station-selector','radio-player','track-list') group by entry->'props'->>'sectionKind' having count(*)>1)then raise exception 'Duplicate singleton section';end if;
 if doc ? 'theme' then$validation$);
 execute definition;
end $$;
-- Private, immutable recovery snapshots taken before layout upgrades. No Data API grants.
create table private.page_layout_backups(
 page_id uuid not null references public.pages(id),layout_version integer not null,
 document jsonb not null,revision bigint not null,settings jsonb not null,
 captured_at timestamptz not null default now(),primary key(page_id,layout_version)
);
alter table private.page_layout_backups enable row level security;
revoke all on private.page_layout_backups from public,anon,authenticated;
