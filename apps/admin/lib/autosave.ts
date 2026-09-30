export type AutosaveState="idle"|"dirty"|"saving"|"saved"|"error";
export function createAutosaveController(save:(document:unknown)=>Promise<void>,delay=800){
 let timer:ReturnType<typeof setTimeout>|undefined;
 return {
   schedule(document:unknown){if(timer)clearTimeout(timer);return new Promise<void>((resolve,reject)=>{timer=setTimeout(async()=>{try{await save(document);resolve()}catch(error){reject(error)}},delay)})},
   cancel(){if(timer)clearTimeout(timer)}
 };
}
