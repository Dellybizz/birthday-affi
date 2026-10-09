'use client';
import { createBrowserClient } from '@supabase/ssr';
import { reserveMedia, finalizeMedia, prepareMediaRecovery, saveMediaPoster } from './media-actions';
import {boundedMedia,mediaCancelled} from './media-deadline';
import {createVideoPoster} from './video-poster';
import { mediaKind, validateMedia } from './media-policy';
async function describe(file:File,makeVariants=true,signal?:AbortSignal):Promise<{width?:number;height?:number;durationMs?:number;variants:Array<{width:number;blob:Blob}>}>{
 const url=URL.createObjectURL(file);
 try{
  if(file.type.startsWith('image/')){
   const image=new Image();image.src=url;try{await boundedMedia(image.decode(),'Unable to decode image. Retry.',15000,signal)}catch(e){image.src='';throw e};const width=image.naturalWidth,height=image.naturalHeight;if(width*height>40000000||width>20000||height>20000)throw new Error('Image dimensions exceed the supported limit');
   const variants:Array<{width:number;blob:Blob}>=[];
   // Preserve animated GIFs. Other raster images get compact WebP delivery sizes.
   if(makeVariants&&file.type!=='image/gif')for(const w of [480,960,1600].filter(w=>w<width)){const canvas=document.createElement('canvas');canvas.width=w;canvas.height=Math.max(1,Math.round(height*w/width));canvas.getContext('2d')!.drawImage(image,0,0,canvas.width,canvas.height);const blob=await boundedMedia(new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,'image/webp',.82)),'Image resizing timed out. Retry.',5000,signal);if(blob?.type==='image/webp')variants.push({width:w,blob})}
   return{width,height,variants};
  }
  const element=document.createElement(file.type.startsWith('video/')?'video':'audio');element.preload='metadata';await new Promise<void>((resolve,reject)=>{const timer=setTimeout(()=>{element.src='';reject(new Error('Unable to read media metadata'))},15000);element.onloadedmetadata=()=>{clearTimeout(timer);resolve()};element.onerror=()=>{clearTimeout(timer);reject(new Error('Unable to read media metadata'))};element.src=url});
  const durationMs=Math.round(element.duration*1000);if(!Number.isFinite(durationMs)||durationMs<=0||durationMs>86400000)throw new Error('Invalid media duration');const dimensions=element instanceof HTMLVideoElement?{width:element.videoWidth,height:element.videoHeight}:{};element.src='';return{...dimensions,durationMs,variants:[]};
 }finally{URL.revokeObjectURL(url)}
}

