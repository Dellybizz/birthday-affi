'use client';
/** Decode one silent frame with a bounded lifetime, then release its source. */
export async function createVideoPoster(source:Blob,timeoutMs=15000):Promise<Blob>{
 const url=URL.createObjectURL(source),video=document.createElement('video');video.muted=true;video.playsInline=true;video.preload='auto';
 let timer:ReturnType<typeof setTimeout>|undefined;
 try{return await new Promise<Blob>((resolve,reject)=>{
  let capturing=false;
  const fail=()=>reject(new Error('Unable to generate thumbnail. Try again or use a supported video.'));
  const capture=()=>{if(capturing||video.readyState<2)return;capturing=true;try{
   if(!video.videoWidth||!video.videoHeight)throw new Error('Missing video dimensions');
   const canvas=document.createElement('canvas');const scale=Math.min(1,960/video.videoWidth,960/video.videoHeight);canvas.width=Math.max(1,Math.round(video.videoWidth*scale));canvas.height=Math.max(1,Math.round(video.videoHeight*scale));
   if(canvas.height>20000)throw new Error('Invalid video dimensions');const context=canvas.getContext('2d');if(!context)throw new Error('Canvas unavailable');context.drawImage(video,0,0,canvas.width,canvas.height);
   canvas.toBlob(blob=>blob?.type==='image/webp'&&blob.size<=524288?resolve(blob):fail(),'image/webp',.8);
  }catch{fail()}};
  timer=setTimeout(fail,timeoutMs);video.onerror=fail;video.onloadedmetadata=()=>{const target=Math.min(.5,video.duration/2);if(Number.isFinite(target)&&target>0)video.currentTime=target;else capture()};video.onseeked=capture;video.onloadeddata=()=>{if(!video.seeking)capture()};video.src=url;video.load();
 })}finally{if(timer)clearTimeout(timer);video.onloadedmetadata=null;video.onloadeddata=null;video.onseeked=null;video.onerror=null;video.pause();video.removeAttribute('src');video.load();URL.revokeObjectURL(url)}
}
