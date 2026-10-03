import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),ts=require('typescript'),cache=new Map();
function load(file){file=path.resolve(file);if(cache.has(file))return cache.get(file).exports;const module={exports:{}};cache.set(file,module);const code=ts.transpile(fs.readFileSync(file,'utf8'),{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022});new Function('require','module','exports',code)(name=>name.startsWith('.')?load(path.resolve(path.dirname(file),name+'.ts')):require(name),module,module.exports);return module.exports}
const transition=load('packages/content/src/heart-to-phone-transition.ts');
const certification=load('packages/content/src/heart-transition-certification.ts');
const read=file=>fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');
const player=read('apps/web/components/heart-phone-transition.tsx');
const css=read('apps/web/app/heart-phone-transition-t4.css');
const layout=read('apps/web/app/layout.tsx');
const index=read('packages/content/src/index.ts');

test('T4 runtime honors all three handoff strategies instead of treating them as aliases',()=>{
 assert.match(player,/data-strategy=\{config\.handoff\.strategy\}/);
 assert.match(player,/config\.handoff\.strategy==='instant'/);
 assert.match(player,/config\.handoff\.strategy==='match-cut'&&config\.handoff\.matchWallpaper/);
 assert.match(css,/data-strategy="fade"/);
 assert.match(css,/data-strategy="instant"/);
 assert.match(css,/transition:none!important/);
 assert.match(layout,/heart-phone-transition-t4\.css/);
});

test('T4 activates previously persisted replay and accessibility-label controls',()=>{
 assert.match(player,/config\.playback\.allowReplay&&mode==='cinematic'/);
 assert.match(player,/setReplayToken\(value=>value\+1\)/);
 assert.match(player,/key=\{replayToken\}/);
 assert.match(player,/aria-label=\{config\.trigger\.ariaLabel\}/);
});

test('T4 certification keeps a missing authored video safe but visible as fallback-ready',()=>{
 const result=certification.certifyHeartToPhoneTransition(transition.defaultHeartToPhoneTransition);
 assert.equal(result.ok,true);assert.equal(result.status,'fallback-ready');
 assert.ok(result.issues.some(issue=>issue.code==='desktop-video-missing'&&issue.level==='warning'));
});

test('T4 certification blocks desktop media above its configured budget',()=>{
 const config=structuredClone(transition.defaultHeartToPhoneTransition);config.media.videoSrc='/media/desktop';config.media.posterSrc='/media/poster';
 const result=certification.certifyHeartToPhoneTransition(config,{desktopVideo:{byteSize:config.performance.maxDesktopVideoBytes+1,durationMs:config.playback.durationMs,mimeType:'video/mp4'}});
 assert.equal(result.ok,false);assert.equal(result.status,'blocked');assert.ok(result.issues.some(issue=>issue.code==='desktop-video-budget'));
});

test('T4 certification blocks footage that ends before handoff or uses an unsupported video type',()=>{
 const config=structuredClone(transition.defaultHeartToPhoneTransition);config.media.videoSrc='/media/desktop';
 const result=certification.certifyHeartToPhoneTransition(config,{desktopVideo:{byteSize:1_000_000,durationMs:config.handoff.handoffAtMs-1,mimeType:'video/quicktime'}});
 assert.equal(result.status,'blocked');assert.ok(result.issues.some(issue=>issue.code==='desktop-video-short'));assert.ok(result.issues.some(issue=>issue.code==='desktop-video-type'));
});

test('T4 certification flags match-cut configurations that disable final wallpaper synchronization',()=>{
 const config=structuredClone(transition.defaultHeartToPhoneTransition);config.media.videoSrc='/media/desktop';config.handoff.matchWallpaper=false;
 const result=certification.certifyHeartToPhoneTransition(config);
 assert.equal(result.ok,true);assert.equal(result.status,'ready');assert.ok(result.issues.some(issue=>issue.code==='match-wallpaper-off'&&issue.level==='warning'));
});

test('T4 exports the certification contract for admin, CI and release tooling',()=>{
 assert.match(index,/export \* from '\.\/heart-transition-certification'/);
});
