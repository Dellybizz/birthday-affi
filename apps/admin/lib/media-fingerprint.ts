import {createHash} from 'node:crypto';
import {matchesSignature} from './media-policy';
/** Stream the authenticated original, bounded by both time and reserved size. */
export async function fingerprintMediaObject(url:string,headers:Record<string,string>,expected:{size:number;mime:string},timeoutMs=12000){
 const controller=new AbortController();let timer:ReturnType<typeof setTimeout>|undefined,reader:ReadableStreamDefaultReader<Uint8Array>|undefined;
 try{return await Promise.race([(async()=>{
  if(!Number.isSafeInteger(expected.size)||expected.size<1||expected.size>52428800)throw new Error('Invalid file size');
  const response=await fetch(url,{headers,cache:'no-store',signal:controller.signal});if(!response.ok||!response.body)throw new Error('Unable to read the saved original');
  const length=response.headers.get('content-length');if(length!==null&&Number(length)!==expected.size)throw new Error('Saved file size does not match');
  reader=response.body.getReader();const hash=createHash('sha256'),prefix=new Uint8Array(64);let bytes=0,prefixLength=0;
  while(true){const part=await reader.read();if(part.done)break;bytes+=part.value.length;if(bytes>expected.size)throw new Error('Saved file exceeds its reserved size');if(prefixLength<64){const chunk=part.value.subarray(0,64-prefixLength);prefix.set(chunk,prefixLength);prefixLength+=chunk.length}hash.update(part.value)}
  if(bytes!==expected.size||!matchesSignature(expected.mime,prefix.subarray(0,prefixLength)))throw new Error('Saved file content does not match');return hash.digest('hex');
 })(),new Promise<never>((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(new Error('Duplicate scan timed out. Retry this file.'))},timeoutMs)})])}finally{if(timer)clearTimeout(timer);controller.abort();void reader?.cancel().catch(()=>{})}
}
