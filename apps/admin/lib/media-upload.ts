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
export async function uploadMedia(siteId:string,file:File,progress:(message:string)=>void){
 const kind=mediaKind(file.type);if(!kind)throw new Error('Choose an image, video or audio file');const check=validateMedia(kind,file.size,file.type);if(!check.ok)throw new Error(check.error);
 progress('Reading file and preparing image sizes…');const metadata=await describe(file);const upload=await reserveMedia({siteId,kind,filename:file.name,mimeType:file.type,size:file.size});
 const db=createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
 const put=async(path:string,body:File|Blob)=>{const {error}=await db.storage.from(upload.bucket).upload(path,body,{upsert:false,contentType:body.type,cacheControl:'3600'});if(error)throw new Error('Upload failed. '+error.message)};
 progress('Uploading original…');await put(upload.path,file);
 for(const variant of metadata.variants){progress('Uploading '+variant.width+'px image…');await put(upload.path.replace(/original$/,variant.width+'.webp'),variant.blob)}
 progress('Verifying upload…');await finalizeMedia(upload.id,{width:metadata.width,height:metadata.height,durationMs:metadata.durationMs,variants:metadata.variants.map(v=>v.width)});
 progress('Upload complete');return upload.id;
}
