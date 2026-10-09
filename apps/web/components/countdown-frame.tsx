'use client';
import {useEffect,useRef} from 'react';
import {useRouter} from 'next/navigation';
export function CountdownFrame({html}:{html:string}){
 const frame=useRef<HTMLIFrameElement>(null),router=useRouter();
 useEffect(()=>{const receive=(event:MessageEvent)=>{if(event.source===frame.current?.contentWindow&&event.data?.type==='wiffey-countdown:unlocked')router.push('/pages/memories-archive')};window.addEventListener('message',receive);router.prefetch('/pages/memories-archive');return()=>window.removeEventListener('message',receive)},[router]);
 return <iframe ref={frame} title="Birthday countdown" srcDoc={html} style={{position:'fixed',inset:0,width:'100%',height:'100%',border:0,zIndex:100}}/>;
}
