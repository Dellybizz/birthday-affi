-- Public app documents contain presentation only. Personal Vault content remains private.
alter function private.assert_page_document(jsonb) rename to assert_pre_b5_page_document;
create function private.assert_page_document(doc jsonb) returns void language plpgsql set search_path='' as $$
declare n jsonb; p jsonb; spec jsonb; item jsonb; roots integer:=0; root jsonb; c jsonb;
begin
 spec:=$spec$[{"key":"appTitle","label":"App title","type":"text"},{"key":"appAccent","label":"App accent","type":"color"},{"key":"appBackground","label":"App background","type":"color"},{"key":"postsLabel","label":"Posts tab","type":"text"},{"key":"reelsLabel","label":"Reels tab","type":"text"},{"key":"emptyTitle","label":"Empty feed title","type":"text"},{"key":"emptyMessage","label":"Empty feed message","type":"text"},{"key":"appTitle","label":"App title","type":"text"},{"key":"appAccent","label":"App accent","type":"color"},{"key":"appBackground","label":"App background","type":"color"},{"key":"cameraAlbum","label":"Camera album name","type":"text"},{"key":"emptyTitle","label":"Empty library title","type":"text"},{"key":"emptyMessage","label":"Empty library message","type":"text"},{"key":"includeCamera","label":"Show local camera captures","type":"select","options":["true","false"]},{"key":"defaultPhotoSort","label":"Default date sorting","type":"select","options":["newest","oldest"]},{"key":"appTitle","label":"App title","type":"text"},{"key":"appAccent","label":"App accent","type":"color"},{"key":"appBackground","label":"App background","type":"color"},{"key":"captureTitle","label":"Camera welcome heading","type":"text"},{"key":"startLabel","label":"Camera permission button","type":"text"},{"key":"permissionMessage","label":"Camera permission message","type":"text"},{"key":"emptyTitle","label":"Empty camera roll title","type":"text"},{"key":"emptyMessage","label":"Empty camera roll message","type":"text"},{"key":"savedMessage","label":"Capture saved message","type":"text"},{"key":"galleryLabel","label":"Gallery destination label","type":"text"},{"key":"savedDestination","label":"Gallery destination","type":"select","options":["/app/adventure","/home"]},{"key":"defaultCamera","label":"Starting camera","type":"select","options":["front","rear"]},{"key":"defaultGrid","label":"Show camera grid initially","type":"select","options":["true","false"]},{"key":"videoEnabled","label":"Allow video capture","type":"select","options":["true","false"]},{"key":"appTitle","label":"App title","type":"text"},{"key":"appAccent","label":"App accent","type":"color"},{"key":"appBackground","label":"App background","type":"color"},{"key":"notesLabel","label":"Notes tab","type":"text"},{"key":"favoritesLabel","label":"Favorites tab","type":"text"},{"key":"letterLabel","label":"Letter tab","type":"text"},{"key":"emptyMessage","label":"Empty notes message","type":"text"},{"key":"signature","label":"Card signature","type":"text"},{"key":"favoritesEnabled","label":"Allow treasured notes","type":"select","options":["true","false"]},{"key":"appTitle","label":"App title","type":"text"},{"key":"appAccent","label":"App accent","type":"color"},{"key":"appBackground","label":"App background","type":"color"},{"key":"voicemailTitle","label":"Voicemail heading","type":"text"},{"key":"voicemailMessage","label":"Voicemail description","type":"text"},{"key":"contactDescription","label":"Contact description","type":"text"},{"key":"endCallLabel","label":"End call label","type":"text"},{"key":"contactTab","label":"Contact tab","type":"text"},{"key":"callTab","label":"Call tab","type":"text"},{"key":"voicemailTab","label":"Voicemail tab","type":"text"},{"key":"appTitle","label":"App title","type":"text"},{"key":"appAccent","label":"App accent","type":"color"},{"key":"appBackground","label":"App background","type":"color"},{"key":"lockedTitle","label":"Locked screen title","type":"text"},{"key":"lockedMessage","label":"Locked screen message","type":"text"},{"key":"question","label":"Unlock question","type":"text"},{"key":"answerPlaceholder","label":"Answer placeholder","type":"text"},{"key":"answerHint","label":"Answer hint","type":"text"},{"key":"unlockLabel","label":"Unlock button","type":"text"},{"key":"openingLabel","label":"Opening message","type":"text"},{"key":"doorLabel","label":"Vault door label","type":"text"},{"key":"unlockDuration","label":"Unlock animation milliseconds","type":"number","min":100,"max":2000},{"key":"appTitle","label":"App title","type":"text"},{"key":"appAccent","label":"App accent","type":"color"},{"key":"appBackground","label":"App background","type":"color"},{"key":"heroTitle","label":"Shop heading","type":"text"},{"key":"heroMessage","label":"Shop introduction","type":"text"},{"key":"heroSignature","label":"Shop signature","type":"text"},{"key":"shelfTitle","label":"Product collection heading","type":"text"},{"key":"freeTitle","label":"Free treats heading","type":"text"},{"key":"freeMessage","label":"Free treats description","type":"text"},{"key":"shopNote","label":"Shop footer note","type":"text"},{"key":"cartTitle","label":"Gift bag title","type":"text"},{"key":"emptyMessage","label":"Empty gift bag message","type":"text"},{"key":"receiptTitle","label":"Receipt heading","type":"text"},{"key":"receiptMessage","label":"Receipt message","type":"text"},{"key":"addGiftLabel","label":"Add gift button","type":"text"},{"key":"unavailableLabel","label":"Unavailable gift label","type":"text"},{"key":"appTitle","label":"App title","type":"text"},{"key":"appAccent","label":"App accent","type":"color"},{"key":"appBackground","label":"App background","type":"color"},{"key":"puzzleTitle","label":"Puzzle heading","type":"text"},{"key":"puzzleMessage","label":"Puzzle introduction","type":"text"},{"key":"rewardTitle","label":"Reward heading","type":"text"},{"key":"rewardMessage","label":"Reward message","type":"text"},{"key":"rewardNote","label":"Reward note","type":"text"},{"key":"giftLabel","label":"Open reward button","type":"text"}]$spec$::jsonb;
 perform private.assert_pre_b5_page_document(doc);
 for n in select value from jsonb_array_elements(doc->'nodes') loop
  p:=n->'props';
  if p ?| array['answer','answers','acceptedAnswers','story','chapters'] then raise exception 'Private Vault content cannot be stored in public pages'; end if;
  if p ? 'runtimeApp' then
   roots:=roots+1;root:=n;
   if n->>'type'<>'section' or n->'parentId'<>'null'::jsonb or coalesce(p->>'runtimeApp','') not in ('camera','vault','pieces') then raise exception 'Invalid runtime app';end if;
   if p->>'runtimeApp'<>'pieces' and jsonb_array_length(n->'children')>0 then raise exception 'This app has no public items';end if;
   if p->>'runtimeApp'='pieces' and jsonb_array_length(n->'children')>10 then raise exception 'Too many puzzle levels';end if;
  end if;
  if p ? 'runtimePart' then
   if jsonb_typeof(p->'title') is distinct from 'string' or jsonb_typeof(p->'src') is distinct from 'string' then raise exception 'Invalid puzzle title or photo';end if;
   if coalesce(p->>'runtimePart','')<>'level' or n->>'component'<>'image' then raise exception 'Invalid runtime item';end if;
   for c in select value from jsonb_array_elements('["cols","rows"]'::jsonb) loop
    if jsonb_typeof(p->(c#>>'{}')) is distinct from 'number' or (p->>(c#>>'{}'))::numeric not between 2 and 8 or (p->>(c#>>'{}'))::numeric<>trunc((p->>(c#>>'{}'))::numeric) then raise exception 'Invalid puzzle pieces';end if;
   end loop;
   if jsonb_typeof(p->'ratio') is distinct from 'number' or (p->>'ratio')::numeric not between 0.3 and 3 or coalesce(p->>'difficulty','') not in ('Easy','Moderate','Hard') then raise exception 'Invalid puzzle shape';end if;
   if not exists(select 1 from jsonb_array_elements(doc->'nodes') parent where parent->>'id'=n->>'parentId' and parent->'props'->>'runtimeApp'='pieces') then raise exception 'Invalid puzzle parent';end if;
  end if;
  for item in select value from jsonb_array_elements(spec) loop
   if p ? (item->>'key') then
    if item->>'type'='select' and not coalesce(item->'options' ? (p->>(item->>'key')),false) then raise exception 'Invalid app choice';end if;
    if item->>'type' in ('text','textarea') and (jsonb_typeof(p->(item->>'key'))<>'string' or length(p->>(item->>'key'))>2000) then raise exception 'Invalid app text';end if;
    if item->>'type'='color' and (jsonb_typeof(p->(item->>'key'))<>'string' or (p->>(item->>'key'))!~'^(#[0-9a-fA-F]{3,8}|transparent)$') then raise exception 'Invalid app color';end if;
    if item->>'type'='number' and (jsonb_typeof(p->(item->>'key'))<>'number' or (p->>(item->>'key'))::numeric not between (item->>'min')::numeric and (item->>'max')::numeric) then raise exception 'Invalid app number';end if;
   end if;
  end loop;
 end loop;
 if roots>1 or (roots=1 and jsonb_array_length(doc->'rootIds')<>1) then raise exception 'Runtime apps require one root';end if;
 if roots=1 and root->'props'->>'runtimeApp'='pieces' and exists(select 1 from jsonb_array_elements(root->'children') child where not exists(select 1 from jsonb_array_elements(doc->'nodes') level where level->>'id'=child#>>'{}' and level->'props'->>'runtimePart'='level')) then raise exception 'Only puzzle levels belong here';end if;
end $$;
revoke all on function private.assert_page_document(jsonb),private.assert_pre_b5_page_document(jsonb) from public,anon;
grant execute on function private.assert_page_document(jsonb),private.assert_pre_b5_page_document(jsonb) to authenticated;

insert into public.pages(site_id,slug,title,draft_document) select id,'camera','Clicksara',$doc${"schemaVersion":2,"nodes":[{"id":"camera-settings","type":"section","component":"section","parentId":null,"label":"Clicksara · settings","props":{"runtimeApp":"camera","appTitle":"Clicksara","appAccent":"#ffffff","appBackground":"#000000","captureTitle":"A little moment, captured.","startLabel":"Enable camera","permissionMessage":"Photos and videos save automatically to the Camera album in Pardanasheen on this device.","emptyTitle":"Your moments start here.","emptyMessage":"Take a photo and it will appear here and in Pardanasheen’s Camera album.","savedMessage":"Automatically saved to Pardanasheen · Camera","galleryLabel":"Open in Pardanasheen ↗","savedDestination":"/app/adventure","defaultCamera":"rear","defaultGrid":"true","videoEnabled":"true"},"children":[],"visible":true}],"rootIds":["camera-settings"]}$doc$::jsonb from public.sites on conflict(site_id,slug) do nothing;

insert into public.pages(site_id,slug,title,draft_document) select id,'vault','Vault',$doc${"schemaVersion":2,"nodes":[{"id":"vault-settings","type":"section","component":"section","parentId":null,"label":"VAULT · settings","props":{"runtimeApp":"vault","appTitle":"VAULT","appAccent":"#d6ae77","appBackground":"#17110c","lockedTitle":"The most precious things stay close.","lockedMessage":"Our story. Protected by a memory only we share.","question":"What’s my favourite memory about us?","answerPlaceholder":"Write your memory…","answerHint":"Say it in your own words.","unlockLabel":"Unlock our story","openingLabel":"Opening our story…","doorLabel":"OUR PRECIOUS STORY","unlockDuration":900},"children":[],"visible":true}],"rootIds":["vault-settings"]}$doc$::jsonb from public.sites on conflict(site_id,slug) do nothing;

insert into public.pages(site_id,slug,title,draft_document) select id,'pieces','Pieces of Us',$doc${"schemaVersion":2,"nodes":[{"id":"pieces-settings","type":"section","component":"section","parentId":null,"label":"Pieces of Us · settings","props":{"runtimeApp":"pieces","appTitle":"Pieces of Us","appAccent":"#c69b65","appBackground":"#19150f","puzzleTitle":"We fit together.","puzzleMessage":"Piece by piece, bring us together. Your surprise waits after every memory.","rewardTitle":"Come a little closer.","rewardMessage":"One warm hug. And an “I love you” — said to you, in person.","rewardNote":"No expiry date. Just show me this when we meet.","giftLabel":"Open my mysterious gift ♡"},"children":["puzzle-level-1","puzzle-level-2","puzzle-level-3"],"visible":true},{"id":"puzzle-level-1","type":"block","component":"image","parentId":"pieces-settings","label":"Level 1 · Easy","props":{"runtimePart":"level","title":"The little beginning","src":"/puzzles/level-one.jpg","alt":"Our memory","difficulty":"Easy","cols":3,"rows":3,"ratio":1.778642936596218,"note":"Nine pieces. One lovely beginning."},"children":[],"visible":true},{"id":"puzzle-level-2","type":"block","component":"image","parentId":"pieces-settings","label":"Level 2 · Moderate","props":{"runtimePart":"level","title":"A little closer","src":"/puzzles/level-two.jpg","alt":"Our memory","difficulty":"Moderate","cols":4,"rows":4,"ratio":0.75,"note":"Sixteen pieces, and a little more patience."},"children":[],"visible":true},{"id":"puzzle-level-3","type":"block","component":"image","parentId":"pieces-settings","label":"Level 3 · Hard","props":{"runtimePart":"level","title":"Together, at last","src":"/puzzles/our-moment.jpg","alt":"Our memory","difficulty":"Hard","cols":5,"rows":4,"ratio":1.7777777777777777,"note":"Twenty pieces. Our final memory."},"children":[],"visible":true}],"rootIds":["pieces-settings"]}$doc$::jsonb from public.sites on conflict(site_id,slug) do nothing;

create table private.vault_configurations(
 site_id uuid primary key references public.sites(id) on delete cascade,
 draft jsonb not null,
 published jsonb,
 revision bigint not null default 0,
 updated_at timestamptz not null default now()
);
alter table private.vault_configurations enable row level security;
revoke all on private.vault_configurations from public,anon,authenticated;
insert into private.vault_configurations(site_id,draft)
 select site_id,jsonb_build_object('answers','[]'::jsonb,'story',story) from private.vault_stories;

create function private.assert_vault_configuration(doc jsonb) returns void language plpgsql set search_path='' as $$
declare story jsonb; chapter jsonb; key text; ids text[]:='{}'; answer jsonb;
begin
 if doc is null or octet_length(doc::text)>900000 or jsonb_typeof(doc) is distinct from 'object' or doc-'answers'-'story'<>'{}'::jsonb or jsonb_typeof(doc->'answers') is distinct from 'array' or jsonb_array_length(doc->'answers')>20 then raise exception 'Invalid private Vault configuration';end if;
 for answer in select value from jsonb_array_elements(doc->'answers') loop
  if jsonb_typeof(answer) is distinct from 'string' or (length(trim(answer#>>'{}')) not between 1 and 160 or (answer#>>'{}')!~'[[:alnum:]]') then raise exception 'Invalid Vault answer';end if;
 end loop;
 story:=doc->'story';
 if jsonb_typeof(story) is distinct from 'object' or story-'title'-'subtitle'-'dedication'-'chapters'<>'{}'::jsonb then raise exception 'Invalid Vault story';end if;
 foreach key in array array['title','subtitle','dedication'] loop
  if jsonb_typeof(story->key) is distinct from 'string' or length(story->>key)>2000 then raise exception 'Invalid story text';end if;
 end loop;
 if jsonb_typeof(story->'chapters') is distinct from 'array' or jsonb_array_length(story->'chapters') not between 1 and 30 then raise exception 'Use between 1 and 30 chapters';end if;
 for chapter in select value from jsonb_array_elements(story->'chapters') loop
  if jsonb_typeof(chapter) is distinct from 'object' or chapter-'id'-'title'-'period'-'motif'-'keepsake'-'quote'-'body'-'noteTitle'-'note'<>'{}'::jsonb then raise exception 'Invalid chapter';end if;
  foreach key in array array['id','title','period','motif','keepsake','quote','body','noteTitle','note'] loop
   if jsonb_typeof(chapter->key) is distinct from 'string' or length(chapter->>key)>(case when key in ('body','note') then 20000 else 2000 end) then raise exception 'Invalid chapter text';end if;
  end loop;
  if chapter->>'id'!~'^[a-zA-Z0-9_-]{1,100}$' or chapter->>'id'=any(ids) or chapter->>'motif' not in ('notebook','letters','touch','seat','dua','shawl','future') then raise exception 'Invalid chapter identity';end if;
  ids:=array_append(ids,chapter->>'id');
 end loop;
end $$;
revoke all on function private.assert_vault_configuration(jsonb) from public,anon,authenticated;

create function public.read_vault_configuration(p_site_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare config private.vault_configurations;
begin
 if not private.has_admin_role(array['owner']::public.admin_role[]) then raise exception 'Not authorized' using errcode='42501';end if;
 select * into config from private.vault_configurations where site_id=p_site_id;
 if not found then return null;end if;
 return jsonb_build_object('document',config.draft,'revision',config.revision,'hasPublication',config.published is not null,'hasChanges',config.published is null or config.draft<>config.published);
end $$;

create function public.change_vault_configuration(p_site_id uuid,p_document jsonb,p_expected_revision bigint,p_publish boolean default false) returns jsonb language plpgsql security definer set search_path='' as $$
declare config private.vault_configurations; next_revision bigint;
begin
 if not private.has_admin_role(array['owner']::public.admin_role[]) then raise exception 'Not authorized' using errcode='42501';end if;
 perform private.assert_vault_configuration(p_document);
 perform 1 from public.sites where id=p_site_id for update;
 if not found then raise exception 'Unknown site';end if;
 select * into config from private.vault_configurations where site_id=p_site_id for update;
 if p_expected_revision is null or coalesce(config.revision,0)<>p_expected_revision then raise exception 'DRAFT_CONFLICT' using errcode='40001';end if;
 next_revision:=coalesce(config.revision,0)+1;
 insert into private.vault_configurations(site_id,draft,published,revision) values(p_site_id,p_document,case when p_publish then p_document else null end,next_revision)
 on conflict(site_id) do update set draft=excluded.draft,published=case when p_publish then excluded.draft else vault_configurations.published end,revision=excluded.revision,updated_at=now();
 if p_publish then insert into private.vault_stories(site_id,story) values(p_site_id,p_document->'story') on conflict(site_id) do update set story=excluded.story,updated_at=now();end if;
 insert into public.audit_logs(actor_id,action,entity_type,entity_id,metadata) values(auth.uid(),case when p_publish then 'vault.publish' else 'vault.save_draft' end,'vault_configuration',p_site_id,jsonb_build_object('revision',next_revision,'chapterCount',jsonb_array_length(p_document->'story'->'chapters')));
 return jsonb_build_object('revision',next_revision,'published',p_publish);
end $$;
revoke all on function public.read_vault_configuration(uuid),public.change_vault_configuration(uuid,jsonb,bigint,boolean) from public,anon;
grant execute on function public.read_vault_configuration(uuid),public.change_vault_configuration(uuid,jsonb,bigint,boolean) to authenticated;

alter function public.unlock_vault_story(text,text) rename to unlock_pre_b5_vault_story;
revoke all on function public.unlock_pre_b5_vault_story(text,text) from public,anon,authenticated;
create function public.unlock_vault_story(p_site_slug text,p_answer text) returns jsonb language plpgsql security definer set search_path='' as $$
declare config jsonb; normalized text;
begin
 if p_answer is null or length(p_answer)>160 then return null;end if;
 select v.published into config from private.vault_configurations v join public.sites s on s.id=v.site_id where s.slug=p_site_slug and s.public_delivery_enabled;
 if config is null or jsonb_array_length(config->'answers')=0 then return public.unlock_pre_b5_vault_story(p_site_slug,p_answer);end if;
 normalized:=trim(regexp_replace(lower(p_answer),'[^[:alnum:][:space:]]',' ','g'));
 normalized:=regexp_replace(normalized,'[[:space:]]+',' ','g');
 if normalized='' then return null;end if;
 if exists(select 1 from jsonb_array_elements_text(config->'answers') answer where regexp_replace(trim(regexp_replace(lower(answer),'[^[:alnum:][:space:]]',' ','g')),'[[:space:]]+',' ','g')=normalized) then return config->'story';end if;
 return null;
end $$;
revoke all on function public.unlock_vault_story(text,text) from public;
grant execute on function public.unlock_vault_story(text,text) to anon,authenticated;
