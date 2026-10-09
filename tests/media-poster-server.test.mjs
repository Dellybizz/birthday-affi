import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import ts from 'typescript';
const require=createRequire(new URL('../apps/admin/package.json',import.meta.url));
const ffmpeg=require('ffmpeg-static'),run=promisify(execFile);
const id='00000000-0000-4000-8000-000000000020';
function load({asset,denied=false,save}){const db={from:table=>{const q={select:()=>q,eq:()=>q,is:()=>q,single:async()=>({data:table==='sites'?{id:'site'}:asset})};return q},storage:{from:()=>({createSignedUrl:async()=>({data:{signedUrl:'https://fixture.example/video'}})})}};const m={exports:{}};new Function('require','module','exports',ts.transpile(readFileSync('apps/admin/lib/media-poster-server.ts','utf8'),{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}))(name=>name==='server-only'?{}:name==='ffmpeg-static'?{default:ffmpeg}:name==='./auth'?{requireAdmin:async()=>{if(denied)throw Error('Writer required')}}:name==='./supabase'?{adminDb:async()=>db}:name==='./media-actions'?{saveMediaPoster:save}:require(name),m,m.exports);return m.exports.generateServerMediaPoster;}
test('server repair requires a writer and a verified unarchived video',async()=>{let saved=0;const save=async()=>{saved++};await assert.rejects(load({denied:true,save})(id),/Writer required/);await assert.rejects(load({asset:{kind:'image',status:'ready'},save})(id),/verified video/);assert.equal(saved,0)});
test('server decoder creates a verified WebP sidecar from an HEVC phone video',async()=>{const dir=await mkdtemp(join(tmpdir(),'poster-fixture-'));const previous=global.fetch;try{const video=join(dir,'phone.mp4');await run(ffmpeg,['-hide_banner','-loglevel','error','-f','lavfi','-i','color=c=red:s=96x128:d=0.5','-c:v','libx265','-x265-params','pools=1:frame-threads=1','-threads','1','-y',video],{timeout:15000});const bytes=await readFile(video);global.fetch=async()=>new Response(bytes);let saved=false;const generate=load({asset:{kind:'video',status:'ready',site_id:'site',storage_path:'site/id/original',byte_size:bytes.length,poster_ready:false},save:async(assetId,form)=>{assert.equal(assetId,id);const image=form.get('poster');assert.equal(image.type,'image/webp');const signature=Buffer.from(await image.arrayBuffer());assert.equal(signature.toString('ascii',0,4),'RIFF');assert.equal(signature.toString('ascii',8,12),'WEBP');assert.ok(image.size<524288);saved=true;return {ok:true}}});assert.deepEqual(await generate(id),{ok:true});assert.equal(saved,true)}finally{global.fetch=previous;await rm(dir,{recursive:true,force:true})}});
