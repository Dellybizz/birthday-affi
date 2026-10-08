export function mediaCancelled(){return new DOMException('Upload stopped. Saved bytes remain available for recovery.','AbortError')}
export async function boundedMedia<T>(operation:Promise<T>,message:string,timeoutMs=30000,signal?:AbortSignal):Promise<T>{
 if(signal?.aborted){void operation.catch(()=>{});throw mediaCancelled()}let timer:ReturnType<typeof setTimeout>|undefined,abort:(()=>void)|undefined;
 try{return await Promise.race([operation,new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new Error(message)),timeoutMs);abort=()=>reject(mediaCancelled());signal?.addEventListener('abort',abort,{once:true})})])}finally{if(timer)clearTimeout(timer);if(abort)signal?.removeEventListener('abort',abort)}
}
