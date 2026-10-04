-- Only theme keys use prop.key; responsive node keys use style_key.
do $$ declare definition text; begin
 definition:=pg_get_functiondef('private.assert_page_document(jsonb)'::regprocedure);
 definition:=replace(definition, 'if style_key=''radius'' then', 'if prop.key=''radius'' then');
 definition:=replace(definition, 'elsif style_key not in (''primary'',''background'',''surface'',''text'',''muted'')', 'elsif prop.key not in (''primary'',''background'',''surface'',''text'',''muted'')');
 execute definition;
end $$;
