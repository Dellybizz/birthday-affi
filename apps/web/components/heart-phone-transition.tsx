"use client";
import {useCallback,useEffect,useMemo,useRef,useState,type CSSProperties,type KeyboardEvent} from 'react';
import {createDefaultPage,installPhoneHome,type HeartToPhoneTransitionConfig,type PageDocument,type SiteDocument} from '@wiffeyyyy/content';
import {CMSRenderer} from '@wiffeyyyy/ui/cms-renderer';
import {DocumentSettingsProvider} from '@wiffeyyyy/ui/page-layout';

type ConnectionInfo={effectiveType?:string;saveData?:boolean};
type NavigatorWithConnection=Navigator&{connection?:ConnectionInfo};
type TransitionMode='cinematic'|'poster'|'aligning'|'leaving';

function reducedMotionRequested(){
 return window.matchMedia('(prefers-reduced-motion: reduce)').matches||!!document.querySelector('.birthday-os[data-reduced-motion="true"]');
}
function slowConnection(){
 const connection=(navigator as NavigatorWithConnection).connection;
 return !!connection&&(connection.saveData===true||connection.effectiveType==='slow-2g'||connection.effectiveType==='2g');
}
const wait=(ms:number)=>new Promise(resolve=>window.setTimeout(resolve,ms));

