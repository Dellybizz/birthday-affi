import {validateHeartToPhoneTransition,type HeartToPhoneTransitionConfig} from './heart-to-phone-transition';

export type TransitionCertificationLevel='error'|'warning'|'info';
export type TransitionCertificationStatus='disabled'|'blocked'|'fallback-ready'|'ready';
export type TransitionCertificationIssue={level:TransitionCertificationLevel;code:string;message:string};
export type TransitionVideoMetadata={src?:string;byteSize?:number;durationMs?:number;mimeType?:string};
export type TransitionCertificationMedia={desktopVideo?:TransitionVideoMetadata;mobileVideo?:TransitionVideoMetadata};
export type TransitionCertificationResult={status:TransitionCertificationStatus;ok:boolean;issues:TransitionCertificationIssue[]};

const videoTypes=new Set(['video/mp4','video/webm']);
const issue=(level:TransitionCertificationLevel,code:string,message:string):TransitionCertificationIssue=>({level,code,message});

function certifyVideo(label:'Desktop'|'Mobile',media:TransitionVideoMetadata|undefined,maxBytes:number,handoffAtMs:number,issues:TransitionCertificationIssue[]){
 if(!media)return;
 if(media.mimeType&&!videoTypes.has(media.mimeType))issues.push(issue('error',label.toLowerCase()+'-video-type',`${label} cinematic video must be MP4 or WebM.`));
 if(typeof media.byteSize==='number'&&media.byteSize>maxBytes)issues.push(issue('error',label.toLowerCase()+'-video-budget',`${label} cinematic video exceeds its configured media budget.`));
 if(typeof media.byteSize==='number'&&media.byteSize<=0)issues.push(issue('error',label.toLowerCase()+'-video-empty',`${label} cinematic video is empty.`));
 if(typeof media.durationMs==='number'&&media.durationMs<handoffAtMs)issues.push(issue('error',label.toLowerCase()+'-video-short',`${label} cinematic video ends before the configured handoff point.`));
}

export function certifyHeartToPhoneTransition(config:HeartToPhoneTransitionConfig,media:TransitionCertificationMedia={}):TransitionCertificationResult{
 const issues:TransitionCertificationIssue[]=[];
 const contract=validateHeartToPhoneTransition(config);
 for(const message of contract.errors)issues.push(issue('error','contract-invalid',message));
 if(!config.enabled)return {status:'disabled',ok:issues.every(item=>item.level!=='error'),issues};

 if(!config.media.videoSrc)issues.push(issue('warning','desktop-video-missing','No desktop cinematic video is configured. The built-in cinematic fallback remains usable.'));
 if(config.media.videoSrc&&!config.media.posterSrc)issues.push(issue('warning','poster-missing','Add a poster so constrained-network and pre-playback states have an authored frame.'));
 if(config.media.videoSrc&&!config.media.mobileVideoSrc)issues.push(issue('info','mobile-uses-desktop','Mobile currently reuses the desktop cinematic video.'));
 if(config.handoff.strategy==='match-cut'&&!config.handoff.matchWallpaper)issues.push(issue('warning','match-wallpaper-off','Match-cut is selected while final wallpaper synchronization is disabled.'));

 certifyVideo('Desktop',media.desktopVideo,config.performance.maxDesktopVideoBytes,config.handoff.handoffAtMs,issues);
 if(config.media.mobileVideoSrc)certifyVideo('Mobile',media.mobileVideo,config.performance.maxMobileVideoBytes,config.handoff.handoffAtMs,issues);

 const blocked=issues.some(item=>item.level==='error');
 const status:TransitionCertificationStatus=blocked?'blocked':config.media.videoSrc?'ready':'fallback-ready';
 return {status,ok:!blocked,issues};
}
