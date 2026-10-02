'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import {
 addArchiveMemory,getInspectorCapabilities,mediaDirectPatch,mediaSelectionPatch,normalizeInspectorValue,resetNodeProperty,resetResponsive,updateNode,
 type CMSField,type CMSNode,type InspectorCapability,type InspectorField,type InspectorGroup,type MediaTargetContract,type PageDocument
} from '@wiffeyyyy/content';
import MediaLibrary from './media-library';

const button='rounded-md border border-[#c9cccf] bg-white px-3 py-2 text-[13px] font-medium text-[#303030] hover:bg-[#f6f6f7] disabled:cursor-not-allowed disabled:opacity-40';
const input='h-9 w-full rounded-md border border-[#8c9196] bg-white px-3 text-[13px] text-[#303030] outline-none focus:border-[#005bd3] focus:ring-1 focus:ring-[#005bd3]';
const sectionTitle='text-[13px] font-semibold text-[#202223]';
const subtle='text-[11px] leading-4 text-[#6d7175]';
const chip='h-8 rounded-md border border-[#c9cccf] bg-white px-2.5 text-[12px] font-medium text-[#303030] hover:bg-[#f6f6f7] disabled:opacity-40';

type SettingsSection='Content'|'Image'|'Media'|'Position'|'Typography'|'Colours'|'Layout'|'Padding'|'Margin'|'Border & shadow'|'Effects'|'Playback'|'Navigation'|'Animation'|'Visibility & behavior'|'Advanced';
type CommitResult=PageDocument|{document:PageDocument;selectedId:string|null};
type Scope='base'|'mobile'|'tablet'|'desktop';

const sectionOrder:SettingsSection[]=['Content','Image','Media','Position','Typography','Colours','Layout','Padding','Margin','Border & shadow','Effects','Playback','Navigation','Animation','Visibility & behavior','Advanced'];
const sectionIcons:Record<SettingsSection,string>={Content:'✎',Image:'▧',Media:'▶',Position:'⌖',Typography:'T',Colours:'●',Layout:'▤',Padding:'□',Margin:'▢','Border & shadow':'◇',Effects:'✦',Playback:'♫',Navigation:'↗',Animation:'◌','Visibility & behavior':'◉',Advanced:'•••'};
const sectionHelp:Partial<Record<SettingsSection,string>>={
 Image:'Choose or replace media, then control how it fills its frame.',Position:'Choose which part of an image stays visible when it is cropped.',Typography:'Font, size, weight, spacing and text alignment.',Colours:'Colours used by this selected element only.',Layout:'Size, columns, gaps and element-specific positioning.',Padding:'Space inside the selected element.',Margin:'Space outside the selected element.','Border & shadow':'Corners, outline and depth.',Effects:'Opacity and visual intensity.',Navigation:'Where this element goes when it is activated.',Animation:'Motion and transition behavior.',Advanced:'Less common controls for this component.'
};

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
const effectKeys=new Set(['opacity','decorationOpacity','grainOpacity','vignetteStrength','outlineOpacity','centerOpacity','dim','mutedAlpha','softAlpha','lineAlpha','glassAlpha','borderAlpha']);

function settingSection(cap:InspectorCapability,group:InspectorGroup):SettingsSection{
 const key=cap.field.key;
 if(cap.media?.kind==='audio')return 'Playback';
 if(cap.media?.kind==='video')return 'Media';
 if(cap.media?.kind==='image')return ['focalX','focalY'].includes(key)?'Position':'Image';
 if(imageKeys.has(key))return ['focalX','focalY'].includes(key)?'Position':'Image';
 if(fontKeys.has(key))return 'Typography';
 if(paddingKeys.has(key))return 'Padding';
 if(marginKeys.has(key))return 'Margin';
 if(borderKeys.has(key))return 'Border & shadow';
 if(colorKeys.has(key))return 'Colours';
 if(layoutKeys.has(key))return 'Layout';
 if(playbackKeys.has(key))return 'Playback';
 if(navigationKeys.has(key))return 'Navigation';
 if(animationKeys.has(key))return 'Animation';
 if(effectKeys.has(key))return 'Effects';
 if(group==='behavior')return 'Visibility & behavior';
 if(group==='content')return 'Content';
 return 'Advanced';
}

