'use client';
import {useMemo,useRef,useState} from 'react';
import type {EditorPageGroup,EditorPageItem} from '../lib/editor-pages';
const groupLabels:Record<EditorPageGroup,string>={active:'Active experiences',drafts:'Custom pages & drafts',legacy:'Saved / legacy',runtime:'Runtime apps'};
const groupOrder:EditorPageGroup[]=['active','drafts','legacy','runtime'];
export function EditorPageSelector({pages,currentSlug,busy,onSelect}:{pages:EditorPageItem[];currentSlug:string;busy:boolean;onSelect:(page:EditorPageItem)=>Promise<void>|void}){
 const details=useRef<HTMLDetailsElement>(null);const [query,setQuery]=useState('');
 const current=pages.find(page=>page.slug===currentSlug);
 const filtered=useMemo(()=>{const needle=query.trim().toLowerCase();return needle?pages.filter(page=>[page.title,page.sourceTitle,page.slug,page.badge].some(value=>value?.toLowerCase().includes(needle))):pages},[pages,query]);
 return <details ref={details} data-editor-context="Inspector" className="relative">
  <summary className="flex h-8 min-w-[150px] max-w-[240px] cursor-pointer list-none items-center gap-2 rounded-md px-2 text-[13px] font-medium text-[#303030] hover:bg-[#f1f1f1] marker:hidden">
   <span aria-hidden className="text-[14px]">⌂</span><span className="min-w-0 flex-1 truncate">{current?.title??(currentSlug||'Home page')}</span><span aria-hidden className="text-[10px] text-[#6d7175]">⌄</span>
  </summary>
  <div className="absolute left-1/2 z-50 mt-1 w-[min(390px,92vw)] -translate-x-1/2 overflow-hidden rounded-lg border border-[#c9cccf] bg-white shadow-[0_8px_30px_rgba(0,0,0,.16)]">
   <div className="border-b border-[#e1e3e5] p-2"><label className="sr-only" htmlFor="editor-page-search">Find a page</label><input id="editor-page-search" autoFocus className="h-9 w-full rounded-md border border-[#8c9196] bg-white px-3 text-sm outline-none focus:border-[#005bd3] focus:ring-1 focus:ring-[#005bd3]" value={query} onChange={event=>setQuery(event.target.value)} onKeyDown={event=>{if(event.key==='Escape')details.current?.removeAttribute('open')}} placeholder="Search pages and apps"/></div>
   <div className="max-h-[62vh] overflow-auto p-2">{groupOrder.map(group=>{const items=filtered.filter(page=>page.group===group);if(!items.length)return null;return <section key={group} className="mb-3 last:mb-0"><h3 className="mb-1 px-2 text-[11px] font-semibold text-[#6d7175]">{groupLabels[group]}</h3><div>{items.map(page=><button key={page.group+page.slug} type="button" disabled={busy||!page.editorEnabled||page.slug===currentSlug} aria-current={page.slug===currentSlug?'page':undefined} onClick={()=>{details.current?.removeAttribute('open');void onSelect(page)}} className={'flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm '+(page.slug===currentSlug?'bg-[#f1f1f1] font-semibold':page.editorEnabled?'hover:bg-[#f6f6f7]':'cursor-not-allowed opacity-50')}><span aria-hidden className="w-4 text-center text-xs">{page.group==='runtime'?'◇':'▣'}</span><span className="min-w-0 flex-1"><span className="block truncate">{page.title}</span>{page.sourceTitle&&page.sourceTitle!==page.title&&<span className="block truncate text-[11px] font-normal text-[#6d7175]">Saved as {page.sourceTitle}</span>}</span><span className="shrink-0 text-[10px] font-normal text-[#6d7175]">{page.badge}</span></button>)}</div></section>})}{!filtered.length&&<p className="p-4 text-center text-sm text-[#6d7175]">No matching pages.</p>}</div>
  </div>
 </details>;
}
