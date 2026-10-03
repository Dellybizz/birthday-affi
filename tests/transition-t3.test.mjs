import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=(file)=>fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');
const fields=read('packages/content/src/inspector-fields.ts');
const capabilities=read('packages/content/src/transition-inspector-capabilities.ts');
const index=read('packages/content/src/index.ts');
const inspector=read('apps/admin/components/editor-inspector-fields.tsx');
const heart=read('packages/content/src/heart-page.ts');

const transitionKeys=[
 'transitionEnabled','transitionAriaLabel','transitionDurationMs','transitionShowSkip','transitionSkipLabel','transitionAllowReplay',
 'transitionVideoSrc','transitionMobileVideoSrc','transitionPosterSrc','transitionAudioEnabled','transitionMusicSrc','transitionUnboxingSrc','transitionWakeSrc','transitionVolume',
 'transitionHandoffAtMs','transitionHandoffDurationMs','transitionHandoffStrategy','transitionPreloadDestination','transitionMatchWallpaper',
 'transitionPreload','transitionSlowConnectionBehavior','transitionMaxMobileVideoBytes','transitionMaxDesktopVideoBytes','transitionReducedMotionBehavior','transitionAnnounceSceneChange'
];

test('T3 exposes the complete T0 transition contract on the Heart next action',()=>{
 assert.match(fields,/next:\[/);
 for(const key of transitionKeys)assert.match(fields,new RegExp(`key:'${key}'`),key);
 assert.match(fields,/key:'href',label:'Handoff destination'/);
 assert.match(fields,/key:'title',label:'Trigger label'/);
});

test('T3 media controls reuse the typed Shopify-style media library',()=>{
 assert.match(capabilities,/transitionVideoSrc:\{key:'transitionVideoSrc'.*kind:'video'/);
 assert.match(capabilities,/transitionMobileVideoSrc:\{key:'transitionMobileVideoSrc'.*kind:'video'/);
 assert.match(capabilities,/transitionPosterSrc:\{key:'transitionPosterSrc'.*kind:'image'/);
 assert.match(capabilities,/transitionMusicSrc:\{key:'transitionMusicSrc'.*kind:'audio'/);
 assert.match(capabilities,/transitionUnboxingSrc:\{key:'transitionUnboxingSrc'.*kind:'audio'/);
 assert.match(capabilities,/transitionWakeSrc:\{key:'transitionWakeSrc'.*kind:'audio'/);
 assert.match(capabilities,/safeMediaUrl\(raw\)/);
 assert.match(inspector,/current\?'Replace':'Add'/);
});

test('T3 shows normalized transition defaults for legacy Heart pages and reset restores them',()=>{
 assert.match(capabilities,/transitionToHeartActionProps\(defaultHeartToPhoneTransition\)/);
 assert.match(capabilities,/hasDefault:hasDefault\|\|cap\.hasDefault/);
 assert.match(capabilities,/resetPolicy:hasDefault\?'component-default'/);
 assert.match(inspector,/value===undefined&&cap\.hasDefault\?cap\.defaultValue:value/);
});

test('T3 inspector groups transition controls into focused editor cards',()=>{
 assert.match(inspector,/type SettingsSection=.*'Performance'.*'Accessibility'/);
 assert.match(inspector,/const playbackKeys=.*transitionDurationMs.*transitionVolume/);
 assert.match(inspector,/const navigationKeys=.*transitionHandoffAtMs.*transitionMatchWallpaper/);
 assert.match(inspector,/const performanceKeys=.*transitionSlowConnectionBehavior.*transitionMaxDesktopVideoBytes/);
 assert.match(inspector,/const accessibilityKeys=.*transitionReducedMotionBehavior.*transitionAnnounceSceneChange/);
});

test('T3 content package exports transition-aware capabilities and new Heart pages seed the full contract',()=>{
 assert.match(index,/export \* from '\.\/transition-inspector-capabilities'/);
 assert.doesNotMatch(index,/export \* from '\.\/inspector-capabilities'/);
 assert.match(heart,/transitionToHeartActionProps\(defaultHeartToPhoneTransition\)/);
 assert.match(heart,/heartPart:'next'.*transitionToHeartActionProps/s);
});
