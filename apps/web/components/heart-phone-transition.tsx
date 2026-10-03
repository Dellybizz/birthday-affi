"use client";
import {useCallback,useEffect,useMemo,useRef,useState,type CSSProperties,type KeyboardEvent} from 'react';
import {createDefaultPage,installPhoneHome,type HeartToPhoneTransitionConfig,type PageDocument,type SiteDocument} from '@wiffeyyyy/content';
import {CMSRenderer} from '@wiffeyyyy/ui/cms-renderer';
import {DocumentSettingsProvider} from '@wiffeyyyy/ui/page-layout';
import {computePhoneFit} from '../lib/phone-fit';

type ConnectionInfo={effectiveType?:string;saveData?:boolean};
type NavigatorWithConnection=Navigator&{connection?:ConnectionInfo};
type TransitionMode='cinematic'|'poster'|'handoff'|'leaving';

function reducedMotionRequested(){
 return window.matchMedia('(prefers-reduced-motion: reduce)').matches||!!document.querySelector('.birthday-os[data-reduced-motion="true"]');
}
function slowConnection(){
 const connection=(navigator as NavigatorWithConnection).connection;
 return !!connection&&(connection.saveData===true||connection.effectiveType==='slow-2g'||connection.effectiveType==='2g');
}
const play=(node:HTMLAudioElement|null)=>{if(!node)return;node.currentTime=0;void node.play().catch(()=>{})};

