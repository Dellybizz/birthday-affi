"use client";
import {useCallback,useEffect,useRef,useState,type ReactNode,type CSSProperties} from 'react';
import {usePathname,useRouter} from 'next/navigation';
import {ArchiveNavigationProvider} from '@wiffeyyyy/ui/archive-navigation';
import type {CMSField,HeartToPhoneTransitionConfig,PageDocument,SiteDocument} from '@wiffeyyyy/content';
import {HeartPhoneTransition} from './heart-phone-transition';
const HEART='/pages/in-my-heart';
const CORE_ROUTES=['/home','/',HEART,'/app/hotline','/app/reasons','/app/adventure','/app/movie','/app/kiss-shop','/app/camera','/app/vault','/app/pieces'];
const T9_CINEMATIC_FRAMES=['/cinematic/heart-phone/01-box.webp','/cinematic/heart-phone/02-gloves.webp','/cinematic/heart-phone/03-open.webp','/cinematic/heart-phone/04-lift.webp','/cinematic/heart-phone/05-wake.webp','/cinematic/heart-phone/06-handoff.webp'];
const warmedFrames=new Set<string>();
function warmFrame(src:string){if(!src||warmedFrames.has(src))return;warmedFrames.add(src);const image=new Image();image.decoding='async';image.src=src;if(typeof image.decode==='function')void image.decode().catch(()=>{})}
function warmTransitionFrames(transition:HeartToPhoneTransitionConfig){for(const scene of transition.scenes){const frame=transition.frames[scene.id];if(!frame)continue;warmFrame(frame.desktop);warmFrame(frame.mobile)}}
const chapter=(path:string)=>path==='/'||path==='/pages/memories-archive'?'archive':path===HEART?'heart':path==='/home'?'phone':null;
export function ArchiveJourney({settings,prefetchHrefs=[],homeDocument,siteSettings,children}:{settings:Record<string,CMSField>;prefetchHrefs?:string[];homeDocument?:PageDocument|null;siteSettings:SiteDocument;children:ReactNode}){
 const router=useRouter(),pathname=usePathname();
 const [phase,setPhase]=useState<'idle'|'closing'|'opening'>('idle'),[heartTransition,setHeartTransition]=useState<HeartToPhoneTransitionConfig|null>(null);
 const busy=useRef(false),cinematicBusy=useRef(false),timer=useRef<ReturnType<typeof setTimeout>|null>(null),watchdog=useRef<ReturnType<typeof setTimeout>|null>(null),previous=useRef(pathname),startedAt=useRef(0);
 const duration=Math.min(1800,Math.max(300,Number(settings.transitionDuration)||800));
 const internalHref=useCallback((target:EventTarget|null)=>{const link=(target as HTMLElement|null)?.closest?.<HTMLAnchorElement>('a[href]');if(!link)return null;const raw=link.getAttribute('href');if(!raw||raw.startsWith('#')||link.target||link.hasAttribute('download'))return null;const destination=new URL(link.href);if(destination.origin!==window.location.origin)return null;return {link,href:destination.pathname+destination.search+destination.hash,pathname:destination.pathname}},[]);
 const navigate=useCallback((target:string)=>{
  if(busy.current||cinematicBusy.current)return;
  router.prefetch(target);
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches||document.querySelector('.birthday-os[data-reduced-motion="true"]');
  if(settings.transitionEnabled===false||settings.transitionEnabled==='false'||reduced){router.push(target);return;}
  busy.current=true;startedAt.current=performance.now();setPhase('closing');
  router.push(target);
  watchdog.current=setTimeout(()=>{setPhase('idle');busy.current=false},8000);
 },[router,settings.transitionEnabled]);
 const startHeartTransition=useCallback((transition:HeartToPhoneTransitionConfig)=>{if(cinematicBusy.current||busy.current)return;cinematicBusy.current=true;warmTransitionFrames(transition);router.prefetch(transition.handoff.destination);setHeartTransition(transition)},[router]);
 const handoffHeartTransition=useCallback(()=>{if(!heartTransition)return;router.prefetch(heartTransition.handoff.destination);router.push(heartTransition.handoff.destination)},[heartTransition,router]);
 const completeHeartTransition=useCallback(()=>{cinematicBusy.current=false;setHeartTransition(null)},[]);
 useEffect(()=>{for(const href of new Set([...CORE_ROUTES,...prefetchHrefs]))if(href.startsWith('/'))router.prefetch(href)},[router,prefetchHrefs]);
 useEffect(()=>{if(pathname!==HEART)return;T9_CINEMATIC_FRAMES.forEach(warmFrame);router.prefetch('/home')},[pathname,router]);
 useEffect(()=>{const receive=(event:Event)=>{const detail=(event as CustomEvent<{href?:string;transition?:HeartToPhoneTransitionConfig}>).detail,href=detail?.href;if(pathname!==HEART||!href||!['/','/home'].includes(href))return;if(href==='/home'&&detail.transition?.id==='heart-to-phone'&&detail.transition.enabled)startHeartTransition(detail.transition);else navigate(href)};window.addEventListener('wiffey:journey',receive);return()=>window.removeEventListener('wiffey:journey',receive)},[pathname,navigate,startHeartTransition]);
 useEffect(()=>{if(previous.current===pathname)return;previous.current=pathname;document.querySelectorAll<HTMLElement>('[data-nav-press="true"]').forEach(node=>node.removeAttribute('data-nav-press'));if(!busy.current)return;if(watchdog.current)clearTimeout(watchdog.current);const elapsed=Math.max(0,performance.now()-startedAt.current),wait=Math.max(0,duration/2-elapsed);if(timer.current)clearTimeout(timer.current);timer.current=setTimeout(()=>{setPhase('opening');timer.current=setTimeout(()=>{setPhase('idle');busy.current=false},duration/2)},wait)},[pathname,duration]);
 useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current);if(watchdog.current)clearTimeout(watchdog.current)},[]);
 const warm=(target:EventTarget|null)=>{const item=internalHref(target);if(item)router.prefetch(item.href)};
 const press=(target:EventTarget|null)=>{const item=internalHref(target);if(!item)return;item.link.setAttribute('data-nav-press','true');router.prefetch(item.href)};
 const release=(target:EventTarget|null)=>{const item=internalHref(target);if(!item)return;window.setTimeout(()=>item.link.removeAttribute('data-nav-press'),110)};
 return <ArchiveNavigationProvider backLabel={String(settings.archiveBackLabel??'‹ In My Heart')} backHref={HEART}><div className="archive-journey" aria-busy={phase!=='idle'||!!heartTransition} onPointerOverCapture={event=>warm(event.target)} onPointerDownCapture={event=>press(event.target)} onPointerUpCapture={event=>release(event.target)} onPointerCancelCapture={event=>release(event.target)} onClickCapture={event=>{
  const item=internalHref(event.target);if(!item||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||cinematicBusy.current)return;
  if(item.pathname===pathname&&item.href.includes('#'))return;
  const from=chapter(pathname),to=chapter(item.pathname);
  event.preventDefault();
  if(from&&to&&from!==to)navigate(item.href);else{router.prefetch(item.href);router.push(item.href)}
 }}>{children}{phase!=='idle'&&<div className="archive-journey-curtain" data-phase={phase} style={{'--journey-half':duration/2+'ms','--journey-accent':String(settings.transitionColor??'#ff78b4')} as CSSProperties} role="status" aria-live="polite"><div className="archive-journey-heart" aria-hidden="true">♡</div><p>{String(settings.transitionText??'A little world, just for you')}</p></div>}{heartTransition?<HeartPhoneTransition config={heartTransition} homeDocument={homeDocument} siteSettings={siteSettings} destinationReady={pathname===heartTransition.handoff.destination} onHandoff={handoffHeartTransition} onComplete={completeHeartTransition}/>:null}</div></ArchiveNavigationProvider>;
}
