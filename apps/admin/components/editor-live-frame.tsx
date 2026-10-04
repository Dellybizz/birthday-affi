'use client';
import {useCallback,useEffect,useMemo,useRef,useState,type PointerEvent as ReactPointerEvent} from 'react';
import type {CMSField,PageDocument} from '@wiffeyyyy/content';

type Device='mobile'|'tablet'|'desktop';
type PreviewMode=Device|'large-phone'|'responsive';
type Viewport={width:number;height:number};
type EditorDocumentMessage={source:'wiffey-editor';type:'update';document:PageDocument;device:Device;pageSlug:string};
type EditorStateMessage={source:'wiffey-editor';type:'state';selectedId:string|null;interactive:boolean};
type PreviewMessage=EditorDocumentMessage|EditorStateMessage|{source:'wiffey-preview';type:'ready'|'select'|'navigate'|'insert';id?:string;href?:string;direction?:'before'|'after'};
type CinematicScene={id:string;label:string;desktopKey:string;mobileKey:string;endKey:string|null;defaultEnd:number};

const VIEWPORTS:Record<Exclude<PreviewMode,'responsive'>,Viewport>={
 mobile:{width:390,height:830},
 'large-phone':{width:430,height:932},
 tablet:{width:768,height:1024},
 desktop:{width:1440,height:900}
};
const MODES:Array<{id:PreviewMode;label:string;short:string}>=[
 {id:'mobile',label:'Mobile · 390 × 830',short:'Mobile'},
 {id:'large-phone',label:'Large phone · 430 × 932',short:'Large phone'},
 {id:'tablet',label:'Tablet · 768 × 1024',short:'Tablet'},
 {id:'desktop',label:'Desktop · 1440 × 900',short:'Desktop'},
 {id:'responsive',label:'Responsive · custom viewport',short:'Responsive'}
];
const CINEMATIC_SCENES:CinematicScene[]=[
 {id:'box-establishing',label:'01 Box',desktopKey:'transitionFrameBoxSrc',mobileKey:'transitionMobileFrameBoxSrc',endKey:'transitionBoxEndMs',defaultEnd:1200},
 {id:'gloves-enter',label:'02 Gloves',desktopKey:'transitionFrameGlovesSrc',mobileKey:'transitionMobileFrameGlovesSrc',endKey:'transitionGlovesEndMs',defaultEnd:2600},
 {id:'top-down-open',label:'03 Open',desktopKey:'transitionFrameOpenSrc',mobileKey:'transitionMobileFrameOpenSrc',endKey:'transitionOpenEndMs',defaultEnd:4400},
 {id:'phone-lift',label:'04 Lift',desktopKey:'transitionFrameLiftSrc',mobileKey:'transitionMobileFrameLiftSrc',endKey:'transitionLiftEndMs',defaultEnd:6100},
 {id:'screen-wake',label:'05 Wake',desktopKey:'transitionFrameWakeSrc',mobileKey:'transitionMobileFrameWakeSrc',endKey:'transitionWakeEndMs',defaultEnd:7500},
 {id:'live-handoff',label:'06 Handoff',desktopKey:'transitionFrameHandoffSrc',mobileKey:'transitionMobileFrameHandoffSrc',endKey:null,defaultEnd:8300}
];
const clamp=(value:number,min:number,max:number)=>Math.min(max,Math.max(min,Math.round(value)));
const deviceForWidth=(width:number):Device=>width<600?'mobile':width<960?'tablet':'desktop';
const numberProp=(props:Record<string,CMSField>,key:string|null,fallback:number)=>key&&typeof props[key]==='number'?Number(props[key]):fallback;
const frameProp=(props:Record<string,CMSField>,scene:CinematicScene,mobile:boolean)=>{const desktop=String(props[scene.desktopKey]??'');const mobileSrc=String(props[scene.mobileKey]??'');return mobile&&mobileSrc?mobileSrc:desktop};