export function HeartPhoneTransition({config,onHandoff,onComplete,destinationReady,homeDocument,siteSettings}:{config:HeartToPhoneTransitionConfig;onHandoff:()=>void;onComplete:()=>void;destinationReady:boolean;homeDocument?:PageDocument|null;siteSettings:SiteDocument}){
 const shell=useRef<HTMLDivElement>(null),video=useRef<HTMLVideoElement>(null),music=useRef<HTMLAudioElement>(null),unboxing=useRef<HTMLAudioElement>(null),wake=useRef<HTMLAudioElement>(null);
 const handoffDone=useRef(false),completeDone=useRef(false),handoffStarted=useRef(false),destinationReadyRef=useRef(destinationReady),fallbackTimer=useRef<ReturnType<typeof setTimeout>|null>(null),watchdog=useRef<ReturnType<typeof setTimeout>|null>(null),cueTimers=useRef<ReturnType<typeof setTimeout>[]>([]),startedAt=useRef(0);
 const [mode,setMode]=useState<TransitionMode>('cinematic'),[videoFailed,setVideoFailed]=useState(false),[soundEnabled,setSoundEnabled]=useState(false),[isMobile,setIsMobile]=useState(false),[phoneFit,setPhoneFit]=useState(1),[sceneLabel,setSceneLabel]=useState(config.scenes[0]?.label??'Opening gift');
 destinationReadyRef.current=destinationReady;
 const selectedVideo=useMemo(()=>isMobile&&config.media.mobileVideoSrc?config.media.mobileVideoSrc:config.media.videoSrc,[config.media.mobileVideoSrc,config.media.videoSrc,isMobile]);
 const home=useMemo(()=>installPhoneHome(homeDocument??createDefaultPage('home')),[homeDocument]);
 const layeredAudio=Boolean(config.audio.musicSrc||config.audio.unboxingSrc||config.audio.wakeSrc);
 const skipVisible=config.accessibility.alwaysAllowSkip||config.playback.showSkip;
 const finish=useCallback(()=>{if(completeDone.current)return;completeDone.current=true;onComplete()},[onComplete]);
 const handoff=useCallback(()=>{if(handoffDone.current)return;handoffDone.current=true;handoffStarted.current=true;setMode('handoff');onHandoff()},[onHandoff]);
 const skip=useCallback(()=>{handoff()},[handoff]);

 useEffect(()=>{const media=window.matchMedia('(max-width: 680px)'),sync=()=>setIsMobile(media.matches);sync();media.addEventListener('change',sync);return()=>media.removeEventListener('change',sync)},[]);
 useEffect(()=>{const fit=()=>setPhoneFit(computePhoneFit(window.innerWidth,window.innerHeight));fit();window.addEventListener('resize',fit);return()=>window.removeEventListener('resize',fit)},[]);
 useEffect(()=>{
  const previousOverflow=document.body.style.overflow,previousFocus=document.activeElement instanceof HTMLElement?document.activeElement:null;document.body.style.overflow='hidden';startedAt.current=performance.now();
  if(reducedMotionRequested()){handoff();return()=>{document.body.style.overflow=previousOverflow;previousFocus?.focus()}};
  if(slowConnection()){
   if(config.performance.slowConnectionBehavior==='skip-to-home'||!config.media.posterSrc){handoff();return()=>{document.body.style.overflow=previousOverflow;previousFocus?.focus()}};
   setMode('poster');fallbackTimer.current=setTimeout(handoff,650);
  }
  watchdog.current=setTimeout(()=>{if(!handoffDone.current)handoff();else if(!destinationReadyRef.current)window.location.assign(config.handoff.destination)},Math.max(config.playback.durationMs+4000,12500));
  return()=>{document.body.style.overflow=previousOverflow;previousFocus?.focus();if(fallbackTimer.current)clearTimeout(fallbackTimer.current);if(watchdog.current)clearTimeout(watchdog.current);cueTimers.current.forEach(clearTimeout);music.current?.pause()};
 },[config.handoff.destination,config.media.posterSrc,config.performance.slowConnectionBehavior,config.playback.durationMs,handoff]);

 useEffect(()=>{
  if(!handoffStarted.current||!destinationReady||mode==='leaving')return;
  let release:ReturnType<typeof setTimeout>|null=null,second=0;const first=requestAnimationFrame(()=>{second=requestAnimationFrame(()=>{release=setTimeout(()=>{setMode('leaving');window.setTimeout(finish,Math.max(150,config.handoff.durationMs))},90)})});
  return()=>{cancelAnimationFrame(first);if(second)cancelAnimationFrame(second);if(release)clearTimeout(release)};
 },[config.handoff.durationMs,destinationReady,finish,mode]);

 useEffect(()=>{
  if(mode!=='cinematic'||!selectedVideo||videoFailed)return;
  const node=video.current;if(!node)return;
  node.muted=!soundEnabled||layeredAudio;
  const promise=node.play();if(promise)promise.catch(()=>setVideoFailed(true));
 },[layeredAudio,mode,selectedVideo,soundEnabled,videoFailed]);

 useEffect(()=>{
  if(mode!=='cinematic'||selectedVideo&&!videoFailed)return;
  const at=setTimeout(handoff,config.handoff.handoffAtMs),done=setTimeout(()=>{if(!handoffDone.current)handoff()},config.playback.durationMs);
  const sceneTimers=config.scenes.slice(1).map(scene=>setTimeout(()=>setSceneLabel(scene.label),scene.startMs));
  return()=>{clearTimeout(at);clearTimeout(done);sceneTimers.forEach(clearTimeout)};
 },[config.handoff.handoffAtMs,config.playback.durationMs,config.scenes,handoff,mode,selectedVideo,videoFailed]);

 const queueAudioCues=()=>{
  cueTimers.current.forEach(clearTimeout);cueTimers.current=[];
  const elapsed=video.current?video.current.currentTime*1000:Math.max(0,performance.now()-startedAt.current);
  if(config.audio.musicSrc&&music.current){music.current.volume=config.audio.volume;music.current.loop=true;void music.current.play().catch(()=>{})}
  const schedule=(id:string,node:HTMLAudioElement|null)=>{const scene=config.scenes.find(item=>item.id===id);if(!scene||!node)return;node.volume=config.audio.volume;const delay=scene.startMs-elapsed;if(delay<=120)play(node);else cueTimers.current.push(setTimeout(()=>play(node),delay))};
  schedule('top-down-open',unboxing.current);schedule('screen-wake',wake.current);
 };
 const enableSound=()=>{setSoundEnabled(true);if(video.current&&!layeredAudio)video.current.muted=false;queueAudioCues()};
 const onTime=()=>{const current=(video.current?.currentTime??0)*1000;const scene=[...config.scenes].reverse().find(item=>current>=item.startMs);if(scene)setSceneLabel(scene.label);if(current>=config.handoff.handoffAtMs)handoff()};
 const onEnded=()=>{if(!handoffDone.current)handoff()};
 const onKeyDown=(event:KeyboardEvent<HTMLDivElement>)=>{if(event.key==='Escape'&&skipVisible){event.preventDefault();skip();return}if(event.key!=='Tab')return;const controls=Array.from(shell.current?.querySelectorAll<HTMLButtonElement>('button:not([disabled])')??[]);if(!controls.length){event.preventDefault();return}const first=controls[0],last=controls[controls.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}};
 const showPlaceholder=mode==='cinematic'&&(!selectedVideo||videoFailed);
 const style={'--transition-duration':config.playback.durationMs+'ms','--handoff-duration':config.handoff.durationMs+'ms','--phone-fit':phoneFit} as CSSProperties;
 return <div ref={shell} className="heart-phone-transition" data-mode={mode} style={style} role="dialog" aria-modal="true" aria-label="Opening your Wiffeyyyy OS gift" onKeyDown={onKeyDown}>
  <div className="heart-phone-transition-stage" aria-hidden="true">
   {mode==='poster'&&config.media.posterSrc?<img className="heart-phone-transition-poster" src={config.media.posterSrc} alt=""/>:null}
   {mode==='cinematic'&&selectedVideo&&!videoFailed?<video ref={video} className="heart-phone-transition-video" src={selectedVideo} poster={config.media.posterSrc||undefined} preload={config.performance.preload} playsInline muted onTimeUpdate={onTime} onEnded={onEnded} onError={()=>setVideoFailed(true)}/>:null}
   {showPlaceholder?<div className="heart-phone-transition-placeholder"><div className="unbox-table"/><div className="unbox-box"><div className="unbox-lid"><span>Wiffeyyyy OS</span></div><div className="unbox-base"/></div><div className="unbox-glove unbox-glove-left"/><div className="unbox-glove unbox-glove-right"/></div>:null}
   {config.handoff.matchWallpaper?<div className="heart-phone-sync-phone"><div className="heart-phone-sync-screen"><DocumentSettingsProvider value={siteSettings}><CMSRenderer document={home} embedded previewDevice="mobile"/></DocumentSettingsProvider></div></div>:null}
  </div>
  {config.audio.musicSrc?<audio ref={music} src={config.audio.musicSrc} preload="metadata"/>:null}{config.audio.unboxingSrc?<audio ref={unboxing} src={config.audio.unboxingSrc} preload="metadata"/>:null}{config.audio.wakeSrc?<audio ref={wake} src={config.audio.wakeSrc} preload="metadata"/>:null}
  <div className="heart-phone-transition-chrome">
   <p className="heart-phone-transition-kicker" aria-live={config.accessibility.announceSceneChange?'polite':'off'}>{mode==='handoff'||mode==='leaving'?'Wiffeyyyy OS is ready':sceneLabel}</p>
   <div className="heart-phone-transition-actions">{config.audio.enabled?<button type="button" onClick={enableSound} aria-pressed={soundEnabled}>{soundEnabled?'Sound on':'Turn on sound'}</button>:null}{skipVisible?<button type="button" autoFocus onClick={skip}>{config.playback.skipLabel}</button>:null}</div>
  </div>
 </div>;
}
