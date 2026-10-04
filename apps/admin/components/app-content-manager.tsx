'use client';
import {getAppEditorDefinition,getAppEditorItems,getAppEditorSections,type AppEditorActionKey,type PageDocument} from '@wiffeyyyy/content';

const button='rounded-md border border-[#c9cccf] bg-white px-3 py-2 text-[12px] font-medium text-[#303030] hover:bg-[#f6f6f7] disabled:cursor-not-allowed disabled:opacity-40';

export default function AppContentManager({slug,document,selectedId,disabled,onSelect,onAdd}:{slug:string;document:PageDocument;selectedId:string|null;disabled:boolean;onSelect:(id:string)=>void;onAdd:(action:AppEditorActionKey)=>void}){
 const definition=getAppEditorDefinition(slug),items=getAppEditorItems(document,slug),sections=getAppEditorSections(document,slug);
 if(!definition)return <div className="p-4"><h2 className="text-[14px] font-semibold">App content</h2><p className="mt-2 text-[12px] leading-5 text-[#6d7175]">This page does not use a dedicated app-content collection.</p><div className="mt-3 grid gap-2"><a className={button} href="/media">Media library</a><a className={button} href="/audio">Audio</a><a className={button} href="/navigation">Navigation</a></div></div>;
 return <div data-t10-app-content-manager={definition.slug}>
  <div className="border-b border-[#e1e3e5] px-4 py-3"><p className="text-[10px] font-semibold uppercase tracking-[.08em] text-[#8c9196]">App content</p><h2 className="mt-0.5 text-[15px] font-semibold text-[#202223]">{definition.title}</h2><p className="mt-1 text-[11px] leading-4 text-[#6d7175]">{definition.description}</p></div>
  <section className="border-b border-[#e1e3e5] p-3">
   <p className="px-1 text-[11px] font-semibold text-[#6d7175]">Add content</p>
   <div className="mt-2 grid grid-cols-2 gap-2">{definition.actions.map(action=><button key={action.key} type="button" className={button} disabled={disabled} onClick={()=>onAdd(action.key)}>+ {action.label.replace(/^Add /,'')}</button>)}</div>
  </section>
  <section className="border-b border-[#e1e3e5] p-2">
   <div className="flex items-center justify-between px-2 py-1"><p className="text-[11px] font-semibold text-[#6d7175]">Content</p><span className="rounded-full bg-[#f1f1f1] px-1.5 py-0.5 text-[9px] text-[#6d7175]">{items.length}</span></div>
   <div className="mt-1 space-y-0.5">{items.map(item=><button key={item.id} type="button" onClick={()=>onSelect(item.id)} aria-current={selectedId===item.id?'true':undefined} className={'group flex w-full items-center gap-2 rounded-md px-2 py-2 text-left '+(selectedId===item.id?'bg-[#eaf3ff] text-[#005bd3]':'text-[#303030] hover:bg-[#f6f6f7]')}>
    <span aria-hidden className={'h-2 w-2 shrink-0 rounded-full '+(item.visible?'bg-[#008060]':'bg-[#c9cccf]')}/>
    <span className="min-w-0 flex-1"><span className="block truncate text-[12px] font-medium">{item.label}</span><span className="block truncate text-[10px] text-[#8c9196]">{item.kind}{item.src?' · media attached':''}</span></span>
    <span aria-hidden className="text-[12px] text-[#8c9196]">›</span>
   </button>)}{!items.length&&<p className="px-2 py-4 text-center text-[11px] leading-4 text-[#8c9196]">{definition.emptyMessage}</p>}</div>
  </section>
  <section className="border-b border-[#e1e3e5] p-2">
   <p className="px-2 py-1 text-[11px] font-semibold text-[#6d7175]">App sections</p>
   <div className="mt-1 space-y-0.5">{sections.map(({entry,node})=><button key={entry.key} type="button" disabled={!node} onClick={()=>node&&onSelect(node.id)} className={'flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-[12px] '+(node&&selectedId===node.id?'bg-[#eaf3ff] text-[#005bd3]':'text-[#303030] hover:bg-[#f6f6f7] disabled:text-[#b5b5b5]')}><span aria-hidden className="grid h-6 w-6 place-items-center rounded border border-[#e1e3e5] bg-white text-[10px]">▣</span><span className="min-w-0 flex-1"><span className="block truncate font-medium">{entry.label}</span>{entry.description&&<span className="block truncate text-[9px] text-[#8c9196]">{entry.description}</span>}</span></button>)}</div>
  </section>
  <section className="p-3"><p className="px-1 text-[11px] font-semibold text-[#6d7175]">Shared resources</p><div className="mt-2 grid gap-2"><a className={button} href="/media">Media library</a><a className={button} href="/audio">Audio</a><a className={button} href="/navigation">Navigation</a></div></section>
 </div>;
}
