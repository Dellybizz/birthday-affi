import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=(path)=>fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');
const player=read('apps/web/components/heart-phone-transition.tsx');
const journey=read('apps/web/components/archive-journey.tsx');
const layout=read('apps/web/app/layout.tsx');
const css=read('apps/web/app/heart-phone-transition.css');

test('T2 renders the published Home document inside the cinematic phone',()=>{
 assert.match(player,/installPhoneHome\(homeDocument\?\?createDefaultPage\('home'\)\)/);
 assert.match(player,/CMSRenderer document=\{previewDocument\}/);
 assert.match(player,/DocumentSettingsProvider value=\{siteSettings\}/);
 assert.match(player,/previewDevice="mobile"/);
 assert.match(player,/setAttribute\('inert',''\)/);
});

test('T2 route handoff measures and converges on the real live phone wrapper',()=>{
 assert.match(player,/querySelector<HTMLElement>\('\.birthday-os-phone'\)/);
 assert.match(player,/getBoundingClientRect\(\)/);
 assert.match(player,/node\.style\.left=to\.left\+'px'/);
 assert.match(player,/node\.style\.width=to\.width\+'px'/);
 assert.match(player,/setMode\('leaving'\)/);
 assert.match(css,/--match-width:min\(390px/);
 assert.match(css,/aspect-ratio:390\/844/);
});

test('T2 shares the same published Home and site settings between live OS and cinematic',()=>{
 assert.match(layout,/siteSettings=\{settings\}/);
 assert.match(layout,/homeDocument=\{home\}/);
 assert.match(journey,/siteSettings:SiteDocument/);
 assert.match(journey,/homeDocument\?:PageDocument\|null/);
 assert.match(journey,/homeDocument=\{homeDocument\}/);
});

test('T2 implements timeline-aware sound design without autoplaying audio',()=>{
 assert.match(player,/music\.current\.play\(\)\.catch/);
 assert.match(player,/scene\.id==='top-down-open'/);
 assert.match(player,/scene\.id==='screen-wake'/);
 assert.match(player,/config\.audio\.unboxingSrc/);
 assert.match(player,/config\.audio\.wakeSrc/);
 assert.match(player,/const enableSound=/);
});

test('T2 keeps reduced-motion and constrained-network paths lightweight',()=>{
 assert.match(player,/directHandoff/);
 assert.match(player,/if\(reducedMotionRequested\(\)\)\{directHandoff\(\)/);
 assert.match(player,/slowConnectionBehavior==='skip-to-home'/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
});

test('T2 fallback cinematic has studio lighting, premium box, gloves and live-screen reveal',()=>{
 for(const token of ['unbox-key-light','unbox-rim-light','unbox-box-heart','unbox-glove','unbox-phone-reflection','transition-home-preview'])assert.match(player,new RegExp(token));
 assert.match(css,/@keyframes t2-lid/);
 assert.match(css,/@keyframes t2-glove-left/);
 assert.match(css,/@keyframes t2-phone/);
 assert.match(css,/@keyframes t2-screen-content/);
});
