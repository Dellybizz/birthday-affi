import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=(path)=>fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');
const heart=read('packages/ui/src/heart-page.tsx');
const journey=read('apps/web/components/archive-journey.tsx');
const player=read('apps/web/components/heart-phone-transition.tsx');
const css=read('apps/web/app/heart-phone-transition.css');
const layout=read('apps/web/app/layout.tsx');

test('Heart sends the versioned T0 transition contract with the /home handoff',()=>{
 assert.match(heart,/heartActionPropsToTransition/);
 assert.match(heart,/message\.href==='\/home'/);
 assert.match(heart,/detail:\{href:message\.href,transition\}/);
});

test('persistent journey layer prefetches home and owns the cinematic across navigation',()=>{
 assert.match(journey,/HeartPhoneTransition/);
 assert.match(journey,/router\.prefetch\(transition\.handoff\.destination\)/);
 assert.match(journey,/router\.push\(heartTransition\.handoff\.destination\)/);
 assert.match(journey,/cinematicBusy/);
});

test('player has accessible skip plus reduced-motion and constrained-network fallbacks',()=>{
 assert.match(player,/prefers-reduced-motion: reduce/);
 assert.match(player,/saveData===true/);
 assert.match(player,/effectiveType==='2g'/);
 assert.match(player,/slowConnectionBehavior==='skip-to-home'/);
 assert.match(player,/config\.playback\.showSkip/);
 assert.match(player,/aria-modal="true"/);
});

test('player works before final media exists and can later play real media',()=>{
 assert.match(player,/showPlaceholder/);
 assert.match(player,/<video/);
 assert.match(player,/config\.media\.mobileVideoSrc/);
 assert.match(player,/poster=\{config\.media\.posterSrc/);
 assert.match(player,/onTimeUpdate=\{onTime\}/);
 assert.match(css,/@keyframes t2-box/);
 assert.match(css,/@keyframes t2-sync-phone/);
 assert.match(css,/data-mode="leaving"/);
 assert.match(layout,/heart-phone-transition\.css/);
});
