import type {CMSField,CMSNode,PageDocument} from './cms';
import type {InspectorField} from './inspector-fields';
import {defaultHeartToPhoneTransition,transitionToHeartActionProps} from './heart-to-phone-transition';
import {safeMediaUrl} from './validate';
import {
 getInspectorCapabilities as getBaseInspectorCapabilities,
 normalizeInspectorValue as normalizeBaseInspectorValue,
 type InspectorCapability,
 type InspectorGroup,
 type MediaTargetContract
} from './inspector-capabilities';

export type {InspectorGroup,MediaKind,MediaTargetContract,InspectorCapability} from './inspector-capabilities';
export {supportsPageTheme,resetNodeProperty,mediaDirectPatch,mediaSelectionPatch} from './inspector-capabilities';

const transitionDefaults=transitionToHeartActionProps(defaultHeartToPhoneTransition);
const transitionMedia:Record<string,MediaTargetContract>={
 transitionVideoSrc:{key:'transitionVideoSrc',label:'Desktop cinematic video',kind:'video'},
 transitionMobileVideoSrc:{key:'transitionMobileVideoSrc',label:'Mobile cinematic video',kind:'video'},
 transitionPosterSrc:{key:'transitionPosterSrc',label:'Cinematic poster',kind:'image'},
 transitionMusicSrc:{key:'transitionMusicSrc',label:'Transition background score',kind:'audio'},
 transitionUnboxingSrc:{key:'transitionUnboxingSrc',label:'Unboxing sound effect',kind:'audio'},
 transitionWakeSrc:{key:'transitionWakeSrc',label:'Screen-wake sound effect',kind:'audio'},
 transitionFrameBoxSrc:{key:'transitionFrameBoxSrc',label:'01 · Closed box frame',kind:'image'},
 transitionMobileFrameBoxSrc:{key:'transitionMobileFrameBoxSrc',label:'01 · Closed box mobile frame',kind:'image'},
 transitionFrameGlovesSrc:{key:'transitionFrameGlovesSrc',label:'02 · Gloved hands frame',kind:'image'},
 transitionMobileFrameGlovesSrc:{key:'transitionMobileFrameGlovesSrc',label:'02 · Gloved hands mobile frame',kind:'image'},
 transitionFrameOpenSrc:{key:'transitionFrameOpenSrc',label:'03 · Open box frame',kind:'image'},
 transitionMobileFrameOpenSrc:{key:'transitionMobileFrameOpenSrc',label:'03 · Open box mobile frame',kind:'image'},
 transitionFrameLiftSrc:{key:'transitionFrameLiftSrc',label:'04 · Phone lift frame',kind:'image'},
 transitionMobileFrameLiftSrc:{key:'transitionMobileFrameLiftSrc',label:'04 · Phone lift mobile frame',kind:'image'},
 transitionFrameWakeSrc:{key:'transitionFrameWakeSrc',label:'05 · Screen wake frame',kind:'image'},
 transitionMobileFrameWakeSrc:{key:'transitionMobileFrameWakeSrc',label:'05 · Screen wake mobile frame',kind:'image'},
 transitionFrameHandoffSrc:{key:'transitionFrameHandoffSrc',label:'06 · Final handoff frame',kind:'image'},
 transitionMobileFrameHandoffSrc:{key:'transitionMobileFrameHandoffSrc',label:'06 · Final handoff mobile frame',kind:'image'}
};
const transitionMediaKeys=new Set(Object.keys(transitionMedia));

