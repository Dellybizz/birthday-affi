import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
const cache=new Map();
function load(file){
 file=path.resolve(file);if(cache.has(file))return cache.get(file).exports;
 const module={exports:{}};cache.set(file,module);
 const code=ts.transpile(fs.readFileSync(file,'utf8'),{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022});
 new Function('require','module','exports',code)(name=>load(path.resolve(path.dirname(file),name+'.ts')),module,module.exports);
 return module.exports;
}
const {appendTemplate,exportSection,importSection,resolveResponsive,resetResponsive,searchNodes,compareDocuments}=load('packages/content/src/power-editor.ts');
const {parsePageDocument}=load('packages/content/src/validate.ts');
const empty=()=>({schemaVersion:2,nodes:[],rootIds:[]});let count=0;const id=()=> 'n'+(++count);
test('templates append without overwriting existing edits and reject unknown templates',()=>{
 const before=appendTemplate(empty(),'greeting',id),after=appendTemplate(before,'photo-story',id);
 assert.equal(before.rootIds.length,1);assert.equal(after.rootIds.length,2);
 assert.ok(after.nodes.some(n=>n.component==='image'));assert.throws(()=>appendTemplate(before,'unknown',id));
});
test('section import remaps every ID and preserves hierarchy without modifying source',()=>{
 const source=appendTemplate(empty(),'greeting',id),section=exportSection(source,source.rootIds[0]);
 const next=importSection(source,section,id);assert.equal(next.rootIds.length,2);
 assert.equal(new Set(next.nodes.map(n=>n.id)).size,next.nodes.length);parsePageDocument(next);
 assert.equal(section.nodes.length,source.nodes.length);assert.throws(()=>importSection(source,{...section,rootIds:[]},id));
});
test('responsive overrides inherit base and are isolated between devices',()=>{
 const node=appendTemplate(empty(),'greeting',id).nodes[0];node.props.padding=20;node.props['mobile:padding']=8;
 assert.equal(resolveResponsive(node,'mobile').props.padding,8);
 assert.equal(resolveResponsive(node,'tablet').props.padding,20);assert.equal(node.props.padding,20);
});
test('responsive reset removes only the chosen device overrides',()=>{
 const d=appendTemplate(empty(),'greeting',id),node=d.nodes[0];node.props['mobile:padding']=8;node.props['tablet:padding']=12;
 const next=resetResponsive(d,node.id,'mobile');assert.equal(next.nodes[0].props['mobile:padding'],undefined);
 assert.equal(next.nodes[0].props['tablet:padding'],12);assert.equal(d.nodes[0].props['mobile:padding'],8);
});
test('JS validation rejects unsafe responsive styles and content overrides',()=>{
 for(const [key,value] of [['mobile:padding',-1],['tablet:color','url(evil)'],['mobile:src','https://example.test/a'],['phone:padding',2]]){
  const d=appendTemplate(empty(),'greeting',id);d.nodes[0].props[key]=value;assert.throws(()=>parsePageDocument(d));
 }
});
test('search matches labels, types and content including hidden layers',()=>{
 const d=appendTemplate(empty(),'greeting',id);d.nodes[1].visible=false;
 assert.equal(searchNodes(d,'favourite').length,1);assert.ok(searchNodes(d,'HEADING').length);assert.deepEqual(searchNodes(d,'  '),[]);
});
test('revision comparison reports additions, removals, settings and ordering changes',()=>{
 const d=appendTemplate(empty(),'greeting',id),next=structuredClone(d);next.nodes[0].props.padding=42;
 assert.ok(compareDocuments(d,next).some(x=>x.fields.includes('settings.padding')));
 assert.deepEqual(compareDocuments(d,d),[]);assert.ok(compareDocuments(empty(),d).every(x=>x.kind==='added'||x.id==='order'));
});

test('all six app layouts expose editable content and preserve existing sections',()=>{
 for(const [slug,component] of Object.entries({reasons:'reason',hotline:'hotline-message',adventure:'image',movie:'movie-scene','kiss-shop':'kiss-gift',radio:'radio-track'})){
 const original=appendTemplate(empty(),'greeting',id),next=appendTemplate(original,slug,id);
 assert.equal(next.rootIds.length,2);assert.ok(next.nodes.filter(n=>n.component===component).length>=(slug==='adventure'?2:3));
 assert.deepEqual(next.nodes.slice(0,original.nodes.length),original.nodes);parsePageDocument(next);
 }
});
