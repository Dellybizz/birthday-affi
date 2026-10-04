import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=file=>fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');
const journey=read('apps/web/components/archive-journey.tsx');
const css=read('apps/web/app/heart-phone-transition-t9.css');
const layout=read('apps/web/app/layout.tsx');

test('T9 prewarms production and editor-selected cinematic frames before playback',()=>{
 assert.match(journey,/T9_CINEMATIC_FRAMES/);
 assert.match(journey,/new Image\(\)/);
 assert.match(journey,/image\.decoding='async'/);
 assert.match(journey,/image\.decode\(\)\.catch/);
 assert.match(journey,/warmTransitionFrames\(transition\)/);
 assert.match(journey,/router\.prefetch\('\/home'\)/);
});

test('T9 gives every authored scene deliberate camera motion instead of a naked image swap',()=>{
 for(const scene of ['box-establishing','gloves-enter','top-down-open','phone-lift','screen-wake','live-handoff'])assert.match(css,new RegExp(`data-scene="${scene}"`));
 for(const motion of ['t9-box-camera','t9-gloves-camera','t9-open-camera','t9-lift-camera','t9-wake-camera','t9-handoff-frame'])assert.match(css,new RegExp(motion));
 assert.match(css,/will-change:opacity,scale,transform,filter/);
});

test('T9 softens the authored-frame to Live Home match cut and keeps reduced motion safe',()=>{
 assert.match(css,/data-interface="live-home"/);
 assert.match(css,/heart-phone-sync-phone/);
 assert.match(css,/data-mode="handoff".*heart-phone-transition-keyframe/s);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(layout,/heart-phone-transition-t9\.css/);
});
