'use client';
import {useCallback,useEffect,useMemo,useRef,useState,type PointerEvent as ReactPointerEvent} from 'react';
import type {PageDocument} from '@wiffeyyyy/content';

type Device='mobile'|'tablet'|'desktop';
type PreviewMode=Device|'large-phone'|'responsive';
type Viewport={width:number;height:number};
type EditorDocumentMessage={source:'wiffey-editor';type:'update';document:PageDocument;device:Device;pageSlug:string};
type EditorStateMessage={source:'wiffey-editor';type:'state';selectedId:string|null;interactive:boolean};
type PreviewMessage=EditorDocumentMessage|EditorStateMessage|{source:'wiffey-preview';type:'ready'|'select'|'navigate'|'insert';id?:string;href?:string;direction?:'before'|'after'};

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
const clamp=(value:number,min:number,max:number)=>Math.min(max,Math.max(min,Math.round(value)));
const deviceForWidth=(width:number):Device=>width<600?'mobile':width<960?'tablet':'desktop';

export default function EditorLiveFrame({pageId,pageSlug,document,device,selectedId,interactive,onSelect,onNavigate,onInsert}:{pageId:string;pageSlug:string;document:PageDocument;device:Device;selectedId:string|null;interactive:boolean;onSelect:(id:string)=>void;onNavigate:(href:string)=>void;onInsert:(direction:'before'|'after')=>void}){
 const frame=useRef<HTMLIFrameElement>(null),fitArea=useRef<HTMLDivElement>(null),drag=useRef<{x:number;y:number;width:number;height:number}|null>(null);
 const documentFrame=useRef<number|null>(null),fitFrame=useRef<number|null>(null),resizeFrame=useRef<number|null>(null),pendingDocument=useRef<{document:PageDocument;device:Device;pageSlug:string}|null>(null),pendingCustom=useRef<Viewport|null>(null);
 const initialPageId=useRef(pageId).current;
 const [ready,setReady]=useState(false),[scale,setScale]=useState(1),[mode,setMode]=useState<PreviewMode>(device),[custom,setCustom]=useState<Viewport>({width:1024,height:768});
 useEffect(()=>setMode(device),[device]);
 const viewport=mode==='responsive'?custom:VIEWPORTS[mode];
 const resolvedDevice=deviceForWidth(viewport.width);
 const src=useMemo(()=>'/preview/'+encodeURIComponent(initialPageId)+'?embed=1',[initialPageId]);
 const firstRoot=document.rootIds[0]??null;
 const firstLayer=document.nodes.find(node=>node.props.phonePart==='wallpaper')??document.nodes.find(node=>node.parentId===firstRoot);
 const firstLayerLabel=firstLayer?.label??firstLayer?.component??'';
 const previewTitle='Exact live draft preview'+(firstLayerLabel?' · Select '+firstLayerLabel:'');
 const postDocument=useCallback((nextDocument:PageDocument,nextDevice:Device,nextSlug:string)=>{pendingDocument.current={document:nextDocument,device:nextDevice,pageSlug:nextSlug};if(documentFrame.current!==null)return;documentFrame.current=requestAnimationFrame(()=>{documentFrame.current=null;const pending=pendingDocument.current;pendingDocument.current=null;if(!pending)return;frame.current?.contentWindow?.postMessage({source:'wiffey-editor',type:'update',document:pending.document,device:pending.device,pageSlug:pending.pageSlug} satisfies EditorDocumentMessage,window.location.origin)})},[]);
 const postState=useCallback((nextSelected:string|null,nextInteractive:boolean)=>{frame.current?.contentWindow?.postMessage({source:'wiffey-editor',type:'state',selectedId:nextSelected,interactive:nextInteractive} satisfies EditorStateMessage,window.location.origin)},[]);
 useEffect(()=>{setReady(false)},[src]);
 useEffect(()=>{if(!ready)return;postDocument(document,resolvedDevice,pageSlug)},[ready,document,resolvedDevice,pageSlug,postDocument]);
 useEffect(()=>{if(!ready)return;postState(selectedId,interactive)},[ready,selectedId,interactive,postState]);
 useEffect(()=>()=>{if(documentFrame.current!==null)cancelAnimationFrame(documentFrame.current);if(fitFrame.current!==null)cancelAnimationFrame(fitFrame.current);if(resizeFrame.current!==null)cancelAnimationFrame(resizeFrame.current)},[]);
 useEffect(()=>{const receive=(event:MessageEvent<PreviewMessage>)=>{if(event.origin!==window.location.origin||event.source!==frame.current?.contentWindow)return;const message=event.data;if(!message||message.source!=='wiffey-preview')return;if(message.type==='ready'){setReady(true);return}if(message.type==='select'&&message.id){onSelect(message.id);return}if(message.type==='navigate'&&message.href){onNavigate(message.href);return}if(message.type==='insert'&&message.direction)onInsert(message.direction)};window.addEventListener('message',receive);return()=>window.removeEventListener('message',receive)},[onSelect,onNavigate,onInsert]);
 useEffect(()=>{const host=fitArea.current;if(!host)return;const fit=()=>{fitFrame.current=null;const box=host.getBoundingClientRect(),padding=24,width=Math.max(1,box.width-padding),height=Math.max(1,box.height-padding),next=Math.min(1,width/viewport.width,height/viewport.height);setScale(current=>Math.abs(current-next)<.001?current:next)};const schedule=()=>{if(fitFrame.current!==null)return;fitFrame.current=requestAnimationFrame(fit)};schedule();const observer=new ResizeObserver(schedule);observer.observe(host);window.visualViewport?.addEventListener('resize',schedule);return()=>{observer.disconnect();window.visualViewport?.removeEventListener('resize',schedule);if(fitFrame.current!==null){cancelAnimationFrame(fitFrame.current);fitFrame.current=null}}},[viewport.width,viewport.height]);
 const visualWidth=Math.max(1,Math.round(viewport.width*scale)),visualHeight=Math.max(1,Math.round(viewport.height*scale));
 const startResize=(event:ReactPointerEvent<HTMLButtonElement>)=>{if(mode!=='responsive')return;drag.current={x:event.clientX,y:event.clientY,width:custom.width,height:custom.height};event.currentTarget.setPointerCapture(event.pointerId)};
 const resize=(event:ReactPointerEvent<HTMLButtonElement>)=>{const current=drag.current;if(!current)return;pendingCustom.current={width:clamp(current.width+(event.clientX-current.x)/Math.max(scale,.01),320,1600),height:clamp(current.height+(event.clientY-current.y)/Math.max(scale,.01),568,1200)};if(resizeFrame.current!==null)return;resizeFrame.current=requestAnimationFrame(()=>{resizeFrame.current=null;const next=pendingCustom.current;pendingCustom.current=null;if(next)setCustom(previous=>previous.width===next.width&&previous.height===next.height?previous:next)})};
 const endResize=(event:ReactPointerEvent<HTMLButtonElement>)=>{drag.current=null;if(pendingCustom.current){const next=pendingCustom.current;pendingCustom.current=null;setCustom(previous=>previous.width===next.width&&previous.height===next.height?previous:next)}if(resizeFrame.current!==null){cancelAnimationFrame(resizeFrame.current);resizeFrame.current=null}if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId)};
 return <div data-editor-preview-stage data-preview-device={resolvedDevice} data-preview-mode={mode} data-preview-page={pageSlug} className="flex h-full min-h-[520px] w-full flex-col overflow-hidden">
  <div className="flex h-10 shrink-0 items-center justify-between gap-2 border-b border-[#d2d5d8] bg-[#f6f6f7] px-3 text-[12px] text-[#616161]">
   <div className="flex min-w-0 items-center gap-1" role="group" aria-label="Preview viewport">
    {MODES.map(item=><button key={item.id} type="button" title={item.label} aria-pressed={mode===item.id} onClick={()=>setMode(item.id)} className={'rounded-md px-2 py-1.5 font-medium '+(mode===item.id?'bg-white text-[#202223] shadow-sm ring-1 ring-[#c9cccf]':'hover:bg-white/70')}>{item.short}</button>)}
   </div>
   <div className="shrink-0 tabular-nums" aria-live="polite">{viewport.width} × {viewport.height} · {Math.round(scale*100)}%</div>
  </div>
  <div ref={fitArea} className="relative flex min-h-0 flex-1 items-start justify-center overflow-auto bg-[#e8e8e8] p-3">
   {firstLayerLabel&&<span className="sr-only" data-preview-first-layer>Select {firstLayerLabel}</span>}
   <div data-editor-preview-viewport data-logical-width={viewport.width} data-logical-height={viewport.height} className="relative shrink-0 bg-white shadow-sm" style={{width:visualWidth,height:visualHeight}}>
    <iframe ref={frame} src={src} title={previewTitle} className="absolute left-0 top-0 border-0 bg-white" style={{width:viewport.width,height:viewport.height,transform:`scale(${scale})`,transformOrigin:'top left'}} onLoad={()=>setReady(false)}/>
    {mode==='responsive'&&<button type="button" aria-label="Resize responsive preview" title="Drag to resize responsive viewport" onPointerDown={startResize} onPointerMove={resize} onPointerUp={endResize} onPointerCancel={endResize} className="absolute bottom-0 right-0 z-20 h-5 w-5 translate-x-1/2 translate-y-1/2 cursor-nwse-resize rounded-full border-2 border-white bg-[#005bd3] shadow-md"/>}
    {!ready&&<div className="pointer-events-none absolute inset-0 grid place-items-center bg-white/80 text-[12px] text-[#6d7175]">Loading live preview…</div>}
   </div>
  </div>
 </div>;
}