export type UploadAttempt={metadata?:Awaited<ReturnType<typeof describe>>;reservation?:Extract<Awaited<ReturnType<typeof reserveMedia>>,{ok:true}>;reserving?:ReturnType<typeof reserveMedia>;completed:Set<string>;posterSaved?:boolean;posterError?:string};
export async function uploadMedia(siteId:string,file:File,progress:(message:string,percent?:number)=>void,attempt:UploadAttempt={completed:new Set()},signal?:AbortSignal){
 if(signal?.aborted)throw mediaCancelled();const kind=mediaKind(file.type);if(!kind)throw new Error('Choose an image, video or audio file');const check=validateMedia(kind,file.size,file.type);if(!check.ok)throw new Error(check.error);
 progress('Preparing media',0);attempt.metadata??=await boundedMedia(describe(file,true,signal),'Media preparation timed out. Retry.',20000,signal);const metadata=attempt.metadata;
 if(!attempt.reservation){attempt.reserving??=reserveMedia({siteId,kind,filename:file.name,mimeType:file.type,size:file.size}).then(result=>{if(result.ok)attempt.reservation=result;return result}).finally(()=>{attempt.reserving=undefined});const result=await boundedMedia(attempt.reserving,'Unable to start upload. Refresh and retry.',20000,signal);if(!result.ok)throw new Error(result.error)}const upload=attempt.reservation!;
 if(signal?.aborted)throw mediaCancelled();const db=createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
 const {data:{session}}=await boundedMedia(db.auth.getSession(),'Session check timed out. Sign in again.',15000,signal);if(!session)throw new Error('Session expired. Sign in again.');
 const objects=[{path:upload.path,body:file},...metadata.variants.map(v=>({path:upload.path.replace(/original$/,v.width+'.webp'),body:v.blob}))];
 const total=objects.reduce((n,o)=>n+o.body.size,0);let done=0;
 for(const object of objects){
  if(signal?.aborted)throw mediaCancelled();
  if(!attempt.completed.has(object.path)){
   progress('Uploading '+file.name,Math.floor(done/total*95));
   await new Promise<void>((resolve,reject)=>{
    const xhr=new XMLHttpRequest();const abort=()=>xhr.abort();signal?.addEventListener('abort',abort,{once:true});xhr.onloadend=()=>signal?.removeEventListener('abort',abort);xhr.onabort=()=>reject(mediaCancelled());xhr.open('POST',process.env.NEXT_PUBLIC_SUPABASE_URL+'/storage/v1/object/'+upload.bucket+'/'+object.path);
    xhr.timeout=180000;xhr.setRequestHeader('Authorization','Bearer '+session.access_token);xhr.setRequestHeader('apikey',process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);xhr.setRequestHeader('Content-Type',object.body.type);xhr.setRequestHeader('x-upsert','false');xhr.setRequestHeader('cache-control','max-age=3600');
    xhr.upload.onprogress=e=>{if(e.lengthComputable)progress('Uploading '+file.name,Math.floor((done+object.body.size*e.loaded/e.total)/total*95))};
    xhr.onload=()=>{if(xhr.status>=200&&xhr.status<300)resolve();else if(xhr.status===409||xhr.status===400&&/Duplicate|already exists/i.test(xhr.responseText))resolve();else reject(new Error('Upload failed ('+xhr.status+'). Retry to continue.'))};
    xhr.onerror=()=>reject(new Error('Network interrupted. Retry to continue.'));xhr.ontimeout=()=>reject(new Error('Upload timed out. Retry to continue.'));xhr.send(object.body);
   });attempt.completed.add(object.path);
  }done+=object.body.size;
 }
 if(signal?.aborted)throw mediaCancelled();progress('Verifying upload',95);const finished=await boundedMedia(finalizeMedia(upload.id,{...(metadata.width!==undefined?{width:metadata.width}:{}),...(metadata.height!==undefined?{height:metadata.height}:{}),...(metadata.durationMs!==undefined?{durationMs:metadata.durationMs}:{}),variants:metadata.variants.map(v=>v.width)}),'Verification timed out. Retry or finish verification from file details.',30000,signal);if(!finished.ok)throw new Error(finished.error);
 if(kind==='video'&&!attempt.posterSaved){try{progress('Saving video thumbnail',98);await boundedMedia(uploadVideoPoster(upload.id,file),'Thumbnail generation timed out.',30000,signal);attempt.posterSaved=true;attempt.posterError=undefined}catch{if(signal?.aborted)throw mediaCancelled();attempt.posterError='Video ready. Thumbnail unavailable — use Generate thumbnail in file details.'}}
 if(signal?.aborted)throw mediaCancelled();progress('Upload complete',100);return upload.id;
}

export async function recoverMedia(id:string){
 const saved=await boundedMedia(prepareMediaRecovery(id),'Unable to start recovery. Retry.',15000);const response=await fetch(saved.url,{signal:AbortSignal.timeout(20000)});if(!response.ok)throw new Error('Saved upload could not be read. Please retry.');const file=new File([await response.blob()],saved.filename,{type:saved.mimeType});const metadata=await boundedMedia(describe(file,false),'Saved media metadata timed out. Retry.',20000);
 const result=await boundedMedia(finalizeMedia(id,{...(metadata.width?{width:metadata.width}:{}),...(metadata.height?{height:metadata.height}:{}),...(metadata.durationMs?{durationMs:metadata.durationMs}:{}),variants:saved.variants}),'Recovery timed out. Retry verification.',30000);if(!result.ok)throw new Error(result.error);return id;
}

async function uploadVideoPoster(id:string,file:Blob){const poster=await createVideoPoster(file);const input=new FormData();input.set('poster',poster,'poster.webp');await saveMediaPoster(id,input)}
export async function generateMediaPoster(asset:{id:string;previewUrl:string;mime_type:string}){
 const poster=await createVideoPoster(asset.previewUrl,30000);const input=new FormData();input.set('poster',poster,'poster.webp');await saveMediaPoster(asset.id,input);
}
