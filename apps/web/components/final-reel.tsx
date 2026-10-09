'use client';
import {useEffect,useRef} from 'react';
import {useRouter} from 'next/navigation';
export function FinalReel({html}:{html:string}){
 const frame=useRef<HTMLIFrameElement>(null),router=useRouter();
 useEffect(()=>{const receive=(event:MessageEvent)=>{if(event.source===frame.current?.contentWindow&&event.data?.type==='wiffey-final-reel:back')router.push('/home')};window.addEventListener('message',receive);return()=>window.removeEventListener('message',receive)},[router]);
 return <iframe ref={frame} title="Final Reel" srcDoc={html} sandbox="allow-scripts allow-same-origin" style={{position:'fixed',inset:0,width:'100%',height:'100%',border:0,zIndex:100}}/>;
}
