"use client";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode, type CSSProperties } from 'react';
import { playbackCoordinator, parsePlayback, resumeTime, parseCaptions } from '../../audio/src/controller';
const AudioDefaults=createContext({volume:1,muted:false});
export function AudioDefaultsProvider({value,children}:{value:{volume:number;muted:boolean};children:ReactNode}){return <AudioDefaults.Provider value={value}>{children}</AudioDefaults.Provider>;}
export function MediaPlayer({src,kind,title,identity,captions='',style,className,disabled=false}:{src:string;kind:'audio'|'video';title:string;identity:string;captions?:string;style?:CSSProperties;className?:string;disabled?:boolean}) {
 const defaults=useContext(AudioDefaults);
 const media=useRef<HTMLMediaElement|null>(null);
 const [failed,setFailed]=useState(false),[attempt,setAttempt]=useState(0),[storageWarning,setStorageWarning]=useState(false),[caption,setCaption]=useState('');
 const [captionWarning,setCaptionWarning]=useState(false),[restored,setRestored]=useState(false);
 useEffect(()=>{
  const element=media.current;if(!element)return;
  setFailed(false);setCaption('');setRestored(false);setCaptionWarning(false);
  const storageKey='wiffeyyyy:playback:v1:'+JSON.stringify([identity,src]);
  let state={...parsePlayback(null),volume:defaults.volume,muted:defaults.muted},lastWrite=0,loaded=false;
  try{const saved=localStorage.getItem(storageKey);if(saved)state=parsePlayback(saved)}catch{setStorageWarning(true)}
  element.volume=state.volume;element.muted=state.muted;
  const save=(force=false)=>{if(!loaded)return;const now=Date.now();if(!force&&now-lastWrite<3000)return;lastWrite=now;
   const value={version:1,time:element.ended?0:element.currentTime,volume:element.volume,muted:element.muted};
   try{localStorage.setItem(storageKey,JSON.stringify(value))}catch{setStorageWarning(true)}
  };
  let cues:ReturnType<typeof parseCaptions>=[];
  try{cues=parseCaptions(captions)}catch{setCaptionWarning(true)}
  let track:TextTrack|undefined;
  if(kind==='video'&&cues.length&&typeof VTTCue!=='undefined'){
   track=element.addTextTrack('captions','Captions','en');track.mode='showing';
   for(const cue of cues)track.addCue(new VTTCue(cue.start,cue.end,cue.text.replace(/</g,'‹').replace(/>/g,'›')));
  }
  const metadata=()=>{if(loaded)return;loaded=true;const time=resumeTime(state.time,element.duration);
   try{element.currentTime=time;setRestored(time>0)}catch{}
  };
  const play=()=>{if(disabled){element.pause();return}playbackCoordinator.claim(element)};
  const pause=()=>{save(true);playbackCoordinator.release(element)};
  const update=()=>{setCaption(cues.filter(c=>element.currentTime>=c.start&&element.currentTime<c.end).map(c=>c.text).join(' '));save()};
  const error=()=>{setFailed(true);pause()};
  const hide=()=>{if(document.hidden){element.pause();save(true)}};
  const unload=()=>save(true);
  element.addEventListener('loadedmetadata',metadata);element.addEventListener('play',play);
  element.addEventListener('pause',pause);element.addEventListener('ended',pause);
  element.addEventListener('timeupdate',update);element.addEventListener('volumechange',unload);element.addEventListener('error',error);
  document.addEventListener('visibilitychange',hide);window.addEventListener('pagehide',unload);
  if(element.readyState>=1)metadata();
  return()=>{save(true);element.pause();playbackCoordinator.release(element);
   element.removeEventListener('loadedmetadata',metadata);element.removeEventListener('play',play);element.removeEventListener('pause',pause);
   element.removeEventListener('ended',pause);element.removeEventListener('timeupdate',update);element.removeEventListener('volumechange',unload);element.removeEventListener('error',error);
   document.removeEventListener('visibilitychange',hide);window.removeEventListener('pagehide',unload);
   if(track){track.mode='disabled';for(const cue of Array.from(track.cues??[]))track.removeCue(cue)}
  };
 },[src,identity,kind,captions,attempt,disabled,defaults.volume,defaults.muted]);
 const ref=(element:HTMLMediaElement|null)=>{media.current=element};
 let transcript='';try{transcript=parseCaptions(captions).map(c=>c.text).join('\n')}catch{}
 const props={src,controls:!disabled,style,className,'aria-label':title};
 return <div className="space-y-3">{kind==='audio'?<audio key={attempt+src} ref={ref} {...props} preload="metadata"/>:<video key={attempt+src} ref={ref} {...props} playsInline preload="metadata"/>}
 {restored&&<p className="text-xs text-[var(--w-muted)]">Your saved position is ready. Press play to continue.</p>}
 {kind==='audio'&&captions&&<p aria-label="Current caption" className="min-h-7 text-sm">{caption}</p>}
 {transcript&&<details><summary className="cursor-pointer py-3">Read transcript</summary><p className="whitespace-pre-line leading-7">{transcript}</p></details>}
 {captionWarning&&<p role="status" className="text-sm">Timed captions are unavailable. Please use the text version.</p>}
 {storageWarning&&<p role="status" className="text-sm">Playback position cannot be saved in this browser.</p>}
 {failed&&<div role="alert"><p>Media couldn’t load. The text version is still available.</p><button className="min-h-11 rounded-xl border px-4 py-2" onClick={()=>setAttempt(x=>x+1)}>Retry media</button></div>}
 </div>;
}
