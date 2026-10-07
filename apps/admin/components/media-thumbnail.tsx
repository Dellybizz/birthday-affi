'use client';
import {useState} from 'react';
import type {MediaAsset} from '../lib/media-policy';

/** Private previews use the authenticated delivery route, never public bucket URLs. */
export function MediaThumbnail({asset}:{asset:MediaAsset}){
 const [failed,setFailed]=useState(false),[loaded,setLoaded]=useState(false);
 const ready=asset.status==='ready';
 return <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-[#f3eeea]">
  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-[#81736d]" aria-hidden="true"><span className="text-4xl">{asset.kind==='audio'?'♫':asset.kind==='video'?'▶':'▧'}</span><span className="text-xs">{!ready?'Incomplete upload':failed?'Preview unavailable':asset.kind==='audio'?'Audio file':'Loading preview…'}</span></div>
  {ready&&!failed&&asset.kind==='image'&&<img src={asset.previewUrl+(asset.metadata.variants?.includes(480)?'?variant=480':'')} alt={asset.alt_text||asset.filename} loading="lazy" onLoad={()=>setLoaded(true)} onError={()=>setFailed(true)} className={'relative h-full w-full object-contain '+(!loaded?'opacity-0':'')}/>}
  {ready&&!failed&&asset.kind==='video'&&<video aria-label={asset.alt_text||asset.filename} src={asset.previewUrl+'#t=0.1'} preload="metadata" muted playsInline onLoadedData={()=>setLoaded(true)} onError={()=>setFailed(true)} className={'relative h-full w-full object-contain '+(!loaded?'opacity-0':'')}/>}
  <span className="absolute bottom-2 left-2 rounded-md bg-black/70 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-white">{asset.kind}{asset.duration_ms?' · '+Math.floor(asset.duration_ms/60000)+':'+String(Math.floor(asset.duration_ms/1000)%60).padStart(2,'0'):''}</span>
 </div>;
}
