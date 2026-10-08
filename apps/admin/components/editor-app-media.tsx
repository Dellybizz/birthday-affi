'use client';
import {useEffect,useRef,useState} from 'react';
import {addAppItem,getOrderedNodes,mediaSelectionPatch,updateNode,type PageDocument} from '@wiffeyyyy/content';
import MediaLibrary from './media-library';
import type {MediaAsset} from '../lib/media-policy';

type ItemKind='post'|'reel'|'photo'|'video';
const options:Record<string,{kind:ItemKind;label:string;media:'image'|'video'}[]>={
 movie:[{kind:'post',label:'Post',media:'image'},{kind:'reel',label:'Reel',media:'video'}],
 adventure:[{kind:'photo',label:'Photo',media:'image'},{kind:'video',label:'Video',media:'video'}]
};
const button='rounded-md border border-[#c9cccf] bg-white px-3 py-2 text-[13px] font-medium hover:bg-[#f6f6f7] disabled:opacity-40';
export default function EditorAppMedia({document,app,siteId,canWrite,selectedId,onSelect,onCommit}:{document:PageDocument;app:string;siteId?:string;canWrite:boolean;selectedId:string|null;onSelect:(id:string)=>void;onCommit:(operation:()=>{document:PageDocument;selectedId:string})=>void}){
 const [target,setTarget]=useState<ItemKind|null>(null),[error,setError]=useState('');
 const dialog=useRef<HTMLDialogElement>(null);
 const choices=options[app],choice=choices?.find(item=>item.kind===target);
 useEffect(()=>{if(target)dialog.current?.showModal();else dialog.current?.close()},[target]);
 if(!choices)return null;
 const collection=document.nodes.find(node=>node.props.sectionKind===(app==='movie'?'movie-player':'photo-library'));
 const items=getOrderedNodes(document).filter(node=>node.parentId===collection?.id&&['movie-scene','image','video'].includes(node.component));
 const add=(media:MediaAsset)=>{
  if(!choice||!canWrite)return;
  if(media.kind!==choice.media){setError('Choose '+(choice.media==='image'?'an image':'a video')+' for this item.');return}
  try{
   const result=addAppItem(document,app,choice.kind,crypto.randomUUID());
   const next=updateNode(result.document,result.selectedId,{label:choice.label+' · '+media.filename,props:{...mediaSelectionPatch({key:'src',label:choice.label,kind:choice.media},media),title:media.filename.replace(/\.[^.]+$/,''),body:media.caption??''}});
   onCommit(()=>({document:next,selectedId:result.selectedId}));setTarget(null);setError('');
  }catch(error){setError(error instanceof Error?error.message:'Unable to add media')}
 };
 return <section aria-label="App media" className="border-b border-[#e1e3e5] p-3">
  <h3 className="text-[13px] font-semibold">{app==='movie'?'Saragram':'Pardanasheen'} media</h3>
  <p className="mt-1 text-[12px] leading-5 text-[#6d7175]">Upload or choose media, then edit its caption and details. Changes appear in the live preview; publish when ready.</p>
  <div className="mt-2 grid grid-cols-2 gap-2">{choices.map(item=><button key={item.kind} className={button} disabled={!canWrite||!siteId||!collection} onClick={()=>{setError('');setTarget(item.kind)}}>+ Add {item.kind}</button>)}</div>
  {!collection&&<p className="mt-2 text-xs" role="status">Restore the app collection to add media.</p>}
  {items.length?<ul className="mt-2 max-h-48 overflow-auto">{items.map(node=><li key={node.id}><button className={'w-full truncate rounded-md px-2 py-2 text-left text-[12px] '+(selectedId===node.id?'bg-[#9b4361] text-white':'hover:bg-[#f1f1f1]')} onClick={()=>onSelect(node.id)}>{node.label??node.props.title??node.component}{!node.visible?' · Hidden':''}</button></li>)}</ul>:<p className="mt-2 text-[12px] text-[#6d7175]">No media added yet.</p>}
  {siteId&&choice&&<dialog ref={dialog} aria-label={'Add '+choice.label+' to '+(app==='movie'?'Saragram':'Pardanasheen')} onCancel={()=>setTarget(null)} onClose={()=>setTarget(null)} className="max-h-[90vh] w-[min(1100px,95vw)] overflow-auto rounded-xl border bg-white p-4 shadow-xl">
   <div className="mb-3 flex items-center justify-between gap-3"><h2 className="font-semibold">Add {choice.label.toLowerCase()} to {app==='movie'?'Saragram':'Pardanasheen'}</h2><button className={button} onClick={()=>setTarget(null)}>Close</button></div>
   <p className="mb-3 text-sm text-[#6d7175]">Upload a file below or select an existing {choice.media==='image'?'image':'video'} and press “Use this {choice.media}”.</p>
   {error&&<p role="alert" className="mb-3 text-sm text-red-700">{error}</p>}
   <MediaLibrary key={choice.kind} siteId={siteId} canWrite={canWrite} kind={choice.media} onPick={add} onClose={()=>setTarget(null)}/>
  </dialog>}
 </section>;
}
