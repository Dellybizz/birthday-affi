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
const {getComponentContract,appSlotContracts,globalSlotContracts}=load('packages/content/src/component-contracts.ts');
const {componentRegistry,createNode}=load('packages/content/src/registry.ts');
const {parsePageDocument}=load('packages/content/src/validate.ts');
test('C0 contracts cover every registered component and preserve valid default documents',()=>{
 for(const name of Object.keys(componentRegistry)){
  const contract=getComponentContract(name);
  assert.equal(contract.component,name);
  assert.equal(new Set(contract.fields.map(f=>f.key)).size,contract.fields.length);
  const section=createNode('section','root');
  const node=createNode(name,'child','root');section.children=['child'];
  const document={schemaVersion:2,rootIds:['root'],nodes:[section,node]};
  assert.deepEqual(parsePageDocument(document),document);
  assert.deepEqual(contract.allowedParents,name==='section'?['page','section']:['section']);
 }
 assert.equal(getComponentContract('app-grid').renderer,'CMSRenderer.Block');
});
test('C0 app contracts separate existing fields from future controls without changing registry defaults',()=>{
 assert.equal(Object.keys(appSlotContracts).length,6);
 for(const app of Object.values(appSlotContracts)){
  assert.ok(componentRegistry[app.component]);
  for(const field of app.planned)assert.ok(!app.existing.includes(field));
 }
 assert.ok(globalSlotContracts.shell.includes('phoneFrame'));
});
