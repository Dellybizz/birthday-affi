-- Allow the Photos-style library while retaining all existing document checks.
do $migration$
declare definition text; updated text;
begin
 definition := pg_get_functiondef('private.assert_page_document(jsonb)'::regprocedure);
 updated := replace(definition,
   $$not in ('startup-greeting','welcome-hero'$$,
   $$not in ('photo-library','startup-greeting','welcome-hero'$$);
 updated := replace(updated,
   $${"startup-greeting":["text"]$$,
   $${"photo-library":["image","video"],"startup-greeting":["text"]$$);
 if position($$'photo-library'$$ in updated) = 0
    or position($$"photo-library":["image","video"]$$ in updated) = 0 then
   raise exception 'Photo library migration could not locate validation rules';
 end if;
 if updated <> definition then execute updated; end if;
end $migration$;
