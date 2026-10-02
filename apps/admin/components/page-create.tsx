"use client";
import {useActionState} from 'react';
import {createPage} from '../lib/page-actions';
export function PageCreate({pages}:{pages:{id:string;title:string}[]}){
 const [state,action,pending]=useActionState(createPage,{error:''});
 return <details className="mt-6 rounded-2xl border bg-white p-5"><summary className="cursor-pointer font-semibold">Create or duplicate a page</summary><form action={action} className="mt-4 grid gap-3 sm:grid-cols-2">
 <label>Page title<input required name="title" maxLength={120} className="mt-1 block w-full rounded-lg border p-2"/></label>
 <label>URL slug<input required name="slug" pattern="[a-z][a-z0-9-]{0,63}" maxLength={64} className="mt-1 block w-full rounded-lg border p-2"/><span className="text-xs">Public URL: /pages/your-slug after publication</span></label>
 <label>Template<select name="template" className="mt-1 block w-full rounded-lg border p-2"><option value="blank">Blank</option><option value="greeting">Birthday greeting</option><option value="photo-story">Photo story</option><option value="memories-archive">Memories Archive</option><option value="app-home">App home</option></select></label>
 <label>Or duplicate a draft<select name="sourceId" className="mt-1 block w-full rounded-lg border p-2"><option value="">Use template</option>{pages.map(p=><option key={p.id} value={p.id}>{p.title}</option>)}</select></label>
 <p className="text-sm sm:col-span-2">Creates an unpublished draft. Copies have independent content and shared media references.</p>
 {state.error&&<p role="alert" className="text-red-700 sm:col-span-2">{state.error}</p>}
 <button disabled={pending} className="rounded-xl bg-[#d86f91] p-3 font-semibold text-white disabled:opacity-50">{pending?'Creating…':'Create draft page'}</button>
 </form></details>;
}
