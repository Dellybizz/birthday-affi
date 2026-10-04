import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const module={exports:{}};
new Function('module','exports',ts.transpile(readFileSync('packages/audio/src/controller.ts','utf8'),{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}))(module,module.exports);
const {PlaybackCoordinator,parsePlayback,resumeTime,parseCaptions}=module.exports;
test('starting another source pauses the previous source exactly once',()=>{
 const coordinator=new PlaybackCoordinator();let pauses=0;
 const first={pause(){pauses++;coordinator.release(first)}},second={pause(){}};
 coordinator.claim(first);coordinator.claim(first);assert.equal(pauses,0);
 coordinator.claim(second);assert.equal(pauses,1);
 coordinator.release(first);coordinator.claim(first);assert.equal(pauses,1);
});
test('released source does not interfere with subsequent playback',()=>{
 const coordinator=new PlaybackCoordinator();let pauses=0;
 const first={pause(){pauses++}},second={pause(){}};
 coordinator.claim(first);coordinator.release(first);coordinator.claim(second);assert.equal(pauses,0);
});
test('corrupt playback data and invalid fields recover safely',()=>{
 for(const value of [null,'{','null','[]','{"version":2}'])assert.deepEqual(parsePlayback(value),{version:1,time:0,volume:1,muted:false});
 assert.deepEqual(parsePlayback('{"version":1,"time":-4,"volume":5,"muted":"true"}'),{version:1,time:0,volume:1,muted:false});
 assert.deepEqual(parsePlayback('{"version":1,"time":32,"volume":0.4,"muted":true}'),{version:1,time:32,volume:0.4,muted:true});
});
test('completed, replaced-shorter and live media start at zero',()=>{
 assert.equal(resumeTime(12,60),12);assert.equal(resumeTime(59.5,60),0);
 assert.equal(resumeTime(100,60),0);assert.equal(resumeTime(12,Infinity),0);assert.equal(resumeTime(12,NaN),0);
});
test('timed captions retain plain text and ordered timestamps',()=>{
 assert.deepEqual(parseCaptions('0 | 2.5 | Hello\n2.5 | 4 | Love you'),[{start:0,end:2.5,text:'Hello'},{start:2.5,end:4,text:'Love you'}]);
 assert.deepEqual(parseCaptions(''),[]);
 assert.equal(parseCaptions('0 | 1 | <script>')[0].text,'<script>');
});
test('caption validation rejects malformed, reversed, oversized and unordered cues',()=>{
 for(const value of ['words','2 | 1 | words','0 | 0 | words','2 | 3 | words\n1 | 2 | words','0 | 604801 | words','0 | 1 | '+'x'.repeat(501)])assert.throws(()=>parseCaptions(value));
 assert.throws(()=>parseCaptions(Array(201).fill('0 | 1 | hello').join('\n')));
});