function friendlyLabel(field:InspectorField,section:SettingsSection){
 const edge:Record<string,string>={padding:'All sides',paddingTop:'Top',paddingRight:'Right',paddingBottom:'Bottom',paddingLeft:'Left',margin:'All sides',marginTop:'Top',marginRight:'Right',marginBottom:'Bottom',marginLeft:'Left'};
 if(edge[field.key])return edge[field.key];
 if(field.key==='background')return 'Background';if(field.key==='color')return 'Text colour';if(field.key==='radius')return 'Corner radius';if(field.key==='borderColor')return 'Border colour';if(field.key==='borderWidth')return 'Border width';
 if(field.key==='src')return section==='Image'?'Image':section==='Media'?'Video':'Media';if(field.key==='alt')return section==='Image'?'Alt text':'Description';if(field.key==='objectFit')return 'Image fit';if(field.key==='displayHeight')return 'Height';if(field.key==='maxWidth')return section==='Image'?'Maximum image width':'Maximum width';
 return field.label.replace(/^padding /i,'').replace(/^margin /i,'').replace(/ color$/i,' colour');
}
function optionLabel(field:InspectorField,option:string){
 if(field.key==='objectFit')return option==='cover'?'Fill':option==='contain'?'Fit':option==='fill'?'Stretch':option==='scale-down'?'Scale down':option;
 if(field.key==='shadow')return option==='none'?'None':option==='soft'?'Soft':option==='deep'?'Deep':option;
 if(option==='true')return 'On';if(option==='false')return 'Off';
 return option.charAt(0).toUpperCase()+option.slice(1).replaceAll('-',' ');
}
function storageKey(cap:InspectorCapability,group:InspectorGroup,scope:Scope){return group==='appearance'&&scope!=='base'?scope+':'+cap.field.key:cap.field.key}
function valueFor(node:CMSNode,cap:InspectorCapability,group:InspectorGroup,scope:Scope){const key=storageKey(cap,group,scope);return group==='appearance'&&scope!=='base'?(node.props[key]??node.props[cap.field.key]):node.props[cap.field.key]}

