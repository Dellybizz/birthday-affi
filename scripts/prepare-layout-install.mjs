// Input is a private pre-upgrade snapshot. Do not commit input or generated SQL.
import fs from 'node:fs';
import {content} from './export-default-pages.mjs';
const [snapshotPath,outputPath]=process.argv.slice(2);
if(!snapshotPath||!outputPath)throw Error('Usage: node scripts/prepare-layout-install.mjs SNAPSHOT_JSON OUTPUT_SQL');
const pages=JSON.parse(fs.readFileSync(snapshotPath,'utf8'));
const updates=content.builtinPages.map(slug=>{const page=pages.find(p=>p.slug===slug);if(!page)throw Error('Missing built-in page '+slug);return {slug,revision:page.draft_revision,previous:page.draft_document,document:content.installDefaultLayout(slug,page.draft_document)}});
const literal=value=>"'"+JSON.stringify(value).replaceAll("'","''")+"'::jsonb";
const sql=`begin;
-- Lock the site before its pages, matching navigation/lifecycle locking order.
do $$ declare target_site_uuid uuid; item jsonb; page_row public.pages%rowtype; begin
 select id into target_site_uuid from public.sites where slug='wiffeyyyy-os' for update;
 if target_site_uuid is null then raise exception 'Target site missing';end if;
 for item in select value from jsonb_array_elements(${literal(updates)})loop
  select * into page_row from public.pages p where p.site_id=target_site_uuid and p.slug=item->>'slug' for update;
  if not found then raise exception 'Page missing: %',item->>'slug';end if;
  if page_row.draft_document->'layout'->>'version'='1' then continue;end if;
  if page_row.draft_revision<>(item->>'revision')::bigint or page_row.draft_document is distinct from item->'previous' then raise exception 'Draft changed: %. Refresh the snapshot before installing.',page_row.slug using errcode='40001';end if;
  perform private.assert_page_document(item->'document');
  insert into private.page_layout_backups(page_id,layout_version,document,revision,settings) values(page_row.id,1,page_row.draft_document,page_row.draft_revision,page_row.settings) on conflict do nothing;
  update public.pages set draft_document=item->'document' where id=page_row.id;
 end loop;
end $$;
commit;
`;
fs.writeFileSync(outputPath,sql);
console.log(JSON.stringify(updates.map(u=>({slug:u.slug,existingNodes:u.previous.nodes.length,completeNodes:u.document.nodes.length})),null,2));
