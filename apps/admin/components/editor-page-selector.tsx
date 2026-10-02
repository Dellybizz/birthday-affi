'use client';
import {useMemo,useRef,useState} from 'react';
import type {EditorPageGroup,EditorPageItem} from '../lib/editor-pages';
const groupLabels:Record<EditorPageGroup,string>={active:'Active experiences',drafts:'Custom pages & drafts',legacy:'Saved / legacy',runtime:'Runtime apps'};
const groupOrder:EditorPageGroup[]=['active','drafts','legacy','runtime'];
export function EditorPageSelector({pages,currentSlug,busy,onSelect}:{pages:EditorPageItem[];currentSlug:string;busy:boolean;onSelect:(page:EditorPageItem)=>Promise<void>|void}){
 const details=useRef<HTMLDetailsElement>(null);const [query,setQuery]=useState('');
 const current=pages.find(page=>page.slug===currentSlug);
 const filtered=useMemo(()=>{const needle=query.trim().toLowerCase();return needle?pages.filter(page=>[page.title,page.sourceTitle,page.slug,page.badge].some(value=>value?.toLowerCase().includes(needle))):pages},[pages,query]);
 return <details ref={details} className="relative min-w-[260px] max-w-[420px] flex-1">
  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl border bg-white px-3 py-2 text-sm shadow-sm marker:hidden">
   <span className="min-w-0"><span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-[#81736d]">Page</span><span className="block truncate font-semibold">{current?.title??currentSlug}</span></span>
   <span className="shrink-0 rounded-full bg-[#f7f5f3] px-2 py-1 text-[10px] text-[#6f625d]">{current?.badge??'Draft'}</span><span aria-hidden>⌄</span>
  </summary>
  <div className="absolute left-1/2 z-50 mt-2 w-[min(430px,92vw)] -translate-x-1/2 rounded-2xl border bg-white p-3 shadow-2xl">
   <label className="block text-xs font-medium text-[#6f625d]">Find a page<input autoFocus className="mt-1 w-full rounded-xl border bg-[#faf9f8] px-3 py-2 text-sm text-[#302927]" value={query} onChange={event=>setQuery(event.target.value)} onKeyDown={event=>{if(event.key==='Escape')details.current?.removeAttribute('open')}} placeholder="Search pages and apps"/></label>
   <div className="mt-3 max-h-[60vh] overflow-auto pr-1">{groupOrder.map(group=>{const items=filtered.filter(page=>page.group===group);if(!items.length)return null;return <section key={group} className="mb-4 last:mb-0"><h3 className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#81736d]">{groupLabels[group]}</h3><div className="space-y-1">{items.map(page=><button key={page.group+page.slug} type="button" disabled={busy||!page.editorEnabled||page.slug===currentSlug} aria-current={page.slug===currentSlug?'page':undefined} onClick={()=>{details.current?.removeAttribute('open');void onSelect(page)}} className={'flex w-full items-start justify-between gap-3 rounded-xl px-3 py-2 text-left transition '+(page.slug===currentSlug?'bg-[#f7e5eb]':page.editorEnabled?'hover:bg-[#f7f5f3]':'cursor-not-allowed opacity-60')}><span className="min-w-0"><span className="block truncate text-sm font-medium">{page.title}</span><span className="mt-0.5 block text-[11px] text-[#81736d]">/{page.slug} · {page.note}</span>{page.sourceTitle&&<span className="mt-0.5 block text-[10px] text-[#9a8e88]">Saved title: {page.sourceTitle}</span>}</span><span className="shrink-0 rounded-full border px-2 py-1 text-[10px]">{page.badge}</span></button>)}</div></section>})}{!filtered.length&&<p className="p-4 text-center text-sm text-[#81736d]">No matching pages.</p>}</div>
  </div>
 </details>;
}
