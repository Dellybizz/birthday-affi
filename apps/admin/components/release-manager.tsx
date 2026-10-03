"use client";

import {useActionState} from 'react';
import {initialReleaseActionState,publishSiteRelease,rollbackSiteRelease} from '../lib/release-actions';

type Release={id:string;release_number:number;note:string;created_at:string;pageCount:number};

function StatusMessage({state}:{state:{status:string;message:string}}){if(!state.message)return null;return <p role="status" className={`mt-3 rounded-xl px-3 py-2.5 text-sm ${state.status==='error'?'bg-red-50 text-red-700':'bg-emerald-50 text-emerald-800'}`}>{state.message}</p>}

function RollbackControl({siteId,release,canPublish}:{siteId:string;release:Release;canPublish:boolean}){
 const [state,action,pending]=useActionState(rollbackSiteRelease,initialReleaseActionState);
 return <form action={action} onSubmit={event=>{if(!window.confirm(`Restore the published site to release #${release.release_number}? Current draft page documents will be preserved.`))event.preventDefault()}} className="mt-3">
  <input type="hidden" name="siteId" value={siteId}/><input type="hidden" name="releaseId" value={release.id}/>
  <input type="hidden" name="note" value={`Rollback to release #${release.release_number}`}/>
  <button disabled={!canPublish||pending} className="rounded-lg border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-[#5b504b] disabled:cursor-not-allowed disabled:opacity-45">{pending?'Rolling back…':'Restore this release'}</button>
  <StatusMessage state={state}/>
 </form>;
}

export function ReleaseManager({siteId,canPublish,pendingCount,releases}:{siteId:string;canPublish:boolean;pendingCount:number;releases:Release[]}){
 const [publishState,publishAction,publishing]=useActionState(publishSiteRelease,initialReleaseActionState);
 return <div className="space-y-6">
  <section className="rounded-2xl border border-black/[.08] bg-white p-5 shadow-[0_1px_2px_rgba(53,43,39,.04)]">
   <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.12em] text-[#998c86]">Current workspaces</p><h2 className="mt-1 text-lg font-semibold">Publish one atomic site release</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-[#776a64]">Pages, site settings and navigation are validated and published in one database transaction. If any workspace fails validation, nothing is partially published.</p></div><span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${pendingCount?'bg-amber-50 text-amber-800':'bg-emerald-50 text-emerald-700'}`}>{pendingCount?`${pendingCount} unpublished workspace${pendingCount===1?'':'s'}`:'Everything matches live'}</span></div>
   <form action={publishAction} className="mt-5 max-w-2xl space-y-3">
    <input type="hidden" name="siteId" value={siteId}/>
    <label className="block text-sm font-medium text-[#514742]">Release note <span className="font-normal text-[#9b8f89]">optional</span><textarea name="note" maxLength={500} placeholder="What changed in this release?" className="mt-1.5 min-h-24 w-full rounded-xl border border-black/10 bg-white p-3 outline-none focus:border-[#d86f91]"/></label>
    <div className="flex flex-wrap items-center gap-3"><button disabled={!canPublish||publishing} className="min-h-11 rounded-xl bg-[#302a28] px-5 text-sm font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-45">{publishing?'Publishing site…':'Publish all changes'}</button><p className="text-xs text-[#8c807a]">Owner only · drafts are preserved after publication</p></div>
    <StatusMessage state={publishState}/>
   </form>
  </section>

  <section className="overflow-hidden rounded-2xl border border-black/[.08] bg-white shadow-[0_1px_2px_rgba(53,43,39,.04)]">
   <div className="border-b border-black/[.07] px-5 py-4"><h2 className="font-semibold">Release history</h2><p className="mt-1 text-xs text-[#8e817b]">Rollback restores published page versions, site settings and navigation, then records that restoration as a new release. Page draft documents are not overwritten.</p></div>
   {releases.length?<div className="divide-y divide-black/[.06]">{releases.map((release,index)=><article key={release.id} className="px-5 py-4"><div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex items-center gap-2"><h3 className="text-sm font-semibold">Release #{release.release_number}</h3>{index===0&&<span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">Latest</span>}</div><p className="mt-1 text-xs text-[#8e817b]">{new Intl.DateTimeFormat('en-IN',{dateStyle:'medium',timeStyle:'short'}).format(new Date(release.created_at))} · {release.pageCount} published page{release.pageCount===1?'':'s'}</p>{release.note&&<p className="mt-2 text-sm text-[#665a55]">{release.note}</p>}</div>{index>0&&<RollbackControl siteId={siteId} release={release} canPublish={canPublish}/>}</div></article>)}</div>:<div className="px-5 py-10 text-center"><p className="text-sm font-semibold">No releases yet</p><p className="mt-1 text-xs text-[#8e817b]">Your first whole-site publication will create release #1.</p></div>}
  </section>
 </div>;
}
