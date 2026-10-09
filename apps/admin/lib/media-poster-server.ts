import 'server-only';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import ffmpegPath from 'ffmpeg-static';
import {requireAdmin} from './auth';
import {adminDb} from './supabase';
import {saveMediaPoster} from './media-actions';
const run=promisify(execFile);
/** Browser decoding is not available for every phone video codec. Only writers
 * can create a verified sidecar; the original file is never modified. */
export async function generateServerMediaPoster(id:string){
 await requireAdmin('media:write');
 if(!/^[0-9a-f-]{36}$/i.test(id)||!ffmpegPath)throw new Error('Unable to generate this thumbnail.');
 const db=await adminDb();
 const {data:asset,error}=await db.from('media_assets').select('site_id,storage_path,kind,status,poster_ready,byte_size').eq('id',id).is('archived_at',null).single();
 if(error||!asset||asset.kind!=='video'||asset.status!=='ready'||asset.byte_size>52428800)throw new Error('A verified video is required.');
 const {data:site,error:siteError}=await db.from('sites').select('id').eq('id',asset.site_id).eq('slug',process.env.NEXT_PUBLIC_SITE_SLUG??'wiffeyyyy-os').single();if(siteError||!site)throw new Error('Site not found.');if(asset.poster_ready)return {ok:true};
 const {data:signed,error:signError}=await db.storage.from('wiffeyyyy-video').createSignedUrl(asset.storage_path,120);
 if(signError||!signed)throw new Error('Unable to read this video.');
 const directory=await mkdtemp(join(tmpdir(),'birthday-poster-'));
 try{
  const response=await fetch(signed.signedUrl,{signal:AbortSignal.timeout(20000),cache:'no-store'});
  if(!response.ok)throw new Error('Unable to read this video.');
  const bytes=await response.arrayBuffer();if(bytes.byteLength>52428800)throw new Error('Video exceeds the thumbnail limit.');
  const source=join(directory,'original'),poster=join(directory,'poster.webp');await writeFile(source,new Uint8Array(bytes));
  await run(ffmpegPath,['-hide_banner','-loglevel','error','-threads','1','-ss','0.1','-i',source,'-frames:v','1','-vf','scale=640:640:force_original_aspect_ratio=decrease','-c:v','libwebp','-quality','80','-threads','1','-y',poster],{timeout:25000,maxBuffer:16384});
  const image=await readFile(poster);const input=new FormData();input.set('poster',new Blob([new Uint8Array(image)],{type:'image/webp'}),'poster.webp');
  return await saveMediaPoster(id,input);
 }catch{throw new Error('This video could not generate a thumbnail. Retry or upload a supported video.')}finally{await rm(directory,{recursive:true,force:true})}
}
