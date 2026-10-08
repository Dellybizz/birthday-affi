'use client';
import {useEffect,useRef,useState} from 'react';
import type {MediaAsset} from '../lib/media-policy';
import {mediaPreviewUrl} from '../lib/media-preview';
/** Thumbnail lists decode images only; video playback belongs in the viewer. */
export function MediaThumbnail({asset,compact=false,retryKey=0}:{asset:MediaAsset;compact?:boolean;retryKey?:number}){
 const root=useRef<HTMLDivElement>(null),[visible,setVisible]=useState(false),[state,setState]=useState<'loading'|'ready'|'failed'>('loading');
 const image=asset.status==='ready'&&(asset.kind==='image'||asset.kind==='video'&&asset.poster_ready);
 useEffect(()=>{const node=root.current;if(!node)return;if(typeof IntersectionObserver==='undefined'){setVisible(true);return}const observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){setVisible(true);observer.disconnect()}},{rootMargin:'150px'});observer.observe(node);return()=>observer.disconnect()},[]);
 useEffect(()=>{setState('loading')},[asset.id,asset.poster_ready,retryKey]);
 useEffect(()=>{if(!image||!visible||state!=='loading')return;const timer=setTimeout(()=>setState('failed'),12000);return()=>clearTimeout(timer)},[image,visible,state,retryKey]);
 const message=asset.status!=='ready'?'Incomplete upload':state==='failed'?'Preview unavailable — open file to retry':asset.kind==='audio'?'Audio file':asset.kind==='video'&&!asset.poster_ready?'Thumbnail not generated':state==='ready'?'':'Loading preview…';
 return <div ref={root} aria-label={message||asset.filename} className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-[#f3eeea]">
  {state!=='ready'&&<div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-[#81736d]" aria-hidden="true"><span className="text-4xl">{asset.kind==='audio'?'♫':asset.kind==='video'?'▶':'▧'}</span><span className={compact?'sr-only':'px-2 text-center text-xs'}>{message}</span></div>}
  {image&&visible&&state!=='failed'&&<img key={retryKey} src={mediaPreviewUrl(asset,true,retryKey)} alt={asset.alt_text||asset.filename} onLoad={()=>setState('ready')} onError={()=>setState('failed')} className={'relative h-full w-full object-contain '+(state!=='ready'?'opacity-0':'')}/>}
  {!compact&&<span className="absolute bottom-2 left-2 rounded-md bg-black/70 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-white">{asset.kind}{asset.duration_ms?' · '+Math.floor(asset.duration_ms/60000)+':'+String(Math.floor(asset.duration_ms/1000)%60).padStart(2,'0'):''}</span>}
 </div>;
}
