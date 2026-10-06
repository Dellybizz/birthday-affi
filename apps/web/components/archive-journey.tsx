"use client";
import {useCallback,useEffect,useRef,useState,type ReactNode,type CSSProperties} from 'react';
import {usePathname,useRouter} from 'next/navigation';
import {ArchiveNavigationProvider} from '@wiffeyyyy/ui/archive-navigation';
import {useSiteNavigation} from '@wiffeyyyy/ui/navigation';
import {navigationVisible,navigationPlacement,orderedNavigation} from '@wiffeyyyy/content';
import type {CMSField} from '@wiffeyyyy/content';
const HEART='/pages/in-my-heart';
const CORE_ROUTES=['/home','/',HEART,'/app/hotline','/app/reasons','/app/adventure','/app/movie','/app/kiss-shop','/app/camera','/app/vault','/app/pieces'];
const chapter=(path:string)=>path==='/'||path==='/pages/memories-archive'?'archive':path===HEART?'heart':path==='/home'?'phone':null;
export function ArchiveJourney({settings,prefetchHrefs=[],children}:{settings:Record<string,CMSField>;prefetchHrefs?:string[];children:ReactNode}){
 const router=useRouter(),pathname=usePathname(),navigation=useSiteNavigation();
 const journey=orderedNavigation(navigation??[]).filter(item=>item.href&&navigationVisible(navigation??[],item)&&navigationPlacement(navigation??[],item)==='journey');
 const index=journey.findIndex(item=>item.href===pathname),previousStep=index>0?journey[index-1]:null,nextStep=index>=0?journey[index+1]:null;
 const [phase,setPhase]=useState<'idle'|'closing'|'opening'>('idle');
 const busy=useRef(false),timer=useRef<ReturnType<typeof setTimeout>|null>(null),watchdog=useRef<ReturnType<typeof setTimeout>|null>(null),previous=useRef(pathname),startedAt=useRef(0);
 const duration=Math.min(1800,Math.max(300,Number(settings.transitionDuration)||800));
 const internalHref=useCallback((target:EventTarget|null)=>{const link=(target as HTMLElement|null)?.closest?.<HTMLAnchorElement>('a[href]');if(!link)return null;const raw=link.getAttribute('href');if(!raw||raw.startsWith('#')||link.target||link.hasAttribute('download'))return null;const destination=new URL(link.href);if(destination.origin!==window.location.origin)return null;return {link,href:destination.pathname+destination.search+destination.hash,pathname:destination.pathname}},[]);
 const navigate=useCallback((target:string)=>{
  if(busy.current)return;
  router.prefetch(target);
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches||document.querySelector('.birthday-os[data-reduced-motion="true"]');
  if(settings.transitionEnabled===false||settings.transitionEnabled==='false'||reduced){router.push(target);return;}
  busy.current=true;startedAt.current=performance.now();setPhase('closing');
  router.push(target);
  watchdog.current=setTimeout(()=>{setPhase('idle');busy.current=false},8000);
 },[router,settings.transitionEnabled]);
 useEffect(()=>{for(const href of new Set([...CORE_ROUTES,...prefetchHrefs]))if(href.startsWith('/'))router.prefetch(href)},[router,prefetchHrefs]);
 useEffect(()=>{const receive=(event:Event)=>{const href=(event as CustomEvent).detail?.href;if(pathname===HEART&&['/','/home'].includes(href))navigate(href==='/'?previousStep?.href??href:nextStep?.href??href)};window.addEventListener('wiffey:journey',receive);return()=>window.removeEventListener('wiffey:journey',receive)},[pathname,navigate,previousStep?.href,nextStep?.href]);
 useEffect(()=>{if(previous.current===pathname)return;previous.current=pathname;document.querySelectorAll<HTMLElement>('[data-nav-press="true"]').forEach(node=>node.removeAttribute('data-nav-press'));if(!busy.current)return;if(watchdog.current)clearTimeout(watchdog.current);const elapsed=Math.max(0,performance.now()-startedAt.current),wait=Math.max(0,duration/2-elapsed);if(timer.current)clearTimeout(timer.current);timer.current=setTimeout(()=>{setPhase('opening');timer.current=setTimeout(()=>{setPhase('idle');busy.current=false},duration/2)},wait)},[pathname,duration]);
 useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current);if(watchdog.current)clearTimeout(watchdog.current)},[]);
 const warm=(target:EventTarget|null)=>{const item=internalHref(target);if(item)router.prefetch(item.href)};
 const press=(target:EventTarget|null)=>{const item=internalHref(target);if(!item)return;item.link.setAttribute('data-nav-press','true');router.prefetch(item.href)};
 const release=(target:EventTarget|null)=>{const item=internalHref(target);if(!item)return;window.setTimeout(()=>item.link.removeAttribute('data-nav-press'),110)};
 return <ArchiveNavigationProvider backLabel={previousStep?'‹ '+previousStep.label:String(settings.archiveBackLabel??'‹ In My Heart')} backHref={previousStep?.href??HEART}><div className="archive-journey" aria-busy={phase!=='idle'} onPointerOverCapture={event=>warm(event.target)} onPointerDownCapture={event=>press(event.target)} onPointerUpCapture={event=>release(event.target)} onPointerCancelCapture={event=>release(event.target)} onClickCapture={event=>{
  const item=internalHref(event.target);if(!item||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  if(item.pathname===pathname&&item.href.includes('#'))return;
  const from=chapter(pathname),to=chapter(item.pathname);
  event.preventDefault();
  if(from&&to&&from!==to)navigate(item.href);else{router.prefetch(item.href);router.push(item.href)}
 }}>{children}{index>=0&&<nav aria-label="Journey chapters" className="configured-journey">{previousStep?.href&&<a href={previousStep.href}>‹ {previousStep.label}</a>}{nextStep?.href&&<a href={nextStep.href}>{nextStep.label} ›</a>}</nav>}{phase!=='idle'&&<div className="archive-journey-curtain" data-phase={phase} style={{'--journey-half':duration/2+'ms','--journey-accent':String(settings.transitionColor??'#ff78b4')} as CSSProperties} role="status" aria-live="polite"><div className="archive-journey-heart" aria-hidden="true">♡</div><p>{String(settings.transitionText??'A little world, just for you')}</p></div>}</div></ArchiveNavigationProvider>;
}