function Switch({checked,disabled,label,onChange}:{checked:boolean;disabled:boolean;label:string;onChange:(checked:boolean)=>void}){
 return <button type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled} onClick={()=>onChange(!checked)} className={'relative h-6 w-11 shrink-0 rounded-full transition-colors '+(checked?'bg-[#008060]':'bg-[#8c9196]')+' disabled:opacity-40'}><span className={'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform '+(checked?'translate-x-5':'translate-x-0.5')}/></button>;
}
function Segmented({options,value,disabled,onChange}:{options:Array<{value:string;label:string;icon?:string}>;value:string;disabled:boolean;onChange:(value:string)=>void}){
 return <div className="grid overflow-hidden rounded-md border border-[#c9cccf] bg-[#f6f6f7]" style={{gridTemplateColumns:`repeat(${options.length},minmax(0,1fr))`}}>{options.map((option,index)=><button key={option.value} type="button" disabled={disabled} aria-pressed={value===option.value} title={option.label} onClick={()=>onChange(option.value)} className={'h-8 min-w-0 px-1 text-[11px] font-medium '+(index?'border-l border-[#c9cccf] ':'')+(value===option.value?'bg-white text-[#005bd3] shadow-[inset_0_0_0_1px_#005bd3]':'text-[#4a4a4a] hover:bg-white/70')}>{option.icon&&<span aria-hidden className="mr-1">{option.icon}</span>}{option.label}</button>)}</div>;
}
function NumberControl({field,value,disabled,onApply}:{field:InspectorField;value:CMSField|undefined;disabled:boolean;onApply:(value:CMSField)=>void}){
 const current=Number(value??0),hasRange=field.min!==undefined&&field.max!==undefined&&Number.isFinite(current),step=field.step??1;
 const commit=(raw:string)=>{try{onApply(normalizeInspectorValue(field,raw))}catch{}}
 return <div className="flex items-center gap-2">{hasRange&&<input aria-label={field.label+' slider'} className="min-w-0 flex-1 accent-[#005bd3]" type="range" min={field.min} max={field.max} step={step} value={current} disabled={disabled} onChange={e=>commit(e.target.value)}/>}<input key={String(value)} aria-label={field.label+' exact value'} className="h-8 w-[72px] rounded-md border border-[#8c9196] bg-white px-2 text-right text-[12px] tabular-nums outline-none focus:border-[#005bd3]" type="number" min={field.min} max={field.max} step={step} defaultValue={String(value??'')} disabled={disabled} onBlur={e=>commit(e.target.value)}/></div>;
}
function ColourControl({field,value,disabled,onApply}:{field:InspectorField;value:CMSField|undefined;disabled:boolean;onApply:(value:CMSField)=>void}){
 const current=String(value??''),isHex=/^#[0-9a-fA-F]{6}$/.test(current);const apply=(raw:string)=>{try{onApply(normalizeInspectorValue(field,raw))}catch{}};
 return <div className="flex items-center gap-2"><label className="relative h-9 w-9 shrink-0 cursor-pointer overflow-hidden rounded-md border border-[#c9cccf] shadow-inner" style={{background:isHex?current:'repeating-conic-gradient(#ddd 0 25%,#fff 0 50%) 0/10px 10px'}}><span className="sr-only">Choose colour</span><input type="color" className="absolute inset-0 h-full w-full cursor-pointer opacity-0" value={isHex?current:'#ffffff'} disabled={disabled} onChange={e=>apply(e.target.value)}/></label><input key={current} className={input+' min-w-0 flex-1 font-mono text-[12px]'} defaultValue={current} disabled={disabled} placeholder="#ffffff or transparent" onBlur={e=>apply(e.target.value)}/></div>;
}
function ImagePreview({src,label}:{src:string;label:string}){if(!src)return <div className="grid h-24 place-items-center rounded-md border border-dashed border-[#c9cccf] bg-[#f6f6f7] text-[11px] text-[#6d7175]">No {label.toLowerCase()} selected</div>;return <div className="overflow-hidden rounded-md border border-[#c9cccf] bg-[#f6f6f7]"><img src={src} alt="" className="h-28 w-full object-cover"/><div className="truncate border-t border-[#e1e3e5] px-2 py-1.5 text-[10px] text-[#6d7175]">{src}</div></div>}

