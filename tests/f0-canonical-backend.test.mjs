import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=path=>fs.readFileSync(path,'utf8');
const registry=read('packages/content/src/experience-registry.ts');
const editorPages=read('apps/admin/lib/editor-pages.ts');
const publicApps=read('packages/content/src/public-apps.ts');
const osProvider=read('apps/web/components/os-provider.tsx');
const siteActions=read('apps/admin/lib/site-actions.ts');
const releaseActions=read('apps/admin/lib/release-actions.ts');
const migration=read('supabase/migrations/20261003053000_f0_canonical_releases.sql');

const active=[
 ['memories-archive','Memories Archive','/'],
 ['in-my-heart','In My Heart','/pages/in-my-heart'],
 ['home','iPhone Home','/home'],
 ['reasons','Adore','/app/reasons'],
 ['hotline','Hotdial','/app/hotline'],
 ['adventure','Pardanasheen','/app/adventure'],
 ['movie','Saragram','/app/movie'],
 ['kiss-shop','Kiss Shop','/app/kiss-shop']
];

test('F0 canonical experience registry owns active and runtime route metadata',()=>{
 for(const [slug,title,livePath] of active){
  assert.ok(registry.includes(`slug:'${slug}'`),slug);
  assert.ok(registry.includes(`title:'${title}'`),title);
  assert.ok(registry.includes(`livePath:'${livePath}'`),livePath);
 }
 for(const slug of ['camera','vault','pieces'])assert.ok(registry.includes(`slug:'${slug}'`),slug);
 assert.match(editorPages,/activeDocumentExperiences/);
 assert.match(editorPages,/runtimeExperiences/);
 assert.match(editorPages,/legacyExperiences/);
 assert.doesNotMatch(editorPages,/const activePages:Record<string,ActiveMeta>=\{/);
 assert.match(publicApps,/experienceRegistry\.flatMap/);
 assert.match(osProvider,/getExperienceByLivePath\(pathname\)/);
 assert.match(osProvider,/getExperience\(String\(n\.props\.pageSlug/);
 assert.doesNotMatch(osProvider,/pathname==='\/home'\|\|pathname==='\/app\/hotline'/);
});

test('F0 removes duplicate legacy content write paths',()=>{
 assert.doesNotMatch(siteActions,/saveSiteSettings/);
 assert.doesNotMatch(siteActions,/saveAppItem/);
 assert.doesNotMatch(siteActions,/\.from\('site_settings'\)/);
 assert.doesNotMatch(siteActions,/\.from\('app_content_items'\)/);
 assert.match(siteActions,/Canonical page writes live here/);
});

test('F0 release manifest is additive and snapshots current published pointers only',()=>{
 assert.match(migration,/create table public\.site_releases/);
 assert.match(migration,/create table public\.site_release_pages/);
 assert.match(migration,/configuration_version_id uuid references public\.site_configuration_versions/);
 assert.match(migration,/navigation_version_id uuid references public\.navigation_versions/);
 assert.match(migration,/page_version_id uuid not null references public\.page_versions/);
 assert.match(migration,/create function private\.capture_site_release/);
 assert.match(migration,/p\.published_version_id/);
 assert.match(migration,/coalesce\(p\.settings->>'archived','false'\)<>'true'/);
 assert.doesNotMatch(migration,/update\s+public\.(pages|site_configurations|site_navigation)/i);
 assert.doesNotMatch(migration,/delete\s+from\s+public\.(pages|site_configurations|site_navigation)/i);
 assert.doesNotMatch(migration,/insert\s+into\s+public\.(page_versions|site_configuration_versions|navigation_versions)/i);
});

test('F0 release server action exposes snapshot history without publishing',()=>{
 assert.match(releaseActions,/captureCurrentRelease/);
 assert.match(releaseActions,/rpc\('capture_site_release'/);
 assert.match(releaseActions,/listSiteReleases/);
 assert.doesNotMatch(releaseActions,/publish_page|change_site_configuration|change_navigation/);
});