export default function EditorLiveFrame({pageId,pageSlug,document,device,selectedId,interactive,onSelect,onNavigate,onInsert}:{pageId:string;pageSlug:string;document:PageDocument;device:Device;selectedId:string|null;interactive:boolean;onSelect:(id:string)=>void;onNavigate:(href:string)=>void;onInsert:(direction:'before'|'after')=>void}){
 const frame=useRef<HTMLIFrameElement>(null),fitArea=useRef<HTMLDivElement>(null),drag=useRef<{x:number;y:number;width:number;height:number}|null>(null);
 const documentFrame=useRef<number|null>(null),fitFrame=useRef<number|null>(null),resizeFrame=useRef<number|null>(null),pendingDocument=useRef<{document:PageDocument;device:Device;pageSlug:string}|null>(null),pendingCustom=useRef<Viewport|null>(null);
 const initialPageId=useRef(pageId).current;
 const [ready,setReady]=useState(false),[scale,setScale]=useState(1),[mode,setMode]=useState<PreviewMode>(device),[custom,setCustom]=useState<Viewport>({width:1024,height:768});
 const [cinematicOpen,setCinematicOpen]=useState(false),[cinematicScene,setCinematicScene]=useState(0),[cinematicPlaying,setCinematicPlaying]=useState(false),[cinematicReplay,setCinematicReplay]=useState(0);
 useEffect(()=>setMode(device),[device]);
 const viewport=mode==='responsive'?custom:VIEWPORTS[mode];
 const resolvedDevice=deviceForWidth(viewport.width);
 const src=useMemo(()=>'/preview/'+encodeURIComponent(initialPageId)+'?embed=1',[initialPageId]);
 const firstRoot=document.rootIds[0]??null;
 const firstLayer=document.nodes.find(node=>node.props.phonePart==='wallpaper')??document.nodes.find(node=>node.parentId===firstRoot);
 const firstLayerLabel=firstLayer?.label??firstLayer?.component??'';
 const previewTitle='Exact live draft preview'+(firstLayerLabel?' · Select '+firstLayerLabel:'');
 const selectedNode=selectedId?document.nodes.find(node=>node.id===selectedId):undefined;
 const cinematicNode=selectedNode?.props.heartPart==='next'?selectedNode:undefined;
 const cinematicProps=(cinematicNode?.props??{}) as Record<string,CMSField>;
 const cinematicDuration=numberProp(cinematicProps,'transitionDurationMs',8300);
 const cinematicEnds=CINEMATIC_SCENES.map(scene=>scene.endKey?numberProp(cinematicProps,scene.endKey,scene.defaultEnd):cinematicDuration);
 const activeCinematic=CINEMATIC_SCENES[Math.min(cinematicScene,CINEMATIC_SCENES.length-1)];
 const activeCinematicFrame=cinematicNode?frameProp(cinematicProps,activeCinematic,resolvedDevice==='mobile'):'';
 const postDocument=useCallback((nextDocument:PageDocument,nextDevice:Device,nextSlug:string)=>{pendingDocument.current={document:nextDocument,device:nextDevice,pageSlug:nextSlug};if(documentFrame.current!==null)return;documentFrame.current=requestAnimationFrame(()=>{documentFrame.current=null;const pending=pendingDocument.current;pendingDocument.current=null;if(!pending)return;frame.current?.contentWindow?.postMessage({source:'wiffey-editor',type:'update',document:pending.document,device:pending.device,pageSlug:pending.pageSlug} satisfies EditorDocumentMessage,window.location.origin)})},[]);
 const postState=useCallback((nextSelected:string|null,nextInteractive:boolean)=>{frame.current?.contentWindow?.postMessage({source:'wiffey-editor',type:'state',selectedId:nextSelected,interactive:nextInteractive} satisfies EditorStateMessage,window.location.origin)},[]);
 useEffect(()=>{setReady(false)},[src]);
 useEffect(()=>{if(!ready)return;postDocument(document,resolvedDevice,pageSlug)},[ready,document,resolvedDevice,pageSlug,postDocument]);
 useEffect(()=>{if(!ready)return;postState(selectedId,interactive)},[ready,selectedId,interactive,postState]);
 useEffect(()=>()=>{if(documentFrame.current!==null)cancelAnimationFrame(documentFrame.current);if(fitFrame.current!==null)cancelAnimationFrame(fitFrame.current);if(resizeFrame.current!==null)cancelAnimationFrame(resizeFrame.current)},[]);
 useEffect(()=>{const receive=(event:MessageEvent<PreviewMessage>)=>{if(event.origin!==window.location.origin||event.source!==frame.current?.contentWindow)return;const message=event.data;if(!message||message.source!=='wiffey-preview')return;if(message.type==='ready'){setReady(true);return}if(message.type==='select'&&message.id){onSelect(message.id);return}if(message.type==='navigate'&&message.href){onNavigate(message.href);return}if(message.type==='insert'&&message.direction)onInsert(message.direction)};window.addEventListener('message',receive);return()=>window.removeEventListener('message',receive)},[onSelect,onNavigate,onInsert]);
 useEffect(()=>{if(!cinematicNode){setCinematicOpen(false);setCinematicPlaying(false);setCinematicScene(0)}},[cinematicNode?.id]);
 useEffect(()=>{
  if(!cinematicPlaying||!cinematicNode)return;
  setCinematicScene(0);const timers:ReturnType<typeof setTimeout>[]=[];let start=0;
  for(let index=1;index<CINEMATIC_SCENES.length;index++){start=cinematicEnds[index-1];timers.push(setTimeout(()=>setCinematicScene(index),Math.max(0,start)))}
  timers.push(setTimeout(()=>setCinematicPlaying(false),Math.max(300,cinematicDuration)));
  return()=>timers.forEach(clearTimeout);
 },[cinematicPlaying,cinematicReplay,cinematicNode?.id,cinematicDuration,...cinematicEnds]);
 useEffect(()=>{const host=fitArea.current;if(!host)return;const fit=()=>{fitFrame.current=null;const box=host.getBoundingClientRect(),padding=24,width=Math.max(1,box.width-padding),height=Math.max(1,box.height-padding),next=Math.min(1,width/viewport.width,height/viewport.height);setScale(current=>Math.abs(current-next)<.001?current:next)};const schedule=()=>{if(fitFrame.current!==null)return;fitFrame.current=requestAnimationFrame(fit)};schedule();const observer=new ResizeObserver(schedule);observer.observe(host);window.visualViewport?.addEventListener('resize',schedule);return()=>{observer.disconnect();window.visualViewport?.removeEventListener('resize',schedule);if(fitFrame.current!==null){cancelAnimationFrame(fitFrame.current);fitFrame.current=null}}},[viewport.width,viewport.height,cinematicNode?.id]);
 const visualWidth=Math.max(1,Math.round(viewport.width*scale)),visualHeight=Math.max(1,Math.round(viewport.height*scale));
 const startResize=(event:ReactPointerEvent<HTMLButtonElement>)=>{if(mode!=='responsive')return;drag.current={x:event.clientX,y:event.clientY,width:custom.width,height:custom.height};event.currentTarget.setPointerCapture(event.pointerId)};
 const resize=(event:ReactPointerEvent<HTMLButtonElement>)=>{const current=drag.current;if(!current)return;pendingCustom.current={width:clamp(current.width+(event.clientX-current.x)/Math.max(scale,.01),320,1600),height:clamp(current.height+(event.clientY-current.y)/Math.max(scale,.01),568,1200)};if(resizeFrame.current!==null)return;resizeFrame.current=requestAnimationFrame(()=>{resizeFrame.current=null;const next=pendingCustom.current;pendingCustom.current=null;if(next)setCustom(previous=>previous.width===next.width&&previous.height===next.height?previous:next)})};
 const endResize=(event:ReactPointerEvent<HTMLButtonElement>)=>{drag.current=null;if(pendingCustom.current){const next=pendingCustom.current;pendingCustom.current=null;setCustom(previous=>previous.width===next.width&&previous.height===next.height?previous:next)}if(resizeFrame.current!==null){cancelAnimationFrame(resizeFrame.current);resizeFrame.current=null}if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId)};
 const playCinematic=()=>{setCinematicOpen(true);setCinematicPlaying(false);setCinematicReplay(value=>value+1);requestAnimationFrame(()=>setCinematicPlaying(true))};
 return <div data-editor-preview-stage data-preview-device={resolvedDevice} data-preview-mode={mode} data-preview-page={pageSlug} data-cinematic-timeline={cinematicNode?'true':undefined} className="flex h-full min-h-[520px] w-full flex-col overflow-hidden">
  <div className="flex h-10 shrink-0 items-center justify-between gap-2 border-b border-[#d2d5d8] bg-[#f6f6f7] px-3 text-[12px] text-[#616161]">
   <div className="flex min-w-0 items-center gap-1" role="group" aria-label="Preview viewport">
    {MODES.map(item=><button key={item.id} type="button" title={item.label} aria-pressed={mode===item.id} onClick={()=>setMode(item.id)} className={'rounded-md px-2 py-1.5 font-medium '+(mode===item.id?'bg-white text-[#202223] shadow-sm ring-1 ring-[#c9cccf]':'hover:bg-white/70')}>{item.short}</button>)}
   </div>
   <div className="shrink-0 tabular-nums" aria-live="polite">{viewport.width} × {viewport.height} · {Math.round(scale*100)}%</div>
  </div>
  {cinematicNode&&<div className="shrink-0 border-b border-[#d2d5d8] bg-white px-2 py-2" data-t9-cinematic-editor>
   <div className="mb-2 flex items-center justify-between gap-2"><div><p className="text-[11px] font-semibold text-[#202223]">Cinematic timeline</p><p className="text-[10px] text-[#6d7175]">Click a phase to inspect it. Frame replacement and exact timing remain editable in the Settings panel.</p></div><div className="flex gap-1"><button type="button" className="rounded border border-[#c9cccf] px-2 py-1 text-[10px] font-medium" onClick={playCinematic}>↻ Replay</button>{cinematicOpen&&<button type="button" className="rounded border border-[#c9cccf] px-2 py-1 text-[10px] font-medium" onClick={()=>{setCinematicOpen(false);setCinematicPlaying(false)}}>Page</button>}</div></div>
   <div className="grid grid-cols-6 gap-1">{CINEMATIC_SCENES.map((scene,index)=>{const frameSrc=frameProp(cinematicProps,scene,resolvedDevice==='mobile');const start=index===0?0:cinematicEnds[index-1],end=cinematicEnds[index];return <button key={scene.id} type="button" aria-pressed={cinematicOpen&&cinematicScene===index} onClick={()=>{setCinematicPlaying(false);setCinematicOpen(true);setCinematicScene(index)}} className={'min-w-0 overflow-hidden rounded-md border text-left '+(cinematicOpen&&cinematicScene===index?'border-[#005bd3] ring-1 ring-[#005bd3]':'border-[#d2d5d8]')}><div className="aspect-[16/9] bg-[#161616]">{frameSrc?<img src={frameSrc} alt="" className="h-full w-full object-cover"/>:<div className="grid h-full place-items-center text-[9px] text-white/60">Empty</div>}</div><div className="px-1 py-1"><p className="truncate text-[9px] font-semibold text-[#303030]">{scene.label}</p><p className="text-[8px] tabular-nums text-[#8c9196]">{Math.max(0,end-start)} ms</p></div></button>})}</div>
  </div>}
  <div ref={fitArea} className="relative flex min-h-0 flex-1 items-start justify-center overflow-auto bg-[#e8e8e8] p-3">
   {firstLayerLabel&&<span className="sr-only" data-preview-first-layer>Select {firstLayerLabel}</span>}
   <div data-editor-preview-viewport data-logical-width={viewport.width} data-logical-height={viewport.height} className="relative shrink-0 overflow-hidden bg-white shadow-sm" style={{width:visualWidth,height:visualHeight}}>
    <iframe ref={frame} src={src} title={previewTitle} className="absolute left-0 top-0 border-0 bg-white" style={{width:viewport.width,height:viewport.height,transform:`scale(${scale})`,transformOrigin:'top left'}} onLoad={()=>setReady(false)}/>
    {cinematicOpen&&cinematicNode&&<div className="absolute inset-0 z-10 overflow-hidden bg-[#050404]" aria-label={'Cinematic preview · '+activeCinematic.label}><div className="absolute inset-0" style={{width:viewport.width,height:viewport.height,transform:`scale(${scale})`,transformOrigin:'top left'}}>{activeCinematicFrame?<img key={activeCinematic.id+'-'+cinematicReplay} src={activeCinematicFrame} alt="" className="h-full w-full object-cover animate-[t9AdminScene_.42s_ease-out_both]"/>:<div className="grid h-full place-items-center text-sm text-white/60">No frame selected for {activeCinematic.label}</div>}<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(0,0,0,.42)_100%)]"/><span className="absolute bottom-4 left-4 rounded-full bg-black/55 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur">{activeCinematic.label}</span></div></div>}
    {mode==='responsive'&&<button type="button" aria-label="Resize responsive preview" title="Drag to resize responsive viewport" onPointerDown={startResize} onPointerMove={resize} onPointerUp={endResize} onPointerCancel={endResize} className="absolute bottom-0 right-0 z-20 h-5 w-5 translate-x-1/2 translate-y-1/2 cursor-nwse-resize rounded-full border-2 border-white bg-[#005bd3] shadow-md"/>}
    {!ready&&!cinematicOpen&&<div className="pointer-events-none absolute inset-0 grid place-items-center bg-white/80 text-[12px] text-[#6d7175]">Loading live preview…</div>}
   </div>
  </div>
  <style>{`@keyframes t9AdminScene{from{opacity:.55;transform:scale(1.015)}to{opacity:1;transform:scale(1)}}`}</style>
 </div>;
}
