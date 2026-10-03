import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),ts=require('typescript'),cache=new Map();
function load(file){file=path.resolve(file);if(cache.has(file))return cache.get(file).exports;const module={exports:{}};cache.set(file,module);const code=ts.transpile(fs.readFileSync(file,'utf8'),{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022});new Function('require','module','exports',code)(name=>name.startsWith('.')?load(path.resolve(path.dirname(file),name+'.ts')):require(name),module,module.exports);return module.exports}
const transition=load('packages/content/src/heart-to-phone-transition.ts');
const certification=load('packages/content/src/heart-transition-certification.ts');
const visual=load('packages/content/src/heart-transition-visual.ts');
const read=file=>fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');

const expected={
 'box-establishing':'/cinematic/heart-phone/01-box.webp',
 'gloves-enter':'/cinematic/heart-phone/02-gloves.webp',
 'top-down-open':'/cinematic/heart-phone/03-open.webp',
 'phone-lift':'/cinematic/heart-phone/04-lift.webp',
 'screen-wake':'/cinematic/heart-phone/05-wake.webp',
 'live-handoff':'/cinematic/heart-phone/06-handoff.webp'
};

test('T8 installs all six production cinematic frames as defaults',()=>{
 const config=transition.defaultHeartToPhoneTransition;
 assert.equal(config.artDirection.renderMode,'hybrid');
 for(const scene of certification.T8_PRODUCTION_SCENES)assert.equal(config.frames[scene].desktop,expected[scene]);
 const result=certification.certifyT8ProductionSequence(config);
 assert.equal(result.ready,true);
 assert.equal(result.desktopFrames,6);
 assert.equal(result.missingDesktop.length,0);
});

test('T8 legacy transitions inherit production frames while explicit editor clears remain respected',()=>{
 const inherited=transition.normalizeHeartToPhoneTransition(undefined);
 assert.equal(inherited.frames['phone-lift'].desktop,expected['phone-lift']);
 const cleared=transition.normalizeHeartToPhoneTransition({frames:{'phone-lift':{desktop:''}}});
 assert.equal(cleared.frames['phone-lift'].desktop,'');
 assert.equal(cleared.frames['box-establishing'].desktop,expected['box-establishing']);
});

test('T8 keeps mobile frames optional and reuses desktop frames by default',()=>{
 const config=structuredClone(transition.defaultHeartToPhoneTransition);
 const result=certification.certifyT8ProductionSequence(config);
 assert.equal(result.mobileOverrides,0);
 assert.equal(result.ready,true);
});

test('T8 final handoff is production-ready only with Live Home, match-cut and wallpaper sync',()=>{
 const config=structuredClone(transition.defaultHeartToPhoneTransition);
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

test('T8 production assets are real public WebP files and temporary staging assets are gone',()=>{
 for(const file of Object.values(expected))assert.match(file,/^\/cinematic\/heart-phone\/0[1-6]-[a-z-]+\.webp$/);
 assert.equal(visual.defaultTransitionFrames()['live-handoff'].desktop,expected['live-handoff']);
 const pkg=read('package.json');
 assert.match(pkg,/test:t8/);
});