function FieldControl({field,value,capability,inherited,disabled,label,section,onApply,onReset,onPickMedia}:{field:InspectorField;value:CMSField|undefined;capability:InspectorCapability;inherited?:boolean;disabled:boolean;label:string;section:SettingsSection;onApply:(value:CMSField)=>void;onReset:()=>void;onPickMedia?:()=>void}){
 const [message,setMessage]=useState('');const current=String(value??'');
 const apply=(raw:string)=>{if(raw===String(value??''))return;try{onApply(normalizeInspectorValue(field,raw));setMessage('')}catch(error){setMessage(error instanceof Error?error.message:'Invalid value')}};
 const booleanSelect=field.type==='select'&&field.options?.length===2&&field.options.includes('true')&&field.options.includes('false');
 const alignment=field.key==='align'&&field.type==='select';const fit=field.key==='objectFit'&&field.type==='select';const shadow=field.key==='shadow'&&field.type==='select';
 const control=booleanSelect?<Switch checked={current==='true'||value===true} disabled={disabled} label={label} onChange={checked=>apply(String(checked))}/>:alignment?<Segmented disabled={disabled} value={current} onChange={apply} options={[{value:'left',label:'Left',icon:'≡'},{value:'center',label:'Centre',icon:'≡'},{value:'right',label:'Right',icon:'≡'}]}/>:fit?<Segmented disabled={disabled} value={current} onChange={apply} options={(field.options??[]).map(option=>({value:option,label:optionLabel(field,option)}))}/>:shadow?<Segmented disabled={disabled} value={current} onChange={apply} options={(field.options??[]).map(option=>({value:option,label:optionLabel(field,option)}))}/>:field.type==='textarea'?<textarea key={current} className="min-h-20 w-full resize-y rounded-md border border-[#8c9196] bg-white px-3 py-2 text-[13px] outline-none focus:border-[#005bd3] focus:ring-1 focus:ring-[#005bd3]" defaultValue={current} rows={3} disabled={disabled} onBlur={e=>apply(e.target.value)}/>:field.type==='select'?<select className={input} value={current} disabled={disabled} onChange={e=>apply(e.target.value)}>{field.options?.map(option=><option key={option} value={option}>{optionLabel(field,option)}</option>)}</select>:field.type==='color'?<ColourControl field={field} value={value} disabled={disabled} onApply={onApply}/>:field.type==='number'?<NumberControl field={field} value={value} disabled={disabled} onApply={onApply}/>:<input key={current} className={input} defaultValue={current} disabled={disabled} type="text" onBlur={e=>apply(e.target.value)}/>;
 const showMediaPreview=capability.media?.kind==='image'&&['src','poster','avatar','callerPhoto'].includes(field.key);
 return <div className="py-2.5" title={capability.storagePath}>{showMediaPreview&&<div className="mb-2"><ImagePreview src={current} label={capability.media?.label??'Image'}/></div>}<div className="flex items-start justify-between gap-2"><label className="min-w-0 flex-1"><span className="mb-1.5 flex items-center gap-1 text-[12px] font-medium text-[#303030]">{label}{inherited&&<span className="rounded bg-[#f1f1f1] px-1.5 py-0.5 text-[9px] font-normal text-[#6d7175]">Inherited</span>}</span>{control}</label><button type="button" className="mt-6 shrink-0 text-[11px] font-medium text-[#005bd3] hover:underline disabled:opacity-40" disabled={disabled} onClick={onReset}>{capability.resetPolicy==='component-default'?'Reset':'Clear'}</button></div>{onPickMedia&&<div className="mt-2 flex gap-2"><button type="button" className={button+' flex-1'} disabled={disabled} onClick={onPickMedia}>{current?'Replace':'Add'} {capability.media?.label.toLowerCase()}</button>{current&&<button type="button" className={button} disabled={disabled} onClick={onReset}>Remove</button>}</div>}{capability.dependency&&<p className={'mt-1.5 '+subtle}>{capability.dependency}</p>}{message&&<p role="alert" className="mt-1.5 text-[11px] text-[#d72c0d]">{message}</p>}</div>;
}

