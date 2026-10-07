import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {loadContentModule} from './load-content-module.mjs';
const policy=loadContentModule('apps/admin/lib/media-policy.ts');
function load(path,require){const mod={exports:{}};new Function('require','module','exports',ts.transpile(readFileSync(path,'utf8'),{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}))(require,mod,mod.exports);return mod.exports}
const {verifyMediaObject}=load('apps/admin/lib/media-verification.ts',()=>policy);
const id='00000000-0000-4000-8000-000000000020';
test('Header verification stops after the signature even if cancellation never finishes',async()=>{
 const original=global.fetch;let cancelled=false;global.fetch=async()=>({ok:true,headers:new Headers({'content-length':'100'}),body:{getReader:()=>({read:async()=>({done:false,value:new Uint8Array([137,80,78,71,13,10,26,10,...new Array(1000).fill(0)])}),cancel:()=>{cancelled=true;return new Promise(()=>{})}})}});
 try{await verifyMediaObject('https://example.test',{}, {mime:'image/png',size:100},50);assert.equal(cancelled,true)}finally{global.fetch=original}
});
test('Stalled verification times out and rejects malformed uploaded content',async()=>{
 const original=global.fetch;try{
 global.fetch=()=>new Promise(()=>{});await assert.rejects(()=>verifyMediaObject('https://example.test',{}, {mime:'image/png',size:100},10),/timed out/);
 global.fetch=async()=>new Response('not a PNG',{headers:{'content-length':'9'}});await assert.rejects(()=>verifyMediaObject('https://example.test',{}, {mime:'image/png',size:9}),/does not match/);
 }finally{global.fetch=original}
});
test('Finalization accepts omitted optional metadata, remains idempotent, and keeps failures pending',async()=>{
 let verified=0,updates=0,failure=false,status='pending';
 const query={select(){return this},eq(){return this},single:async()=>({data:{id,site_id:id,status,kind:'image',storage_path:'site/id/original',mime_type:'image/png',byte_size:100},error:null}),update(){updates++;return this},then(resolve){resolve({error:null})}};
 const db={from:()=>query,auth:{getSession:async()=>({data:{session:{access_token:'test'}}})}};
 const {finalizeMedia}=load('apps/admin/lib/media-actions.ts',name=>name==='./supabase'?{adminDb:async()=>db}:name==='./auth'?{requireAdmin:async()=>{}}:name==='./media-verification'?{verifyMediaObject:async()=>{verified++;if(failure)throw new Error('Verification timed out')}}:policy);
 assert.deepEqual(await finalizeMedia(id,{width:400,height:300,durationMs:undefined,variants:[]}),{ok:true});assert.equal(updates,1);
 failure=true;assert.equal((await finalizeMedia(id,{width:400,height:300})).ok,false);assert.equal(updates,1);
 status='ready';assert.deepEqual(await finalizeMedia(id,{width:400,height:300}),{ok:true});assert.equal(updates,1);assert.equal(verified,2);
});
