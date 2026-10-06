"use client";
import {useActionState,useEffect,useRef} from 'react';
import {pageTemplates} from '@wiffeyyyy/content';
import {createPage} from '../lib/page-actions';
export function PageCreate({pages,sourceId='',request=0}:{pages:{id:string;title:string}[];sourceId?:string;request?:number}){
 const details=useRef<HTMLDetailsElement>(null),source=useRef<HTMLSelectElement>(null);
 useEffect(()=>{if(!sourceId)return;if(details.current)details.current.open=true;if(source.current)source.current.value=sourceId;details.current?.scrollIntoView({block:'nearest',behavior:'smooth'})},[sourceId,request]);
 const [state,action,pending]=useActionState(createPage,{error:''});
 return <details ref={details} className="mt-6 rounded-2xl border bg-white p-5"><summary className="cursor-pointer font-semibold">Create or duplicate a page</summary><form action={action} className="mt-4 grid gap-3 sm:grid-cols-2">
 <label className="admin-form-field">Page title<input required name="title" maxLength={120} className="mt-1 block w-full rounded-lg border p-2"/></label>
 <label className="admin-form-field">URL slug<input required name="slug" pattern="[a-z][a-z0-9-]{0,63}" maxLength={64} className="mt-1 block w-full rounded-lg border p-2"/><span className="text-xs">Public URL: /pages/your-slug after publication</span></label>
 <label className="admin-form-field">Template<select name="template" className="mt-1 block w-full rounded-lg border p-2"><option value="blank">Blank</option>{pageTemplates.filter(template=>template.id!=='radio').map(template=><option key={template.id} value={template.id}>{template.label}</option>)}</select></label>
 <label className="admin-form-field">Or duplicate a draft<select ref={source} name="sourceId" className="mt-1 block w-full rounded-lg border p-2"><option value="">Use template</option>{pages.map(p=><option key={p.id} value={p.id}>{p.title}</option>)}</select></label>
 <p className="text-sm sm:col-span-2">Creates an unpublished draft. Copies have independent content and shared media references.</p>
 {state.error&&<p role="alert" className="text-red-700 sm:col-span-2">{state.error}</p>}
 <button disabled={pending} className="admin-button admin-button-primary">{pending?'Creating…':'Create draft page'}</button>
 </form></details>;
}
