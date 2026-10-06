"use client";

import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useEffect,useMemo,useRef,useState,type ReactNode} from 'react';
import {AdminIcon,type AdminIconName} from './admin-icon';
import {signOut} from '../app/login/actions';

type NavItem={label:string;href:string;description:string;icon:AdminIconName;aliases?:string[]};
type NavGroup={label:string;items:NavItem[]};


export const controlPanelNavigation:readonly NavGroup[]=[
 {label:'Overview',items:[{label:'Dashboard',href:'/',description:'Site status and quick actions',icon:'dashboard'}]},
 {label:'Content',items:[
  {label:'Pages',href:'/pages',description:'Pages, apps and page settings',icon:'pages'},
  {label:'Navigation',href:'/navigation',description:'Home grid and navigation',icon:'navigation'}
 ]},
 {label:'Assets',items:[{label:'Media',href:'/media',description:'Images, video and audio assets',icon:'media'}]},
 {label:'Site',items:[
  {label:'Releases',href:'/releases',description:'Publish and restore site releases',icon:'publish'},
  {label:'Site settings',href:'/settings',description:'Personalization, theme, audio and account',icon:'settings',aliases:['/theme','/audio']},
  {label:'Vault story',href:'/vault',description:'Private chapters and accepted answers',icon:'pages'},
  {label:'Hotline',href:'/hotline',description:'Private caller and receiver links',icon:'hotline'}
 ]}
] as const;

export const standaloneAdminPrefixes=['/login','/editor','/preview'] as const;

export function isStandaloneAdminPath(pathname:string){
 return standaloneAdminPrefixes.some(prefix=>pathname===prefix||pathname.startsWith(prefix+'/'));
}

function isActive(item:NavItem,pathname:string){
 if(item.href==='/')return pathname==='/';
 if(pathname===item.href||pathname.startsWith(item.href+'/'))return true;
 return item.aliases?.some(alias=>pathname===alias||pathname.startsWith(alias+'/'))??false;
}


