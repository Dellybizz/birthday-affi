'use client';
import {useEffect,useMemo,useState} from 'react';
import {useRouter} from 'next/navigation';
import Link from 'next/link';
import {getExperience,protectedPageSlugs} from '@wiffeyyyy/content';
import {updatePageSettings} from '../lib/page-actions';
import {filterPages,type ManagedPage,type PageTab} from '../lib/page-catalog';
import {AdminStatus} from './admin-status';
import {AdminIcon} from './admin-icon';
import {PageCreate} from './page-create';

function PageDetails({page,canWrite,canPublish,onSaved,onClose}:{page:ManagedPage;canWrite:boolean;canPublish:boolean;onSaved:(page:ManagedPage)=>void;onClose:()=>void}){
 const router=useRouter();
 const [values,setValues]=useState({title:page.title,slug:page.slug,description:page.settings.description??'',seoTitle:page.settings.seoTitle??'',seoDescription:page.settings.seoDescription??'',socialImage:page.settings.socialImage??'',noIndex:page.settings.noIndex??false});
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 const locked=protectedPageSlugs.includes(page.slug),liveRouteLocked=Boolean(page.published_version_id)&&!canPublish;
 const set=(key:string,value:string|boolean)=>setValues(old=>({...old,[key]:value}));
 return <section aria-label={'Settings for '+page.title} className="mt-5 rounded-2xl border border-black/10 bg-[#faf8f7] p-5">
  <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-semibold">Page settings · {page.title}</h2><button className="admin-button" onClick={onClose} disabled={busy}>Close</button></div>
  <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={async event=>{event.preventDefault();if(busy||!canWrite)return;if(page.published_version_id&&values.slug!==page.slug&&!window.confirm('Rename this published URL? Visitors using the old address will be redirected to the new address.'))return;setBusy(true);setError('');try{const result=await updatePageSettings(page.id,values,page.settings.archived===true,page.updated_at);onSaved({...page,...result.page,status:page.published_version_id?'changed':'draft'});router.refresh()}catch(error){setError(error instanceof Error?error.message:'Unable to save page settings.')}finally{setBusy(false)}}}>
   <label className="admin-form-field">Page title<input required maxLength={120} value={values.title} disabled={!canWrite||busy} onChange={e=>set('title',e.target.value)}/></label>
   <label className="admin-form-field">URL slug<input required pattern="[a-z][a-z0-9-]{0,63}" maxLength={64} value={values.slug} disabled={!canWrite||busy||locked||liveRouteLocked} onChange={e=>set('slug',e.target.value)}/><span className="text-xs font-normal text-[#766a65]">{locked?'Built-in address is protected.':liveRouteLocked?'An owner must rename a published page.':'Old published addresses keep redirecting to this page.'}</span></label>
   <label className="admin-form-field sm:col-span-2">Description<textarea maxLength={300} rows={3} value={values.description} disabled={!canWrite||busy} onChange={e=>set('description',e.target.value)}/></label>
   <fieldset className="grid gap-4 rounded-xl border border-black/10 bg-white p-4 sm:col-span-2 sm:grid-cols-2" disabled={!canWrite||busy}><legend className="px-2 text-sm font-semibold">Search and sharing</legend>
    <label className="admin-form-field">Search title<input maxLength={70} value={values.seoTitle} placeholder={values.title} onChange={e=>set('seoTitle',e.target.value)}/></label>
    <label className="admin-form-field">Sharing image URL<input value={values.socialImage} placeholder="/media/… or https://…" onChange={e=>set('socialImage',e.target.value)}/></label>
    <label className="admin-form-field sm:col-span-2">Search description<textarea maxLength={160} rows={2} value={values.seoDescription} placeholder={values.description} onChange={e=>set('seoDescription',e.target.value)}/></label>
    <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" checked={values.noIndex} onChange={e=>set('noIndex',e.target.checked)}/>Hide this page from search engines</label>
    <div aria-label="Search preview" className="rounded-lg bg-[#f6f4f2] p-3 sm:col-span-2"><p className="text-xs text-[#766a65]">/pages/{values.slug}</p><p className="mt-1 text-base text-[#624885]">{values.seoTitle||values.title}</p><p className="mt-1 text-sm text-[#766a65]">{values.seoDescription||values.description||'Add a description for search results.'}</p></div>
   </fieldset>
   <p className="text-xs leading-5 text-[#766a65] sm:col-span-2">Title, description and search settings remain draft changes until publication. Renaming a live custom route applies immediately and preserves its old address.</p>
   {error&&<p role="alert" className="text-sm text-red-700 sm:col-span-2">{error}</p>}
   <button className="admin-button admin-button-primary justify-self-start" disabled={!canWrite||busy}>{busy?'Saving…':'Save page settings'}</button>
  </form>
 </section>;
}

