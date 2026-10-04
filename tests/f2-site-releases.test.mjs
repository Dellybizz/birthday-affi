import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const sql=fs.readFileSync(new URL('../supabase/migrations/20261003065000_f2_atomic_site_publishing.sql',import.meta.url),'utf8');
const actions=fs.readFileSync(new URL('../apps/admin/lib/release-actions.ts',import.meta.url),'utf8');
const releasePage=fs.readFileSync(new URL('../apps/admin/app/releases/page.tsx',import.meta.url),'utf8');
const manager=fs.readFileSync(new URL('../apps/admin/components/release-manager.tsx',import.meta.url),'utf8');
const revalidate=fs.readFileSync(new URL('../apps/web/app/api/revalidate/route.ts',import.meta.url),'utf8');

test('whole-site publish validates and publishes inside one database function',()=>{
 assert.match(sql,/private\.publish_site_release/);
 assert.match(sql,/private\.assert_site_document\(cfg\.draft\)/);
 assert.match(sql,/private\.assert_navigation\(nav\.draft,p_site,true\)/);
 assert.match(sql,/private\.assert_page_document\(page_row\.draft_document\)/);
 assert.match(sql,/for update/);
 assert.match(sql,/private\.capture_site_release\(p_site,p_note\)/);
 assert.match(actions,/db\.rpc\('publish_site_release'/);
 assert.doesNotMatch(actions,/publishPage\s*\(/,'server action must not emulate atomicity with per-page publish calls');
});

test('rollback restores published pointers and records a new release without replacing draft documents',()=>{
 assert.match(sql,/private\.rollback_site_release/);
 assert.match(sql,/update public\.site_configurations set published_id=source_release\.configuration_version_id/);
 assert.match(sql,/update public\.site_navigation set published_id=source_release\.navigation_version_id/);
 assert.match(sql,/update public\.pages set published_version_id=null where site_id=p_site/);
 assert.match(sql,/set published_version_id=source_page\.page_version_id/);
 assert.match(sql,/new_release_id:=private\.capture_site_release/);
 const rollbackSection=sql.slice(sql.indexOf('private.rollback_site_release'));
 assert.doesNotMatch(rollbackSection,/set\s+draft_document\s*=/i);
});

test('release actions invalidate public CMS after committed publish or rollback',()=>{
 assert.match(actions,/publish_site_release/);
 assert.match(actions,/rollback_site_release/);
 assert.match(actions,/\/api\/revalidate/);
 assert.match(actions,/CMS_REVALIDATE_SECRET/);
 assert.match(actions,/up to 10 seconds/);
 assert.match(revalidate,/revalidateTag\('public-cms'\)/);
 assert.match(revalidate,/status:401/);
 assert.match(revalidate,/Cache-Control':'no-store/);
});

test('release workspace previews pending state and requires explicit rollback confirmation',()=>{
 assert.match(releasePage,/documentsEqual/);
 assert.match(releasePage,/published_version_id/);
 assert.match(releasePage,/site_release_pages/);
 assert.match(manager,/Publish all changes/);
 assert.match(manager,/window\.confirm/);
 assert.match(manager,/draft page documents will be preserved/i);
 assert.match(manager,/Release history/);
});
