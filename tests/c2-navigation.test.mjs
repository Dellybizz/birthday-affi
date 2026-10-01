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
const {parseNavigation}=load('packages/content/src/navigation.ts');
const item={id:'one',parentId:null,pageId:null,label:'Menu',icon:'♡',description:'',visible:true,startHere:false};
test('C2 navigation rejects cycles, duplicate IDs, unknown fields and excessive depth',()=>{
 assert.deepEqual(parseNavigation([item]),[item]);
 for(const input of [[item,item],[{...item,parentId:'one'}],[{...item,parentId:'missing'}],[{...item,href:'javascript:bad'}],[{...item,label:''}]])assert.throws(()=>parseNavigation(input));
 const levels=Array.from({length:5},(_,i)=>({...item,id:'n'+i,parentId:i?'n'+(i-1):null}));assert.throws(()=>parseNavigation(levels));
});
