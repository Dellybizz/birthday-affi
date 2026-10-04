import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=file=>fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');
const player=read('apps/web/components/heart-phone-transition.tsx');
const css=read('apps/web/app/heart-phone-transition-t5.css');
const layout=read('apps/web/app/layout.tsx');

test('T5 replaces the bare placeholder with a structured premium box/tray stage',()=>{
 assert.match(player,/unbox-ambient/);
 assert.match(player,/unbox-beam/);
 assert.match(player,/unbox-tray/);
 assert.match(player,/unbox-tray-well/);
 assert.match(player,/unbox-lid-mark/);
 assert.match(player,/unbox-package-shadow/);
});

test('T5 never presents CSS blobs as human hands on the no-video public path',()=>{
 assert.match(css,/data-video="false"\] \.unbox-glove\{display:none!important\}/);
});

test('T5 preserves the same fallback styling through match-cut handoff',()=>{
 assert.match(css,/data-video="false"\]\[data-mode="handoff"\] \.heart-phone-sync-phone/);
 assert.match(css,/@keyframes t5-phone-lift/);
 assert.match(css,/scale\(var\(--phone-fit,1\)\)/);
});

test('T5 hides visual scene debug pills while preserving the aria-live scene node',()=>{
 assert.match(player,/aria-live=\{config\.accessibility\.announceSceneChange\?'polite':'off'\}/);
 assert.match(css,/heart-phone-transition-kicker/);
 assert.match(css,/clip:rect\(0,0,0,0\)!important/);
});

test('T5 styles are loaded after the prior certified transition layers',()=>{
 const t4=layout.indexOf('heart-phone-transition-t4.css');
 const t5=layout.indexOf('heart-phone-transition-t5.css');
 assert.ok(t4>=0&&t5>t4);
});