export function PageManager({pages,canWrite,canPublish=false,publicSiteUrl=''}:{pages:ManagedPage[];canWrite:boolean;canPublish?:boolean;publicSiteUrl?:string}){
 const router=useRouter();
 const [rows,setRows]=useState(pages),[query,setQuery]=useState(''),[tab,setTab]=useState<PageTab>('active'),[selected,setSelected]=useState<string|null>(null),[duplicate,setDuplicate]=useState<string|null>(null),[duplicateRequest,setDuplicateRequest]=useState(0),[busy,setBusy]=useState<string|null>(null),[message,setMessage]=useState(''),[error,setError]=useState('');
 useEffect(()=>setRows(pages),[pages]);
 const visible=useMemo(()=>filterPages(rows,query,tab),[rows,query,tab]),current=rows.find(page=>page.id===selected);
 const upsert=(page:ManagedPage)=>setRows(old=>old.map(row=>row.id===page.id?page:row));
 const archive=async(page:ManagedPage)=>{if(busy||!canWrite)return;const archived=page.settings.archived!==true;if(archived&&!window.confirm('Archive '+page.title+'? Remove its saved and published navigation references first.'))return;setBusy(page.id);setError('');setMessage('');try{const result=await updatePageSettings(page.id,{title:page.title,slug:page.slug,description:page.settings.description??''},archived,page.updated_at);upsert({...page,...result.page});setMessage(archived?'Page archived.':'Page restored.');router.refresh()}catch(e){setError(e instanceof Error?e.message:'Unable to update page.')}finally{setBusy(null)}};
 return <div className="mt-5">
  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><label className="flex min-w-0 items-center gap-2 sm:w-96"><AdminIcon name="search"/><span className="sr-only">Search pages</span><input type="search" className="w-full" placeholder="Search pages, apps and addresses" value={query} onChange={e=>setQuery(e.target.value)}/></label><span className="text-xs text-[#766a65]">{visible.length} matching page{visible.length===1?'':'s'}</span></div>
  <nav aria-label="Page filters" className="mt-4 flex flex-wrap gap-2">{(['active','draft','archived','all'] as const).map(key=><button key={key} className={'admin-button '+(tab===key?'bg-[#f7e7ed] text-[#9b4361]':'')} aria-pressed={tab===key} onClick={()=>setTab(key)}>{key==='active'?'Active':key==='draft'?'Drafts & changes':key==='archived'?'Archived':'All'} <span className="text-xs">{filterPages(rows,'',key).length}</span></button>)}</nav>
  {canWrite&&<PageCreate pages={rows} sourceId={duplicate??''} request={duplicateRequest}/>}
  {message&&<p role="status" className="mt-3 text-sm text-emerald-700">{message}</p>}{error&&<p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
  <div className="mt-4 divide-y divide-black/10 overflow-hidden rounded-xl border border-black/10">{visible.map(page=>{const archived=page.settings.archived===true,locked=protectedPageSlugs.includes(page.slug),href=getExperience(page.slug)?.livePath??(page.published_version_id?'/pages/'+page.slug:null);return <article key={page.id} className="flex flex-col gap-3 bg-white p-4 sm:flex-row sm:items-center">
   <div className="flex min-w-0 flex-1 items-center gap-3"><div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-[#f7e7ed] text-[#9b4361]">{page.thumbnail?<img className="h-full w-full object-cover" src={page.thumbnail} alt="" loading="lazy" onError={e=>{e.currentTarget.style.display='none'}}/>:<AdminIcon name="pages" className="h-7 w-7"/>}</div><div className="min-w-0"><h3 className="truncate text-sm font-semibold">{page.title}</h3>{getExperience(page.slug)?.title!==page.title&&getExperience(page.slug)&&<p className="truncate text-xs text-[#9b4361]">{getExperience(page.slug)?.title}</p>}<p className="mt-1 truncate text-xs text-[#766a65]">{href??'/pages/'+page.slug}</p><p className="mt-1 truncate text-xs text-[#766a65]">{page.settings.description||'No description yet'}</p></div></div>
   <div className="flex flex-wrap items-center gap-2">{archived?<span className="admin-status admin-status-draft">Archived</span>:<AdminStatus state={page.status}/>} {!archived&&<Link className="admin-button" href={'/editor/'+page.slug}>Edit content</Link>}<button className="admin-button" onClick={()=>setSelected(selected===page.id?null:page.id)}>Settings</button>{canWrite&&<button className="admin-button" onClick={()=>{setDuplicate(page.id);setDuplicateRequest(count=>count+1);setMessage('Choose the new title and address in Create or duplicate a page.')}}>Duplicate</button>}{canWrite&&!locked&&<button className="admin-button" disabled={busy!==null||Boolean(page.published_version_id)&&!canPublish} onClick={()=>archive(page)}>{busy===page.id?'Updating…':archived?'Restore':'Archive'}</button>}{!archived&&href&&publicSiteUrl&&<a className="admin-button" href={publicSiteUrl.replace(/\/+$/,'')+href} target="_blank" rel="noreferrer" aria-label={'View '+page.title}><AdminIcon name="external" className="h-4 w-4"/></a>}</div>
  </article>})}{!visible.length&&<div className="bg-white p-8 text-center"><h2 className="font-semibold">No matching pages</h2><p className="mt-2 text-sm text-[#766a65]">Try another filter or search, or create a new draft.</p></div>}</div>
  {current&&<PageDetails key={current.id+current.updated_at} page={current} canWrite={canWrite} canPublish={canPublish} onClose={()=>setSelected(null)} onSaved={page=>{upsert(page);setMessage('Page settings saved.');setError('')}}/>}
 </div>;
}
