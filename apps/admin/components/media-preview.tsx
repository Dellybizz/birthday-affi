'use client';
import {useEffect,useRef,useState} from 'react';
import type {MediaAsset} from '../lib/media-policy';
import {mediaPreviewUrl} from '../lib/media-preview';
export function MediaPreview({asset,fullScreen=false}:{asset:MediaAsset;fullScreen?:boolean}){
 const [attempt,setAttempt]=useState(0),[state,setState]=useState<'loading'|'ready'|'failed'>('loading');
 const element=useRef<HTMLVideoElement|HTMLAudioElement|null>(null);
 useEffect(()=>{if(state!=='loading')return;const timer=setTimeout(()=>{element.current?.pause();setState('failed')},15000);return()=>clearTimeout(timer)},[state,attempt]);
 useEffect(()=>{const media=element.current;return()=>{media?.pause();media?.removeAttribute('src');media?.load()}},[asset.id,attempt]);
 const loaded=()=>setState('ready'),failed=()=>{element.current?.pause();setState('failed')},waiting=()=>setState('loading');
 const source=mediaPreviewUrl(asset,false,attempt);
 const sizing=fullScreen?'max-h-[calc(100dvh-190px)] w-full object-contain':'max-h-64 w-full rounded-xl object-contain';
 return <div className="w-full space-y-3">{state==='failed'?<div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-gray-900"><p>Preview unavailable or timed out. The original file remains saved.</p><button type="button" className="mt-3 rounded-lg border px-3 py-2" onClick={()=>{setState('loading');setAttempt(value=>value+1)}}>Retry preview</button></div>:<>{state==='loading'&&<p role="status" className="text-sm">Loading preview…</p>}{asset.kind==='image'?<img key={source} src={source} alt={asset.alt_text??asset.filename} onLoad={loaded} onError={failed} className={sizing}/>:asset.kind==='video'?<video key={source} ref={element as React.RefObject<HTMLVideoElement|null>} controls playsInline preload="metadata" src={source} poster={asset.poster_ready?mediaPreviewUrl(asset,true,attempt):undefined} onLoadedMetadata={loaded} onCanPlay={loaded} onPlaying={loaded} onWaiting={waiting} onError={failed} className={sizing}/>:<div className="mx-auto max-w-xl py-8"><p className="mb-6 text-center text-6xl" aria-hidden="true">♫</p><audio key={source} ref={element as React.RefObject<HTMLAudioElement|null>} controls preload="metadata" src={source} onLoadedMetadata={loaded} onCanPlay={loaded} onPlaying={loaded} onWaiting={waiting} onError={failed} className="w-full"/>{asset.transcript&&<p className="mt-4 whitespace-pre-wrap text-sm">{asset.transcript}</p>}</div>}</>}</div>;
}
