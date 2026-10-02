import type { PageDocument } from './cms';
export type SaveResult = {ok:true;revision:number}|{ok:false;code:'conflict'|'error';message:string};
export type SaveSnapshot = {status:'saved'|'waiting'|'saving'|'error'|'conflict';revision:number;saved:string;message:string};
/** Serializes saves, but keeps full-document serialization off the edit interaction path. */
export class DraftSaveQueue {
 private latest:PageDocument;
 private savedDocument:PageDocument;
 private latestVersion=0;
 private savedVersion=0;
 private inFlight:Promise<void>|null=null;
 private listeners=new Set<()=>void>();
 private snapshot:SaveSnapshot;
 constructor(document:PageDocument,revision:number,private save:(document:PageDocument,revision:number)=>Promise<SaveResult>) {
  this.latest=document;this.savedDocument=document;this.snapshot={status:'saved',revision,saved:JSON.stringify(document),message:''};
 }
 getSnapshot=()=>this.snapshot;
 subscribe=(listener:()=>void)=>{this.listeners.add(listener);return ()=>{this.listeners.delete(listener)}};
 isSaved=(document:PageDocument)=>document===this.savedDocument&&this.latest===document&&this.latestVersion===this.savedVersion;
 private set(next:Partial<SaveSnapshot>){this.snapshot={...this.snapshot,...next};this.listeners.forEach(listener=>listener())}
 stage(document:PageDocument){
  if(document===this.latest)return;
  this.latest=document;this.latestVersion++;
  if(this.snapshot.status==='conflict'||this.snapshot.status==='error')return;
  if(this.inFlight)return;
  if(document===this.savedDocument){this.savedVersion=this.latestVersion;this.set({status:'saved',message:''});return}
  this.set({status:'waiting'});
 }
 flush():Promise<void> {
  if(this.inFlight)return this.inFlight;
  if(this.snapshot.status==='conflict')return Promise.reject(new Error(this.snapshot.message));
  if(this.latestVersion===this.savedVersion)return Promise.resolve();
  this.inFlight=this.run().finally(()=>{this.inFlight=null});return this.inFlight;
 }
 private async run(){
  try {
   while(this.savedVersion!==this.latestVersion){
    const source=this.latest,version=this.latestVersion,document=structuredClone(source);this.set({status:'saving',message:''});
    const result=await this.save(document,this.snapshot.revision);
    if(!result.ok){this.set({status:result.code==='conflict'?'conflict':'error',message:result.message});throw new Error(result.message)}
    this.savedVersion=version;this.savedDocument=source;this.set({revision:result.revision,saved:JSON.stringify(document)});
   }
   this.set({status:'saved',message:''});
  }catch(e){if(this.snapshot.status!=='conflict')this.set({status:'error',message:e instanceof Error?e.message:'Unable to save'});throw e}
 }
}
