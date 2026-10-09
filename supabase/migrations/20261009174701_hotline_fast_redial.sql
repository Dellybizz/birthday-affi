-- Keep the serialized active-call guard and a minimal rapid-repeat limit.
do $migration$
declare definition text;
begin
 definition:=pg_get_functiondef('public.hotline_exchange(text,text,text,jsonb)'::regprocedure);
 if position('interval ''10 seconds''' in definition)=0 then
  if position('interval ''1 second''' in definition)>0 then return;end if;
  raise exception 'Unexpected Hotline cooldown definition';
 end if;
 execute replace(definition,'interval ''10 seconds''','interval ''1 second''');
end
$migration$;
