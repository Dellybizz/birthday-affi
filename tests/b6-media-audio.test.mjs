import test from 'node:test';
import assert from 'node:assert/strict';
import {loadContentModule} from './load-content-module.mjs';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const {parseAudioSettings,defaultAudioSettings}=loadContentModule('packages/content/src/audio-settings.ts');
const {parseSiteDocument,defaultSiteDocument}=loadContentModule('packages/content/src/site-document.ts');
const id='00000000-0000-4000-8000-000000000020';const track={assetId:id,title:'Birthday song',transcript:'Words for you'};
test('B6 soundtrack validates exact shape, ordered unique tracks and default membership',()=>{
 const value={...defaultAudioSettings,tracks:[track],defaultTrack:id};assert.deepEqual(parseAudioSettings(value),value);assert.deepEqual(parseSiteDocument({...defaultSiteDocument,audio:value}).audio,value);
 for(const patch of [{unknown:1},{tracks:[track,track]},{defaultTrack:null},{defaultTrack:'other'},{background:null},{interruption:'mix'},{loop:'true'},{tracks:[{...track,title:''}]},{tracks:[{...track,transcript:'x'.repeat(20001)}]}])assert.throws(()=>parseAudioSettings({...value,...patch}));
 const copy=parseAudioSettings(value);copy.tracks[0].title='Changed';assert.equal(value.tracks[0].title,'Birthday song');assert.deepEqual(parseSiteDocument(defaultSiteDocument),defaultSiteDocument);
});
test('B6 upload retry preserves reservation and never overwrites completed objects',async()=>{
 let reservations=0,finalizations=0,fail=true,puts=[];const events=[];const actions={reserveMedia:async()=>{reservations++;return{id,path:'site/id/original',bucket:'wiffeyyyy-audio'}},finalizeMedia:async()=>{finalizations++}};
 const source=readFileSync('apps/admin/lib/media-upload.ts','utf8');const mod={exports:{}};
 const require=name=>name==='@supabase/ssr'?{createBrowserClient:()=>({auth:{getSession:async()=>({data:{session:{access_token:'test'}}})}})}:name==='./media-actions'?actions:name==='./media-policy'?loadContentModule('apps/admin/lib/media-policy.ts'):null;
 const previous={URL:global.URL,document:global.document,HTMLVideoElement:global.HTMLVideoElement,XMLHttpRequest:global.XMLHttpRequest};
 global.URL={createObjectURL:()=>'',revokeObjectURL:()=>{}};global.HTMLVideoElement=class{};global.document={createElement:()=>{const element={duration:10};Object.defineProperty(element,'src',{set:()=>queueMicrotask(()=>element.onloadedmetadata?.())});return element}};
 global.XMLHttpRequest=class{upload={};responseText='';open(method,url){puts.push(url)}setRequestHeader(key,value){if(key==='x-upsert')assert.equal(value,'false')}send(){queueMicrotask(()=>{this.upload.onprogress({lengthComputable:true,loaded:50,total:100});if(fail){fail=false;this.onerror()}else{this.status=200;this.onload()}})}};
 try{new Function('require','module','exports',ts.transpile(source,{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}))(require,mod,mod.exports);const attempt={completed:new Set()},file={type:'audio/mpeg',size:100,name:'birthday.mp3'};await assert.rejects(()=>mod.exports.uploadMedia('site',file,(message,percent)=>events.push(percent),attempt),/Network/);await mod.exports.uploadMedia('site',file,(message,percent)=>events.push(percent),attempt);await mod.exports.uploadMedia('site',file,()=>{},attempt);assert.equal(reservations,1);assert.equal(puts.length,2);assert.equal(finalizations,2);assert.ok(events.includes(47));assert.ok(events.includes(100));}finally{Object.assign(global,previous)}
});

test('B6 picker copies accessible text and captions with the immutable asset reference',()=>{
 const {mediaSelectionPatch}=loadContentModule('packages/content/src/inspector-capabilities.ts');const picked=mediaSelectionPatch({key:'src',kind:'audio',label:'Recording'},{id,alt_text:'A message',captions:'0 | 2 | Hello',transcript:'Hello'});assert.equal(picked.src,'/media/'+id);assert.equal(picked.captions,'0 | 2 | Hello');assert.equal(picked.transcript,'Hello');assert.equal(picked.mediaAssetId,id);
});
