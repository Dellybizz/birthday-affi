import Link from 'next/link';
import type {ReactNode} from 'react';

export function AdminPageHeader({eyebrow,title,description,actions}:{eyebrow?:string;title:string;description?:string;actions?:ReactNode}){
 const showReleases=title!=='Releases';
 return <header className="mb-7 flex flex-col gap-4 border-b border-black/[.07] pb-6 sm:flex-row sm:items-end sm:justify-between">
  <div className="max-w-3xl">
   {eyebrow&&<p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a06b7d]">{eyebrow}</p>}
   <h1 className="text-2xl font-semibold tracking-[-0.025em] text-[#302a28] md:text-[30px]">{title}</h1>
   {description&&<p className="mt-2 max-w-2xl text-sm leading-6 text-[#766a65]">{description}</p>}
  </div>
  {(actions||showReleases)&&<div className="flex shrink-0 flex-wrap items-center gap-2">{showReleases&&<Link href="/releases" className="inline-flex min-h-10 items-center rounded-xl border border-black/10 bg-white px-3 text-sm font-semibold text-[#5a4f4a] shadow-sm transition hover:bg-[#faf8f7]">Releases</Link>}{actions}</div>}
 </header>;
}

export function AdminPanel({children,className=''}:{children:ReactNode;className?:string}){
 return <section className={`rounded-2xl border border-black/[.08] bg-white shadow-[0_1px_2px_rgba(53,43,39,.04)] ${className}`}>{children}</section>;
}
