-- No personal chapters or plain-text answer are included in migrations.
create table private.vault_stories (
 site_id uuid primary key references public.sites(id),
 story jsonb not null check (jsonb_typeof(story)='object'),
 updated_at timestamptz not null default now()
);
alter table private.vault_stories enable row level security;
revoke all on private.vault_stories from public,anon,authenticated;
-- Deliberate riddle capability: anonymous birthday visitors can read only after
-- the memory is independently checked here. No direct table grants or writes.
create function public.unlock_vault_story(p_site_slug text,p_answer text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare words text[]; word text; meaningful text[]:='{}'; result jsonb;
begin
 if p_answer is null or length(p_answer)>160 then return null; end if;
 words:=regexp_split_to_array(trim(regexp_replace(lower(p_answer),'[^a-z[:space:]]',' ','g')),'[[:space:]]+');
 if cardinality(words)>24 then return null; end if;
 foreach word in array words loop
  if word=any(array['my','your','our','me','i','you','we','us','u','ur','the','a','an','is','was','were','are','when','that','time','memory','favourite','favorite','of','about','each','other','s','both','together','it','and','for','first']) then continue; end if;
  word:=case word when 'held' then 'hold' when 'met' then 'meet' when 'went' then 'go' when 'fell' then 'fall' when 'ran' then 'run' when 'sat' then 'sit' when 'saw' then 'see' when 'came' then 'come' else regexp_replace(regexp_replace(word,'ing$',''),'s$','') end;
  if word='forearm' then word:='arm'; end if;
  meaningful:=array_append(meaningful,word);
 end loop;
 if encode(sha256(convert_to(array_to_string(meaningful,' '),'UTF8')),'hex')<>'b03a0e8f505d63a1e1fdc6a18b6b80e7a6740a1645c5520b4566834acf79ec0e' then return null; end if;
 select v.story into result from private.vault_stories v join public.sites s on s.id=v.site_id where s.slug=p_site_slug and s.public_delivery_enabled;
 return result;
end $$;
revoke all on function public.unlock_vault_story(text,text) from public;
grant execute on function public.unlock_vault_story(text,text) to anon,authenticated;
