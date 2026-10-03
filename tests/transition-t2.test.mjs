import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),ts=require('typescript');
function load(file){const module={exports:{}};const code=ts.transpile(fs.readFileSync(path.resolve(file),'utf8'),{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022});new Function('module','exports',code)(module,module.exports);return module.exports}
const fit=load('apps/web/lib/phone-fit.ts');
const read=(file)=>fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');
const player=read('apps/web/components/heart-phone-transition.tsx');
const journey=read('apps/web/components/archive-journey.tsx');
const layout=read('apps/web/app/layout.tsx');
const osProvider=read('apps/web/components/os-provider.tsx');
const css=read('apps/web/app/heart-phone-transition.css');

test('T2 shares the exact 390x844 phone fit model with the public phone shell',()=>{
 assert.equal(fit.PHONE_FRAME_WIDTH,390);assert.equal(fit.PHONE_FRAME_HEIGHT,844);assert.equal(fit.PHONE_SCREEN_WIDTH,376);assert.equal(fit.PHONE_SCREEN_HEIGHT,830);
 assert.equal(fit.computePhoneFit(422,876),1);
 assert.ok(fit.computePhoneFit(390,844)<1);
 assert.match(osProvider,/computePhoneFit\(window\.innerWidth,window\.innerHeight\)/);
 assert.match(player,/computePhoneFit\(window\.innerWidth,window\.innerHeight\)/);
});

test('T2 final cinematic phone renders the real published Home document',()=>{
 assert.match(player,/installPhoneHome\(homeDocument\?\?createDefaultPage\('home'\)\)/);
 assert.match(player,/CMSRenderer document=\{home\} embedded previewDevice="mobile"/);
 assert.match(player,/DocumentSettingsProvider value=\{siteSettings\}/);
 assert.match(layout,/homeDocument=\{home\}/);
 assert.match(layout,/siteSettings=\{settings\}/);
});

test('T2 does not release the overlay until the destination route is committed',()=>{
 assert.match(journey,/destinationReady=\{pathname===heartTransition\.handoff\.destination\}/);
 assert.match(player,/handoffStarted\.current\|\|!destinationReady/);
 assert.match(player,/setMode\('handoff'\)/);
 assert.match(player,/setMode\('leaving'\)/);
 assert.match(player,/window\.location\.assign\(config\.handoff\.destination\)/);
});

test('T2 match-cut dimensions mirror the public phone bezel and screen',()=>{
 assert.match(css,/width:390px;height:844px;border:7px solid #19151e;border-radius:44px/);
 assert.match(css,/width:376px;height:830px/);
 assert.match(css,/@keyframes t2-sync-phone/);
 assert.match(css,/scale\(var\(--phone-fit,1\)\)/);
 assert.match(css,/data-mode="handoff"/);
});

test('T2 supports layered score, unboxing and screen-wake audio cues',()=>{
 assert.match(player,/config\.audio\.musicSrc/);
 assert.match(player,/config\.audio\.unboxingSrc/);
 assert.match(player,/config\.audio\.wakeSrc/);
 assert.match(player,/schedule\('top-down-open',unboxing\.current\)/);
 assert.match(player,/schedule\('screen-wake',wake\.current\)/);
 assert.match(player,/music\.current\.loop=true/);
});
