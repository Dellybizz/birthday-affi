import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
const cache=new Map();
function load(file){file=path.resolve(file);if(cache.has(file))return cache.get(file).exports;const module={exports:{}};cache.set(file,module);const code=ts.transpile(fs.readFileSync(file,'utf8'),{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022});new Function('require','module','exports',code)(name=>name==='@wiffeyyyy/content'?load(path.resolve('packages/content/src/experience-registry.ts')):load(path.resolve(path.dirname(file),name+'.ts')),module,module.exports);return module.exports}
const pages=load('apps/admin/lib/editor-pages.ts');
const navigation=load('apps/admin/lib/editor-navigation.ts');

test('E1 page catalog groups active, custom, legacy and runtime pages truthfully',()=>{
 const catalog=pages.buildEditorPageCatalog([
  {id:'a',title:'Old home title',slug:'home',settings:{},published_version_id:null},
  {id:'b',title:'Heart',slug:'in-my-heart',settings:{},published_version_id:'v1'},
  {id:'c',title:'Secret draft',slug:'secret-draft',settings:{},published_version_id:null},
  {id:'d',title:'Radio',slug:'radio',settings:{},published_version_id:null},
  {id:'e',title:'Archived',slug:'old-page',settings:{archived:true},published_version_id:null}
 ]);
 const home=catalog.find(page=>page.slug==='home');assert.equal(home.title,'iPhone Home');assert.equal(home.status,'fallback');assert.equal(home.livePath,'/home');assert.equal(home.editorEnabled,true);assert.equal(home.sourceTitle,'Old home title');
 const heart=catalog.find(page=>page.slug==='in-my-heart');assert.equal(heart.status,'published');assert.equal(heart.livePath,'/pages/in-my-heart');
 const custom=catalog.find(page=>page.slug==='secret-draft');assert.equal(custom.group,'drafts');assert.equal(custom.livePath,null);assert.equal(custom.badge,'Draft only');
 const radio=catalog.find(page=>page.slug==='radio');assert.equal(radio.group,'legacy');assert.equal(radio.livePath,null);
 const archived=catalog.find(page=>page.slug==='old-page');assert.equal(archived.status,'archived');assert.equal(archived.editorEnabled,false);
 for(const slug of ['camera','vault','pieces']){const runtime=catalog.find(page=>page.slug===slug);assert.equal(runtime.group,'active');assert.equal(runtime.editorEnabled,false);assert.match(runtime.badge,/missing/)}
 assert.equal(catalog.find(page=>page.slug==='memories-archive').status,'missing');
});

test('E1 public links require an explicit site origin',()=>{
 assert.equal(pages.normalizePublicSiteUrl(' https://gift.example/ '),'https://gift.example');
 assert.equal(pages.buildPublicHref('https://gift.example/','/home'),'https://gift.example/home');
 assert.equal(pages.buildPublicHref('','/home'),null);
});

test('E1 switch saves before navigation and stays put when save fails',async()=>{
 const calls=[];let navigated='';
 let result=await navigation.saveBeforeEditorSwitch({targetHref:'/editor/reasons',canWrite:true,saveStatus:'idle',flush:async()=>{calls.push('save')},navigate:href=>{calls.push('navigate');navigated=href}});
 assert.deepEqual(calls,['save','navigate']);assert.equal(navigated,'/editor/reasons');assert.equal(result.ok,true);
 navigated='';result=await navigation.saveBeforeEditorSwitch({targetHref:'/editor/movie',canWrite:true,saveStatus:'error',flush:async()=>{throw new Error('network unavailable')},navigate:href=>{navigated=href}});
 assert.equal(result.ok,false);assert.equal(result.reason,'save-failed');assert.equal(navigated,'');assert.match(result.message,/could not be saved/);
});

test('E1 conflict blocks page switching without attempting a write',async()=>{
 let flushed=false,navigated=false;const result=await navigation.saveBeforeEditorSwitch({targetHref:'/editor/home',canWrite:true,saveStatus:'conflict',flush:async()=>{flushed=true},navigate:()=>{navigated=true}});
 assert.equal(result.ok,false);assert.equal(result.reason,'conflict');assert.equal(flushed,false);assert.equal(navigated,false);
});
