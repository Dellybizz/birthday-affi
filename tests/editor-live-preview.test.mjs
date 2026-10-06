import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const renderer=fs.readFileSync(new URL('../packages/ui/src/cms-renderer.tsx',import.meta.url),'utf8');
const inspector=fs.readFileSync(new URL('../apps/admin/components/editor-inspector-fields.tsx',import.meta.url),'utf8');
const fields=fs.readFileSync(new URL('../packages/content/src/inspector-fields.ts',import.meta.url),'utf8');
const adminLayout=fs.readFileSync(new URL('../apps/admin/app/layout.tsx',import.meta.url),'utf8');
const editorLayout=fs.readFileSync(new URL('../apps/admin/app/editor/layout.tsx',import.meta.url),'utf8');
const editorBootstrap=fs.readFileSync(new URL('../apps/admin/lib/editor-bootstrap.ts',import.meta.url),'utf8');
const editorPage=fs.readFileSync(new URL('../apps/admin/app/editor/[slug]/page.tsx',import.meta.url),'utf8');
const editor=fs.readFileSync(new URL('../apps/admin/app/editor/[slug]/editor-client.tsx',import.meta.url),'utf8');
const frame=fs.readFileSync(new URL('../apps/admin/components/editor-live-frame.tsx',import.meta.url),'utf8');
const previewPage=fs.readFileSync(new URL('../apps/admin/app/preview/[pageId]/page.tsx',import.meta.url),'utf8');
const preview=fs.readFileSync(new URL('../apps/admin/app/preview/[pageId]/preview-client.tsx',import.meta.url),'utf8');
const publicShell=fs.readFileSync(new URL('../packages/ui/src/public-page-shell.tsx',import.meta.url),'utf8');
const osProvider=fs.readFileSync(new URL('../apps/web/components/os-provider.tsx',import.meta.url),'utf8');

test('real editor opts into exact live renderers while legacy selection contracts remain isolated',()=>{
 assert.match(renderer,/LiveEditorPreviewContext/);
 assert.match(renderer,/exactLivePreview/);
 assert.match(editorLayout,/LiveEditorPreviewProvider/);
 assert.doesNotMatch(renderer,/const group=!onSelect/);
 assert.match(renderer,/<KissShop document=\{valid\} persist=\{persistProgress\}/);
 assert.match(renderer,/<Saragram document=\{valid\} persist=\{persistProgress\}/);
 assert.match(renderer,/<AdoreJournal document=\{valid\} persist=\{persistProgress\}/);
 assert.match(renderer,/<PhotoLibrary document=\{valid\} persist=\{persistProgress\}/);
 assert.match(renderer,/PageLayoutProvider persist=\{persistProgress\} document=\{valid\} editing=\{false\}/);
 assert.match(renderer,/ArchiveFrame enabled=\{!!archiveRoot\}/);
 assert.match(renderer,/<Block node=\{n\} editing=\{legacyEditing\}/);
});

test('admin preview loads live OS styling and persistent draft site settings',()=>{
 assert.match(adminLayout,/\.\.\/\.\.\/web\/app\/os\.css/);
 assert.match(editorBootstrap,/site_configurations/);
 assert.match(editorBootstrap,/site_navigation/);
 assert.match(editorLayout,/DocumentSettingsProvider value=\{settings\}/);
 assert.match(editorLayout,/AudioDefaultsProvider value=\{\{volume:settings\.defaultVolume,muted:settings\.defaultMuted\}\}/);
 assert.doesNotMatch(editorPage,/site_configurations/);
 assert.doesNotMatch(editorPage,/site_navigation/);
});

test('P1 isolates the live preview in an iframe and streams unsaved drafts through postMessage',()=>{
 assert.match(editor,/EditorLiveFrame/);
 assert.doesNotMatch(editor,/<CMSRenderer document=\{doc\}/);
 assert.match(frame,/VIEWPORTS/);
 const viewport=fs.readFileSync('apps/admin/lib/editor-viewport.ts','utf8');assert.match(viewport,/1440/);assert.match(viewport,/390/);assert.match(viewport,/768/);
 assert.match(frame,/postMessage\(\{source:'wiffey-editor'/);
 assert.match(frame,/type:'state'/);
 assert.match(preview,/source!=='wiffey-editor'/);
 assert.doesNotMatch(preview,/parsePageDocument\(message\.document\)/);
 assert.match(preview,/message\.type==='update'/);
 assert.match(preview,/message\.type==='state'/);
 assert.match(preview,/data-isolated-live-preview/);
});

test('P2 Archive and Heart preview reuse the same public non-phone shell without a nested synthetic shell',()=>{
 assert.match(osProvider,/PublicPageShell/);
 assert.match(preview,/PublicPageShell/);
 assert.match(preview,/ArchiveNavigationProvider/);
 assert.match(preview,/pageSlug==='memories-archive'\|\|pageSlug==='in-my-heart'/);
 assert.match(preview,/externalShell=\{shellPage\|\|phonePage\}/);
 assert.match(renderer,/externalShell=false/);
 assert.match(renderer,/if\(!exactLivePreview\|\|externalShell\)return content/);
 assert.match(previewPage,/published_version_id,draft_document/);
 assert.match(previewPage,/initialArchiveSettings/);
 for(const className of ['os-topbar','os-brand','os-status','os-footer'])assert.match(publicShell,new RegExp(className));
});

test('inspector exposes Shopify-style semantic settings groups and full image controls',()=>{
 for(const heading of ['Typography','Colours','Layout','Padding','Margin','Border & shadow','Image','Position','Playback','Navigation','Animation'])assert.ok(inspector.includes("'"+heading+"'"),heading);
 for(const position of ['Top left','Top','Top right','Left','Centre','Right','Bottom left','Bottom','Bottom right'])assert.ok(inspector.includes("['"+position+"'"),position);
 assert.match(inspector,/current\?'Replace':'Add'/);
 assert.match(inspector,/>Remove<\/button>/);
 assert.match(inspector,/All sides/);
 assert.match(inspector,/function SpacingEditor/);
 assert.match(inspector,/function SettingsCard/);
 assert.match(fields,/options:\['cover','contain','fill','scale-down'\]/);
});
