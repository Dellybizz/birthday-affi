import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);const ts=require('typescript');const cache=new Map();
function load(file){file=path.resolve(file);if(cache.has(file))return cache.get(file).exports;const module={exports:{}};cache.set(file,module);const code=ts.transpile(fs.readFileSync(file,'utf8'),{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022});new Function('require','module','exports',code)(name=>load(path.resolve(path.dirname(file),name+'.ts')),module,module.exports);return module.exports}
const transition=load('packages/content/src/heart-to-phone-transition.ts');

test('T0 default storyboard is valid and ends with a live /home match-cut',()=>{const value=transition.defaultHeartToPhoneTransition;assert.equal(transition.validateHeartToPhoneTransition(value).ok,true);assert.equal(value.handoff.destination,'/home');assert.equal(value.handoff.strategy,'match-cut');assert.equal(value.handoff.matchWallpaper,true);assert.deepEqual(value.scenes.map(x=>x.id),['box-establishing','gloves-enter','top-down-open','phone-lift','screen-wake','live-handoff']);assert.match(value.scenes[1].description,/Black premium gloves/)});

test('T0 normalization is safe for media, text, timing and volume',()=>{const value=transition.normalizeHeartToPhoneTransition({trigger:{label:'  Open it  '},media:{videoSrc:'javascript:bad'},audio:{volume:8},handoff:{destination:'https://bad.example',durationMs:20},playback:{durationMs:50000}});assert.equal(value.trigger.label,'Open it');assert.equal(value.media.videoSrc,'');assert.equal(value.audio.volume,1);assert.equal(value.handoff.destination,'/home');assert.equal(value.handoff.durationMs,100);assert.equal(value.playback.durationMs,20000);assert.equal(value.playback.startMuted,true);assert.equal(value.accessibility.alwaysAllowSkip,true)});

test('T0 Heart action mapping remains primitive and backward-compatible',()=>{const legacy={heartPart:'next',title:'Enter Wiffeyyyy OS →',href:'/home'};const value=transition.heartActionPropsToTransition(legacy);assert.equal(value.handoff.destination,'/home');assert.equal(value.trigger.label,'Enter Wiffeyyyy OS →');assert.equal(value.media.videoSrc,'');const props=transition.transitionToHeartActionProps(value);assert.ok(Object.values(props).every(x=>['string','number','boolean'].includes(typeof x)));assert.equal(props.transitionId,'heart-to-phone');assert.equal(props.href,'/home')});

test('T0 validator rejects broken handoff and scene timing',()=>{const value=structuredClone(transition.defaultHeartToPhoneTransition);value.handoff.destination='https://outside.example';value.scenes[1].startMs=100;const result=transition.validateHeartToPhoneTransition(value);assert.equal(result.ok,false);assert.match(result.errors.join(' '),/site-relative/);assert.match(result.errors.join(' '),/chronological/)});
