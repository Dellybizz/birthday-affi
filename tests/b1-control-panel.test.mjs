import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
const cache=new Map();
function load(file){file=path.resolve(file);if(cache.has(file))return cache.get(file).exports;const module={exports:{}};cache.set(file,module);const code=ts.transpile(fs.readFileSync(file,'utf8'),{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022});new Function('require','module','exports',code)(name=>{if(!name.startsWith('.'))throw Error('Unexpected dependency '+name);return load(path.resolve(path.dirname(file),name)+'.ts')},module,module.exports);return module.exports}
const {editorPublicationState:state}=load('apps/admin/lib/editor-publication-state.ts');
test('saved draft remains unpublished until its document matches live',()=>{
 const live={nodes:[{text:'Original'}]},draft={nodes:[{text:'Edited'}]};
 assert.equal(state({draft:live,liveDocument:live,hasPublication:true}),'published');
 assert.equal(state({draft,liveDocument:live,hasPublication:true}),'changed');
 // Saving or autosaving has no effect on the live document.
 assert.equal(state({draft:structuredClone(draft),liveDocument:live,hasPublication:true}),'changed');
 assert.equal(state({draft,liveDocument:draft,hasPublication:true}),'published');
 // Undo to the published document clears unpublished changes.
 assert.equal(state({draft:live,liveDocument:live,hasPublication:true}),'published');
});
test('new drafts, failed publication, publishing and broken pointers are distinct',()=>{
 const base={draft:{nodes:[]},liveDocument:undefined,hasPublication:false};
 assert.equal(state(base),'draft');
 assert.equal(state({...base,publishing:true}),'publishing');
 assert.equal(state({...base,publishing:true,error:true}),'error');
 assert.equal(state({...base,hasPublication:true}),'error');
 assert.equal(state({...base,hasPublication:true,liveDocument:{nodes:[{}]}}),'changed');
});
