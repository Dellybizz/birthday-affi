import type {CMSField} from './cms';

export type TransitionSceneId='box-establishing'|'gloves-enter'|'top-down-open'|'phone-lift'|'screen-wake'|'live-handoff';
export type TransitionScene={id:TransitionSceneId;label:string;startMs:number;endMs:number;description:string};
export type HeartToPhoneTransitionConfig={
 schemaVersion:1;
 id:'heart-to-phone';
 enabled:boolean;
 trigger:{label:string;ariaLabel:string};
 playback:{durationMs:number;showSkip:boolean;skipLabel:string;startMuted:true;allowReplay:boolean};
 media:{videoSrc:string;mobileVideoSrc:string;posterSrc:string};
 audio:{enabled:boolean;musicSrc:string;unboxingSrc:string;wakeSrc:string;volume:number};
 handoff:{destination:string;handoffAtMs:number;durationMs:number;strategy:'match-cut'|'fade'|'instant';preloadDestination:boolean;matchWallpaper:boolean;lockInteractionUntilComplete:true};
 performance:{preload:'metadata'|'auto';slowConnectionBehavior:'poster-to-home'|'skip-to-home';maxMobileVideoBytes:number;maxDesktopVideoBytes:number};
 accessibility:{reducedMotionBehavior:'skip-to-home'|'poster-to-home';alwaysAllowSkip:true;announceSceneChange:boolean};
 scenes:TransitionScene[];
};
export type HeartToPhoneTransitionInput={
 enabled?:boolean;
 trigger?:Partial<HeartToPhoneTransitionConfig['trigger']>;
 playback?:Partial<HeartToPhoneTransitionConfig['playback']>;
 media?:Partial<HeartToPhoneTransitionConfig['media']>;
 audio?:Partial<HeartToPhoneTransitionConfig['audio']>;
 handoff?:Partial<HeartToPhoneTransitionConfig['handoff']>;
 performance?:Partial<HeartToPhoneTransitionConfig['performance']>;
 accessibility?:Partial<HeartToPhoneTransitionConfig['accessibility']>;
};

export const HEART_TO_PHONE_TRANSITION_ID='heart-to-phone' as const;
export const HEART_TO_PHONE_ACTION_PART='next' as const;

export const defaultHeartToPhoneScenes:TransitionScene[]=[
 {id:'box-establishing',label:'Gift box',startMs:0,endMs:1200,description:'Low three-quarter side view of a premium Wiffeyyyy OS phone box resting on the table.'},
 {id:'gloves-enter',label:'Gloved hands',startMs:1200,endMs:2600,description:'Black premium gloves enter frame, steady the box and prepare the reveal.'},
 {id:'top-down-open',label:'Top-down unboxing',startMs:2600,endMs:4400,description:'Camera eases toward a top-down view while the lid opens slowly.'},
 {id:'phone-lift',label:'Phone reveal',startMs:4400,endMs:6100,description:'The phone is lifted from the box with its screen dark and angled toward the camera.'},
 {id:'screen-wake',label:'Screen wake',startMs:6100,endMs:7500,description:'The display wakes using the same wallpaper and home-screen composition as the live iPhone interface.'},
 {id:'live-handoff',label:'Live handoff',startMs:7500,endMs:8300,description:'Camera framing and live phone shell align, then the cinematic layer dissolves into the interactive interface.'}
];

export const defaultHeartToPhoneTransition:HeartToPhoneTransitionConfig={
 schemaVersion:1,id:HEART_TO_PHONE_TRANSITION_ID,enabled:true,
 trigger:{label:'Unbox your gift',ariaLabel:'Unbox your gift and enter Wiffeyyyy OS'},
 playback:{durationMs:8300,showSkip:true,skipLabel:'Skip',startMuted:true,allowReplay:false},
 media:{videoSrc:'',mobileVideoSrc:'',posterSrc:''},
 audio:{enabled:false,musicSrc:'',unboxingSrc:'',wakeSrc:'',volume:.72},
 handoff:{destination:'/home',handoffAtMs:7500,durationMs:500,strategy:'match-cut',preloadDestination:true,matchWallpaper:true,lockInteractionUntilComplete:true},
 performance:{preload:'metadata',slowConnectionBehavior:'poster-to-home',maxMobileVideoBytes:8_000_000,maxDesktopVideoBytes:16_000_000},
 accessibility:{reducedMotionBehavior:'skip-to-home',alwaysAllowSkip:true,announceSceneChange:false},
 scenes:defaultHeartToPhoneScenes
};

