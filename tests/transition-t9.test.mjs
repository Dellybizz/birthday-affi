import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=file=>fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');
const journey=read('apps/web/components/archive-journey.tsx');
const player=read('apps/web/components/heart-phone-transition.tsx');
const compositor=read('apps/web/components/heart-phone-frame-compositor.tsx');
const css=read('apps/web/app/heart-phone-transition-t9.css');
const layout=read('apps/web/app/layout.tsx');
const adminPreview=read('apps/admin/components/editor-live-frame.tsx');

test('T9 prewarms production and editor-selected cinematic frames before playback',()=>{
 assert.match(journey,/T9_CINEMATIC_FRAMES/);
 assert.match(journey,/new Image\(\)/);
 assert.match(journey,/image\.decoding='async'/);
 assert.match(journey,/image\.decode\(\)\.catch/);
 assert.match(journey,/warmTransitionFrames\(transition\)/);
 assert.match(journey,/router\.prefetch\('\/home'\)/);
});

test('T9 uses a decoded two-frame compositor instead of naked image replacement',()=>{
 assert.match(player,/HeartPhoneFrameCompositor/);
 assert.match(player,/data-t9-compositor/);
 assert.match(compositor,/image\.decoding='async'/);
 assert.match(compositor,/image\.decode\(\)\.then\(activate\)\.catch\(activate\)/);
 assert.match(compositor,/state:'outgoing'/);
 assert.match(compositor,/state:'incoming'/);
 assert.match(compositor,/state:'active'/);
 assert.match(compositor,/heart-phone-frame-layer/);
 assert.match(css,/heart-phone-frame-layer\[data-frame-state="outgoing"\]/);
 assert.match(css,/--t9-frame-blend/);
});

test('T9 gives every authored scene deliberate camera motion while the wrapper owns the crossfade',()=>{
 for(const scene of ['box-establishing','gloves-enter','top-down-open','phone-lift','screen-wake','live-handoff'])assert.match(css,new RegExp(`data-frame-scene="${scene}"`));
 for(const motion of ['t9-box-camera','t9-gloves-camera','t9-open-camera','t9-lift-camera','t9-wake-camera','t9-handoff-frame'])assert.match(css,new RegExp(motion));
 assert.match(css,/will-change:transform,scale,translate,filter/);
});

test('T9 calibrates the photographic phone into the real published Live Home shell',()=>{
 assert.match(css,/t9-live-home-match/);
 assert.match(css,/calc\(-50% \+ 100px\)/);
 assert.match(css,/scale\(calc\(var\(--phone-fit,1\)\*\.86\)\)/);
 assert.match(css,/data-interface="live-home"/);
 assert.match(css,/data-mode="handoff"/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(layout,/heart-phone-transition-t9\.css/);
});

test('T9 admin exposes a six-scene cinematic timeline with thumbnails, scene durations and replay',()=>{
 assert.match(adminPreview,/CINEMATIC_SCENES/);
 for(const key of ['transitionFrameBoxSrc','transitionFrameGlovesSrc','transitionFrameOpenSrc','transitionFrameLiftSrc','transitionFrameWakeSrc','transitionFrameHandoffSrc'])assert.match(adminPreview,new RegExp(key));
 assert.match(adminPreview,/data-t9-cinematic-editor/);
 assert.match(adminPreview,/Cinematic timeline/);
 assert.match(adminPreview,/Replay/);
 assert.match(adminPreview,/Math\.max\(0,end-start\)/);
 assert.match(adminPreview,/resolvedDevice==='mobile'/);
});
