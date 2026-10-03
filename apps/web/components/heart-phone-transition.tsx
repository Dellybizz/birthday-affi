"use client";
import {useCallback,useEffect,useMemo,useRef,useState,type CSSProperties,type KeyboardEvent} from 'react';
import {createDefaultPage,installPhoneHome,type HeartToPhoneTransitionConfig,type PageDocument,type SiteDocument,type TransitionSceneId} from '@wiffeyyyy/content';
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
 const handoffDone=useRef(false),completeDone=useRef(false),handoffStarted=useRef(false),instantRelease=useRef(false),destinationReadyRef=useRef(destinationReady),fallbackTimer=useRef<ReturnType<typeof setTimeout>|null>(null),watchdog=useRef<ReturnType<typeof setTimeout>|null>(null),cueTimers=useRef<ReturnType<typeof setTimeout>[]>([]),startedAt=useRef(0);
 const firstScene=config.scenes[0];
 const [mode,setMode]=useState<TransitionMode>('cinematic'),[videoFailed,setVideoFailed]=useState(false),[soundEnabled,setSoundEnabled]=useState(false),[isMobile,setIsMobile]=useState(false),[phoneFit,setPhoneFit]=useState(1),[sceneLabel,setSceneLabel]=useState(firstScene?.label??'Opening gift'),[sceneId,setSceneId]=useState<TransitionSceneId>(firstScene?.id??'box-establishing'),[replayToken,setReplayToken]=useState(0);
 destinationReadyRef.current=destinationReady;
 const selectedVideo=useMemo(()=>isMobile&&config.media.mobileVideoSrc?config.media.mobileVideoSrc:config.media.videoSrc,[config.media.mobileVideoSrc,config.media.videoSrc,isMobile]);
 const currentFrame=config.frames[sceneId];
 const selectedFrame=useMemo(()=>currentFrame?(isMobile&&currentFrame.mobile?currentFrame.mobile:currentFrame.desktop):'',[currentFrame,isMobile]);
 const home=useMemo(()=>installPhoneHome(homeDocument??createDefaultPage('home')),[homeDocument]);
 const layeredAudio=Boolean(config.audio.musicSrc||config.audio.unboxingSrc||config.audio.wakeSrc);
 const skipVisible=config.accessibility.alwaysAllowSkip||config.playback.showSkip;
 const renderMode=config.artDirection.renderMode;
 const videoAvailable=Boolean(selectedVideo)&&!videoFailed&&(renderMode==='auto'||renderMode==='video');
 const hybridAvailable=Boolean(selectedFrame)&&(renderMode==='hybrid'||(renderMode==='auto'&&!videoAvailable));
 const videoActive=mode==='cinematic'&&videoAvailable;
 const hybridActive=mode==='cinematic'&&hybridAvailable;
 const showPlaceholder=mode==='cinematic'&&!videoActive&&!hybridActive;
 const finish=useCallback(()=>{if(completeDone.current)return;completeDone.current=true;onComplete()},[onComplete]);
 const handoff=useCallback(()=>{if(handoffDone.current)return;handoffDone.current=true;handoffStarted.current=true;setMode('handoff');onHandoff()},[onHandoff]);
 const handoffImmediately=useCallback(()=>{instantRelease.current=true;handoff()},[handoff]);
 const skip=useCallback(()=>{handoff()},[handoff]);
 const setScene=useCallback((scene:{id:TransitionSceneId;label:string})=>{setSceneId(scene.id);setSceneLabel(scene.label)},[]);

 useEffect(()=>{const media=window.matchMedia('(max-width: 680px)'),sync=()=>setIsMobile(media.matches);sync();media.addEventListener('change',sync);return()=>media.removeEventListener('change',sync)},[]);
 useEffect(()=>{const fit=()=>setPhoneFit(computePhoneFit(window.innerWidth,window.innerHeight));fit();window.addEventListener('resize',fit);return()=>window.removeEventListener('resize',fit)},[]);
 useEffect(()=>{
  const previousOverflow=document.body.style.overflow,previousFocus=document.activeElement instanceof HTMLElement?document.activeElement:null;document.body.style.overflow='hidden';startedAt.current=performance.now();
  if(reducedMotionRequested()){handoffImmediately();return()=>{document.body.style.overflow=previousOverflow;previousFocus?.focus()}};
  if(slowConnection()){
   if(config.performance.slowConnectionBehavior==='skip-to-home'||!config.media.posterSrc){handoffImmediately();return()=>{document.body.style.overflow=previousOverflow;previousFocus?.focus()}};
   setMode('poster');fallbackTimer.current=setTimeout(handoff,650);
  }
  watchdog.current=setTimeout(()=>{if(!handoffDone.current)handoff();else if(!destinationReadyRef.current)window.location.assign(config.handoff.destination)},Math.max(config.playback.durationMs+4000,12500));
  return()=>{document.body.style.overflow=previousOverflow;previousFocus?.focus();if(fallbackTimer.current)clearTimeout(fallbackTimer.current);if(watchdog.current)clearTimeout(watchdog.current);cueTimers.current.forEach(clearTimeout);music.current?.pause()};
 },[config.handoff.destination,config.media.posterSrc,config.performance.slowConnectionBehavior,config.playback.durationMs,handoff,handoffImmediately]);

 useEffect(()=>{
  if(!handoffStarted.current||!destinationReady||mode==='leaving')return;
  if(instantRelease.current){setMode('leaving');finish();return}
  if(config.handoff.strategy==='instant'){setMode('leaving');finish();return}
  let release:ReturnType<typeof setTimeout>|null=null,second=0;const first=requestAnimationFrame(()=>{second=requestAnimationFrame(()=>{release=setTimeout(()=>{setMode('leaving');window.setTimeout(finish,Math.max(150,config.handoff.durationMs))},90)})});
  return()=>{cancelAnimationFrame(first);if(second)cancelAnimationFrame(second);if(release)clearTimeout(release)};
 },[config.handoff.durationMs,config.handoff.strategy,destinationReady,finish,mode]);

 useEffect(()=>{
  if(!videoActive)return;
  const node=video.current;if(!node)return;
  node.muted=!soundEnabled||layeredAudio;
  const promise=node.play();if(promise)promise.catch(()=>setVideoFailed(true));
 },[layeredAudio,replayToken,soundEnabled,videoActive]);

 useEffect(()=>{
  if(mode!=='cinematic'||videoActive)return;
  const at=setTimeout(handoff,config.handoff.handoffAtMs),done=setTimeout(()=>{if(!handoffDone.current)handoff()},config.playback.durationMs);
  const sceneTimers=config.scenes.slice(1).map(scene=>setTimeout(()=>setScene(scene),scene.startMs));
  return()=>{clearTimeout(at);clearTimeout(done);sceneTimers.forEach(clearTimeout)};
 },[config.handoff.handoffAtMs,config.playback.durationMs,config.scenes,handoff,mode,replayToken,setScene,videoActive]);

 const queueAudioCues=()=>{
  cueTimers.current.forEach(clearTimeout);cueTimers.current=[];
  const elapsed=videoActive&&video.current?video.current.currentTime*1000:Math.max(0,performance.now()-startedAt.current);
  if(config.audio.musicSrc&&music.current){music.current.volume=config.audio.volume;music.current.loop=true;try{const seconds=elapsed/1000,duration=music.current.duration;music.current.currentTime=Number.isFinite(duration)&&duration>0?seconds%duration:seconds}catch{}void music.current.play().catch(()=>{})}
  const schedule=(id:string,node:HTMLAudioElement|null)=>{const scene=config.scenes.find(item=>item.id===id);if(!scene||!node)return;node.volume=config.audio.volume;const delay=scene.startMs-elapsed;if(delay<-250)return;if(delay<=120)play(node);else cueTimers.current.push(setTimeout(()=>play(node),delay))};
  schedule('top-down-open',unboxing.current);schedule('screen-wake',wake.current);
 };
 const enableSound=()=>{setSoundEnabled(true);if(video.current&&videoActive&&!layeredAudio)video.current.muted=false;queueAudioCues()};
 const replay=()=>{
  if(!config.playback.allowReplay||handoffDone.current||mode!=='cinematic')return;
  cueTimers.current.forEach(clearTimeout);cueTimers.current=[];music.current?.pause();unboxing.current?.pause();wake.current?.pause();
  startedAt.current=performance.now();if(firstScene)setScene(firstScene);setVideoFailed(false);setReplayToken(value=>value+1);
  if(soundEnabled)window.setTimeout(queueAudioCues,0);
 };
 const onTime=()=>{const current=(video.current?.currentTime??0)*1000;const scene=[...config.scenes].reverse().find(item=>current>=item.startMs);if(scene)setScene(scene);if(current>=config.handoff.handoffAtMs)handoff()};
 const onEnded=()=>{if(!handoffDone.current)handoff()};
 const onKeyDown=(event:KeyboardEvent<HTMLDivElement>)=>{if(event.key==='Escape'&&skipVisible){event.preventDefault();skip();return}if(event.key!=='Tab')return;const controls=Array.from(shell.current?.querySelectorAll<HTMLButtonElement>('.heart-phone-transition-actions button:not([disabled])')??[]);if(!controls.length){event.preventDefault();return}const first=controls[0],last=controls[controls.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}};
 const art=config.artDirection,scaledPhoneFit=phoneFit*(isMobile?art.mobilePhoneScale:art.phoneScale);
 const style={
  '--transition-duration':config.playback.durationMs+'ms','--handoff-duration':config.handoff.durationMs+'ms','--phone-fit':scaledPhoneFit,
  '--transition-background':art.backgroundColor,'--transition-ambient':art.ambientColor,'--transition-light':art.lightColor,'--transition-light-intensity':art.lightIntensity,
  '--transition-brightness':art.brightness,'--transition-contrast':art.contrast,'--transition-saturation':art.saturation,'--transition-vignette':art.vignette,'--transition-bloom':art.bloom,
  '--transition-stage-scale':art.stageScale,'--transition-stage-x':art.stageOffsetX+'px','--transition-stage-y':art.stageOffsetY+'px',
  '--transition-box-width':art.boxWidth+'px','--transition-box-aspect':art.boxAspect,'--transition-box-radius':art.boxRadius+'px','--transition-lid-thickness':art.lidThickness+'px','--transition-tray-inset':art.trayInset+'%',
  '--transition-phone-x':art.phoneOffsetX+'px','--transition-phone-y':art.phoneOffsetY+'px','--transition-phone-tilt':art.phoneTilt+'deg','--transition-interface-opacity':art.interfaceOpacity
 } as CSSProperties;
 const frameStyle={objectFit:art.frameFit,objectPosition:`${art.framePositionX}% ${art.framePositionY}%`} as CSSProperties;
 return <div ref={shell} className="heart-phone-transition" data-mode={mode} data-strategy={config.handoff.strategy} data-video={videoAvailable?'true':'false'} data-hybrid={hybridAvailable?'true':'false'} data-fallback={showPlaceholder?'true':'false'} data-render-mode={renderMode} data-scene={sceneId} data-interface={art.interfaceSource} style={style} role="dialog" aria-modal="true" aria-label={config.trigger.ariaLabel} onKeyDown={onKeyDown}>
  <div key={replayToken} className="heart-phone-transition-stage" aria-hidden="true" inert>
   {mode==='poster'&&config.media.posterSrc?<img className="heart-phone-transition-poster" src={config.media.posterSrc} alt=""/>:null}
   {videoActive?<video ref={video} className="heart-phone-transition-video" src={selectedVideo} poster={config.media.posterSrc||undefined} preload={config.performance.preload} playsInline muted onTimeUpdate={onTime} onEnded={onEnded} onError={()=>setVideoFailed(true)}/>:null}
   {hybridActive?<img key={sceneId+'-'+replayToken} className="heart-phone-transition-keyframe" src={selectedFrame} alt="" style={frameStyle}/>:null}
   {showPlaceholder?<div className="heart-phone-transition-placeholder">
    <div className="unbox-ambient"/><div className="unbox-beam"/>
    <div className="unbox-table"><div className="unbox-table-glow"/></div>
    <div className="unbox-box">
     <div className="unbox-base"><div className="unbox-tray"/><div className="unbox-tray-well"/></div>
     <div className="unbox-lid"><div className="unbox-lid-mark">Wiffeyyyy OS</div><div className="unbox-lid-edge"/></div>
     <div className="unbox-package-shadow"/>
    </div>
    <div className="unbox-glove unbox-glove-left"/><div className="unbox-glove unbox-glove-right"/>
   </div>:null}
   <div className="heart-phone-art-light"/><div className="heart-phone-art-vignette"/>
   {config.handoff.strategy==='match-cut'&&config.handoff.matchWallpaper&&art.interfaceSource==='live-home'?<div className="heart-phone-sync-phone"><div className="heart-phone-sync-screen"><DocumentSettingsProvider value={siteSettings}><CMSRenderer document={home} embedded previewDevice="mobile"/></DocumentSettingsProvider></div></div>:null}
  </div>
  {config.audio.musicSrc?<audio ref={music} src={config.audio.musicSrc} preload="metadata"/>:null}{config.audio.unboxingSrc?<audio ref={unboxing} src={config.audio.unboxingSrc} preload="metadata"/>:null}{config.audio.wakeSrc?<audio ref={wake} src={config.audio.wakeSrc} preload="metadata"/>:null}
  <div className="heart-phone-transition-chrome">
   <p className="heart-phone-transition-kicker" aria-live={config.accessibility.announceSceneChange?'polite':'off'}>{mode==='handoff'||mode==='leaving'?'Wiffeyyyy OS is ready':sceneLabel}</p>
   <div className="heart-phone-transition-actions">{config.playback.allowReplay&&mode==='cinematic'?<button type="button" onClick={replay}>Replay</button>:null}{config.audio.enabled?<button type="button" onClick={enableSound} aria-pressed={soundEnabled}>{soundEnabled?'Sound on':'Turn on sound'}</button>:null}{skipVisible?<button type="button" autoFocus onClick={skip}>{config.playback.skipLabel}</button>:null}</div>
  </div>
 </div>;
}
