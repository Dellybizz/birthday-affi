import {matchesSignature} from './media-policy';
/** Bound header inspection even if a provider ignores Range or cancellation stalls. */
export async function verifyMediaObject(url:string,headers:Record<string,string>,object:{mime:string;size:number},timeoutMs=12000){
 const controller=new AbortController();let timer:ReturnType<typeof setTimeout>|undefined;let reader:ReadableStreamDefaultReader<Uint8Array>|undefined;
 try{
  await Promise.race([ (async()=>{
   const response=await fetch(url,{headers:{...headers,Range:'bytes=0-63'},cache:'no-store',signal:controller.signal});
   if(!response.ok)throw new Error('Uploaded file could not be verified. Retry verification.');
   const size=Number(response.headers.get('content-range')?.split('/')[1]??response.headers.get('content-length'));
   reader=response.body?.getReader();if(!reader)throw new Error('Missing upload body');
   const prefix=new Uint8Array(64);let length=0;
   while(length<64){const {value,done}=await reader.read();if(done)break;const chunk=value.subarray(0,64-length);prefix.set(chunk,length);length+=chunk.length}
   if((object.size&&size!==object.size)||!matchesSignature(object.mime,prefix.subarray(0,length)))throw new Error('File content or size does not match its declared type');
  })(),new Promise<never>((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(new Error('Verification timed out. Your file is saved; retry verification.'))},timeoutMs)})]);
 }finally{if(timer)clearTimeout(timer);controller.abort();void reader?.cancel().catch(()=>{})}
}
