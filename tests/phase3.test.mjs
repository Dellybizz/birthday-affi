import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const compile=name=>ts.transpile(fs.readFileSync(new URL('../packages/content/src/'+name+'.ts',import.meta.url),'utf8'),{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022});
const url=js=>'data:text/javascript;base64,'+Buffer.from(js).toString('base64');
const {parsePageDocument,safeMediaUrl}=await import(url(compile('validate').replace("'./registry'",JSON.stringify(url(compile('registry'))))));
const page=()=>({schemaVersion:2,nodes:[{id:'s',type:'section',component:'section',parentId:null,props:{padding:20},visible:true,children:['t']},{id:'t',type:'block',component:'text',parentId:'s',props:{text:'Hello'},visible:true,children:[]}],rootIds:['s']});
test('valid document is copied',()=>{const p=page();assert.deepEqual(parsePageDocument(p),p);assert.notEqual(parsePageDocument(p),p)});
test('empty draft valid',()=>parsePageDocument({schemaVersion:2,nodes:[],rootIds:[]}));
for(const [name,change] of [
 ['old version',p=>p.schemaVersion=1],['duplicate ID',p=>p.nodes.push(p.nodes[1])],
 ['unknown component',p=>p.nodes[1].component='constructor'],['component mismatch',p=>p.nodes[1].component='section'],
 ['missing child',p=>p.nodes[0].children=['missing']],['parent mismatch',p=>p.nodes[1].parentId=null],
 ['cycle',p=>p.nodes[1].children=['s']],['orphan',p=>p.rootIds=[]],['duplicate root',p=>p.rootIds.push('s')],
 ['visibility',p=>p.nodes[1].visible='yes'],['URL',p=>p.nodes[1].props.src='javascript:alert(1)'],
 ['style',p=>p.nodes[1].props.padding=-1],['text',p=>p.nodes[1].props.text={}],
 ['theme',p=>p.theme={background:'url(https://evil.test)'}],['limit',p=>p.nodes=Array(501).fill(p.nodes[0])]
])test('rejects '+name,()=>{const p=page();change(p);assert.throws(()=>parsePageDocument(p),/Invalid page document/)});
test('media URL allowlist',()=>{for(const u of ['/a.jpg','https://example.test/a',''])assert.ok(safeMediaUrl(u));for(const u of ['//evil.test','/\\evil.test','data:image/svg+xml,a','http://example.test','https://user:pass@example.test'])assert.equal(safeMediaUrl(u),false)});
