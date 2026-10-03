"use client";
import {useCallback,useEffect,useMemo,useRef,useState,type CSSProperties} from 'react';
import type {HeartToPhoneTransitionConfig} from '@wiffeyyyy/content';

type ConnectionInfo={effectiveType?:string;saveData?:boolean};
type NavigatorWithConnection=Navigator&{connection?:ConnectionInfo};
type TransitionMode='cinematic'|'poster'|'leaving';

function reducedMotionRequested(){
 return window.matchMedia('(prefers-reduced-motion: reduce)').matches||!!document.querySelector('.birthday-os[data-reduced-motion="true"]');
}
function slowConnection(){
 const connection=(navigator as NavigatorWithConnection).connection;
 return !!connection&&(connection.saveData===true||connection.effectiveType==='slow-2g'||connection.effectiveType==='2g');
}

export function HeartPhoneTransition({config,onHandoff,onComplete}:{config:HeartToPhoneTransitionConfig;onHandoff:()=>void;onComplete:()=>void}){
 const video=useRef<HTMLVideoElement>(null),handoffDone=useRef(false),completeDone=useRef(false),fallbackTimer=useRef<ReturnType<typeof setTimeout>|null>(null),watchdog=useRef<ReturnType<typeof setTimeout>|null>(null);
 const [mode,setMode]=useState<TransitionMode>('cinematic'),[videoFailed,setVideoFailed]=useState(false),[soundEnabled,setSoundEnabled]=useState(false);
 const useMobile=typeof window!=='undefined'&&window.matchMedia('(max-width: 680px)').matches;
 const selectedVideo=useMemo(()=>useMobile&&config.media.mobileVideoSrc?config.media.mobileVideoSrc:config.media.videoSrc,[config.media.mobileVideoSrc,config.media.videoSrc,useMobile]);
 const finish=useCallback(()=>{if(completeDone.current)return;completeDone.current=true;onComplete()},[onComplete]);
 const handoff=useCallback(()=>{if(handoffDone.current)return;handoffDone.current=true;setMode('leaving');onHandoff();window.setTimeout(finish,Math.max(150,config.handoff.durationMs))},[config.handoff.durationMs,finish,onHandoff]);
 const skip=useCallback(()=>{handoff();},[handoff]);

 useEffect(()=>{
  const previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';
  if(reducedMotionRequested()){handoff();return()=>{document.body.style.overflow=previousOverflow}};
  if(slowConnection()){
   if(config.performance.slowConnectionBehavior==='skip-to-home'||!config.media.posterSrc){handoff();return()=>{document.body.style.overflow=previousOverflow}};
   setMode('poster');fallbackTimer.current=setTimeout(handoff,650);
  }
  watchdog.current=setTimeout(()=>{if(!handoffDone.current)handoff();else finish()},Math.max(config.playback.durationMs+3000,12000));
  return()=>{document.body.style.overflow=previousOverflow;if(fallbackTimer.current)clearTimeout(fallbackTimer.current);if(watchdog.current)clearTimeout(watchdog.current)};
 },[config.media.posterSrc,config.performance.slowConnectionBehavior,config.playback.durationMs,finish,handoff]);

 useEffect(()=>{
  if(mode!=='cinematic'||!selectedVideo||videoFailed)return;
  const node=video.current;if(!node)return;
  node.muted=true;
  const play=node.play();if(play)play.catch(()=>setVideoFailed(true));
 },[mode,selectedVideo,videoFailed]);

 useEffect(()=>{
  if(mode!=='cinematic'||selectedVideo&&!videoFailed)return;
  const at=setTimeout(handoff,config.handoff.handoffAtMs),done=setTimeout(()=>{if(!handoffDone.current)handoff();else finish()},config.playback.durationMs);
  return()=>{clearTimeout(at);clearTimeout(done)};
 },[config.handoff.handoffAtMs,config.playback.durationMs,finish,handoff,mode,selectedVideo,videoFailed]);

 const onTime=()=>{const current=(video.current?.currentTime??0)*1000;if(current>=config.handoff.handoffAtMs)handoff()};
 const onEnded=()=>{if(!handoffDone.current)handoff();else finish()};
 const enableSound=()=>{setSoundEnabled(true);if(video.current)video.current.muted=false};
 const showPlaceholder=mode==='cinematic'&&(!selectedVideo||videoFailed);
 const style={'--transition-duration':config.playback.durationMs+'ms','--handoff-duration':config.handoff.durationMs+'ms'} as CSSProperties;
 return <div className="heart-phone-transition" data-mode={mode} style={style} role="dialog" aria-modal="true" aria-label="Opening your Wiffeyyyy OS gift">
  <div className="heart-phone-transition-stage" aria-hidden="true">
   {mode==='poster'&&config.media.posterSrc?<img className="heart-phone-transition-poster" src={config.media.posterSrc} alt=""/>:null}
   {mode==='cinematic'&&selectedVideo&&!videoFailed?<video ref={video} className="heart-phone-transition-video" src={selectedVideo} poster={config.media.posterSrc||undefined} preload={config.performance.preload} playsInline muted onTimeUpdate={onTime} onEnded={onEnded} onError={()=>setVideoFailed(true)}/>:null}
   {showPlaceholder?<div className="heart-phone-transition-placeholder">
    <div className="unbox-table"/>
    <div className="unbox-box"><div className="unbox-lid"><span>Wiffeyyyy OS</span></div><div className="unbox-base"/></div>
    <div className="unbox-glove unbox-glove-left"/><div className="unbox-glove unbox-glove-right"/>
    <div className="unbox-phone"><div className="unbox-phone-island"/><div className="unbox-phone-screen"><span>Wiffeyyyy OS</span></div></div>
   </div>:null}
  </div>
  <div className="heart-phone-transition-chrome">
   <p className="heart-phone-transition-kicker" aria-live="polite">Your gift is opening…</p>
   <div className="heart-phone-transition-actions">
    {config.audio.enabled?<button type="button" onClick={enableSound} aria-pressed={soundEnabled}>{soundEnabled?'Sound on':'Turn on sound'}</button>:null}
    {config.playback.showSkip?<button type="button" autoFocus onClick={skip}>{config.playback.skipLabel}</button>:null}
   </div>
  </div>
 </div>;
}