function SpacingEditor({title,caps,document,node,group,scope,disabled,onCommit}:{title:'Padding'|'Margin';caps:InspectorCapability[];document:PageDocument;node:CMSNode;group:InspectorGroup;scope:Scope;disabled:boolean;onCommit:(operation:()=>CommitResult)=>void}){
 const base=title.toLowerCase(),find=(suffix:string)=>caps.find(cap=>cap.field.key===(suffix?base+suffix:base));
 const entries=[['All',''],['Top','Top'],['Right','Right'],['Bottom','Bottom'],['Left','Left']] as const;
 const patch=(cap:InspectorCapability,raw:string)=>{const key=storageKey(cap,group,scope);onCommit(()=>updateNode(document,node.id,{props:{[key]:normalizeInspectorValue(cap.field,raw)}}))};
 return <div><div className="grid grid-cols-4 gap-2"><div className="col-span-4">{(()=>{const cap=find('');if(!cap)return null;const value=valueFor(node,cap,group,scope);return <label className="block text-[11px] font-medium text-[#616161]">All sides<input key={String(value)} className={input+' mt-1'} type="number" min={cap.field.min} max={cap.field.max} step={cap.field.step} defaultValue={String(value??'')} disabled={disabled} onBlur={e=>patch(cap,e.target.value)}/></label>})()}</div>{entries.slice(1).map(([label,suffix])=>{const cap=find(suffix);if(!cap)return null;const value=valueFor(node,cap,group,scope),key=storageKey(cap,group,scope),inherited=scope!=='base'&&node.props[key]===undefined;return <label key={suffix} className="min-w-0 text-[10px] font-medium text-[#6d7175]">{label}<input key={String(value)} className="mt-1 h-8 w-full rounded-md border border-[#c9cccf] bg-white px-1 text-center text-[11px] tabular-nums outline-none focus:border-[#005bd3]" type="number" min={cap.field.min} max={cap.field.max} step={cap.field.step} defaultValue={String(value??'')} disabled={disabled} onBlur={e=>patch(cap,e.target.value)}/>{inherited&&<span className="mt-1 block text-center text-[9px]">Inherited</span>}</label>})}</div><div className="mt-3 rounded-md border border-dashed border-[#c9cccf] bg-[#fafbfb] p-3"><div className="rounded border border-[#d2d5d8] bg-white p-3 text-center text-[10px] text-[#8c9196]">{title==='Padding'?'Content area':'Selected element'}<div className="mt-2 text-[9px]">{title==='Padding'?'Space sits inside this box':'Space sits outside this box'}</div></div></div></div>;
}

function ImagePosition({document,node,capabilities,designScope,disabled,onCommit}:{document:PageDocument;node:CMSNode;capabilities:InspectorCapability[];designScope:Scope;disabled:boolean;onCommit:(operation:()=>CommitResult)=>void}){
 const xCap=capabilities.find(cap=>cap.field.key==='focalX'),yCap=capabilities.find(cap=>cap.field.key==='focalY');if(!xCap||!yCap)return null;
 const prefix=designScope==='base'?'':designScope+':',xKey=prefix+'focalX',yKey=prefix+'focalY';const x=Number(node.props[xKey]??node.props.focalX??50),y=Number(node.props[yKey]??node.props.focalY??50);
 const presets=[['Top left',0,0,'↖'],['Top',50,0,'↑'],['Top right',100,0,'↗'],['Left',0,50,'←'],['Centre',50,50,'●'],['Right',100,50,'→'],['Bottom left',0,100,'↙'],['Bottom',50,100,'↓'],['Bottom right',100,100,'↘']] as const;
 const patch=(nx:number,ny:number)=>onCommit(()=>updateNode(document,node.id,{props:{[xKey]:Math.max(0,Math.min(100,nx)),[yKey]:Math.max(0,Math.min(100,ny))}}));
 return <div><div className="grid w-[132px] grid-cols-3 gap-1 rounded-lg bg-[#f1f1f1] p-1">{presets.map(([name,px,py,icon])=><button key={name} type="button" disabled={disabled} aria-label={name} aria-pressed={x===px&&y===py} title={name} onClick={()=>patch(px,py)} className={'grid h-10 place-items-center rounded-md text-[14px] '+(x===px&&y===py?'bg-white text-[#005bd3] shadow-sm ring-1 ring-[#005bd3]':'text-[#616161] hover:bg-white')}>{icon}</button>)}</div><div className="mt-3 grid grid-cols-2 gap-2"><label className="text-[10px] font-medium text-[#6d7175]">Horizontal<input key={'x'+x} className={input+' mt-1 text-center'} type="number" min="0" max="100" defaultValue={x} disabled={disabled} onBlur={e=>patch(Number(e.target.value),y)}/></label><label className="text-[10px] font-medium text-[#6d7175]">Vertical<input key={'y'+y} className={input+' mt-1 text-center'} type="number" min="0" max="100" defaultValue={y} disabled={disabled} onBlur={e=>patch(x,Number(e.target.value))}/></label></div></div>;
}

