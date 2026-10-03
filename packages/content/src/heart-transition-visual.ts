import type {CMSField} from './cms';

export type TransitionSceneId='box-establishing'|'gloves-enter'|'top-down-open'|'phone-lift'|'screen-wake'|'live-handoff';
export type TransitionScene={id:TransitionSceneId;label:string;startMs:number;endMs:number;description:string};
export type TransitionRenderMode='auto'|'video'|'hybrid'|'fallback';
export type TransitionFrameFit='cover'|'contain';
export type TransitionInterfaceSource='live-home'|'frame-only';
export type TransitionFrame={desktop:string;mobile:string};
export type TransitionFrameMap=Record<TransitionSceneId,TransitionFrame>;
export type TransitionArtDirection={renderMode:TransitionRenderMode;backgroundColor:string;ambientColor:string;lightColor:string;lightIntensity:number;brightness:number;contrast:number;saturation:number;vignette:number;bloom:number;stageScale:number;stageOffsetX:number;stageOffsetY:number;frameFit:TransitionFrameFit;framePositionX:number;framePositionY:number;boxWidth:number;boxAspect:number;boxRadius:number;lidThickness:number;trayInset:number;phoneScale:number;mobilePhoneScale:number;phoneOffsetX:number;phoneOffsetY:number;phoneTilt:number;interfaceSource:TransitionInterfaceSource;interfaceOpacity:number};
export type TransitionTiming={boxEndMs:number;glovesEndMs:number;openEndMs:number;liftEndMs:number;wakeEndMs:number};
export type TransitionVisualInput={frames?:Partial<Record<TransitionSceneId,Partial<TransitionFrame>>>;artDirection?:Partial<TransitionArtDirection>;timing?:Partial<TransitionTiming>};

const copy={
 'box-establishing':['Gift box','Low three-quarter side view of a premium Wiffeyyyy OS phone box resting on the table.'],
 'gloves-enter':['Gloved hands','Black premium gloves enter frame, steady the box and prepare the reveal.'],
 'top-down-open':['Top-down unboxing','Camera eases toward a top-down view while the lid opens slowly.'],
 'phone-lift':['Phone reveal','The phone is lifted from the box with its screen dark and angled toward the camera.'],
 'screen-wake':['Screen wake','The display wakes using the same wallpaper and home-screen composition as the live iPhone interface.'],
 'live-handoff':['Live handoff','Camera framing and live phone shell align, then the cinematic layer dissolves into the interactive interface.']
} as const;

export const defaultTransitionTiming:TransitionTiming={boxEndMs:1200,glovesEndMs:2600,openEndMs:4400,liftEndMs:6100,wakeEndMs:7500};
export const defaultTransitionArtDirection:TransitionArtDirection={renderMode:'hybrid',backgroundColor:'#050404',ambientColor:'#2a1713',lightColor:'#e6b08d',lightIntensity:.75,brightness:1,contrast:1,saturation:1,vignette:.42,bloom:.32,stageScale:1,stageOffsetX:0,stageOffsetY:0,frameFit:'cover',framePositionX:50,framePositionY:50,boxWidth:470,boxAspect:1.82,boxRadius:24,lidThickness:8,trayInset:11,phoneScale:1,mobilePhoneScale:1,phoneOffsetX:0,phoneOffsetY:0,phoneTilt:0,interfaceSource:'live-home',interfaceOpacity:1};

export const emptyTransitionFrames=():TransitionFrameMap=>({
 'box-establishing':{desktop:'',mobile:''},
 'gloves-enter':{desktop:'',mobile:''},
 'top-down-open':{desktop:'',mobile:''},
 'phone-lift':{desktop:'',mobile:''},
 'screen-wake':{desktop:'',mobile:''},
 'live-handoff':{desktop:'',mobile:''}
});

export const defaultTransitionFrames=():TransitionFrameMap=>({
 'box-establishing':{desktop:'/cinematic/heart-phone/01-box.jpg',mobile:''},
 'gloves-enter':{desktop:'/cinematic/heart-phone/02-gloves.jpg',mobile:''},
 'top-down-open':{desktop:'/cinematic/heart-phone/03-open.jpg',mobile:''},
 'phone-lift':{desktop:'/cinematic/heart-phone/04-lift.jpg',mobile:''},
 'screen-wake':{desktop:'/cinematic/heart-phone/05-wake.jpg',mobile:''},
 'live-handoff':{desktop:'/cinematic/heart-phone/06-handoff.jpg',mobile:''}
});

