'use client';
import {useState} from 'react';
import {getAppEditorDefinition,getAppEditorItems,getAppEditorSections,type AppEditorActionKey,type AppEditorItem,type AppEditorMedia,type PageDocument} from '@wiffeyyyy/content';
import MediaLibrary from './media-library';

const button='rounded-md border border-[#c9cccf] bg-white px-3 py-2 text-[12px] font-medium text-[#303030] hover:bg-[#f6f6f7] disabled:cursor-not-allowed disabled:opacity-40';
const tiny='grid h-7 w-7 place-items-center rounded-md text-[11px] text-[#6d7175] hover:bg-white hover:text-[#202223] disabled:opacity-25';

function MediaThumb({item}:{item:AppEditorItem}){
 if(item.mediaKind==='image'&&item.src)return <span className="h-10 w-10 shrink-0 overflow-hidden rounded-md border border-[#e1e3e5] bg-[#f6f6f7]"><img src={item.src} alt="" className="h-full w-full object-cover"/></span>;
 const icon=item.mediaKind==='video'?'▶':item.mediaKind==='audio'?'♫':item.mediaKind==='image'?'▧':'◇';
 return <span aria-hidden className={'grid h-10 w-10 shrink-0 place-items-center rounded-md border border-[#e1e3e5] text-[13px] '+(item.src?'bg-[#eef7f2] text-[#008060]':'bg-[#f6f6f7] text-[#8c9196]')}>{icon}</span>;
}

type Props={
 slug:string;document:PageDocument;selectedId:string|null;siteId?:string;disabled:boolean;
 onSelect:(id:string)=>void;onAdd:(action:AppEditorActionKey)=>void;onMove:(id:string,direction:-1|1)=>void;onToggle:(id:string)=>void;onDuplicate:(id:string)=>void;onDelete:(id:string)=>void;onMedia:(id:string,media:AppEditorMedia)=>void;
};

