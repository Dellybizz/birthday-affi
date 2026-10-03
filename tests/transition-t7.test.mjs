import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),ts=require('typescript'),cache=new Map();
function load(file){file=path.resolve(file);if(cache.has(file))return cache.get(file).exports;const module={exports:{}};cache.set(file,module);const code=ts.transpile(fs.readFileSync(file,'utf8'),{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022});new Function('require','module','exports',code)(name=>name.startsWith('.')?load(path.resolve(path.dirname(file),name+'.ts')):require(name),module,module.exports);return module.exports}
const transition=load('packages/content/src/heart-to-phone-transition.ts');
const read=file=>fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');
const capabilities=read('packages/content/src/transition-inspector-capabilities.ts');
const player=read('apps/web/components/heart-phone-transition.tsx');
const css=read('apps/web/app/heart-phone-transition-t7.css');
const layout=read('apps/web/app/layout.tsx');

test('T7 transition contract exposes editable art direction, frames and scene timing',()=>{
 const value=transition.defaultHeartToPhoneTransition;
 assert.equal(value.artDirection.renderMode,'auto');
 assert.equal(value.artDirection.interfaceSource,'live-home');
 assert.equal(value.frames['box-establishing'].desktop,'');
 assert.equal(value.timing.boxEndMs,1200);
 assert.equal(value.timing.wakeEndMs,7500);
});

test('T7 Heart persistence stays flat and round-trips visual editor values',()=>{
 const base=structuredClone(transition.defaultHeartToPhoneTransition);
 base.artDirection.lightIntensity=1.25;base.artDirection.boxWidth=620;base.artDirection.phoneScale=1.14;base.artDirection.interfaceSource='live-home';
 base.frames['box-establishing'].desktop='/transition/box.webp';base.frames['screen-wake'].desktop='/transition/wake.webp';
 base.timing.boxEndMs=1350;
 const props=transition.transitionToHeartActionProps(base);
 assert.equal(props.transitionLightIntensity,1.25);assert.equal(props.transitionBoxWidth,620);assert.equal(props.transitionFrameBoxSrc,'/transition/box.webp');
 assert.ok(Object.values(props).every(x=>['string','number','boolean'].includes(typeof x)));
 const round=transition.heartActionPropsToTransition(props);
 assert.equal(round.artDirection.phoneScale,1.14);assert.equal(round.frames['screen-wake'].desktop,'/transition/wake.webp');assert.equal(round.timing.boxEndMs,1350);
});

test('T7 transition inspector adds Shopify-style controls for every scene and art direction',()=>{
 for(const key of ['transitionRenderMode','transitionFrameBoxSrc','transitionFrameGlovesSrc','transitionFrameOpenSrc','transitionFrameLiftSrc','transitionFrameWakeSrc','transitionFrameHandoffSrc','transitionBackgroundColor','transitionLightColor','transitionLightIntensity','transitionBrightness','transitionStageScale','transitionBoxWidth','transitionLidThickness','transitionPhoneScale','transitionMobilePhoneScale','transitionInterfaceSource','transitionBoxEndMs','transitionWakeEndMs'])assert.match(capabilities,new RegExp(key),key);
 assert.match(capabilities,/transitionFrameBoxSrc:.*kind:'image'/s);
 assert.match(capabilities,/Live Home uses the actual published Home page/);
});

test('T7 runtime can play authored hybrid frames and still hand off to the real Home UI',()=>{
 assert.match(player,/heart-phone-transition-keyframe/);
 assert.match(player,/config\.frames\[sceneId\]/);
 assert.match(player,/data-hybrid=\{hybridAvailable\?'true':'false'\}/);
 assert.match(player,/art\.interfaceSource==='live-home'/);
 assert.match(player,/CMSRenderer document=\{home\}/);
 assert.match(player,/data-scene=\{sceneId\}/);
});

test('T7 CSS binds lighting, framing, box geometry and live phone geometry to editor variables',()=>{
 for(const token of ['--transition-light-intensity','--transition-brightness','--transition-stage-scale','--transition-box-width','--transition-lid-thickness','--transition-phone-x','--transition-interface-opacity'])assert.match(css,new RegExp(token));
 assert.match(layout,/heart-phone-transition-t7\.css/);
});