const transitionEditorFields:InspectorField[]=[
 {key:'transitionRenderMode',label:'Render source',type:'select',options:['auto','video','hybrid','fallback']},
 {key:'transitionFrameBoxSrc',label:'01 · Closed box frame',type:'text'},{key:'transitionMobileFrameBoxSrc',label:'01 · Closed box mobile frame',type:'text'},
 {key:'transitionFrameGlovesSrc',label:'02 · Gloved hands frame',type:'text'},{key:'transitionMobileFrameGlovesSrc',label:'02 · Gloved hands mobile frame',type:'text'},
 {key:'transitionFrameOpenSrc',label:'03 · Open box frame',type:'text'},{key:'transitionMobileFrameOpenSrc',label:'03 · Open box mobile frame',type:'text'},
 {key:'transitionFrameLiftSrc',label:'04 · Phone lift frame',type:'text'},{key:'transitionMobileFrameLiftSrc',label:'04 · Phone lift mobile frame',type:'text'},
 {key:'transitionFrameWakeSrc',label:'05 · Screen wake frame',type:'text'},{key:'transitionMobileFrameWakeSrc',label:'05 · Screen wake mobile frame',type:'text'},
 {key:'transitionFrameHandoffSrc',label:'06 · Final handoff frame',type:'text'},{key:'transitionMobileFrameHandoffSrc',label:'06 · Final handoff mobile frame',type:'text'},
 {key:'transitionBackgroundColor',label:'Studio background',type:'color'},{key:'transitionAmbientColor',label:'Ambient light colour',type:'color'},{key:'transitionLightColor',label:'Key light colour',type:'color'},
 {key:'transitionLightIntensity',label:'Key light intensity',type:'number',min:0,max:2,step:.05},{key:'transitionBrightness',label:'Scene brightness',type:'number',min:.25,max:2,step:.05},{key:'transitionContrast',label:'Scene contrast',type:'number',min:.25,max:2,step:.05},{key:'transitionSaturation',label:'Scene saturation',type:'number',min:0,max:2,step:.05},{key:'transitionVignette',label:'Edge vignette',type:'number',min:0,max:1,step:.05},{key:'transitionBloom',label:'Light bloom',type:'number',min:0,max:1,step:.05},
 {key:'transitionStageScale',label:'Whole scene scale',type:'number',min:.5,max:2,step:.01},{key:'transitionStageOffsetX',label:'Scene horizontal position',type:'number',min:-600,max:600,step:1},{key:'transitionStageOffsetY',label:'Scene vertical position',type:'number',min:-600,max:600,step:1},{key:'transitionFrameFit',label:'Frame fit',type:'select',options:['cover','contain']},{key:'transitionFramePositionX',label:'Frame focus horizontal (%)',type:'number',min:0,max:100,step:1},{key:'transitionFramePositionY',label:'Frame focus vertical (%)',type:'number',min:0,max:100,step:1},
 {key:'transitionBoxWidth',label:'Fallback box width',type:'number',min:220,max:900,step:5},{key:'transitionBoxAspect',label:'Fallback box width / height ratio',type:'number',min:1,max:3,step:.01},{key:'transitionBoxRadius',label:'Fallback box corner radius',type:'number',min:0,max:80,step:1},{key:'transitionLidThickness',label:'Fallback lid thickness',type:'number',min:1,max:40,step:1},{key:'transitionTrayInset',label:'Fallback tray inset (%)',type:'number',min:0,max:30,step:1},
 {key:'transitionPhoneScale',label:'Desktop live phone scale',type:'number',min:.5,max:1.8,step:.01},{key:'transitionMobilePhoneScale',label:'Mobile live phone scale',type:'number',min:.5,max:1.8,step:.01},{key:'transitionPhoneOffsetX',label:'Live phone horizontal position',type:'number',min:-600,max:600,step:1},{key:'transitionPhoneOffsetY',label:'Live phone vertical position',type:'number',min:-600,max:600,step:1},{key:'transitionPhoneTilt',label:'Live phone tilt (degrees)',type:'number',min:-30,max:30,step:.5},
 {key:'transitionInterfaceSource',label:'OS screen source',type:'select',options:['live-home','frame-only']},{key:'transitionInterfaceOpacity',label:'Live OS screen opacity',type:'number',min:0,max:1,step:.05},
 {key:'transitionBoxEndMs',label:'01 · Box scene ends at',type:'number',min:200,max:19000,step:50},{key:'transitionGlovesEndMs',label:'02 · Gloves scene ends at',type:'number',min:300,max:19500,step:50},{key:'transitionOpenEndMs',label:'03 · Open scene ends at',type:'number',min:400,max:19700,step:50},{key:'transitionLiftEndMs',label:'04 · Lift scene ends at',type:'number',min:500,max:19800,step:50},{key:'transitionWakeEndMs',label:'05 · Wake scene ends at',type:'number',min:600,max:19900,step:50}
];
const behaviorKeys=new Set(['transitionRenderMode','transitionInterfaceSource','transitionBoxEndMs','transitionGlovesEndMs','transitionOpenEndMs','transitionLiftEndMs','transitionWakeEndMs']);
const appearanceKeys=new Set(transitionEditorFields.map(field=>field.key).filter(key=>!transitionMediaKeys.has(key)&&!behaviorKeys.has(key)));

function extraCapability(node:CMSNode,field:InspectorField):InspectorCapability{
 const key=field.key,hasDefault=Object.hasOwn(transitionDefaults,key),media=transitionMedia[key];
 const group:InspectorGroup=behaviorKeys.has(key)?'behavior':appearanceKeys.has(key)?'appearance':'content';
 const dependency=key.startsWith('transitionMobileFrame')?'Optional mobile override. When empty, the desktop frame is used.':key==='transitionInterfaceSource'?'Live Home uses the actual published Home page, so wallpaper, widgets and app icons stay editable in the Home editor.':key.startsWith('transitionBox')||key==='transitionLidThickness'||key==='transitionTrayInset'?'Geometry controls affect the browser-built fallback. Uploaded/generated frame pixels are changed by replacing the frame or using framing and lighting controls.':undefined;
 return {field,group,storagePath:`pages.draft_document.nodes[${node.id}].props.${key}`,rendererBinding:`HeartPage.next.${key}`,responsive:false,resetPolicy:hasDefault?'component-default':'delete-override',hasDefault,defaultValue:hasDefault?transitionDefaults[key]:undefined,media,dependency};
}

export function getInspectorCapabilities(pageSlug:string,document:PageDocument,node:CMSNode):InspectorCapability[]{
 const caps=getBaseInspectorCapabilities(pageSlug,document,node);
 if(node.props.heartPart!=='next')return caps;
 const mapped=caps.map(cap=>{
  const key=cap.field.key;
  const hasDefault=Object.hasOwn(transitionDefaults,key);
  const media=transitionMedia[key]??cap.media;
  return {
   ...cap,
   group:'content' as const,
   hasDefault:hasDefault||cap.hasDefault,
   defaultValue:hasDefault?transitionDefaults[key]:cap.defaultValue,
   resetPolicy:hasDefault?'component-default' as const:cap.resetPolicy,
   media,
   dependency:key==='transitionMobileVideoSrc'?'Optional. When empty, the desktop cinematic video is used on mobile.':cap.dependency
  };
 });
 const existing=new Set(mapped.map(cap=>cap.field.key));
 return [...mapped,...transitionEditorFields.filter(field=>!existing.has(field.key)).map(field=>extraCapability(node,field))];
}

export function normalizeInspectorValue(field:InspectorField,raw:string):CMSField{
 if(transitionMediaKeys.has(field.key)&&!safeMediaUrl(raw))throw new Error('Use an HTTPS URL, a site path, or choose media from the library.');
 return normalizeBaseInspectorValue(field,raw);
}