export default function AppContentManager({slug,document,selectedId,siteId,disabled,onSelect,onAdd,onMove,onToggle,onDuplicate,onDelete,onMedia}:Props){
 const definition=getAppEditorDefinition(slug),items=getAppEditorItems(document,slug),sections=getAppEditorSections(document,slug),[picker,setPicker]=useState<AppEditorItem|null>(null);
 if(!definition)return <div className="p-4"><h2 className="text-[14px] font-semibold">App content</h2><p className="mt-2 text-[12px] leading-5 text-[#6d7175]">This page does not use a dedicated app-content collection.</p><div className="mt-3 grid gap-2"><a className={button} href="/media">Media library</a><a className={button} href="/audio">Audio</a><a className={button} href="/navigation">Navigation</a></div></div>;
 const openMedia=(item:AppEditorItem)=>{if(siteId&&item.mediaKind)setPicker(item);else onSelect(item.id)};
 return <>
 <div data-t10-app-content-manager={definition.slug}>
  <div className="border-b border-[#e1e3e5] px-4 py-3"><p className="text-[10px] font-semibold uppercase tracking-[.08em] text-[#8c9196]">App content</p><h2 className="mt-0.5 text-[15px] font-semibold text-[#202223]">{definition.title}</h2><p className="mt-1 text-[11px] leading-4 text-[#6d7175]">{definition.description}</p></div>
  <section className="border-b border-[#e1e3e5] p-3">
   <p className="px-1 text-[11px] font-semibold text-[#6d7175]">Add content</p>
   <div className="mt-2 grid grid-cols-2 gap-2">{definition.actions.map(action=><button key={action.key} type="button" className={button} disabled={disabled} onClick={()=>onAdd(action.key)}>+ {action.label.replace(/^Add /,'')}</button>)}</div>
  </section>
  <section className="border-b border-[#e1e3e5] p-2">
   <div className="flex items-center justify-between px-2 py-1"><p className="text-[11px] font-semibold text-[#6d7175]">Content</p><span className="rounded-full bg-[#f1f1f1] px-1.5 py-0.5 text-[9px] text-[#6d7175]">{items.length}</span></div>
   <div className="mt-1 space-y-3">{definition.actions.map(action=>{const group=items.filter(item=>item.actionKey===action.key);if(!group.length)return null;return <div key={action.key} data-t10-content-group={action.key}>
    <div className="flex items-center justify-between px-2 py-1"><span className="text-[10px] font-semibold uppercase tracking-[.06em] text-[#8c9196]">{action.singular}{group.length===1?'':'s'}</span><span className="text-[9px] text-[#8c9196]">{group.length}</span></div>
    <div className="space-y-1">{group.map((item,index)=><div key={item.id} data-t10-app-item={item.id} className={'group flex items-center gap-1 rounded-md p-1.5 '+(selectedId===item.id?'bg-[#eaf3ff]':'hover:bg-[#f6f6f7]')}>
     <button type="button" onClick={()=>onSelect(item.id)} aria-current={selectedId===item.id?'true':undefined} className="flex min-w-0 flex-1 items-center gap-2 text-left">
      <MediaThumb item={item}/><span className="min-w-0 flex-1"><span className={'block truncate text-[12px] font-medium '+(selectedId===item.id?'text-[#005bd3]':'text-[#303030]')}>{item.label}</span><span className="mt-0.5 flex items-center gap-1 text-[9px] text-[#8c9196]"><span className={'h-1.5 w-1.5 rounded-full '+(item.visible?'bg-[#008060]':'bg-[#c9cccf]')}/><span>{item.visible?'Visible':'Hidden'}</span><span>·</span><span>{item.src?'Media attached':'No media'}</span></span></span>
     </button>
     {item.mediaKind&&<button type="button" className="h-7 rounded px-1.5 text-[10px] font-medium text-[#005bd3] opacity-75 hover:bg-white hover:opacity-100" disabled={disabled} onClick={()=>openMedia(item)} title={item.src?'Replace media':'Add media'}>{item.src?'Media':'Add'}</button>}
     <div className="hidden items-center group-hover:flex group-focus-within:flex"><button type="button" className={tiny} disabled={disabled||index===0} aria-label={'Move '+item.label+' earlier'} onClick={()=>onMove(item.id,-1)}>↑</button><button type="button" className={tiny} disabled={disabled||index===group.length-1} aria-label={'Move '+item.label+' later'} onClick={()=>onMove(item.id,1)}>↓</button></div>
     <details className="relative"><summary className={tiny+' cursor-pointer list-none marker:hidden'} aria-label={'Actions for '+item.label}>•••</summary><div className="absolute right-0 z-30 mt-1 w-36 rounded-lg border border-[#c9cccf] bg-white p-1 shadow-xl">
      <button type="button" className="w-full rounded px-2 py-1.5 text-left text-[11px] hover:bg-[#f1f1f1]" disabled={disabled} onClick={()=>onToggle(item.id)}>{item.visible?'Hide':'Show'}</button>
      <button type="button" className="w-full rounded px-2 py-1.5 text-left text-[11px] hover:bg-[#f1f1f1]" disabled={disabled} onClick={()=>onDuplicate(item.id)}>Duplicate</button>
      {item.mediaKind&&<button type="button" className="w-full rounded px-2 py-1.5 text-left text-[11px] hover:bg-[#f1f1f1]" disabled={disabled} onClick={()=>openMedia(item)}>{item.src?'Replace media':'Add media'}</button>}
      <button type="button" className="w-full rounded px-2 py-1.5 text-left text-[11px] text-[#d72c0d] hover:bg-[#fff1f0]" disabled={disabled} onClick={()=>{if(window.confirm('Delete '+item.label+'?'))onDelete(item.id)}}>Delete</button>
     </div></details>
    </div>)}</div>
   </div>})}{!items.length&&<p className="px-2 py-4 text-center text-[11px] leading-4 text-[#8c9196]">{definition.emptyMessage}</p>}</div>
  </section>
  <section className="border-b border-[#e1e3e5] p-2">
   <p className="px-2 py-1 text-[11px] font-semibold text-[#6d7175]">App sections</p>
   <div className="mt-1 space-y-0.5">{sections.map(({entry,node})=><button key={entry.key} type="button" disabled={!node} onClick={()=>node&&onSelect(node.id)} className={'flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-[12px] '+(node&&selectedId===node.id?'bg-[#eaf3ff] text-[#005bd3]':'text-[#303030] hover:bg-[#f6f6f7] disabled:text-[#b5b5b5]')}><span aria-hidden className="grid h-6 w-6 place-items-center rounded border border-[#e1e3e5] bg-white text-[10px]">▣</span><span className="min-w-0 flex-1"><span className="block truncate font-medium">{entry.label}</span>{entry.description&&<span className="block truncate text-[9px] text-[#8c9196]">{entry.description}</span>}</span></button>)}</div>
  </section>
  <section className="p-3"><p className="px-1 text-[11px] font-semibold text-[#6d7175]">Shared resources</p><div className="mt-2 grid gap-2"><a className={button} href="/media">Media library</a><a className={button} href="/audio">Audio</a><a className={button} href="/navigation">Navigation</a></div></section>
 </div>
 {picker&&siteId&&picker.mediaKind&&<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/35 p-4" role="dialog" aria-modal="true" aria-label={'Choose media for '+picker.label}><div className="max-h-[90vh] w-full max-w-5xl overflow-auto rounded-xl bg-white p-5 shadow-2xl"><div className="mb-4"><p className="text-[11px] font-semibold uppercase tracking-[.08em] text-[#8c9196]">{definition.title}</p><h2 className="text-lg font-semibold">{picker.src?'Replace':'Add'} {picker.mediaKind} for {picker.label}</h2></div><MediaLibrary siteId={siteId} canWrite={!disabled} kind={picker.mediaKind} onClose={()=>setPicker(null)} onPick={media=>{onMedia(picker.id,media);setPicker(null)}}/></div></div>}
 </>;
}
