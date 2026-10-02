import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=path=>fs.readFileSync(path,'utf8');

test('public CMS uses shared short-lived server cache and avoids force-dynamic public routes',()=>{
 const cms=read('apps/web/lib/cms.ts');
 assert.match(cms,/unstable_cache/);
 assert.match(cms,/PUBLIC_REVALIDATE_SECONDS=10/);
 assert.match(cms,/sharedPublicDb/);
 for(const path of ['apps/web/app/layout.tsx','apps/web/app/page.tsx','apps/web/app/home/page.tsx','apps/web/app/app/[slug]/page.tsx','apps/web/app/pages/[slug]/page.tsx']){
  const source=read(path);assert.doesNotMatch(source,/force-dynamic/,path);assert.match(source,/revalidate=10/,path);
 }
});

test('public same-origin navigation uses Next router instead of document reloads',()=>{
 const journey=read('apps/web/components/archive-journey.tsx');
 assert.match(journey,/router\.push\(href\)/);
 assert.match(journey,/router\.prefetch\(href\)/);
 assert.doesNotMatch(journey,/location\.(assign|href)/);
});

test('editor page selector prefetches and switches with client routing',()=>{
 const selector=read('apps/admin/components/editor-page-selector.tsx');
 const editor=read('apps/admin/app/editor/[slug]/editor-client.tsx');
 assert.match(selector,/router\.prefetch\(page\.editorHref\)/);
 assert.match(editor,/router\.push\(href,\{scroll:false\}\)/);
 assert.doesNotMatch(editor,/window\.location\.assign/);
});

test('editor avoids full-document work on every pointer movement',()=>{
 const editor=read('apps/admin/app/editor/[slug]/editor-client.tsx');
 assert.match(editor,/serializedDoc=useMemo\(\(\)=>JSON\.stringify\(doc\),\[doc\]\)/);
 assert.match(editor,/hoveredId\.current===id/);
});

test('admin Supabase client is reused within a server request',()=>{
 const source=read('apps/admin/lib/supabase.ts');
 assert.match(source,/import \{ cache \} from 'react'/);
 assert.match(source,/adminDb=cache/);
});
