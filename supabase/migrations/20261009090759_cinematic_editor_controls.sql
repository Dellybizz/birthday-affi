-- Optional cinematic controls preserve existing published documents and defaults.
create function private.assert_cinematic_shape(actual jsonb,expected jsonb) returns void language plpgsql set search_path='' as $shape$
declare item record;i integer;
begin
 if actual is null or jsonb_typeof(actual) is distinct from jsonb_typeof(expected) then raise exception 'Invalid cinematic settings';end if;
 case jsonb_typeof(expected)
 when 'object' then
  if (select array_agg(key order by key) from jsonb_object_keys(actual) key) is distinct from (select array_agg(key order by key) from jsonb_object_keys(expected) key) then raise exception 'Unknown cinematic control';end if;
  for item in select key,value from jsonb_each(expected) loop perform private.assert_cinematic_shape(actual->item.key,item.value);end loop;
 when 'array' then
  if jsonb_array_length(actual)<>jsonb_array_length(expected) then raise exception 'Missing cinematic controls';end if;
  for i in 0..jsonb_array_length(expected)-1 loop perform private.assert_cinematic_shape(actual->i,expected->i);end loop;
 when 'string' then if length(actual #>> '{}')>2000 then raise exception 'Cinematic copy is too long';end if;
 when 'number' then if (actual #>> '{}')::numeric not between 0 and 3600 then raise exception 'Invalid cinematic timing';end if;
 else raise exception 'Invalid cinematic value';
 end case;
end $shape$;
alter function private.assert_base_site_document(jsonb) rename to assert_base_site_document_before_cinematic;
create function private.assert_base_site_document(doc jsonb) returns void language plpgsql set search_path='' as $validation$
declare c jsonb;expected jsonb := $defaults${"countdown": {"before": {"eyebrow": "one last wait", "titleLine": "until the day that's", "titleEmphasis": "actually yours.", "sub": "No giant decorations. No dramatic speech yet. Just time moving toward one very specific person.", "lockLabel": "locked until her birthday", "lockNote": "The timer is the key. When it reaches zero, the lock can finally be opened."}, "after": {"eyebrow": "it is officially time", "titleLine": "happy birthday,", "titleEmphasis": "{nickname}.", "sub": "The waiting part is over. There is one last thing I made for you.", "lockLabel": "unlock", "lockNote": "The wait is over. One tiny password check and the rest is yours."}, "access": {"title": "come on! you know the password", "text": "Your birthday: day, month, then the full year."}, "phases": [{"key": "near", "seconds": 180, "text": "three minutes. stay here.", "eyebrow": "", "titleLine": "", "titleEmphasis": "", "sub": ""}, {"key": "mid", "seconds": 135, "text": "the room is changing", "eyebrow": "", "titleLine": "", "titleEmphasis": "", "sub": ""}, {"key": "close", "seconds": 90, "text": "ninety seconds", "eyebrow": "", "titleLine": "", "titleEmphasis": "", "sub": ""}, {"key": "minute", "seconds": 60, "text": "one minute", "eyebrow": "", "titleLine": "", "titleEmphasis": "", "sub": ""}, {"key": "fortyfive", "seconds": 45, "text": "forty-five seconds", "eyebrow": "", "titleLine": "", "titleEmphasis": "", "sub": ""}, {"key": "twentyfive", "seconds": 25, "text": "just seconds now", "eyebrow": "", "titleLine": "", "titleEmphasis": "", "sub": ""}, {"key": "ten", "seconds": 10, "text": "ten tiny seconds", "eyebrow": "", "titleLine": "", "titleEmphasis": "", "sub": ""}]}, "reel": {"copy": [{"key": "copy0", "scene": 0, "text": "okay."}, {"key": "copy1", "scene": 0, "text": "this is the last one."}, {"key": "copy2", "scene": 0, "text": "play final reel"}, {"key": "copy3", "scene": 1, "text": "I started making this because it was your birthday."}, {"key": "copy4", "scene": 2, "text": "somewhere along the way,it became about something else."}, {"key": "copy5", "scene": 3, "text": "how much of you I’ve somehow collected in my head."}, {"key": "copy6", "scene": 4, "text": "the stupid conversations"}, {"key": "copy7", "scene": 4, "text": "the photos I saved"}, {"key": "copy8", "scene": 4, "text": "the things you probably forgot"}, {"key": "copy9", "scene": 4, "text": "your unnecessary yapping"}, {"key": "copy10", "scene": 4, "text": "the tiny things I notice"}, {"key": "copy11", "scene": 5, "text": "not necessarily the prettiest one. just the one that feels most like her."}, {"key": "copy12", "scene": 6, "text": "out of everything I put in here…"}, {"key": "copy13", "scene": 7, "text": "this is still my favourite part."}, {"key": "copy14", "scene": 8, "text": "not the picture."}, {"key": "copy15", "scene": 9, "text": "you."}, {"key": "copy16", "scene": 11, "text": "I hope you never become less of yourself just to make life easier for everyone else."}, {"key": "copy17", "scene": 11, "text": "Keep the loud parts. The soft parts. The weird parts. The parts that take time to understand."}, {"key": "copy18", "scene": 12, "text": "and I hope this year gives you reasons to be proud of yourself\n        even on the days nobody else notices."}, {"key": "copy19", "scene": 13, "text": "…actually"}, {"key": "copy20", "scene": 13, "text": "happy birthday, {nickname}. ♡"}, {"key": "copy21", "scene": 13, "text": "one more thing?"}, {"key": "copy22", "scene": 13, "text": "thank you for being someone worth making all of this for."}, {"key": "copy23", "scene": 10, "text": "I hope this year is good to you."}, {"key": "copy24", "scene": 10, "text": "I hope you get more of the things that make you excited."}, {"key": "copy25", "scene": 10, "text": "less of the things that quietly drain you."}, {"key": "copy26", "scene": 10, "text": "more days that feel easy."}, {"key": "copy27", "scene": 10, "text": "more people who make you feel understood."}, {"key": "copy28", "scene": 10, "text": "and enough stupid moments to keep everything interesting."}, {"key": "copy29", "scene": 10, "text": "and selfishly, I hope I get to be around for some of it."}], "sceneSeconds": [0, 0, 4.3, 8.4, 12.7, 19.8, 24.6, 28.6, 32.9, 36.8, 41.2, 52, 58, 64.6], "actuallySeconds": 68.1, "birthdaySeconds": 70.4, "actionsSeconds": 73.5, "favoritePhoto": ""}}$defaults$::jsonb;i integer;last numeric;next numeric;k text;
begin
 perform private.assert_base_site_document_before_cinematic(doc-'cinematic');
 if not doc ? 'cinematic' then return;end if;c:=doc->'cinematic';
 perform private.assert_cinematic_shape(c,expected);
 last:=3601;
 for i in 0..6 loop
  if c->'countdown'->'phases'->i->'key' is distinct from expected->'countdown'->'phases'->i->'key' then raise exception 'Invalid countdown stage';end if;
  next:=(c->'countdown'->'phases'->i->>'seconds')::numeric;
  if next<1 or next>=last then raise exception 'Countdown stages must descend toward zero';end if;last:=next;
 end loop;
 for i in 0..jsonb_array_length(expected->'reel'->'copy')-1 loop
  if c->'reel'->'copy'->i->'key' is distinct from expected->'reel'->'copy'->i->'key' or c->'reel'->'copy'->i->'scene' is distinct from expected->'reel'->'copy'->i->'scene' then raise exception 'Invalid reel text';end if;
 end loop;
 if c->'reel'->'sceneSeconds'->0 <> '0'::jsonb or c->'reel'->'sceneSeconds'->1 <> '0'::jsonb then raise exception 'Invalid opening timing';end if;
 last:=0;
 for i in 2..13 loop next:=(c->'reel'->'sceneSeconds'->>i)::numeric;if next<=last then raise exception 'Reel scenes must be in order';end if;last:=next;end loop;
 foreach k in array array['actuallySeconds','birthdaySeconds','actionsSeconds'] loop next:=(c->'reel'->>k)::numeric;if next<=last then raise exception 'Final reveal events must be in order';end if;last:=next;end loop;
end $validation$;
revoke all on function private.assert_cinematic_shape(jsonb,jsonb),private.assert_base_site_document(jsonb),private.assert_base_site_document_before_cinematic(jsonb) from public,anon,authenticated;
