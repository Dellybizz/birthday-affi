"use client";
import {useState} from 'react';
import Link from 'next/link';
import {protectedPageSlugs} from '@wiffeyyyy/content';
import {updatePageSettings} from '../lib/page-actions';
type Page={id:string;title:string;slug:string;settings:{description?:string;archived?:boolean};published_version_id:string|null};
function PageRow({page,canWrite}:{page:Page;canWrite:boolean}){
 const [title,setTitle]=useState(page.title),[slug,setSlug]=useState(page.slug),[description,setDescription]=useState(page.settings.description??''),[archived,setArchived]=useState(page.settings.archived===true),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const locked=protectedPageSlugs.includes(page.slug)||!!page.published_version_id;
 return <article className="rounded-2xl border bg-white p-5"><h2 className="font-semibold">{page.title} · {page.published_version_id?'Published':'Draft'}{archived?' · Archived':''}</h2><form className="mt-3 grid gap-3" onSubmit={async e=>{e.preventDefault();setBusy(true);try{await updatePageSettings(page.id,{title,slug,description},archived);setMessage('Page settings saved. Reload the page list to refresh links.')}catch(error){setMessage((error as Error).message)}finally{setBusy(false)}}}>
 <label>Title<input aria-label="Page title" required maxLength={120} value={title} disabled={!canWrite||busy} onChange={e=>setTitle(e.target.value)} className="ml-2 rounded border p-2"/></label>
 <label>Slug<input aria-label="Page slug" required value={slug} disabled={!canWrite||busy||locked} onChange={e=>setSlug(e.target.value)} className="ml-2 rounded border p-2"/></label>
 <label>Draft description<textarea aria-label="Page description" maxLength={300} value={description} disabled={!canWrite||busy} onChange={e=>setDescription(e.target.value)} className="mt-1 block w-full rounded border p-2"/></label>
 <label><input type="checkbox" checked={archived} disabled={!canWrite||busy||locked} onChange={e=>setArchived(e.target.checked)}/> Archive draft</label>
 <p className="text-xs">Built-in and published URLs are protected. Descriptions are saved as draft metadata; public SEO publishing is still pending.</p>
 <button disabled={!canWrite||busy} className="rounded border p-2">{busy?'Saving…':'Save page settings'}</button><p role="status">{message}</p>
 </form>{!archived&&<Link href={'/editor/'+page.slug} className="mt-3 inline-block underline">Edit content</Link>}</article>;
}
export function PageManager({pages,canWrite}:{pages:Page[];canWrite:boolean}){return <div className="mt-6 grid gap-4 md:grid-cols-2">{pages.map(page=><PageRow key={page.id} page={page} canWrite={canWrite}/>)}</div>}
