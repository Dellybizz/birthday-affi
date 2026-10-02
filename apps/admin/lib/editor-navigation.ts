export type SwitchResult={ok:true}|{ok:false;reason:'unavailable'|'conflict'|'save-failed';message:string};
export async function saveBeforeEditorSwitch(input:{targetHref:string|null;canWrite:boolean;saveStatus:string;flush:()=>Promise<void>;navigate:(href:string)=>void}):Promise<SwitchResult>{
 if(!input.targetHref)return {ok:false,reason:'unavailable',message:'This page does not have an editor yet.'};
 if(input.saveStatus==='conflict')return {ok:false,reason:'conflict',message:'Resolve the draft conflict before switching pages.'};
 try{if(input.canWrite)await input.flush();input.navigate(input.targetHref);return {ok:true}}
 catch(error){return {ok:false,reason:'save-failed',message:'Page switch cancelled because the current draft could not be saved. '+(error instanceof Error?error.message:'Try saving again.')};}
}
