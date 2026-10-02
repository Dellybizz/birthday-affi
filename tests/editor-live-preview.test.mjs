import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const renderer=fs.readFileSync(new URL('../packages/ui/src/cms-renderer.tsx',import.meta.url),'utf8');
const inspector=fs.readFileSync(new URL('../apps/admin/components/editor-inspector-fields.tsx',import.meta.url),'utf8');
const adminLayout=fs.readFileSync(new URL('../apps/admin/app/layout.tsx',import.meta.url),'utf8');
const editorPage=fs.readFileSync(new URL('../apps/admin/app/editor/[slug]/page.tsx',import.meta.url),'utf8');

test('editor preview uses live app renderers instead of editor substitutes',()=>{
 assert.match(renderer,/const group=groups\.find/);
 assert.doesNotMatch(renderer,/const group=!onSelect/);
 assert.match(renderer,/<KissShop document=\{valid\} persist=\{persistProgress\}/);
 assert.match(renderer,/<Saragram document=\{valid\} persist=\{persistProgress\}/);
 assert.match(renderer,/<AdoreJournal document=\{valid\} persist=\{persistProgress\}/);
 assert.match(renderer,/<PhotoLibrary document=\{valid\} persist=\{persistProgress\}/);
 assert.match(renderer,/PageLayoutProvider persist=\{persistProgress\} document=\{valid\} editing=\{false\}/);
 assert.match(renderer,/ArchiveFrame enabled=\{!!archiveRoot\} editing=\{false\}/);
 assert.match(renderer,/<Block node=\{n\} editing=\{false\}/);
});

test('admin preview loads live OS styling and draft site settings',()=>{
 assert.match(adminLayout,/\.\.\/\.\.\/web\/app\/os\.css/);
 assert.match(editorPage,/site_configurations/);
 assert.match(editorPage,/DocumentSettingsProvider value=\{settings\}/);
 assert.match(editorPage,/AudioDefaultsProvider value=\{\{volume:settings\.defaultVolume,muted:settings\.defaultMuted\}\}/);
});

test('inspector exposes Shopify-style semantic settings groups',()=>{
 for(const heading of ['Typography','Colours','Layout','Padding','Margin','Border & shadow','Image','Position','Playback','Navigation','Animation'])assert.ok(inspector.includes("'"+heading+"'"),heading);
 for(const position of ['Top left','Top','Top right','Left','Centre','Right','Bottom left','Bottom','Bottom right'])assert.ok(inspector.includes("'"+position+"'"),position);
 assert.match(inspector,/Add '\+capability\.media\?\.label\.toLowerCase\(\)/);
 assert.match(inspector,/Replace '\+capability\.media\?\.label\.toLowerCase\(\)/);
 assert.match(inspector,/All sides/);
});