function SettingsCard({section,children,count}:{section:SettingsSection;children:React.ReactNode;count:number}){
 const advanced=section==='Advanced';return <details open={!advanced} className="group border-b border-[#e1e3e5] bg-white"><summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 marker:hidden hover:bg-[#fafbfb]"><span aria-hidden className="grid h-5 w-5 place-items-center text-[11px] text-[#6d7175]">{sectionIcons[section]}</span><span className="min-w-0 flex-1"><span className={sectionTitle}>{section}</span>{sectionHelp[section]&&<span className="mt-0.5 block text-[10px] font-normal leading-4 text-[#8c9196]">{sectionHelp[section]}</span>}</span><span className="rounded-full bg-[#f1f1f1] px-1.5 py-0.5 text-[9px] text-[#6d7175]">{count}</span><span aria-hidden className="text-[11px] text-[#8c9196] transition-transform group-open:rotate-180">⌄</span></summary><div className="px-4 pb-3">{children}</div></details>;
}

export default function EditorInspectorFields({document,node,pageSlug,siteId,canWrite,busy,group,designScope,onDesignScope,onCommit,allCapabilities}:{document:PageDocument;node:CMSNode;pageSlug:string;siteId?:string;canWrite:boolean;busy:boolean;group:InspectorGroup;designScope:Scope;onDesignScope:(scope:Scope)=>void;onCommit:(operation:()=>CommitResult)=>void;allCapabilities?:InspectorCapability[]}){
 const dialog=useRef<HTMLDialogElement>(null);const [mediaTarget,setMediaTarget]=useState<(MediaTargetContract&{nodeId:string})|null>(null);
 useEffect(()=>{if(mediaTarget)dialog.current?.showModal()},[mediaTarget]);
 const all=useMemo(()=>allCapabilities??getInspectorCapabilities(pageSlug,document,node),[allCapabilities,pageSlug,document,node]);
 const capabilities=useMemo(()=>all.filter(cap=>cap.group===group).filter(cap=>group!=='appearance'||designScope==='base'||cap.responsive),[all,group,designScope]);const disabled=!canWrite||busy;const patch=(props:Record<string,CMSField>)=>onCommit(()=>updateNode(document,node.id,{props}));
 const positionCaps=group==='appearance'&&node.component==='image'?capabilities.filter(cap=>['focalX','focalY'].includes(cap.field.key)):[];
 const displayCaps=capabilities.filter(cap=>!(node.component==='image'&&['focalX','focalY'].includes(cap.field.key)));
 const sections=useMemo(()=>{const map=new Map<SettingsSection,InspectorCapability[]>();for(const cap of displayCaps){const key=settingSection(cap,group),list=map.get(key)??[];list.push(cap);map.set(key,list)}return sectionOrder.flatMap(section=>{const list=map.get(section);return list?.length?[[section,list] as [SettingsSection,InspectorCapability[]]]:[]})},[displayCaps,group]);
 return <div className="-mx-4">
  {group==='content'&&<SettingsCard section="Content" count={1}><label className="block text-[12px] font-medium text-[#303030]">Layer name<input key={node.id+String(node.label??node.component)} className={input+' mt-1.5'} defaultValue={node.label??node.component} disabled={disabled} maxLength={200} onBlur={e=>{const value=e.target.value;if(value!==(node.label??node.component))onCommit(()=>updateNode(document,node.id,{label:value}))}}/></label><p className={'mt-1.5 '+subtle}>Only changes the name shown in the editor hierarchy.</p></SettingsCard>}
  {group==='content'&&node.props.archivePart==='collection'&&<div className="border-b border-[#e1e3e5] px-4 py-3"><button type="button" className={button+' w-full'} disabled={disabled} onClick={()=>onCommit(()=>addArchiveMemory(document,node.id,()=>crypto.randomUUID()))}>+ Add memory</button><p className={'mt-1.5 '+subtle}>Adds a complete editable memory. Existing memories are never changed.</p></div>}
  {group==='behavior'&&<SettingsCard section="Visibility & behavior" count={1}><div className="flex items-center justify-between gap-3"><div><p className="text-[12px] font-medium text-[#303030]">Show this section or block</p><p className={'mt-0.5 '+subtle}>Hidden items stay saved but do not appear on the site.</p></div><Switch checked={node.visible} disabled={disabled} label="Show this section or block" onChange={checked=>onCommit(()=>updateNode(document,node.id,{visible:checked}))}/></div></SettingsCard>}
  {group==='appearance'&&<div className="border-b border-[#e1e3e5] bg-[#fafbfb] px-4 py-3"><div className="flex items-center justify-between gap-2"><div><p className="text-[12px] font-semibold text-[#303030]">Responsive settings</p><p className={'mt-0.5 '+subtle}>Edit this element for a specific device size.</p></div>{designScope!=='base'&&<button type="button" className="text-[11px] font-medium text-[#005bd3] hover:underline" disabled={disabled} onClick={()=>onCommit(()=>resetResponsive(document,node.id,designScope))}>Reset {designScope}</button>}</div><div className="mt-2"><Segmented disabled={disabled} value={designScope} onChange={value=>onDesignScope(value as Scope)} options={[{value:'base',label:'Default'},{value:'mobile',label:'Mobile'},{value:'tablet',label:'Tablet'},{value:'desktop',label:'Desktop'}]}/></div></div>}
  {sections.map(([section,caps])=>{
   if(section==='Padding'||section==='Margin')return <SettingsCard key={section} section={section} count={caps.length}><SpacingEditor title={section} caps={caps} document={document} node={node} group={group} scope={designScope} disabled={disabled} onCommit={onCommit}/></SettingsCard>;
   return <SettingsCard key={section} section={section} count={caps.length}><div className="divide-y divide-[#f0f1f2]">{caps.map(cap=>{const key=storageKey(cap,group,designScope),overridden=node.props[key]!==undefined,value=valueFor(node,cap,group,designScope);return <FieldControl key={node.id+key} field={cap.field} label={friendlyLabel(cap.field,section)} section={section} value={value} capability={cap} inherited={group==='appearance'&&designScope!=='base'&&!overridden} disabled={disabled} onApply={next=>{if(cap.media)patch(mediaDirectPatch(cap.media,String(next)));else patch({[key]:next})}} onReset={()=>onCommit(()=>resetNodeProperty(document,node.id,key,designScope==='base'&&cap.hasDefault,cap.defaultValue))} onPickMedia={siteId&&cap.media?()=>setMediaTarget({...cap.media!,nodeId:node.id}):undefined}/>})}</div>{section==='Position'&&positionCaps.length>0&&<ImagePosition document={document} node={node} capabilities={positionCaps} designScope={designScope} disabled={disabled} onCommit={onCommit}/>}</SettingsCard>
  })}
  {positionCaps.length>0&&!sections.some(([section])=>section==='Position')&&<SettingsCard section="Position" count={positionCaps.length}><ImagePosition document={document} node={node} capabilities={positionCaps} designScope={designScope} disabled={disabled} onCommit={onCommit}/></SettingsCard>}
  {mediaTarget&&siteId&&<dialog ref={dialog} onClose={()=>setMediaTarget(null)} aria-modal="true" aria-label={'Choose '+mediaTarget.label} className="fixed inset-4 z-50 m-auto max-h-[90vh] w-[min(1100px,95vw)] overflow-auto rounded-lg border border-[#c9cccf] bg-white p-5 shadow-2xl" onCancel={()=>setMediaTarget(null)}><div className="mb-4 flex items-center justify-between"><div><p className="text-xs text-[#6d7175]">Media</p><h2 className="font-semibold text-[#303030]">{mediaTarget.label}</h2></div><button type="button" className={button} onClick={()=>setMediaTarget(null)}>Close</button></div><MediaLibrary siteId={siteId} canWrite={canWrite} kind={mediaTarget.kind} onClose={()=>setMediaTarget(null)} onPick={media=>{onCommit(()=>updateNode(document,mediaTarget.nodeId,{props:mediaSelectionPatch(mediaTarget,media)}));setMediaTarget(null)}}/></dialog>}
 </div>;
}
