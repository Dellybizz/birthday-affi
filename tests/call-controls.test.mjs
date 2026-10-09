import test from 'node:test';
import assert from 'node:assert/strict';
import {loadContentModule} from './load-content-module.mjs';
const {applyCallControls,formatCallTime}=loadContentModule('packages/audio/src/call-controls.ts');
test('hold silences both directions and releasing hold preserves microphone mute',()=>{
 const tracks=[{enabled:true}],audio={muted:false};
 applyCallControls(tracks,audio,false,true);assert.equal(tracks[0].enabled,false);assert.equal(audio.muted,true);
 applyCallControls(tracks,audio,true,false);assert.equal(tracks[0].enabled,false);assert.equal(audio.muted,false);
 applyCallControls(tracks,audio,false,false);assert.equal(tracks[0].enabled,true);
});
test('call duration is stable over minute boundaries',()=>{assert.equal(formatCallTime(59),'0:59');assert.equal(formatCallTime(60),'1:00');assert.equal(formatCallTime(3659),'60:59')});
