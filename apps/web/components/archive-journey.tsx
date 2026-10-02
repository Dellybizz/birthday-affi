"use client";
import {useEffect,useRef,useState,type ReactNode,type CSSProperties} from 'react';
import {usePathname,useRouter} from 'next/navigation';
import {ArchiveNavigationProvider} from '@wiffeyyyy/ui/archive-navigation';
import type {CMSField} from '@wiffeyyyy/content';
export function ArchiveJourney({settings,children}:{settings:Record<string,CMSField>;children:ReactNode}){
 const router=useRouter(),pathname=usePathname();
 const [phase,setPhase]=useState<'idle'|'closing'|'opening'>('idle');
 const busy=useRef(false),timer=useRef<ReturnType<typeof setTimeout>|null>(null),watchdog=useRef<ReturnType<typeof setTimeout>|null>(null),previous=useRef(pathname);
 const duration=Math.min(1800,Math.max(300,Number(settings.transitionDuration)||800));
 const motion=()=>settings.transitionEnabled!==false&&settings.transitionEnabled!=='false'&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches&&!document.querySelector('.birthday-os[data-reduced-motion="true"]');
 useEffect(()=>{router.prefetch('/home');router.prefetch('/')},[router]);
 useEffect(()=>{if(previous.current===pathname)return;previous.current=pathname;if(!busy.current)return;if(watchdog.current)clearTimeout(watchdog.current);setPhase('opening');timer.current=setTimeout(()=>{setPhase('idle');busy.current=false},duration/2)},[pathname,duration]);
 useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current);if(watchdog.current)clearTimeout(watchdog.current)},[]);
 return <ArchiveNavigationProvider backLabel={String(settings.archiveBackLabel??'‹ Memories Archive')}><div className="archive-journey" aria-busy={phase!=='idle'} onClickCapture={event=>{const link=(event.target as HTMLElement).closest<HTMLAnchorElement>('a[href]');if(!link||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||link.target||link.hasAttribute('download'))return;const destination=new URL(link.href);if(destination.origin!==window.location.origin)return;const archive=pathname==='/'||pathname==='/pages/memories-archive',target=destination.pathname;const crossing=(archive&&target==='/home')||(pathname==='/home'&&(target==='/'||target==='/pages/memories-archive'));if(!crossing)return;if(busy.current){event.preventDefault();return}if(!motion())return;event.preventDefault();busy.current=true;setPhase('closing');timer.current=setTimeout(()=>{router.push(target);watchdog.current=setTimeout(()=>{setPhase('idle');busy.current=false},8000)},duration/2)}}>{children}{phase!=='idle'&&<div className="archive-journey-curtain" data-phase={phase} style={{'--journey-half':duration/2+'ms','--journey-accent':String(settings.transitionColor??'#ff78b4')} as CSSProperties} role="status" aria-live="polite"><div className="archive-journey-heart" aria-hidden="true">♡</div><p>{String(settings.transitionText??'A little world, just for you')}</p></div>}</div></ArchiveNavigationProvider>
}
