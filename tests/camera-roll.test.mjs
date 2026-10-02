import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import {IDBFactory} from 'fake-indexeddb';
const load=path=>{const module={exports:{}};new Function('module','exports',ts.transpile(fs.readFileSync(new URL(path,import.meta.url),'utf8'),{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}))(module,module.exports);return module.exports};
const store=load('../packages/ui/src/camera-roll-store.ts'),camera=load('../packages/ui/src/camera-session.ts');
test('Multiple captures append and remain readable after reopening the camera database',async()=>{
 globalThis.indexedDB=new IDBFactory();
 const photos=await Promise.all(Array.from({length:4},(_,i)=>store.saveCameraCapture(new Blob(['photo-'+i],{type:'image/jpeg'}),'image')));
 const video=await store.saveCameraCapture(new Blob(['video'],{type:'video/mp4'}),'video');
 const first=await store.listCameraCaptures(),second=await store.listCameraCaptures();
 assert.equal(first.length,5);assert.equal(second.length,5);assert.equal(new Set(second.map(c=>c.id)).size,5);
 for(const photo of photos)assert.equal(await second.find(c=>c.id===photo.id).blob.text(),await photo.blob.text());
 assert.equal(second.find(c=>c.id===video.id).kind,'video');assert.match(store.captureFilename(video),/\.mp4$/);
});
test('Failed saves reject without replacing previously saved captures',async()=>{
 globalThis.indexedDB=new IDBFactory();const saved=await store.saveCameraCapture(new Blob(['original'],{type:'image/jpeg'}),'image');
 await assert.rejects(store.saveCameraCapture(new Blob(['replacement']),'image',saved));
 await assert.rejects(store.saveCameraCapture(new Blob([]),'image'),/empty/);
 const items=await store.listCameraCaptures();assert.equal(items.length,1);assert.equal(await items[0].blob.text(),'original');
});
test('Unavailable browser storage reports an error instead of claiming a saved photo',async()=>{
 const previous=globalThis.indexedDB;delete globalThis.indexedDB;try{await assert.rejects(store.saveCameraCapture(new Blob(['photo']),'image'),/storage is unavailable/)}finally{globalThis.indexedDB=previous}
});
const oldStream=()=>{const track={readyState:'live',stops:0,stop(){this.stops++;this.readyState='ended'}};return {track,getTracks:()=>[track]}};
test('Switching keeps the old feed alive while requesting the exact opposite camera',async()=>{
 const previous=oldStream(),next={id:'front'};let request;
 const stream=await camera.acquireCamera({getUserMedia:async constraints=>{request=constraints;assert.equal(previous.track.stops,0);return next}},previous,true,true);
 assert.equal(stream,next);assert.equal(previous.track.stops,0);assert.deepEqual(request.video.facingMode,{exact:'user'});assert.equal(request.audio,false);
});
test('Camera-locked mobile browsers release the old sensor and retry once',async()=>{
 const previous=oldStream(),next={id:'rear'};let calls=0;
 const stream=await camera.acquireCamera({getUserMedia:async constraints=>{calls++;assert.deepEqual(constraints.video.facingMode,{exact:'environment'});if(calls===1)throw new DOMException('locked','NotReadableError');assert.equal(previous.track.stops,1);return next}},previous,false,true);
 assert.equal(stream,next);assert.equal(calls,2);
});
test('A missing opposite camera leaves the current feed alive',async()=>{
 const previous=oldStream();let calls=0;
 await assert.rejects(camera.acquireCamera({getUserMedia:async()=>{calls++;throw new DOMException('No front camera','OverconstrainedError')}},previous,true,true));
 assert.equal(calls,1);assert.equal(previous.track.stops,0);
});
test('Frame readiness resolves only after new camera data and removes listeners',async()=>{
 const video=new EventTarget();video.play=async()=>{};video.readyState=0;video.videoWidth=0;
 const stream={id:'new'},frame=camera.waitForCameraFrame(video,stream);assert.equal(video.srcObject,stream);
 video.dispatchEvent(new Event('loadeddata'));await frame;
});