const cleanText=(value:unknown,fallback:string,max:number)=>typeof value==='string'&&value.trim()?value.trim().slice(0,max):fallback;
const finite=(value:unknown,fallback:number,min:number,max:number)=>typeof value==='number'&&Number.isFinite(value)?Math.min(max,Math.max(min,value)):fallback;
const bool=(value:unknown,fallback:boolean)=>typeof value==='boolean'?value:fallback;
const mediaPath=(value:unknown)=>typeof value==='string'&&(!value||value.startsWith('/')||/^https:\/\//.test(value))?value:'';
const option=<T extends string>(value:unknown,allowed:readonly T[],fallback:T)=>typeof value==='string'&&allowed.includes(value as T)?value as T:fallback;

export function normalizeHeartToPhoneTransition(input:HeartToPhoneTransitionInput|null|undefined):HeartToPhoneTransitionConfig{
 const base=defaultHeartToPhoneTransition,playback=input?.playback??{},handoff=input?.handoff??{},audio=input?.audio??{};
 const durationMs=finite(playback.durationMs,base.playback.durationMs,3000,20000);
 return {
  ...base,...input,schemaVersion:1,id:HEART_TO_PHONE_TRANSITION_ID,
  enabled:bool(input?.enabled,base.enabled),
  trigger:{label:cleanText(input?.trigger?.label,base.trigger.label,60),ariaLabel:cleanText(input?.trigger?.ariaLabel,base.trigger.ariaLabel,120)},
  playback:{durationMs,showSkip:bool(playback.showSkip,base.playback.showSkip),skipLabel:cleanText(playback.skipLabel,base.playback.skipLabel,30),startMuted:true,allowReplay:bool(playback.allowReplay,base.playback.allowReplay)},
  media:{videoSrc:mediaPath(input?.media?.videoSrc),mobileVideoSrc:mediaPath(input?.media?.mobileVideoSrc),posterSrc:mediaPath(input?.media?.posterSrc)},
  audio:{enabled:bool(audio.enabled,base.audio.enabled),musicSrc:mediaPath(audio.musicSrc),unboxingSrc:mediaPath(audio.unboxingSrc),wakeSrc:mediaPath(audio.wakeSrc),volume:finite(audio.volume,base.audio.volume,0,1)},
  handoff:{destination:typeof handoff.destination==='string'&&handoff.destination.startsWith('/')?handoff.destination:base.handoff.destination,handoffAtMs:finite(handoff.handoffAtMs,base.handoff.handoffAtMs,0,durationMs),durationMs:finite(handoff.durationMs,base.handoff.durationMs,100,2000),strategy:option(handoff.strategy,['match-cut','fade','instant'] as const,base.handoff.strategy),preloadDestination:bool(handoff.preloadDestination,base.handoff.preloadDestination),matchWallpaper:bool(handoff.matchWallpaper,base.handoff.matchWallpaper),lockInteractionUntilComplete:true},
  performance:{preload:option(input?.performance?.preload,['metadata','auto'] as const,base.performance.preload),slowConnectionBehavior:option(input?.performance?.slowConnectionBehavior,['poster-to-home','skip-to-home'] as const,base.performance.slowConnectionBehavior),maxMobileVideoBytes:finite(input?.performance?.maxMobileVideoBytes,base.performance.maxMobileVideoBytes,1_000_000,20_000_000),maxDesktopVideoBytes:finite(input?.performance?.maxDesktopVideoBytes,base.performance.maxDesktopVideoBytes,1_000_000,40_000_000)},
  accessibility:{reducedMotionBehavior:option(input?.accessibility?.reducedMotionBehavior,['skip-to-home','poster-to-home'] as const,base.accessibility.reducedMotionBehavior),alwaysAllowSkip:true,announceSceneChange:bool(input?.accessibility?.announceSceneChange,base.accessibility.announceSceneChange)},
  scenes:base.scenes.map(scene=>({...scene}))
 };
}

export function validateHeartToPhoneTransition(config:HeartToPhoneTransitionConfig){
 const errors:string[]=[];
 if(config.schemaVersion!==1||config.id!==HEART_TO_PHONE_TRANSITION_ID)errors.push('Unsupported transition contract.');
 if(!config.handoff.destination.startsWith('/'))errors.push('Handoff destination must be a site-relative route.');
 if(config.playback.durationMs<3000||config.playback.durationMs>20000)errors.push('Duration must be between 3 and 20 seconds.');
 if(config.handoff.handoffAtMs<0||config.handoff.handoffAtMs>config.playback.durationMs)errors.push('Handoff time must fall inside the transition duration.');
 if(config.handoff.durationMs<100||config.handoff.durationMs>2000)errors.push('Handoff duration must be between 100 and 2000 ms.');
 if(config.audio.volume<0||config.audio.volume>1)errors.push('Audio volume must be between 0 and 1.');
 const ids=new Set<string>();let previousEnd=0;
 for(const scene of config.scenes){if(ids.has(scene.id))errors.push('Scene ids must be unique.');ids.add(scene.id);if(scene.startMs<previousEnd)errors.push('Scenes must be chronological and non-overlapping.');if(scene.endMs<=scene.startMs)errors.push('Each scene must end after it starts.');if(scene.endMs>config.playback.durationMs)errors.push('Scenes cannot extend beyond the total duration.');previousEnd=scene.endMs;}
 return {ok:errors.length===0,errors};
}

// T0 persistence contract: the cinematic configuration belongs to the existing Heart
// `heartPart: next` action. All values remain primitive CMS fields, so page versioning,
// rollback and whole-site releases preserve the transition without a new table or schema.
const propString=(value:CMSField)=>typeof value==='string'?value:undefined;
const propNumber=(value:CMSField)=>typeof value==='number'?value:undefined;
const propBoolean=(value:CMSField)=>typeof value==='boolean'?value:undefined;

export function heartActionPropsToTransition(props:Record<string,CMSField>):HeartToPhoneTransitionConfig{
 return normalizeHeartToPhoneTransition({
  enabled:propBoolean(props.transitionEnabled),
  trigger:{label:propString(props.title),ariaLabel:propString(props.transitionAriaLabel)},
  playback:{durationMs:propNumber(props.transitionDurationMs),showSkip:propBoolean(props.transitionShowSkip),skipLabel:propString(props.transitionSkipLabel),allowReplay:propBoolean(props.transitionAllowReplay)},
  media:{videoSrc:propString(props.transitionVideoSrc),mobileVideoSrc:propString(props.transitionMobileVideoSrc),posterSrc:propString(props.transitionPosterSrc)},
  audio:{enabled:propBoolean(props.transitionAudioEnabled),musicSrc:propString(props.transitionMusicSrc),unboxingSrc:propString(props.transitionUnboxingSrc),wakeSrc:propString(props.transitionWakeSrc),volume:propNumber(props.transitionVolume)},
  handoff:{destination:propString(props.href),handoffAtMs:propNumber(props.transitionHandoffAtMs),durationMs:propNumber(props.transitionHandoffDurationMs),strategy:propString(props.transitionHandoffStrategy) as HeartToPhoneTransitionConfig['handoff']['strategy']|undefined,preloadDestination:propBoolean(props.transitionPreloadDestination),matchWallpaper:propBoolean(props.transitionMatchWallpaper)},
  performance:{preload:propString(props.transitionPreload) as HeartToPhoneTransitionConfig['performance']['preload']|undefined,slowConnectionBehavior:propString(props.transitionSlowConnectionBehavior) as HeartToPhoneTransitionConfig['performance']['slowConnectionBehavior']|undefined,maxMobileVideoBytes:propNumber(props.transitionMaxMobileVideoBytes),maxDesktopVideoBytes:propNumber(props.transitionMaxDesktopVideoBytes)},
  accessibility:{reducedMotionBehavior:propString(props.transitionReducedMotionBehavior) as HeartToPhoneTransitionConfig['accessibility']['reducedMotionBehavior']|undefined,announceSceneChange:propBoolean(props.transitionAnnounceSceneChange)}
 });
}

export function transitionToHeartActionProps(config:HeartToPhoneTransitionConfig):Record<string,CMSField>{
 const value=normalizeHeartToPhoneTransition(config);
 return {
  transitionId:value.id,transitionEnabled:value.enabled,title:value.trigger.label,transitionAriaLabel:value.trigger.ariaLabel,href:value.handoff.destination,
  transitionDurationMs:value.playback.durationMs,transitionShowSkip:value.playback.showSkip,transitionSkipLabel:value.playback.skipLabel,transitionAllowReplay:value.playback.allowReplay,
  transitionVideoSrc:value.media.videoSrc,transitionMobileVideoSrc:value.media.mobileVideoSrc,transitionPosterSrc:value.media.posterSrc,
  transitionAudioEnabled:value.audio.enabled,transitionMusicSrc:value.audio.musicSrc,transitionUnboxingSrc:value.audio.unboxingSrc,transitionWakeSrc:value.audio.wakeSrc,transitionVolume:value.audio.volume,
  transitionHandoffAtMs:value.handoff.handoffAtMs,transitionHandoffDurationMs:value.handoff.durationMs,transitionHandoffStrategy:value.handoff.strategy,transitionPreloadDestination:value.handoff.preloadDestination,transitionMatchWallpaper:value.handoff.matchWallpaper,
  transitionPreload:value.performance.preload,transitionSlowConnectionBehavior:value.performance.slowConnectionBehavior,transitionMaxMobileVideoBytes:value.performance.maxMobileVideoBytes,transitionMaxDesktopVideoBytes:value.performance.maxDesktopVideoBytes,
  transitionReducedMotionBehavior:value.accessibility.reducedMotionBehavior,transitionAnnounceSceneChange:value.accessibility.announceSceneChange
 };
}
