create function private.assert_base_site_document(doc jsonb) returns void language plpgsql set search_path='' as $$
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
revoke all on function private.assert_base_site_document(jsonb) from public,anon,authenticated;
create or replace function private.assert_site_document(doc jsonb) returns void language plpgsql set search_path='' as $$
declare os jsonb;begin
 perform private.assert_base_site_document(doc - 'os');
 if not doc ? 'os' then return;end if;os:=doc->'os';
 if jsonb_typeof(os)<>'object' or (select count(*) from jsonb_object_keys(os))<>45 or not os ?& array['width','height','scale','viewportPadding','frameWidth','frameRadius','position','frameColor','brightness','wallpaperDim','surfaceOpacity','blur','shadow','iconRadius','iconSize','iconGap','fontScale','wallpaper','wallpaperFit','colorMode','statusVisible','showIsland','showWifi','showSignal','showBattery','dockVisible','showIconLabels','clockFormat','clockMode','fixedTime','statusColor','batteryLevel','dockOpacity','dockBlur','dockRadius','dockSpacing','gridColumns','motionEnabled','reducedMotion','notificationsEnabled','appAnimation','appDuration','journeyDuration','shadeDuration','swipeThreshold'] then raise exception 'Invalid OS settings';end if;
 if jsonb_typeof(os->'width')<>'number' or (os->>'width')::numeric not between 320 and 480 or (os->>'width')::numeric<>trunc((os->>'width')::numeric) then raise exception 'Invalid OS width';end if;
 if jsonb_typeof(os->'height')<>'number' or (os->>'height')::numeric not between 600 and 1100 or (os->>'height')::numeric<>trunc((os->>'height')::numeric) then raise exception 'Invalid OS height';end if;
 if jsonb_typeof(os->'scale')<>'number' or (os->>'scale')::numeric not between 0.5 and 1.5 then raise exception 'Invalid OS scale';end if;
 if jsonb_typeof(os->'viewportPadding')<>'number' or (os->>'viewportPadding')::numeric not between 0 and 64 then raise exception 'Invalid OS viewportPadding';end if;
 if jsonb_typeof(os->'frameWidth')<>'number' or (os->>'frameWidth')::numeric not between 0 and 16 then raise exception 'Invalid OS frameWidth';end if;
 if jsonb_typeof(os->'frameRadius')<>'number' or (os->>'frameRadius')::numeric not between 0 and 64 then raise exception 'Invalid OS frameRadius';end if;
 if jsonb_typeof(os->'position')<>'string' or os->>'position' not in ('center','top') then raise exception 'Invalid OS position';end if;
 if jsonb_typeof(os->'frameColor')<>'string' or os->>'frameColor' !~ '^#[0-9a-fA-F]{6}$' then raise exception 'Invalid OS frameColor';end if;
 if jsonb_typeof(os->'brightness')<>'number' or (os->>'brightness')::numeric not between 0.5 and 1.5 then raise exception 'Invalid OS brightness';end if;
 if jsonb_typeof(os->'wallpaperDim')<>'number' or (os->>'wallpaperDim')::numeric not between 0 and 1 then raise exception 'Invalid OS wallpaperDim';end if;
 if jsonb_typeof(os->'surfaceOpacity')<>'number' or (os->>'surfaceOpacity')::numeric not between 0.2 and 1 then raise exception 'Invalid OS surfaceOpacity';end if;
 if jsonb_typeof(os->'blur')<>'number' or (os->>'blur')::numeric not between 0 and 40 then raise exception 'Invalid OS blur';end if;
 if jsonb_typeof(os->'shadow')<>'number' or (os->>'shadow')::numeric not between 0 and 1 then raise exception 'Invalid OS shadow';end if;
 if jsonb_typeof(os->'iconRadius')<>'number' or (os->>'iconRadius')::numeric not between 0 and 32 then raise exception 'Invalid OS iconRadius';end if;
 if jsonb_typeof(os->'iconSize')<>'number' or (os->>'iconSize')::numeric not between 40 and 72 then raise exception 'Invalid OS iconSize';end if;
 if jsonb_typeof(os->'iconGap')<>'number' or (os->>'iconGap')::numeric not between 4 and 28 then raise exception 'Invalid OS iconGap';end if;
 if jsonb_typeof(os->'fontScale')<>'number' or (os->>'fontScale')::numeric not between 0.8 and 1.3 then raise exception 'Invalid OS fontScale';end if;
 if jsonb_typeof(os->'wallpaper')<>'string' or length(os->>'wallpaper')>2048 or (os->>'wallpaper'<>'' and (position(chr(92) in os->>'wallpaper')>0 or os->>'wallpaper' !~ '^(https://[^/@[:space:]]+(/[^[:space:]]*)?|/([^/[:space:]][^[:space:]]*)?)$')) then raise exception 'Invalid OS wallpaper';end if;
 if jsonb_typeof(os->'wallpaperFit')<>'string' or os->>'wallpaperFit' not in ('cover','contain') then raise exception 'Invalid OS wallpaperFit';end if;
 if jsonb_typeof(os->'colorMode')<>'string' or os->>'colorMode' not in ('light','dark','system') then raise exception 'Invalid OS colorMode';end if;
 if jsonb_typeof(os->'statusVisible')<>'boolean' then raise exception 'Invalid OS statusVisible';end if;
 if jsonb_typeof(os->'showIsland')<>'boolean' then raise exception 'Invalid OS showIsland';end if;
 if jsonb_typeof(os->'showWifi')<>'boolean' then raise exception 'Invalid OS showWifi';end if;
 if jsonb_typeof(os->'showSignal')<>'boolean' then raise exception 'Invalid OS showSignal';end if;
 if jsonb_typeof(os->'showBattery')<>'boolean' then raise exception 'Invalid OS showBattery';end if;
 if jsonb_typeof(os->'dockVisible')<>'boolean' then raise exception 'Invalid OS dockVisible';end if;
 if jsonb_typeof(os->'showIconLabels')<>'boolean' then raise exception 'Invalid OS showIconLabels';end if;
 if jsonb_typeof(os->'clockFormat')<>'string' or os->>'clockFormat' not in ('12','24') then raise exception 'Invalid OS clockFormat';end if;
 if jsonb_typeof(os->'clockMode')<>'string' or os->>'clockMode' not in ('live','fixed') then raise exception 'Invalid OS clockMode';end if;
 if jsonb_typeof(os->'fixedTime')<>'string' or os->>'fixedTime' !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' then raise exception 'Invalid OS fixedTime';end if;
 if jsonb_typeof(os->'statusColor')<>'string' or os->>'statusColor' !~ '^#[0-9a-fA-F]{6}$' then raise exception 'Invalid OS statusColor';end if;
 if jsonb_typeof(os->'batteryLevel')<>'number' or (os->>'batteryLevel')::numeric not between 0 and 100 then raise exception 'Invalid OS batteryLevel';end if;
 if jsonb_typeof(os->'dockOpacity')<>'number' or (os->>'dockOpacity')::numeric not between 0 and 1 then raise exception 'Invalid OS dockOpacity';end if;
 if jsonb_typeof(os->'dockBlur')<>'number' or (os->>'dockBlur')::numeric not between 0 and 40 then raise exception 'Invalid OS dockBlur';end if;
 if jsonb_typeof(os->'dockRadius')<>'number' or (os->>'dockRadius')::numeric not between 0 and 48 then raise exception 'Invalid OS dockRadius';end if;
 if jsonb_typeof(os->'dockSpacing')<>'number' or (os->>'dockSpacing')::numeric not between 4 and 28 then raise exception 'Invalid OS dockSpacing';end if;
 if jsonb_typeof(os->'gridColumns')<>'number' or (os->>'gridColumns')::numeric not between 3 and 6 or (os->>'gridColumns')::numeric<>trunc((os->>'gridColumns')::numeric) then raise exception 'Invalid OS gridColumns';end if;
 if jsonb_typeof(os->'motionEnabled')<>'boolean' then raise exception 'Invalid OS motionEnabled';end if;
 if jsonb_typeof(os->'reducedMotion')<>'boolean' then raise exception 'Invalid OS reducedMotion';end if;
 if jsonb_typeof(os->'notificationsEnabled')<>'boolean' then raise exception 'Invalid OS notificationsEnabled';end if;
 if jsonb_typeof(os->'appAnimation')<>'string' or os->>'appAnimation' not in ('zoom','fade','none') then raise exception 'Invalid OS appAnimation';end if;
 if jsonb_typeof(os->'appDuration')<>'number' or (os->>'appDuration')::numeric not between 100 and 1200 then raise exception 'Invalid OS appDuration';end if;
 if jsonb_typeof(os->'journeyDuration')<>'number' or (os->>'journeyDuration')::numeric not between 300 and 1800 then raise exception 'Invalid OS journeyDuration';end if;
 if jsonb_typeof(os->'shadeDuration')<>'number' or (os->>'shadeDuration')::numeric not between 100 and 800 then raise exception 'Invalid OS shadeDuration';end if;
 if jsonb_typeof(os->'swipeThreshold')<>'number' or (os->>'swipeThreshold')::numeric not between 20 and 160 then raise exception 'Invalid OS swipeThreshold';end if;
end $$;
-- Existing owner checks, revisions, publication snapshots and rollback remain unchanged.
