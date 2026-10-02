import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
const cache=new Map();
function load(file){file=path.resolve(file);if(cache.has(file))return cache.get(file).exports;const module={exports:{}};cache.set(file,module);const code=ts.transpile(fs.readFileSync(file,'utf8'),{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022});new Function('require','module','exports',code)(name=>{if(name.endsWith('/editor-pages'))return {};if(!name.startsWith('.'))throw new Error('Unexpected dependency '+name);return load(path.resolve(path.dirname(file),name)+'.ts')},module,module.exports);return module.exports}
const {resolvePreviewNavigation}=load('apps/admin/lib/editor-preview-navigation.ts');
const page=(slug,livePath,extra={})=>({id:slug,slug,title:slug,editorHref:'/editor/'+slug,draftPreviewHref:'/preview/'+slug,livePath,group:'active',status:'published',badge:'Published',note:'',editorEnabled:true,published:true,...extra});
const pages=[page('memories-archive','/'),page('in-my-heart','/pages/in-my-heart'),page('home','/home'),page('movie','/app/movie'),page('camera','/app/camera',{id:null,editorHref:null,group:'runtime',status:'runtime',badge:'Runtime · editor in E5',note:'Runtime only',editorEnabled:false,published:false})];

test('E3 routes internal preview navigation back into the admin editor',()=>{
 const result=resolvePreviewNavigation('/app/movie?from=home#post',pages,'home');
 assert.equal(result.kind,'editor-page');assert.equal(result.href,'/editor/movie');assert.equal(result.page.slug,'movie');
 assert.equal(resolvePreviewNavigation('/pages/in-my-heart',pages,'home').kind,'editor-page');
 assert.equal(resolvePreviewNavigation('/',pages,'home').page.slug,'memories-archive');
});

test('E3 keeps same-page anchors and current destinations inside the preview',()=>{
 assert.equal(resolvePreviewNavigation('#memory-2',pages,'home').kind,'same-page');
 assert.equal(resolvePreviewNavigation('/home',pages,'home').kind,'same-page');
});

test('E3 blocks runtime destinations that have no authoring adapter',()=>{
 const result=resolvePreviewNavigation('/app/camera',pages,'home');
 assert.equal(result.kind,'blocked');assert.match(result.message,/runtime-only/i);
});

test('E3 treats external navigation separately so the admin shell can remain mounted',()=>{
 assert.equal(resolvePreviewNavigation('https://example.com/surprise',pages,'home').kind,'external');
 assert.equal(resolvePreviewNavigation('mailto:hello@example.com',pages,'home').kind,'external');
});

test('E3 source follows the Shopify editor shell rather than four competing inspector tabs',()=>{
 const source=fs.readFileSync('apps/admin/app/editor/[slug]/editor-client.tsx','utf8');
 for(const text of ['Theme settings','Sections','Preview inspector on','Select a section or block','onClickCapture={interceptPreview}','wiffey:journey','data-editor-inspect'])assert.ok(source.includes(text),text);
 assert.equal(source.includes("['content','appearance','behavior','page']"),false);
 assert.match(source,/grid-cols-1 lg:grid-cols-\[280px_minmax\(0,1fr\)_320px\]/);
});

test('E3 inspect mode quiets media and reveals the selected preview element',()=>{
 const source=fs.readFileSync('apps/admin/app/editor/[slug]/editor-client.tsx','utf8');
 assert.match(source,/querySelectorAll(?:<HTMLMediaElement>)?\('audio,video'\).*pause/);
 assert.match(source,/scrollIntoView\(\{behavior:'smooth',block:'center'\}\)/);
 assert.match(source,/animation-play-state:paused/);
});
