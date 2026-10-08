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
 let reservations=0,finalizations=0,fail=true,puts=[];const events=[];const actions={reserveMedia:async()=>{reservations++;return{ok:true,id,path:'site/id/original',bucket:'wiffeyyyy-audio'}},finalizeMedia:async()=>{finalizations++;return{ok:true}}};
 const source=readFileSync('apps/admin/lib/media-upload.ts','utf8');const mod={exports:{}};
 const require=name=>name==='@supabase/ssr'?{createBrowserClient:()=>({auth:{getSession:async()=>({data:{session:{access_token:'test'}}})}})}:name==='./media-actions'?actions:name==='./media-deadline'?loadContentModule('apps/admin/lib/media-deadline.ts'):name==='./media-organization'?loadContentModule('apps/admin/lib/media-organization.ts'):name==='./media-policy'?loadContentModule('apps/admin/lib/media-policy.ts'):null;
 const previous={URL:global.URL,document:global.document,HTMLVideoElement:global.HTMLVideoElement,XMLHttpRequest:global.XMLHttpRequest};
 global.URL={createObjectURL:()=>'',revokeObjectURL:()=>{}};global.HTMLVideoElement=class{};global.document={createElement:()=>{const element={duration:10};Object.defineProperty(element,'src',{set:()=>queueMicrotask(()=>element.onloadedmetadata?.())});return element}};
 global.XMLHttpRequest=class{upload={};responseText='';open(method,url){puts.push(url)}setRequestHeader(key,value){if(key==='x-upsert')assert.equal(value,'false')}send(){queueMicrotask(()=>{this.upload.onprogress({lengthComputable:true,loaded:50,total:100});if(fail){fail=false;this.onerror()}else{this.status=200;this.onload()}})}};
 try{new Function('require','module','exports',ts.transpile(source,{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}))(require,mod,mod.exports);const attempt={completed:new Set()},file={type:'audio/mpeg',size:100,name:'birthday.mp3'};await assert.rejects(()=>mod.exports.uploadMedia('site',file,(message,percent)=>events.push(percent),attempt),/Network/);await mod.exports.uploadMedia('site',file,(message,percent)=>events.push(percent),attempt);await mod.exports.uploadMedia('site',file,()=>{},attempt);assert.equal(reservations,1);assert.equal(puts.length,2);assert.equal(finalizations,2);assert.ok(events.includes(47));assert.ok(events.includes(100));}finally{Object.assign(global,previous)}
});

test('B6 picker copies accessible text and captions with the immutable asset reference',()=>{
 const {mediaSelectionPatch}=loadContentModule('packages/content/src/inspector-capabilities.ts');const picked=mediaSelectionPatch({key:'src',kind:'audio',label:'Recording'},{id,alt_text:'A message',captions:'0 | 2 | Hello',transcript:'Hello'});assert.equal(picked.src,'/media/'+id);assert.equal(picked.captions,'0 | 2 | Hello');assert.equal(picked.transcript,'Hello');assert.equal(picked.mediaAssetId,id);
});

test('B6 missing Storage returns a safe action result without reserving an upload',async()=>{
 let storageError={message:'TenantNotFound: private provider diagnostics'},inserts=0;const permissions=[];
 const query={select(){return this},eq(){return this},single:async()=>({data:{id},error:null}),insert:async()=>{inserts++;return{error:null}}};
 const db={from:()=>query,storage:{from:()=>({list:async()=>({error:storageError})})}};
 const mod={exports:{}};new Function('require','module','exports',ts.transpile(readFileSync('apps/admin/lib/media-actions.ts','utf8'),{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}))(name=>name==='./supabase'?{adminDb:async()=>db}:name==='./auth'?{requireAdmin:async permission=>{permissions.push(permission)}}:name==='./media-deadline'?loadContentModule('apps/admin/lib/media-deadline.ts'):name==='./media-organization'?loadContentModule('apps/admin/lib/media-organization.ts'):name==='./media-policy'?loadContentModule('apps/admin/lib/media-policy.ts'):null,mod,mod.exports);
 const input={siteId:id,kind:'audio',filename:'song.mp3',mimeType:'audio/mpeg',size:100};const result=await mod.exports.reserveMedia(input);assert.equal(result.ok,false);assert.match(result.error,/Storage must be activated/);assert.doesNotMatch(result.error,/TenantNotFound|private provider/);assert.equal(inserts,0);assert.equal(permissions[0],'media:write');
 assert.equal((await mod.exports.checkMediaStorage(id)).available,false);storageError=null;assert.equal((await mod.exports.checkMediaStorage(id)).available,true);assert.equal((await mod.exports.reserveMedia(input)).ok,true);assert.equal(inserts,1);
});

test('Media sorting applies before pagination and rejects unknown sort fields',async()=>{
 const calls=[];
 const query={select(){return this},eq(){return this},single:async()=>({data:{id},error:null}),order(field,options){calls.push(['order',field,options.ascending]);return this},range(start,end){calls.push(['range',start,end]);return this},is(){return this},then(resolve){resolve({data:[],error:null})}};
 const mod={exports:{}};new Function('require','module','exports',ts.transpile(readFileSync('apps/admin/lib/media-actions.ts','utf8'),{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}))(name=>name==='./supabase'?{adminDb:async()=>({from:()=>query})}:name==='./auth'?{requireAdmin:async()=>{}}:name==='./media-deadline'?loadContentModule('apps/admin/lib/media-deadline.ts'):name==='./media-organization'?loadContentModule('apps/admin/lib/media-organization.ts'):name==='./media-policy'?loadContentModule('apps/admin/lib/media-policy.ts'):null,mod,mod.exports);
 for(const [sort,column,ascending] of [['newest','created_at',false],['oldest','created_at',true],['name','filename',true],['largest','byte_size',false],['smallest','byte_size',true]]){
 calls.length=0;await mod.exports.listMediaAssets(id,false,false,{sort,offset:50});assert.deepEqual(calls,[['order',column,ascending],['order','id',false],['range',50,99]]);
 }
 await assert.rejects(()=>mod.exports.listMediaAssets(id,false,false,{sort:'storage_path'}),/Invalid media sort/);
});
