import type {CMSField,CMSNode,PageDocument} from './cms';
import type {InspectorField} from './inspector-fields';
import {defaultHeartToPhoneTransition,transitionToHeartActionProps} from './heart-to-phone-transition';
import {safeMediaUrl} from './validate';
import {
 getInspectorCapabilities as getBaseInspectorCapabilities,
 normalizeInspectorValue as normalizeBaseInspectorValue,
 type InspectorCapability,
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
 transitionWakeSrc:{key:'transitionWakeSrc',label:'Screen-wake sound effect',kind:'audio'}
};
const transitionMediaKeys=new Set(Object.keys(transitionMedia));

export function getInspectorCapabilities(pageSlug:string,document:PageDocument,node:CMSNode):InspectorCapability[]{
 const caps=getBaseInspectorCapabilities(pageSlug,document,node);
 if(node.props.heartPart!=='next')return caps;
 return caps.map(cap=>{
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
}

export function normalizeInspectorValue(field:InspectorField,raw:string):CMSField{
 if(transitionMediaKeys.has(field.key)&&!safeMediaUrl(raw))throw new Error('Use an HTTPS URL, a site path, or choose media from the library.');
 return normalizeBaseInspectorValue(field,raw);
}