function NavigationList({pathname,onNavigate}:{pathname:string;onNavigate?:()=>void}){
 return <nav className="space-y-5" aria-label="Control panel">
  {controlPanelNavigation.map(group=><div key={group.label}>
   <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-[0.13em] text-[#9a8d88]">{group.label}</p>
   <div className="space-y-1">{group.items.map(item=>{
    const active=isActive(item,pathname);
    return <Link key={item.href} href={item.href} onClick={onNavigate} aria-current={active?'page':undefined} className={`group flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${active?'bg-[#f7e7ed] font-semibold text-[#9b4361] shadow-[inset_0_0_0_1px_rgba(216,111,145,.12)]':'text-[#544a46] hover:bg-[#f7f5f3] hover:text-[#302a28]'}`}>
     <span className={`grid h-8 w-8 place-items-center rounded-lg ${active?'bg-white/80 text-[#b65173]':'text-[#756862] group-hover:bg-white'}`}><AdminIcon name={item.icon}/></span>
     <span className="min-w-0"><span className="block truncate">{item.label}</span><span className={`hidden truncate text-[11px] font-normal xl:block ${active?'text-[#a7667c]':'text-[#9a8d88]'}`}>{item.description}</span></span>
    </Link>;
   })}</div>
  </div>)}
 </nav>;
}

function SidebarContent({pathname,onNavigate}:{pathname:string;onNavigate?:()=>void}){
 return <div className="flex h-full flex-col">
  <div className="border-b border-black/[.07] px-4 py-5">
   <Link href="/" onClick={onNavigate} className="flex items-center gap-3 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-[#d86f91]">
    <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#d86f91] text-lg font-bold text-white shadow-sm">W</span>
    <span className="min-w-0"><span className="block truncate text-sm font-bold text-[#302a28]">Wiffeyyyy OS</span><span className="block truncate text-xs text-[#887b75]">Private control panel</span></span>
   </Link>
  </div>
  <div className="flex-1 overflow-y-auto px-3 py-5"><NavigationList pathname={pathname} onNavigate={onNavigate}/></div>
  <div className="border-t border-black/[.07] p-3">
   <div className="mb-2 rounded-xl bg-[#f8f6f4] px-3 py-2.5"><p className="text-xs font-semibold text-[#4f4541]">Birthday site</p><p className="mt-0.5 text-[11px] text-[#90827c]">Website management</p></div>
   <form action={signOut}><button type="submit" className="flex min-h-10 w-full items-center gap-2 rounded-xl px-3 text-sm font-medium text-[#6c5e58] transition hover:bg-[#f7f5f3] hover:text-[#302a28]"><AdminIcon name="logout" className="h-4 w-4"/>Sign out</button></form>
  </div>
 </div>;
}

export function AdminShell({children,publicSiteUrl}:{children:ReactNode;publicSiteUrl:string}){
 const pathname=usePathname()||'/';
 const [mobileOpen,setMobileOpen]=useState(false);
 useEffect(()=>setMobileOpen(false),[pathname]);
 const menuTrigger=useRef<HTMLButtonElement>(null),drawer=useRef<HTMLDivElement>(null);
 useEffect(()=>{if(!mobileOpen)return;const previous=document.activeElement as HTMLElement|null;const overflow=document.body.style.overflow;document.body.style.overflow='hidden';drawer.current?.querySelector<HTMLElement>('button')?.focus();const keydown=(event:KeyboardEvent)=>{if(event.key==='Escape'){setMobileOpen(false);return}if(event.key!=='Tab')return;const targets=Array.from(drawer.current?.querySelectorAll<HTMLElement>('a[href],button:not([disabled])')??[]);const first=targets[0],last=targets.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus()}};document.addEventListener('keydown',keydown);return()=>{document.body.style.overflow=overflow;document.removeEventListener('keydown',keydown);(previous??menuTrigger.current)?.focus()}},[mobileOpen]);
 const current=useMemo(()=>controlPanelNavigation.flatMap(group=>group.items).find(item=>isActive(item,pathname)),[pathname]);
 if(isStandaloneAdminPath(pathname))return <>{children}</>;
 const viewSite=publicSiteUrl||null;
 return <div className="admin-chrome min-h-screen bg-[#f6f4f2] text-[#302a28]">
  <a href="#admin-main" className="admin-skip-link">Skip to content</a>
  <aside className="fixed inset-y-0 left-0 z-40 hidden w-[268px] border-r border-black/[.08] bg-white lg:block"><SidebarContent pathname={pathname}/></aside>
  {mobileOpen&&<div ref={drawer} id="admin-navigation-drawer" className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true" aria-label="Control panel navigation">
   <button className="absolute inset-0 bg-black/25 backdrop-blur-[1px]" aria-label="Close navigation" onClick={()=>setMobileOpen(false)}/>
   <aside className="relative h-full w-[286px] max-w-[86vw] border-r border-black/10 bg-white shadow-2xl"><button type="button" onClick={()=>setMobileOpen(false)} aria-label="Close navigation" className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-lg text-[#695d58] hover:bg-[#f6f3f1]"><AdminIcon name="close"/></button><SidebarContent pathname={pathname} onNavigate={()=>setMobileOpen(false)}/></aside>
  </div>}
  <div className="min-w-0 lg:pl-[268px]">
   <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-black/[.08] bg-white/95 px-4 backdrop-blur md:px-6 lg:px-8">
    <div className="flex min-w-0 items-center gap-3">
     <button type="button" ref={menuTrigger} aria-controls="admin-navigation-drawer" onClick={()=>setMobileOpen(true)} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-black/10 bg-white text-[#514742] lg:hidden" aria-label="Open navigation" aria-expanded={mobileOpen}><AdminIcon name="menu"/></button>
     <div className="min-w-0"><p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#9a8d88]">Control panel</p><p className="truncate text-sm font-semibold text-[#403733]">{current?.label??'Wiffeyyyy OS'}</p></div>
    </div>
    <div className="flex items-center gap-2">
     <Link href="/editor/home" className="hidden min-h-10 items-center gap-2 rounded-xl border border-black/10 bg-white px-3 text-sm font-semibold text-[#4f4541] shadow-sm transition hover:bg-[#faf8f7] sm:flex"><AdminIcon name="editor" className="h-4 w-4"/>Open editor</Link>
     {viewSite?<a aria-label="View site" href={viewSite} target="_blank" rel="noreferrer" className="flex min-h-10 items-center gap-2 rounded-xl bg-[#302a28] px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-black"><span className="hidden sm:inline">View site</span><AdminIcon name="external" className="h-4 w-4"/></a>:<span title="Set NEXT_PUBLIC_WEB_URL to enable live-site links" className="flex min-h-10 cursor-not-allowed items-center gap-2 rounded-xl bg-[#d9d3d0] px-3 text-sm font-semibold text-white"><span className="hidden sm:inline">View site</span><AdminIcon name="external" className="h-4 w-4"/></span>}
    </div>
   </header>
   <main id="admin-main" className="mx-auto w-full max-w-[1500px] p-4 md:p-6 lg:p-8">{children}</main>
  </div>
 </div>;
}
