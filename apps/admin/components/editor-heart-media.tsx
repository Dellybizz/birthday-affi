'use client';
import {useEffect,useRef,useState} from 'react';
import {getOrderedNodes,insertNode,mediaSelectionPatch,updateNode,type PageDocument} from '@wiffeyyyy/content';
import EditorMediaPicker from './editor-media-picker';
import type {MediaAsset} from '../lib/media-policy';

type Target={kind:'image'|'video';nodeId?:string};
const button='rounded-md border border-[#c9cccf] bg-white px-3 py-2 text-[12px] font-medium text-[#303030] hover:bg-[#f6f6f7] disabled:opacity-40';
export default function EditorHeartMedia({document,siteId,canWrite,selectedId,onSelect,onCommit}:{document:PageDocument;siteId?:string;canWrite:boolean;selectedId:string|null;onSelect:(id:string)=>void;onCommit:(operation:()=>{document:PageDocument;selectedId:string})=>void}){
 const [target,setTarget]=useState<Target|null>(null),[error,setError]=useState(''),[batchMode,setBatchMode]=useState<'fill'|'add'>('fill');
 const dialog=useRef<HTMLDialogElement>(null);
 const collection=document.nodes.find(node=>node.props.heartPart==='memories');
 const memories=getOrderedNodes(document).filter(node=>node.props.heartPart==='memory'&&['image','video'].includes(node.component));
 useEffect(()=>{if(target)dialog.current?.showModal();else dialog.current?.close()},[target]);
 const open=(next:Target)=>{setError('');setTarget(next)};
 const applyBatch=(assets:MediaAsset[])=>{
  if(!target||target.nodeId||!canWrite||!collection||!assets.length)return;
  try{
   if(assets.some(asset=>asset.kind!==target.kind||asset.status!=='ready'))throw new Error('Choose ready files of the matching media type.');
   let next=document,lastId='';
   const slots=batchMode==='fill'?memories.filter(node=>node.component===target.kind&&node.visible):[];
   assets.forEach((media,index)=>{
    let id=slots[index]?.id;
    if(!id){id=crypto.randomUUID();next=insertNode(next,target.kind,id,collection.id);next=updateNode(next,id,{label:'Heart memory · '+media.filename,props:{heartPart:'memory',title:media.filename.replace(/\.[^.]+$/,''),body:media.caption??'',objectFit:'cover',focalX:50,focalY:50,offsetX:0,offsetY:0,offsetZ:0,cardScale:1}})}
    next=updateNode(next,id,{props:mediaSelectionPatch({key:'src',label:'Heart memory',kind:target.kind},media)});lastId=id;
   });
   onCommit(()=>({document:next,selectedId:lastId}));setTarget(null);
  }catch(error){setError(error instanceof Error?error.message:'Unable to update memory cards')}
 };
 const apply=(media:MediaAsset)=>{
  if(!target||!canWrite||media.kind!==target.kind)return;
  try{
   let next=document,id=target.nodeId;
   if(!id){
    if(!collection)throw new Error('The Heart memories section is missing.');
    id=crypto.randomUUID();next=insertNode(document,target.kind,id,collection.id);
    next=updateNode(next,id,{label:'Heart memory · '+media.filename,props:{heartPart:'memory',title:media.filename.replace(/\.[^.]+$/,''),body:media.caption??'',objectFit:'cover',focalX:50,focalY:50,offsetX:0,offsetY:0,offsetZ:0,cardScale:1}});
   }
   const memory=next.nodes.find(node=>node.id===id);
   if(!memory||memory.props.heartPart!=='memory'||memory.component!==target.kind)throw new Error('Select the memory to replace again.');
   next=updateNode(next,id,{props:mediaSelectionPatch({key:'src',label:'Heart memory',kind:target.kind},media)});
   const selectedId=id;onCommit(()=>({document:next,selectedId}));setTarget(null);
  }catch(error){setError(error instanceof Error?error.message:'Unable to update this memory')}
 };
 return <section aria-label="Heart media" className="border-b border-[#e1e3e5] p-3">
  <h3 className="text-[13px] font-semibold">Heart photos & videos</h3>
  <p className="mt-1 text-[12px] leading-5 text-[#6d7175]">Select several photos or videos to fill separate memory cards, or replace an individual memory below.</p>
  <div className="mt-2 grid grid-cols-2 gap-2"><button className={button} disabled={!canWrite||!siteId||!collection} onClick={()=>open({kind:'image'})}>+ Upload photo</button><button className={button} disabled={!canWrite||!siteId||!collection} onClick={()=>open({kind:'video'})}>+ Upload video</button></div>
  <ul className="mt-3 max-h-64 overflow-auto" aria-label="Heart memory media">{memories.map(node=><li key={node.id} className={'mb-1 rounded-md border p-2 '+(selectedId===node.id?'border-[#9b4361] bg-[#fff1f5]':'border-[#e1e3e5]')}><button className="w-full truncate text-left text-[12px] font-medium" onClick={()=>onSelect(node.id)}>{node.label??node.props.title??'Memory'}{!node.visible?' · Hidden':''}</button><button className={button+' mt-2 w-full'} disabled={!canWrite||!siteId} aria-label={'Upload or replace '+(node.label??'memory')} onClick={()=>{onSelect(node.id);open({kind:node.component as Target['kind'],nodeId:node.id})}}>Upload / Replace {node.component==='image'?'photo':'video'}</button></li>)}</ul>
  {!memories.length&&<p className="mt-2 text-xs text-[#6d7175]">No memories added yet.</p>}
  {target&&siteId&&<dialog ref={dialog} aria-label={target.nodeId?'Replace Heart media':'Add Heart media'} onCancel={()=>setTarget(null)} onClose={()=>setTarget(null)} className="fixed inset-4 z-50 m-auto max-h-[90vh] w-[min(1100px,95vw)] overflow-auto rounded-xl border bg-white p-4 shadow-xl"><div className="mb-3 flex items-center justify-between gap-3"><h2 className="font-semibold">{target.nodeId?'Upload or replace':'Add'} Heart {target.kind==='image'?'photo':'video'}</h2><button className={button} onClick={()=>setTarget(null)}>Close</button></div><p className="mb-3 text-sm text-[#6d7175]">{target.nodeId?'Choose one file to replace this memory.':'Select multiple files. Each selected file updates one separate memory card.'}</p>{!target.nodeId&&<label className="mb-3 block text-sm">Apply selected media<select className="ml-2 rounded border p-2" value={batchMode} onChange={event=>setBatchMode(event.target.value as 'fill'|'add')}><option value="fill">Update existing cards in order</option><option value="add">Add new memory cards</option></select><span className="mt-1 block text-xs text-[#6d7175]">Existing titles, notes and card positions stay unchanged. Extra files create new cards.</span></label>}{error&&<p role="alert" className="mb-3 text-sm text-red-700">{error}</p>}<EditorMediaPicker key={target.nodeId??target.kind} multiple={!target.nodeId} onPickMany={applyBatch} siteId={siteId} kind={target.kind} canWrite={canWrite} onPick={apply} uploadInitiallyOpen/></dialog>}
 </section>;
}
