'use client';
import { createBrowserClient } from '@supabase/ssr';
import { reserveMedia, finalizeMedia } from './media-actions';
import { mediaKind, validateMedia } from './media-policy';
async function describe(file:File):Promise<{width?:number;height?:number;durationMs?:number;variants:Array<{width:number;blob:Blob}>}>{
 const url=URL.createObjectURL(file);
 try{
  if(file.type.startsWith('image/')){
   const image=new Image();image.src=url;await image.decode();const width=image.naturalWidth,height=image.naturalHeight;if(width*height>40000000||width>20000||height>20000)throw new Error('Image dimensions exceed the supported limit');
   const variants:Array<{width:number;blob:Blob}>=[];
   // Preserve animated GIFs. Other raster images get compact WebP delivery sizes.
   if(file.type!=='image/gif')for(const w of [480,960,1600].filter(w=>w<width)){const canvas=document.createElement('canvas');canvas.width=w;canvas.height=Math.max(1,Math.round(height*w/width));canvas.getContext('2d')!.drawImage(image,0,0,canvas.width,canvas.height);const blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,'image/webp',.82));if(blob?.type==='image/webp')variants.push({width:w,blob})}
   return{width,height,variants};
  }
  const element=document.createElement(file.type.startsWith('video/')?'video':'audio');element.preload='metadata';element.src=url;await new Promise<void>((resolve,reject)=>{const timer=setTimeout(()=>{element.src='';reject(new Error('Unable to read media metadata'))},15000);element.onloadedmetadata=()=>{clearTimeout(timer);resolve()};element.onerror=()=>{clearTimeout(timer);reject(new Error('Unable to read media metadata'))}});
  const durationMs=Math.round(element.duration*1000);if(!Number.isFinite(durationMs)||durationMs<=0||durationMs>86400000)throw new Error('Invalid media duration');const dimensions=element instanceof HTMLVideoElement?{width:element.videoWidth,height:element.videoHeight}:{};element.src='';return{...dimensions,durationMs,variants:[]};
 }finally{URL.revokeObjectURL(url)}
}

export type UploadAttempt={metadata?:Awaited<ReturnType<typeof describe>>;reservation?:Extract<Awaited<ReturnType<typeof reserveMedia>>,{ok:true}>;completed:Set<string>};
export async function uploadMedia(siteId:string,file:File,progress:(message:string,percent?:number)=>void,attempt:UploadAttempt={completed:new Set()}){
 const kind=mediaKind(file.type);if(!kind)throw new Error('Choose an image, video or audio file');const check=validateMedia(kind,file.size,file.type);if(!check.ok)throw new Error(check.error);
 progress('Preparing media',0);attempt.metadata??=await describe(file);const metadata=attempt.metadata;
 if(!attempt.reservation){const result=await reserveMedia({siteId,kind,filename:file.name,mimeType:file.type,size:file.size});if(!result.ok)throw new Error(result.error);attempt.reservation=result}const upload=attempt.reservation;
 const db=createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
 const {data:{session}}=await db.auth.getSession();if(!session)throw new Error('Session expired. Sign in again.');
 const objects=[{path:upload.path,body:file},...metadata.variants.map(v=>({path:upload.path.replace(/original$/,v.width+'.webp'),body:v.blob}))];
 const total=objects.reduce((n,o)=>n+o.body.size,0);let done=0;
 for(const object of objects){
  if(!attempt.completed.has(object.path)){
   progress('Uploading '+file.name,Math.floor(done/total*95));
   await new Promise<void>((resolve,reject)=>{
    const xhr=new XMLHttpRequest();xhr.open('POST',process.env.NEXT_PUBLIC_SUPABASE_URL+'/storage/v1/object/'+upload.bucket+'/'+object.path);
    xhr.timeout=180000;xhr.setRequestHeader('Authorization','Bearer '+session.access_token);xhr.setRequestHeader('apikey',process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);xhr.setRequestHeader('Content-Type',object.body.type);xhr.setRequestHeader('x-upsert','false');xhr.setRequestHeader('cache-control','max-age=3600');
    xhr.upload.onprogress=e=>{if(e.lengthComputable)progress('Uploading '+file.name,Math.floor((done+object.body.size*e.loaded/e.total)/total*95))};
    xhr.onload=()=>{if(xhr.status>=200&&xhr.status<300)resolve();else if(xhr.status===409||xhr.status===400&&/Duplicate|already exists/i.test(xhr.responseText))resolve();else reject(new Error('Upload failed ('+xhr.status+'). Retry to continue.'))};
    xhr.onerror=()=>reject(new Error('Network interrupted. Retry to continue.'));xhr.ontimeout=()=>reject(new Error('Upload timed out. Retry to continue.'));xhr.send(object.body);
   });attempt.completed.add(object.path);
  }done+=object.body.size;
 }
 progress('Verifying upload',95);const finished=await finalizeMedia(upload.id,{width:metadata.width,height:metadata.height,durationMs:metadata.durationMs,variants:metadata.variants.map(v=>v.width)});if(!finished.ok)throw new Error(finished.error);
 progress('Upload complete',100);return upload.id;
}
