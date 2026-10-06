import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
const cache=new Map();
function load(file){file=path.resolve(file);if(cache.has(file))return cache.get(file).exports;const module={exports:{}};cache.set(file,module);const code=ts.transpile(fs.readFileSync(file,'utf8'),{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022});new Function('require','module','exports',code)(name=>name==='@wiffeyyyy/content'?{...load('packages/content/src/experience-registry.ts'),safeMediaUrl:value=>typeof value==='string'&&(value.startsWith('https://')||value.startsWith('/'))}:load(path.resolve(path.dirname(file),name)+'.ts'),module,module.exports);return module.exports}
const {parseNavigation}=load('packages/content/src/navigation.ts');
const {moveNavigationItem:move,removeNavigationItem:remove,navigationPlacement:placement,navigationVisible:visible,upgradeNavigation:upgrade,orderedNavigation:ordered}=load('packages/content/src/navigation-operations.ts');
const {catalogPage,filterPages,pageMetadata}=load('apps/admin/lib/page-catalog.ts');
const item=(id,parentId=null,extra={})=>({id,parentId,pageId:null,label:id,icon:'♡',description:'',visible:true,startHere:false,...extra});
test('B2 reorders siblings, preserves descendants and rejects cyclic or excessively deep moves',()=>{
 const items=[item('a'),item('b'),item('child','a'),item('c')];
 assert.deepEqual(move(items,'c',null,'b').filter(n=>n.parentId===null).map(n=>n.id),['a','c','b']);
 assert.equal(move(items,'a','b').find(n=>n.id==='child').parentId,'a');
 assert.throws(()=>move(items,'a','child'),/itself/);
 assert.throws(()=>move(items,'b','missing'));
 assert.throws(()=>move([item('a'),item('b','a'),item('c','b'),item('d','c'),item('e')],'a','e'));
 assert.equal(remove(items,'a').find(n=>n.id==='child').parentId,null);
 assert.equal(items[0].parentId,null);assert.deepEqual(ordered(items).map(n=>n.id),['a','child','b','c']);
});
test('B2 descendants inherit visibility and placement; runtime destinations are restricted',()=>{
 const items=[item('menu',null,{placement:'dock',visible:false}),item('child','menu',{placement:'grid'})];
 assert.equal(visible(items,items[1]),false);assert.equal(placement(items,items[1]),'dock');
 assert.deepEqual(parseNavigation([item('camera',null,{runtimeSlug:'camera',placement:'grid'})])[0].runtimeSlug,'camera');
 assert.throws(()=>parseNavigation([item('bad',null,{runtimeSlug:'external'})]));
 assert.throws(()=>parseNavigation([item('bad',null,{runtimeSlug:'camera',pageId:'00000000-0000-4000-8000-000000000001'})]));
 const upgraded=upgrade([item('hotline')]);assert.deepEqual(upgrade(upgraded),upgraded);assert.ok(upgraded.some(n=>n.runtimeSlug==='vault'));
});
test('B2 page filters and publication state include metadata and ignore JSON object key ordering',()=>{
 const row={id:'p',title:'Letter',slug:'letter',updated_at:'now',draft_revision:1,settings:{seoTitle:'For you'},published_version_id:'v',draft_document:{schemaVersion:2,nodes:[]}};
 const version={document:{nodes:[],schemaVersion:2},metadata:{seoTitle:'For you',description:'',title:'Letter'}};
 const published=catalogPage(row,version);assert.equal(published.status,'published');
 const changed=catalogPage({...row,settings:{seoTitle:'Changed'}},version);assert.equal(changed.status,'changed');
 const draft=catalogPage({...row,id:'d',published_version_id:null});const archived={...published,id:'a',settings:{archived:true}};
 const pages=[published,changed,draft,archived];assert.equal(filterPages(pages,'','active').length,3);assert.equal(filterPages(pages,'letter','draft').length,2);assert.deepEqual(filterPages(pages,'','archived'),[archived]);assert.equal(filterPages(pages,'missing','all').length,0);
 assert.deepEqual(pageMetadata('Letter',{}),{title:'Letter',description:''});
});
