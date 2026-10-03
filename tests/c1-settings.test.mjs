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
const {defaultSiteDocument,parseSiteDocument}=load('packages/content/src/site-document.ts');
test('C1 settings reject unknown fields, unsafe colors, impossible dates and invalid audio',()=>{
 assert.deepEqual(parseSiteDocument(defaultSiteDocument),defaultSiteDocument);
 for(const patch of [{extra:'x'},{accent:'url(javascript:x)'},{birthdate:'2026-02-30'},{timezone:'invalid-zone'},{defaultVolume:2},{nickname:''}])assert.throws(()=>parseSiteDocument({...defaultSiteDocument,...patch}));
 assert.equal(parseSiteDocument({...defaultSiteDocument,birthdate:'2026-10-10'}).birthdate,'2026-10-10');
});
