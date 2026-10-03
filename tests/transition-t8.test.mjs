import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),ts=require('typescript'),cache=new Map();
function load(file){file=path.resolve(file);if(cache.has(file))return cache.get(file).exports;const module={exports:{}};cache.set(file,module);const code=ts.transpile(fs.readFileSync(file,'utf8'),{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022});new Function('require','module','exports',code)(name=>name.startsWith('.')?load(path.resolve(path.dirname(file),name+'.ts')):require(name),module,module.exports);return module.exports}
const transition=load('packages/content/src/heart-to-phone-transition.ts');
const certification=load('packages/content/src/heart-transition-certification.ts');

test('T8 requires all six desktop cinematic frames for production hybrid readiness',()=>{
 const config=structuredClone(transition.defaultHeartToPhoneTransition);
 config.artDirection.renderMode='hybrid';
 let result=certification.certifyT8ProductionSequence(config);
 assert.equal(result.ready,false);
 assert.equal(result.desktopFrames,0);
 assert.equal(result.missingDesktop.length,6);
 for(const scene of certification.T8_PRODUCTION_SCENES)config.frames[scene].desktop=`/cinematic/${scene}.webp`;
 result=certification.certifyT8ProductionSequence(config);
 assert.equal(result.ready,true);
 assert.equal(result.desktopFrames,6);
});

test('T8 keeps mobile frames optional and reuses desktop frames by default',()=>{
 const config=structuredClone(transition.defaultHeartToPhoneTransition);
 for(const scene of certification.T8_PRODUCTION_SCENES)config.frames[scene].desktop=`/cinematic/${scene}.webp`;
 const result=certification.certifyT8ProductionSequence(config);
 assert.equal(result.mobileOverrides,0);
 assert.equal(result.ready,true);
});

test('T8 final handoff is only production-ready with Live Home, match-cut and wallpaper sync',()=>{
 const config=structuredClone(transition.defaultHeartToPhoneTransition);
 for(const scene of certification.T8_PRODUCTION_SCENES)config.frames[scene].desktop=`/cinematic/${scene}.webp`;
 config.artDirection.interfaceSource='frame-only';
 config.handoff.strategy='fade';
 config.handoff.matchWallpaper=false;
 const result=certification.certifyT8ProductionSequence(config);
 assert.equal(result.ready,false);
 assert.equal(result.liveHome,false);
 assert.equal(result.matchCut,false);
 assert.equal(result.wallpaperSync,false);
 assert.ok(result.issues.length>=3);
});