export function HeartPhoneTransition({config,homeDocument,siteSettings,onHandoff,onComplete}:{config:HeartToPhoneTransitionConfig;homeDocument?:PageDocument|null;siteSettings:SiteDocument;onHandoff:()=>void;onComplete:()=>void}){
 const shell=useRef<HTMLDivElement>(null),video=useRef<HTMLVideoElement>(null),phone=useRef<HTMLDivElement>(null),previewCanvas=useRef<HTMLDivElement>(null),music=useRef<HTMLAudioElement>(null),unboxing=useRef<HTMLAudioElement>(null),wake=useRef<HTMLAudioElement>(null);
 const handoffDone=useRef(false),completeDone=useRef(false),fallbackTimer=useRef<ReturnType<typeof setTimeout>|null>(null),watchdog=useRef<ReturnType<typeof setTimeout>|null>(null),startedAt=useRef(0),soundTimers=useRef<number[]>([]);
 const [mode,setMode]=useState<TransitionMode>('cinematic'),[videoFailed,setVideoFailed]=useState(false),[soundEnabled,setSoundEnabled]=useState(false),[isMobile,setIsMobile]=useState(false);
 const selectedVideo=useMemo(()=>isMobile&&config.media.mobileVideoSrc?config.media.mobileVideoSrc:config.media.videoSrc,[config.media.mobileVideoSrc,config.media.videoSrc,isMobile]);
 const previewDocument=useMemo(()=>installPhoneHome(homeDocument??createDefaultPage('home')),[homeDocument]);
 const skipVisible=config.accessibility.alwaysAllowSkip||config.playback.showSkip;
 const finish=useCallback(()=>{if(completeDone.current)return;completeDone.current=true;onComplete()},[onComplete]);
 const stopSound=useCallback(()=>{for(const timer of soundTimers.current)window.clearTimeout(timer);soundTimers.current=[];for(const node of [music.current,unboxing.current,wake.current]){if(node){node.pause();node.currentTime=0}}},[]);
 const syncPreviewScale=useCallback(()=>{const host=phone.current,canvas=previewCanvas.current;if(!host||!canvas)return;const width=Math.max(1,host.clientWidth-(parseFloat(getComputedStyle(host).borderLeftWidth)||0)-(parseFloat(getComputedStyle(host).borderRightWidth)||0));canvas.style.transform=`scale(${width/390})`},[]);
 const findLivePhone=useCallback(async()=>{const started=performance.now(),timeout=Math.min(1400,Math.max(650,config.handoff.durationMs*2.4));while(performance.now()-started<timeout){const target=document.querySelector<HTMLElement>('.birthday-os-phone');if(target&&target.getBoundingClientRect().width>0)return target;await new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()))}return null},[config.handoff.durationMs]);
 const alignToLivePhone=useCallback(async()=>{
  const node=phone.current;if(!node){setMode('leaving');await wait(config.handoff.durationMs);finish();return}
  const target=await findLivePhone();
  if(!target){setMode('leaving');await wait(config.handoff.durationMs);finish();return}
  const from=node.getBoundingClientRect(),to=target.getBoundingClientRect(),scale=Math.max(.2,to.width/390);
  node.style.animation='none';node.style.transition='none';node.style.position='fixed';node.style.inset='auto';node.style.left=from.left+'px';node.style.top=from.top+'px';node.style.width=from.width+'px';node.style.height=from.height+'px';node.style.aspectRatio='auto';node.style.transform='none';node.style.opacity='1';
  syncPreviewScale();
  await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));
  const duration=Math.max(180,config.handoff.durationMs);
  node.style.transition=`left ${duration}ms cubic-bezier(.22,1,.36,1),top ${duration}ms cubic-bezier(.22,1,.36,1),width ${duration}ms cubic-bezier(.22,1,.36,1),height ${duration}ms cubic-bezier(.22,1,.36,1),border-radius ${duration}ms cubic-bezier(.22,1,.36,1),border-width ${duration}ms cubic-bezier(.22,1,.36,1),box-shadow ${duration}ms ease`;
  node.style.left=to.left+'px';node.style.top=to.top+'px';node.style.width=to.width+'px';node.style.height=to.height+'px';node.style.borderRadius=44*scale+'px';node.style.borderWidth=7*scale+'px';node.style.boxShadow='0 22px 70px #20172930,0 2px 7px #20172930';
  window.setTimeout(()=>setMode('leaving'),Math.round(duration*.58));
  await wait(duration+80);finish();
 },[config.handoff.durationMs,findLivePhone,finish,syncPreviewScale]);
 const handoff=useCallback(()=>{if(handoffDone.current)return;handoffDone.current=true;setMode('aligning');onHandoff();void alignToLivePhone()},[alignToLivePhone,onHandoff]);
 const skip=useCallback(()=>{handoff()},[handoff]);

 useEffect(()=>{startedAt.current=performance.now();const media=window.matchMedia('(max-width: 680px)'),sync=()=>setIsMobile(media.matches);sync();media.addEventListener('change',sync);return()=>media.removeEventListener('change',sync)},[]);
 useEffect(()=>{const node=phone.current;if(!node)return;syncPreviewScale();const observer=new ResizeObserver(syncPreviewScale);observer.observe(node);return()=>observer.disconnect()},[syncPreviewScale]);
 useEffect(()=>{
  const previousOverflow=document.body.style.overflow,previousFocus=document.activeElement instanceof HTMLElement?document.activeElement:null;document.body.style.overflow='hidden';
  if(reducedMotionRequested()){handoff();return()=>{document.body.style.overflow=previousOverflow;previousFocus?.focus()}};
  if(slowConnection()){
   if(config.performance.slowConnectionBehavior==='skip-to-home'||!config.media.posterSrc){handoff();return()=>{document.body.style.overflow=previousOverflow;previousFocus?.focus()}};
   setMode('poster');fallbackTimer.current=setTimeout(handoff,650);
  }
  watchdog.current=setTimeout(()=>{if(!handoffDone.current)handoff();else finish()},Math.max(config.playback.durationMs+3500,12500));
  return()=>{document.body.style.overflow=previousOverflow;previousFocus?.focus();if(fallbackTimer.current)clearTimeout(fallbackTimer.current);if(watchdog.current)clearTimeout(watchdog.current);stopSound()};
 },[config.media.posterSrc,config.performance.slowConnectionBehavior,config.playback.durationMs,finish,handoff,stopSound]);

 useEffect(()=>{
  if(mode!=='cinematic'||!selectedVideo||videoFailed)return;
  const node=video.current;if(!node)return;node.muted=true;
  const play=node.play();if(play)play.catch(()=>setVideoFailed(true));
 },[mode,selectedVideo,videoFailed]);
 useEffect(()=>{
  if(mode!=='cinematic'||selectedVideo&&!videoFailed)return;
  const at=setTimeout(handoff,config.handoff.handoffAtMs),done=setTimeout(()=>{if(!handoffDone.current)handoff()},config.playback.durationMs);
  return()=>{clearTimeout(at);clearTimeout(done)};
 },[config.handoff.handoffAtMs,config.playback.durationMs,handoff,mode,selectedVideo,videoFailed]);
 useEffect(()=>{
  if(!soundEnabled)return;stopSound();const elapsed=Math.max(0,performance.now()-startedAt.current),volume=config.audio.volume;
  const play=(node:HTMLAudioElement|null)=>{if(!node)return;node.volume=volume;void node.play().catch(()=>{})};
  if(music.current){music.current.loop=true;music.current.volume=volume;try{music.current.currentTime=Math.max(0,elapsed/1000)}catch{}void music.current.play().catch(()=>{})}
  const unboxAt=config.scenes.find(scene=>scene.id==='top-down-open')?.startMs??2600,wakeAt=config.scenes.find(scene=>scene.id==='screen-wake')?.startMs??6100;
  if(config.audio.unboxingSrc&&unboxAt>elapsed)soundTimers.current.push(window.setTimeout(()=>play(unboxing.current),unboxAt-elapsed));
  if(config.audio.wakeSrc&&wakeAt>elapsed)soundTimers.current.push(window.setTimeout(()=>play(wake.current),wakeAt-elapsed));
  return stopSound;
 },[config.audio.unboxingSrc,config.audio.volume,config.audio.wakeSrc,config.scenes,soundEnabled,stopSound]);

 const onTime=()=>{const current=(video.current?.currentTime??0)*1000;if(current>=config.handoff.handoffAtMs)handoff()};
 const onEnded=()=>{if(!handoffDone.current)handoff()};
 const enableSound=()=>{setSoundEnabled(true);if(video.current)video.current.muted=false};
 const onKeyDown=(event:KeyboardEvent<HTMLDivElement>)=>{if(event.key==='Escape'&&skipVisible){event.preventDefault();skip();return}if(event.key!=='Tab')return;const controls=Array.from(shell.current?.querySelectorAll<HTMLButtonElement>('button:not([disabled])')??[]);if(!controls.length){event.preventDefault();return}const first=controls[0],last=controls[controls.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}};
 const showPlaceholder=mode==='cinematic'&&(!selectedVideo||videoFailed),showMatchPhone=showPlaceholder||mode==='aligning'||mode==='leaving';
 const style={'--transition-duration':config.playback.durationMs+'ms','--handoff-duration':config.handoff.durationMs+'ms'} as CSSProperties;
 return <div ref={shell} className="heart-phone-transition" data-mode={mode} data-video={selectedVideo&&!videoFailed?'true':'false'} style={style} role="dialog" aria-modal="true" aria-label="Opening your Wiffeyyyy OS gift" onKeyDown={onKeyDown}>
  <div className="heart-phone-transition-stage" aria-hidden="true">
   <div className="unbox-ambient unbox-ambient-one"/><div className="unbox-ambient unbox-ambient-two"/><div className="unbox-film-grain"/>
   {mode==='poster'&&config.media.posterSrc?<img className="heart-phone-transition-poster" src={config.media.posterSrc} alt=""/>:null}
   {(mode==='cinematic'||mode==='aligning')&&selectedVideo&&!videoFailed?<video ref={video} className="heart-phone-transition-video" src={selectedVideo} poster={config.media.posterSrc||undefined} preload={config.performance.preload} playsInline muted onTimeUpdate={onTime} onEnded={onEnded} onError={()=>setVideoFailed(true)}/>:null}
   {showPlaceholder?<div className="heart-phone-transition-placeholder">
    <div className="unbox-key-light"/><div className="unbox-rim-light"/><div className="unbox-table"/><div className="unbox-table-shadow"/>
    <div className="unbox-box"><div className="unbox-lid"><span className="unbox-box-mark">Wiffeyyyy OS</span><span className="unbox-box-heart">♡</span></div><div className="unbox-base"><span className="unbox-inlay"/></div></div>
    <div className="unbox-glove unbox-glove-left"><i/><i/><i/><i/></div><div className="unbox-glove unbox-glove-right"><i/><i/><i/><i/></div>
   </div>:null}
   {showMatchPhone?<div ref={phone} className="unbox-phone"><span className="unbox-phone-side unbox-phone-side-one"/><span className="unbox-phone-side unbox-phone-side-two"/><div className="unbox-phone-island"/><div className="unbox-phone-screen"><div className="unbox-screen-glow"/><div className="transition-home-preview"><div ref={previewCanvas} className="transition-home-preview-canvas" style={{'--phone-height':'830px','--phone-width':'390px'} as CSSProperties}><DocumentSettingsProvider value={siteSettings}><CMSRenderer document={previewDocument} embedded previewDevice="mobile"/></DocumentSettingsProvider></div></div></div><div className="unbox-phone-reflection"/></div>:null}
  </div>
  <div className="heart-phone-transition-chrome">
   <p className="heart-phone-transition-kicker" aria-live="polite">{mode==='aligning'||mode==='leaving'?'Welcome to Wiffeyyyy OS':'Your gift is opening…'}</p>
   <div className="heart-phone-transition-actions">
    {config.audio.enabled?<button type="button" onClick={enableSound} aria-pressed={soundEnabled}>{soundEnabled?'Sound on':'Turn on sound'}</button>:null}
    {skipVisible?<button type="button" autoFocus onClick={skip}>{config.playback.skipLabel}</button>:null}
   </div>
  </div>
  {config.audio.musicSrc?<audio ref={music} src={config.audio.musicSrc} preload="metadata"/>:null}{config.audio.unboxingSrc?<audio ref={unboxing} src={config.audio.unboxingSrc} preload="metadata"/>:null}{config.audio.wakeSrc?<audio ref={wake} src={config.audio.wakeSrc} preload="metadata"/>:null}
 </div>;
}
