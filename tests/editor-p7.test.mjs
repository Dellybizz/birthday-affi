import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=path=>fs.readFileSync(path,'utf8');

test('P7 keeps site bootstrap in a persistent editor layout and makes slug routes draft-only',()=>{
 const layout=read('apps/admin/app/editor/layout.tsx');
 const bootstrap=read('apps/admin/lib/editor-bootstrap.ts');
 const page=read('apps/admin/app/editor/[slug]/page.tsx');
 const workspace=read('apps/admin/app/editor/editor-workspace.tsx');
 assert.match(layout,/loadEditorBootstrap/);
 assert.match(layout,/EditorWorkspace/);
 assert.match(bootstrap,/Promise\.all/);
 assert.match(bootstrap,/site_configurations/);
 assert.match(bootstrap,/site_navigation/);
 assert.match(bootstrap,/buildEditorPageCatalog/);
 assert.match(workspace,/useLayoutEffect/);
 assert.match(workspace,/<Editor pageId=\{page\.pageId\}/);
 assert.match(page,/select\('id,slug,draft_document,draft_revision,settings,published_version_id,title'\)/);
 assert.doesNotMatch(page,/site_configurations/);
 assert.doesNotMatch(page,/site_navigation/);
 assert.doesNotMatch(page,/buildEditorPageCatalog/);
});

test('P7 resets per-page save/history state without remounting the workspace',()=>{
 const editor=read('apps/admin/app/editor/[slug]/editor-client.tsx');
 const operations=read('packages/content/src/editor-operations.ts');
 assert.match(editor,/\[saver,setSaver\]=useState/);
 assert.match(editor,/activePage=useRef\(pageId\)/);
 assert.match(editor,/useLayoutEffect\(\(\)=>\{if\(activePage\.current===pageId\)return/);
 assert.match(editor,/setSaver\(nextSaver\)/);
 assert.match(editor,/dispatch\(\{type:'reset',document:initialDocument/);
 assert.match(operations,/type: 'reset'/);
 assert.match(operations,/past:\[\],future:\[\]/);
});

test('P7 keeps the exact-live iframe mounted and streams page identity instead of changing iframe src',()=>{
 const frame=read('apps/admin/components/editor-live-frame.tsx');
 const preview=read('apps/admin/app/preview/[pageId]/preview-client.tsx');
 assert.match(frame,/initialPageId=useRef\(pageId\)\.current/);
 assert.match(frame,/encodeURIComponent\(initialPageId\)/);
 assert.match(frame,/pageSlug:string/);
 assert.match(frame,/pageSlug:pending\.pageSlug/);
 assert.match(preview,/setPageSlug\(message\.pageSlug\)/);
 assert.match(preview,/data-preview-page=\{pageSlug\}/);
});
