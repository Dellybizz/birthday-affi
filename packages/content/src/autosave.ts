import type { PageDocument } from './cms';
export type SaveResult = {ok:true;revision:number}|{ok:false;code:'conflict'|'error';message:string};
export type SaveSnapshot = {status:'saved'|'waiting'|'saving'|'error'|'conflict';revision:number;saved:string;message:string};
/** Serializes saves and retains edits made while a request is in flight. */
export class DraftSaveQueue {
 private latest:PageDocument;
 private inFlight:Promise<void>|null=null;
 private listeners=new Set<()=>void>();
 private snapshot:SaveSnapshot;
 constructor(document:PageDocument,revision:number,private save:(document:PageDocument,revision:number)=>Promise<SaveResult>) {
  this.latest=document;this.snapshot={status:'saved',revision,saved:JSON.stringify(document),message:''};
 }
 getSnapshot=()=>this.snapshot;
 subscribe=(listener:()=>void)=>{this.listeners.add(listener);return ()=>{this.listeners.delete(listener)}};
 private set(next:Partial<SaveSnapshot>){this.snapshot={...this.snapshot,...next};this.listeners.forEach(listener=>listener())}
 stage(document:PageDocument){
  this.latest=document;
  if(this.snapshot.status==='conflict'||this.snapshot.status==='error'||this.inFlight)return;
  this.set({status:JSON.stringify(document)===this.snapshot.saved?'saved':'waiting'});
 }
 flush():Promise<void> {
  if(this.inFlight)return this.inFlight;
  if(this.snapshot.status==='conflict')return Promise.reject(new Error(this.snapshot.message));
  this.inFlight=this.run().finally(()=>{this.inFlight=null});return this.inFlight;
 }
 private async run(){
  try {
   while(JSON.stringify(this.latest)!==this.snapshot.saved){
    const document=structuredClone(this.latest);this.set({status:'saving',message:''});
    const result=await this.save(document,this.snapshot.revision);
    if(!result.ok){this.set({status:result.code==='conflict'?'conflict':'error',message:result.message});throw new Error(result.message)}
    this.set({revision:result.revision,saved:JSON.stringify(document)});
   }
   this.set({status:'saved',message:''});
  }catch(e){if(this.snapshot.status!=='conflict')this.set({status:'error',message:e instanceof Error?e.message:'Unable to save'});throw e}
 }
}
