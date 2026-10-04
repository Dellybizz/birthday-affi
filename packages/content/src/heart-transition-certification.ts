import {validateHeartToPhoneTransition,type HeartToPhoneTransitionConfig,type TransitionSceneId} from './heart-to-phone-transition';

export type TransitionCertificationLevel='error'|'warning'|'info';
export type TransitionCertificationStatus='disabled'|'blocked'|'fallback-ready'|'ready';
export type TransitionCertificationIssue={level:TransitionCertificationLevel;code:string;message:string};
export type TransitionVideoMetadata={src?:string;byteSize?:number;durationMs?:number;mimeType?:string};
export type TransitionCertificationMedia={desktopVideo?:TransitionVideoMetadata;mobileVideo?:TransitionVideoMetadata};
export type TransitionCertificationResult={status:TransitionCertificationStatus;ok:boolean;issues:TransitionCertificationIssue[]};
export type T8ProductionReadiness={ready:boolean;desktopFrames:number;mobileOverrides:number;missingDesktop:TransitionSceneId[];liveHome:boolean;matchCut:boolean;wallpaperSync:boolean;issues:string[]};

const videoTypes=new Set(['video/mp4','video/webm']);
export const T8_PRODUCTION_SCENES:TransitionSceneId[]=['box-establishing','gloves-enter','top-down-open','phone-lift','screen-wake','live-handoff'];
const issue=(level:TransitionCertificationLevel,code:string,message:string):TransitionCertificationIssue=>({level,code,message});

function certifyVideo(label:'Desktop'|'Mobile',media:TransitionVideoMetadata|undefined,maxBytes:number,handoffAtMs:number,issues:TransitionCertificationIssue[]){
 if(!media)return;
 if(media.mimeType&&!videoTypes.has(media.mimeType))issues.push(issue('error',label.toLowerCase()+'-video-type',`${label} cinematic video must be MP4 or WebM.`));
 if(typeof media.byteSize==='number'&&media.byteSize>maxBytes)issues.push(issue('error',label.toLowerCase()+'-video-budget',`${label} cinematic video exceeds its configured media budget.`));
 if(typeof media.byteSize==='number'&&media.byteSize<=0)issues.push(issue('error',label.toLowerCase()+'-video-empty',`${label} cinematic video is empty.`));
 if(typeof media.durationMs==='number'&&media.durationMs<handoffAtMs)issues.push(issue('error',label.toLowerCase()+'-video-short',`${label} cinematic video ends before the configured handoff point.`));
}
function desktopFrameCount(config:HeartToPhoneTransitionConfig){return T8_PRODUCTION_SCENES.filter(scene=>Boolean(config.frames[scene]?.desktop)).length}

export function certifyT8ProductionSequence(config:HeartToPhoneTransitionConfig):T8ProductionReadiness{
 const missingDesktop=T8_PRODUCTION_SCENES.filter(scene=>!config.frames[scene]?.desktop);
 const desktopFrames=T8_PRODUCTION_SCENES.length-missingDesktop.length;
 const mobileOverrides=T8_PRODUCTION_SCENES.filter(scene=>Boolean(config.frames[scene]?.mobile)).length;
 const liveHome=config.artDirection.interfaceSource==='live-home';
 const matchCut=config.handoff.strategy==='match-cut';
 const wallpaperSync=config.handoff.matchWallpaper;
 const issues:string[]=[];
 if(missingDesktop.length)issues.push(`Add desktop frames for: ${missingDesktop.join(', ')}.`);
 if(!liveHome)issues.push('Use Live Home for the final Wiffeyyyy OS screen so it stays identical to the editable website.');
 if(!matchCut)issues.push('Use match-cut for the production handoff.');
 if(!wallpaperSync)issues.push('Enable wallpaper synchronization for the final handoff.');
 return {ready:desktopFrames===T8_PRODUCTION_SCENES.length&&liveHome&&matchCut&&wallpaperSync,desktopFrames,mobileOverrides,missingDesktop,liveHome,matchCut,wallpaperSync,issues};
}

export function certifyHeartToPhoneTransition(config:HeartToPhoneTransitionConfig,media:TransitionCertificationMedia={}):TransitionCertificationResult{
 const issues:TransitionCertificationIssue[]=[];
 const contract=validateHeartToPhoneTransition(config);
 for(const message of contract.errors)issues.push(issue('error','contract-invalid',message));
 if(!config.enabled)return {status:'disabled',ok:issues.every(item=>item.level!=='error'),issues};

 const frames=desktopFrameCount(config),hasHybrid=frames>0,mode=config.artDirection.renderMode;
 if(!config.media.videoSrc&&!hasHybrid)issues.push(issue('warning','desktop-video-missing','No desktop cinematic video or authored hybrid frames are configured. The built-in cinematic fallback remains usable.'));
 if(mode==='video'&&!config.media.videoSrc)issues.push(issue('warning','video-mode-missing','Video mode is selected but no desktop cinematic video is configured. Runtime will fall back safely.'));
 if(mode==='hybrid'&&!hasHybrid)issues.push(issue('warning','hybrid-frames-missing','Hybrid mode is selected but no authored scene frames are configured. Runtime will use the browser-built fallback.'));
 if(hasHybrid&&frames<T8_PRODUCTION_SCENES.length)issues.push(issue('info','hybrid-partial',`Hybrid sequence has ${frames} of ${T8_PRODUCTION_SCENES.length} desktop scene frames; missing scenes use the safe fallback.`));
 if(config.media.videoSrc&&!config.media.posterSrc)issues.push(issue('warning','poster-missing','Add a poster so constrained-network and pre-playback states have an authored frame.'));
 if(config.media.videoSrc&&!config.media.mobileVideoSrc)issues.push(issue('info','mobile-uses-desktop','Mobile currently reuses the desktop cinematic video.'));
 if(config.handoff.strategy==='match-cut'&&!config.handoff.matchWallpaper)issues.push(issue('warning','match-wallpaper-off','Match-cut is selected while final wallpaper synchronization is disabled.'));
 if(config.artDirection.interfaceSource==='frame-only'&&config.handoff.strategy==='match-cut')issues.push(issue('info','frame-only-interface','The final phone screen is frame-only. Choose Live Home if you want the transition to mirror the editable published Home page exactly.'));

 certifyVideo('Desktop',media.desktopVideo,config.performance.maxDesktopVideoBytes,config.handoff.handoffAtMs,issues);
 if(config.media.mobileVideoSrc)certifyVideo('Mobile',media.mobileVideo,config.performance.maxMobileVideoBytes,config.handoff.handoffAtMs,issues);

 const blocked=issues.some(item=>item.level==='error');
 const ready=Boolean(config.media.videoSrc||hasHybrid);
 const status:TransitionCertificationStatus=blocked?'blocked':ready?'ready':'fallback-ready';
 return {status,ok:!blocked,issues};
}
