'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import {
 addArchiveMemory,getInspectorCapabilities,mediaDirectPatch,mediaSelectionPatch,normalizeInspectorValue,resetNodeProperty,resetResponsive,updateNode,
 type CMSField,type CMSNode,type InspectorCapability,type InspectorField,type InspectorGroup,type MediaTargetContract,type PageDocument
} from '@wiffeyyyy/content';
import MediaLibrary from './media-library';
const button='rounded-md border border-[#c9cccf] bg-white px-3 py-2 text-[13px] font-medium text-[#303030] hover:bg-[#f6f6f7] disabled:cursor-not-allowed disabled:opacity-40';
const input='mt-1.5 h-9 w-full rounded-md border border-[#8c9196] bg-white px-3 text-[13px] text-[#303030] outline-none focus:border-[#005bd3] focus:ring-1 focus:ring-[#005bd3]';
const sectionTitle='text-[13px] font-semibold text-[#303030]';
type SettingsSection='Content'|'Image'|'Position'|'Typography'|'Colours'|'Layout'|'Padding'|'Margin'|'Border & shadow'|'Effects'|'Playback'|'Navigation'|'Animation'|'Visibility & behavior'|'Advanced';
const fontKeys=new Set(['fontFamily','size','weight','align','lineHeight','letterSpacing','titleItalic','titleTracking','controlTextSize']);
const paddingKeys=new Set(['padding','paddingTop','paddingRight','paddingBottom','paddingLeft','popupPadding','controlPadding','mobileHeroTopPadding']);
const marginKeys=new Set(['margin','marginTop','marginRight','marginBottom','marginLeft']);
const colorKeys=new Set(['background','color','borderColor','transitionColor','gradientStart','gradientEnd','glowOneColor','glowTwoColor','decorativeHeartColor','bg','bg2','bg3','text','muted','pink','rose','blush','violet','line','glass','border','iconBackground']);
const borderKeys=new Set(['radius','borderWidth','shadow','nodeRadius','mobileNodeRadius','popupRadius','controlRadius']);
const imageKeys=new Set(['src','alt','emptyLabel','objectFit','focalX','focalY','displayHeight','mobileImageHeight','imageSide','poster','avatar','callerPhoto']);
const layoutKeys=new Set(['columns','gap','maxWidth','heroMinHeight','heroSideSpace','heroGap','mobileHeroMinHeight','decorativeHeartSize','nodeWidth','mobileNodeWidth','popupWidth','mobilePopupWidth','controlHeight','povTop','mobilePovTop','hudInset','offsetX','offsetY','offsetZ','cardScale','heartScale','mobileHeartScale','heartDepth','mobileHeartDepth','shells','initialZoom','openSpread','closeSpread','perspective']);
const animationKeys=new Set(['visualEffects','transitionEnabled','transitionDuration','revealAnimation','hoverLift','drifting','driftSpeed','zoomSpeed','heartbeat','heartbeatDuration','showMesh','showOutline','showCenter','showParticles','showFloatingHearts','showGrain','showVignette']);
const playbackKeys=new Set(['loop','initialVolume','captions','voiceSrc','introSrc','transcript']);
const navigationKeys=new Set(['href','openInNewTab','pageSlug','placement','archiveBackLabel','transitionText']);
function settingSection(cap:InspectorCapability,group:InspectorGroup):SettingsSection{
 const key=cap.field.key;
 if(cap.media||imageKeys.has(key))return ['focalX','focalY'].includes(key)?'Position':'Image';
 if(fontKeys.has(key))return 'Typography';
 if(paddingKeys.has(key))return 'Padding';
 if(marginKeys.has(key))return 'Margin';
 if(borderKeys.has(key))return 'Border & shadow';
 if(colorKeys.has(key))return 'Colours';
 if(layoutKeys.has(key))return 'Layout';
 if(playbackKeys.has(key))return 'Playback';
 if(navigationKeys.has(key))return 'Navigation';
 if(animationKeys.has(key))return 'Animation';
 if(['opacity','decorationOpacity','grainOpacity','vignetteStrength','outlineOpacity','centerOpacity','dim','mutedAlpha','softAlpha','lineAlpha','glassAlpha','borderAlpha'].includes(key))return 'Effects';
 if(group==='behavior')return 'Visibility & behavior';
 if(group==='content')return 'Content';
 return 'Advanced';
}
function friendlyLabel(field:InspectorField,section:SettingsSection){
 const edge:Record<string,string>={padding:'All sides',paddingTop:'Top',paddingRight:'Right',paddingBottom:'Bottom',paddingLeft:'Left',margin:'All sides',marginTop:'Top',marginRight:'Right',marginBottom:'Bottom',marginLeft:'Left'};
 if(edge[field.key])return edge[field.key];
 if(field.key==='background')return 'Background';if(field.key==='color')return 'Text colour';if(field.key==='radius')return 'Corner radius';if(field.key==='borderColor')return 'Border colour';if(field.key==='borderWidth')return 'Border width';
 if(field.key==='src')return 'Image';if(field.key==='alt')return 'Alt text';if(field.key==='objectFit')return 'Image fit';if(field.key==='displayHeight')return 'Height';if(field.key==='maxWidth')return section==='Image'?'Maximum image width':'Maximum width';
 return field.label.replace(/^padding /i,'').replace(/^margin /i,'');
}
function optionLabel(field:InspectorField,option:string){
 if(field.key==='objectFit')return option==='cover'?'Fill area (crop)':option==='contain'?'Fit inside':option;
 if(option==='true')return 'On';if(option==='false')return 'Off';
 return option.charAt(0).toUpperCase()+option.slice(1).replaceAll('-',' ');
}
function FieldControl({field,value,capability,inherited,disabled,label,onApply,onReset,onPickMedia}:{field:InspectorField;value:CMSField|undefined;capability:InspectorCapability;inherited?:boolean;disabled:boolean;label:string;onApply:(value:CMSField)=>void;onReset:()=>void;onPickMedia?:()=>void}){
 const [message,setMessage]=useState('');
 const apply=(raw:string)=>{if(raw===String(value??''))return;try{onApply(normalizeInspectorValue(field,raw));setMessage('')}catch(error){setMessage(error instanceof Error?error.message:'Invalid value')}};
 const current=String(value??'');const isHex=/^#[0-9a-fA-F]{6}$/.test(current);
 return <div className="py-2.5" title={capability.storagePath}><div className="flex items-start gap-2"><label className="min-w-0 flex-1 text-[12px] font-medium text-[#303030]">{label}{field.type==='textarea'?<textarea key={current} className="mt-1.5 min-h-20 w-full resize-y rounded-md border border-[#8c9196] bg-white px-3 py-2 text-[13px] outline-none focus:border-[#005bd3] focus:ring-1 focus:ring-[#005bd3]" defaultValue={current} rows={3} disabled={disabled} onBlur={e=>apply(e.target.value)}/>:field.type==='select'?<select className={input} value={current} disabled={disabled} onChange={e=>apply(e.target.value)}>{field.options?.map(option=><option key={option} value={option}>{optionLabel(field,option)}</option>)}</select>:field.type==='color'?<div className="mt-1.5 flex gap-2"><input aria-label={label+' colour picker'} type="color" className="h-9 w-11 cursor-pointer rounded-md border border-[#8c9196] bg-white p-1" value={isHex?current:'#ffffff'} disabled={disabled} onChange={e=>apply(e.target.value)}/><input key={current} className="h-9 min-w-0 flex-1 rounded-md border border-[#8c9196] bg-white px-3 text-[13px] outline-none focus:border-[#005bd3] focus:ring-1 focus:ring-[#005bd3]" defaultValue={current} disabled={disabled} placeholder="#ffffff or transparent" onBlur={e=>apply(e.target.value)}/></div>:<input key={current} className={input} defaultValue={current} disabled={disabled} type={field.type==='number'?'number':'text'} min={field.min} max={field.max} step={field.step} onBlur={e=>apply(e.target.value)}/>} {inherited&&<span className="mt-1 block text-[11px] font-normal text-[#6d7175]">Inherited from Default</span>}</label><button type="button" className="mt-6 text-[11px] font-medium text-[#005bd3] hover:underline disabled:opacity-40" disabled={disabled} onClick={onReset}>{capability.resetPolicy==='component-default'?'Reset':'Clear'}</button></div>{onPickMedia&&<button type="button" className={button+' mt-2 w-full'} disabled={disabled} onClick={onPickMedia}>{current?'Replace '+capability.media?.label.toLowerCase():'Add '+capability.media?.label.toLowerCase()}</button>}{capability.dependency&&<p className="mt-1.5 text-[11px] leading-4 text-[#6d7175]">{capability.dependency}</p>}{message&&<p role="alert" className="mt-1.5 text-[11px] text-[#d72c0d]">{message}</p>}</div>;
}
function ImagePosition({document,node,capabilities,designScope,disabled,onCommit}:{document:PageDocument;node:CMSNode;capabilities:InspectorCapability[];designScope:'base'|'mobile'|'tablet'|'desktop';disabled:boolean;onCommit:(operation:()=>CommitResult)=>void}){
 const xCap=capabilities.find(cap=>cap.field.key==='focalX'),yCap=capabilities.find(cap=>cap.field.key==='focalY');if(!xCap||!yCap)return null;
 const prefix=designScope==='base'?'':designScope+':',xKey=prefix+'focalX',yKey=prefix+'focalY';const x=Number(node.props[xKey]??node.props.focalX??50),y=Number(node.props[yKey]??node.props.focalY??50);
 const presets=[['Top left',0,0],['Top',50,0],['Top right',100,0],['Left',0,50],['Centre',50,50],['Right',100,50],['Bottom left',0,100],['Bottom',50,100],['Bottom right',100,100]] as const;
 const patch=(nx:number,ny:number)=>onCommit(()=>updateNode(document,node.id,{props:{[xKey]:nx,[yKey]:ny}}));
 return <section className="border-t border-[#e1e3e5] py-3"><h4 className={sectionTitle}>Position</h4><p className="mt-1 text-[11px] leading-4 text-[#6d7175]">Choose which part of the image stays in focus when the frame crops it.</p><div className="mt-3 grid grid-cols-3 gap-1.5">{presets.map(([name,px,py])=><button key={name} type="button" disabled={disabled} aria-label={name} aria-pressed={x===px&&y===py} title={name} onClick={()=>patch(px,py)} className={'h-9 rounded-md border text-[11px] '+(x===px&&y===py?'border-[#005bd3] bg-[#eaf3ff] text-[#005bd3]':'border-[#c9cccf] bg-white hover:bg-[#f6f6f7]')}>{name}</button>)}</div><div className="mt-3 grid grid-cols-2 gap-2"><label className="text-[11px] text-[#6d7175]">Horizontal %<input className={input+' mt-1'} type="number" min="0" max="100" value={x} disabled={disabled} onChange={e=>patch(Number(e.target.value),y)}/></label><label className="text-[11px] text-[#6d7175]">Vertical %<input className={input+' mt-1'} type="number" min="0" max="100" value={y} disabled={disabled} onChange={e=>patch(x,Number(e.target.value))}/></label></div></section>;
}
type CommitResult=PageDocument|{document:PageDocument;selectedId:string|null};
export default function EditorInspectorFields({document,node,pageSlug,siteId,canWrite,busy,group,designScope,onDesignScope,onCommit}:{document:PageDocument;node:CMSNode;pageSlug:string;siteId?:string;canWrite:boolean;busy:boolean;group:InspectorGroup;designScope:'base'|'mobile'|'tablet'|'desktop';onDesignScope:(scope:'base'|'mobile'|'tablet'|'desktop')=>void;onCommit:(operation:()=>CommitResult)=>void}){
 const dialog=useRef<HTMLDialogElement>(null);const [mediaTarget,setMediaTarget]=useState<(MediaTargetContract&{nodeId:string})|null>(null);
 useEffect(()=>{if(mediaTarget)dialog.current?.showModal()},[mediaTarget]);
 const all=getInspectorCapabilities(pageSlug,document,node),capabilities=all.filter(cap=>cap.group===group).filter(cap=>group!=='appearance'||designScope==='base'||cap.responsive);const disabled=!canWrite||busy;const patch=(props:Record<string,CMSField>)=>onCommit(()=>updateNode(document,node.id,{props}));
 const positionCaps=group==='appearance'&&node.component==='image'?capabilities.filter(cap=>['focalX','focalY'].includes(cap.field.key)):[];
 const displayCaps=capabilities.filter(cap=>!(node.component==='image'&&['focalX','focalY'].includes(cap.field.key)));
 const sections=useMemo(()=>{const map=new Map<SettingsSection,InspectorCapability[]>();for(const cap of displayCaps){const key=settingSection(cap,group),list=map.get(key)??[];list.push(cap);map.set(key,list)}return [...map.entries()]},[displayCaps,group]);
 return <div>
  {group==='content'&&<section className="border-b border-[#e1e3e5] pb-3"><h4 className={sectionTitle}>Content</h4><label className="mt-2 block text-[12px] font-medium text-[#303030]">Layer name<input className={input} value={node.label??node.component} disabled={disabled} maxLength={200} onChange={e=>onCommit(()=>updateNode(document,node.id,{label:e.target.value}))}/></label><p className="mt-1.5 text-[11px] leading-4 text-[#6d7175]">Only used in the editor hierarchy.</p></section>}
  {group==='content'&&node.props.archivePart==='collection'&&<section className="border-b border-[#e1e3e5] py-3"><button type="button" className={button+' w-full'} disabled={disabled} onClick={()=>onCommit(()=>addArchiveMemory(document,node.id,()=>crypto.randomUUID()))}>+ Add memory</button><p className="mt-1.5 text-[11px] leading-4 text-[#6d7175]">Adds a complete editable memory. Existing memories are never changed.</p></section>}
  {group==='behavior'&&<section className="border-b border-[#e1e3e5] py-3"><h4 className={sectionTitle}>Visibility</h4><label className="mt-2 flex items-center justify-between text-[12px] font-medium text-[#303030]">Show this section or block<input type="checkbox" checked={node.visible} disabled={disabled} onChange={e=>onCommit(()=>updateNode(document,node.id,{visible:e.target.checked}))}/></label></section>}
  {group==='appearance'&&<section className="border-b border-[#e1e3e5] py-3"><h4 className={sectionTitle}>Responsive</h4><label className="mt-2 block text-[12px] font-medium text-[#303030]">Edit settings for<select className={input} value={designScope} disabled={disabled} onChange={e=>onDesignScope(e.target.value as 'base'|'mobile'|'tablet'|'desktop')}><option value="base">Default</option><option value="mobile">Mobile</option><option value="tablet">Tablet</option><option value="desktop">Desktop</option></select></label>{designScope!=='base'&&<button type="button" className={button+' mt-2 w-full'} disabled={disabled} onClick={()=>onCommit(()=>resetResponsive(document,node.id,designScope))}>Reset {designScope} overrides</button>}</section>}
  {sections.map(([section,caps])=><section key={section} className="border-b border-[#e1e3e5] py-3 last:border-b-0"><h4 className={sectionTitle}>{section}</h4><div className="divide-y divide-[#f0f1f2]">{caps.map(cap=>{const storageKey=group==='appearance'&&designScope!=='base'?designScope+':'+cap.field.key:cap.field.key;const overridden=node.props[storageKey]!==undefined;const value=group==='appearance'&&designScope!=='base'?(node.props[storageKey]??node.props[cap.field.key]):node.props[cap.field.key];return <FieldControl key={node.id+storageKey+String(value)} field={cap.field} label={friendlyLabel(cap.field,section)} value={value} capability={cap} inherited={group==='appearance'&&designScope!=='base'&&!overridden} disabled={disabled} onApply={next=>{if(cap.media)patch(mediaDirectPatch(cap.media,String(next)));else patch({[storageKey]:next})}} onReset={()=>onCommit(()=>resetNodeProperty(document,node.id,storageKey,designScope==='base'&&cap.hasDefault,cap.defaultValue))} onPickMedia={siteId&&cap.media?()=>setMediaTarget({...cap.media!,nodeId:node.id}):undefined}/>})}</div></section>)}
  {positionCaps.length>0&&<ImagePosition document={document} node={node} capabilities={positionCaps} designScope={designScope} disabled={disabled} onCommit={onCommit}/>} 
  {mediaTarget&&siteId&&<dialog ref={dialog} onClose={()=>setMediaTarget(null)} aria-modal="true" aria-label={'Choose '+mediaTarget.label} className="fixed inset-4 z-50 m-auto max-h-[90vh] w-[min(1100px,95vw)] overflow-auto rounded-lg border border-[#c9cccf] bg-white p-5 shadow-2xl" onCancel={()=>setMediaTarget(null)}><div className="mb-4 flex items-center justify-between"><div><p className="text-xs text-[#6d7175]">Media</p><h2 className="font-semibold text-[#303030]">{mediaTarget.label}</h2></div><button type="button" className={button} onClick={()=>setMediaTarget(null)}>Close</button></div><MediaLibrary siteId={siteId} canWrite={canWrite} kind={mediaTarget.kind} onClose={()=>setMediaTarget(null)} onPick={media=>{onCommit(()=>updateNode(document,mediaTarget.nodeId,{props:mediaSelectionPatch(mediaTarget,media)}));setMediaTarget(null)}}/></dialog>}
 </div>;
}