export function buildTransitionScenes(duration:number,t:TransitionTiming):TransitionScene[]{
 const make=(id:TransitionSceneId,startMs:number,endMs:number)=>({id,label:copy[id][0],description:copy[id][1],startMs,endMs});
 return [make('box-establishing',0,t.boxEndMs),make('gloves-enter',t.boxEndMs,t.glovesEndMs),make('top-down-open',t.glovesEndMs,t.openEndMs),make('phone-lift',t.openEndMs,t.liftEndMs),make('screen-wake',t.liftEndMs,t.wakeEndMs),make('live-handoff',t.wakeEndMs,duration)];
}

const finite=(v:unknown,f:number,min:number,max:number)=>typeof v==='number'&&Number.isFinite(v)?Math.min(max,Math.max(min,v)):f;
const media=(v:unknown)=>typeof v==='string'&&(!v||v.startsWith('/')||/^https:\/\//.test(v))?v:'';
const opt=<T extends string>(v:unknown,a:readonly T[],f:T)=>typeof v==='string'&&a.includes(v as T)?v as T:f;
const colour=(v:unknown,f:string)=>typeof v==='string'&&/^#[0-9a-fA-F]{6}$/.test(v)?v:f;
function timing(input:Partial<TransitionTiming>|undefined,d:number){const g=120,p=(v:unknown,r:number,prev:number,left:number)=>finite(v,d*r,prev+g,d-left*g),boxEndMs=p(input?.boxEndMs,1200/8300,0,5),glovesEndMs=p(input?.glovesEndMs,2600/8300,boxEndMs,4),openEndMs=p(input?.openEndMs,4400/8300,glovesEndMs,3),liftEndMs=p(input?.liftEndMs,6100/8300,openEndMs,2),wakeEndMs=p(input?.wakeEndMs,7500/8300,liftEndMs,1);return{boxEndMs,glovesEndMs,openEndMs,liftEndMs,wakeEndMs}}

export function normalizeTransitionVisual(input:TransitionVisualInput|undefined,duration:number){
 const b=defaultTransitionArtDirection,a=input?.artDirection??{},t=timing(input?.timing,duration),defaults=defaultTransitionFrames(),frames=emptyTransitionFrames();
 for(const id of Object.keys(frames) as TransitionSceneId[]){
  const incoming=input?.frames?.[id];
  frames[id]={
   desktop:incoming?.desktop===undefined?defaults[id].desktop:media(incoming.desktop),
   mobile:incoming?.mobile===undefined?defaults[id].mobile:media(incoming.mobile)
  };
 }
 const artDirection:TransitionArtDirection={renderMode:opt(a.renderMode,['auto','video','hybrid','fallback'] as const,b.renderMode),backgroundColor:colour(a.backgroundColor,b.backgroundColor),ambientColor:colour(a.ambientColor,b.ambientColor),lightColor:colour(a.lightColor,b.lightColor),lightIntensity:finite(a.lightIntensity,b.lightIntensity,0,2),brightness:finite(a.brightness,b.brightness,.25,2),contrast:finite(a.contrast,b.contrast,.25,2),saturation:finite(a.saturation,b.saturation,0,2),vignette:finite(a.vignette,b.vignette,0,1),bloom:finite(a.bloom,b.bloom,0,1),stageScale:finite(a.stageScale,b.stageScale,.5,2),stageOffsetX:finite(a.stageOffsetX,b.stageOffsetX,-600,600),stageOffsetY:finite(a.stageOffsetY,b.stageOffsetY,-600,600),frameFit:opt(a.frameFit,['cover','contain'] as const,b.frameFit),framePositionX:finite(a.framePositionX,b.framePositionX,0,100),framePositionY:finite(a.framePositionY,b.framePositionY,0,100),boxWidth:finite(a.boxWidth,b.boxWidth,220,900),boxAspect:finite(a.boxAspect,b.boxAspect,1,3),boxRadius:finite(a.boxRadius,b.boxRadius,0,80),lidThickness:finite(a.lidThickness,b.lidThickness,1,40),trayInset:finite(a.trayInset,b.trayInset,0,30),phoneScale:finite(a.phoneScale,b.phoneScale,.5,1.8),mobilePhoneScale:finite(a.mobilePhoneScale,b.mobilePhoneScale,.5,1.8),phoneOffsetX:finite(a.phoneOffsetX,b.phoneOffsetX,-600,600),phoneOffsetY:finite(a.phoneOffsetY,b.phoneOffsetY,-600,600),phoneTilt:finite(a.phoneTilt,b.phoneTilt,-30,30),interfaceSource:opt(a.interfaceSource,['live-home','frame-only'] as const,b.interfaceSource),interfaceOpacity:finite(a.interfaceOpacity,b.interfaceOpacity,0,1)};
 return{frames,artDirection,timing:t,scenes:buildTransitionScenes(duration,t)};
}

const str=(v:CMSField)=>typeof v==='string'?v:undefined,num=(v:CMSField)=>typeof v==='number'?v:undefined;
const keys:Record<TransitionSceneId,[string,string]>={
 'box-establishing':['transitionFrameBoxSrc','transitionMobileFrameBoxSrc'],
 'gloves-enter':['transitionFrameGlovesSrc','transitionMobileFrameGlovesSrc'],
 'top-down-open':['transitionFrameOpenSrc','transitionMobileFrameOpenSrc'],
 'phone-lift':['transitionFrameLiftSrc','transitionMobileFrameLiftSrc'],
 'screen-wake':['transitionFrameWakeSrc','transitionMobileFrameWakeSrc'],
 'live-handoff':['transitionFrameHandoffSrc','transitionMobileFrameHandoffSrc']
};

export function transitionVisualFromProps(p:Record<string,CMSField>):TransitionVisualInput{
 const frames:NonNullable<TransitionVisualInput['frames']>={};
 for(const id of Object.keys(keys) as TransitionSceneId[]){const[k,m]=keys[id];frames[id]={desktop:str(p[k]),mobile:str(p[m])}}
 return{frames,artDirection:{renderMode:str(p.transitionRenderMode) as TransitionRenderMode|undefined,backgroundColor:str(p.transitionBackgroundColor),ambientColor:str(p.transitionAmbientColor),lightColor:str(p.transitionLightColor),lightIntensity:num(p.transitionLightIntensity),brightness:num(p.transitionBrightness),contrast:num(p.transitionContrast),saturation:num(p.transitionSaturation),vignette:num(p.transitionVignette),bloom:num(p.transitionBloom),stageScale:num(p.transitionStageScale),stageOffsetX:num(p.transitionStageOffsetX),stageOffsetY:num(p.transitionStageOffsetY),frameFit:str(p.transitionFrameFit) as TransitionFrameFit|undefined,framePositionX:num(p.transitionFramePositionX),framePositionY:num(p.transitionFramePositionY),boxWidth:num(p.transitionBoxWidth),boxAspect:num(p.transitionBoxAspect),boxRadius:num(p.transitionBoxRadius),lidThickness:num(p.transitionLidThickness),trayInset:num(p.transitionTrayInset),phoneScale:num(p.transitionPhoneScale),mobilePhoneScale:num(p.transitionMobilePhoneScale),phoneOffsetX:num(p.transitionPhoneOffsetX),phoneOffsetY:num(p.transitionPhoneOffsetY),phoneTilt:num(p.transitionPhoneTilt),interfaceSource:str(p.transitionInterfaceSource) as TransitionInterfaceSource|undefined,interfaceOpacity:num(p.transitionInterfaceOpacity)},timing:{boxEndMs:num(p.transitionBoxEndMs),glovesEndMs:num(p.transitionGlovesEndMs),openEndMs:num(p.transitionOpenEndMs),liftEndMs:num(p.transitionLiftEndMs),wakeEndMs:num(p.transitionWakeEndMs)}};
}

export function transitionVisualToProps(v:{frames:TransitionFrameMap;artDirection:TransitionArtDirection;timing:TransitionTiming}){
 const a=v.artDirection,p:Record<string,CMSField>={transitionRenderMode:a.renderMode,transitionBackgroundColor:a.backgroundColor,transitionAmbientColor:a.ambientColor,transitionLightColor:a.lightColor,transitionLightIntensity:a.lightIntensity,transitionBrightness:a.brightness,transitionContrast:a.contrast,transitionSaturation:a.saturation,transitionVignette:a.vignette,transitionBloom:a.bloom,transitionStageScale:a.stageScale,transitionStageOffsetX:a.stageOffsetX,transitionStageOffsetY:a.stageOffsetY,transitionFrameFit:a.frameFit,transitionFramePositionX:a.framePositionX,transitionFramePositionY:a.framePositionY,transitionBoxWidth:a.boxWidth,transitionBoxAspect:a.boxAspect,transitionBoxRadius:a.boxRadius,transitionLidThickness:a.lidThickness,transitionTrayInset:a.trayInset,transitionPhoneScale:a.phoneScale,transitionMobilePhoneScale:a.mobilePhoneScale,transitionPhoneOffsetX:a.phoneOffsetX,transitionPhoneOffsetY:a.phoneOffsetY,transitionPhoneTilt:a.phoneTilt,transitionInterfaceSource:a.interfaceSource,transitionInterfaceOpacity:a.interfaceOpacity,transitionBoxEndMs:v.timing.boxEndMs,transitionGlovesEndMs:v.timing.glovesEndMs,transitionOpenEndMs:v.timing.openEndMs,transitionLiftEndMs:v.timing.liftEndMs,transitionWakeEndMs:v.timing.wakeEndMs};
 for(const id of Object.keys(keys) as TransitionSceneId[]){const[k,m]=keys[id];p[k]=v.frames[id].desktop;p[m]=v.frames[id].mobile}
 return p;
}
