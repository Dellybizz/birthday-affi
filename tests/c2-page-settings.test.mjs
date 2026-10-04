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
const {parsePageSettings,protectedPageSlugs}=load('packages/content/src/page-settings.ts');
test('C2 page settings normalize text and reject unsafe routes and oversized metadata',()=>{
 assert.deepEqual(parsePageSettings({title:' Letter ',slug:'letter',description:' A note '}),{title:'Letter',slug:'letter',description:'A note'});
 for(const slug of ['../home','/home','HOME','a/b','javascript:alert(1)',''])assert.throws(()=>parsePageSettings({title:'Page',slug,description:''}));
 assert.throws(()=>parsePageSettings({title:'',slug:'page',description:''}));
 assert.throws(()=>parsePageSettings({title:'Page',slug:'page',description:'x'.repeat(301)}));
 assert.ok(protectedPageSlugs.includes('home'));assert.ok(protectedPageSlugs.includes('radio'));
});
