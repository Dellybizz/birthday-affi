'use client';
import {useCallback,useEffect,useMemo,useRef,useState,type PointerEvent as ReactPointerEvent} from 'react';
import type {PageDocument} from '@wiffeyyyy/content';

import {VIEWPORTS,MODES,clampViewport as clamp,deviceForWidth,previewScale,type PreviewZoom,type Device,type PreviewMode,type Viewport} from '../lib/editor-viewport';
type EditorDocumentMessage={source:'wiffey-editor';type:'update';document:PageDocument;device:Device;pageSlug:string;homeDocument?:PageDocument};
type EditorStateMessage={source:'wiffey-editor';type:'state';selectedId:string|null;interactive:boolean};
type PreviewMessage=EditorDocumentMessage|EditorStateMessage|{source:'wiffey-preview';type:'ready'|'select'|'navigate'|'insert';id?:string;href?:string;direction?:'before'|'after'};

export function PreviewViewportControls({mode,custom,onMode,onCustom}:{mode:PreviewMode;custom:Viewport;onMode:(mode:PreviewMode)=>void;onCustom:(viewport:Viewport)=>void}){
 return <div data-editor-responsive-toolbar className="flex items-center gap-2" role="group" aria-label="Preview viewport"><label className="sr-only" htmlFor="editor-preview-size">Preview size</label><select id="editor-preview-size" className="h-8 max-w-[190px] rounded-md border border-[#c9cccf] bg-white px-2 text-xs" value={mode} onChange={e=>onMode(e.target.value as PreviewMode)}>{MODES.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select>{mode==='responsive'&&<div className="flex items-center gap-1">{(['width','height'] as const).map(axis=><input key={axis} aria-label={'Preview '+axis} type="number" className="h-8 w-16 rounded-md border border-[#c9cccf] px-1 text-xs" value={custom[axis]} min={axis==='width'?320:568} max={axis==='width'?1600:1200} onChange={e=>onCustom({...custom,[axis]:clamp(Number(e.target.value),axis==='width'?320:568,axis==='width'?1600:1200)})}/>)}</div>}</div>;
}

export default function EditorLiveFrame({pageId,pageSlug,document,mode,custom,onCustom,selectedId,interactive,onSelect,onNavigate,onInsert}:{pageId:string;pageSlug:string;document:PageDocument;mode:PreviewMode;custom:Viewport;onCustom:(viewport:Viewport)=>void;selectedId:string|null;interactive:boolean;onSelect:(id:string)=>void;onNavigate:(href:string)=>void;onInsert:(direction:'before'|'after')=>void}){
 const frame=useRef<HTMLIFrameElement>(null),fitArea=useRef<HTMLDivElement>(null),drag=useRef<{x:number;y:number;width:number;height:number}|null>(null);
 const documentFrame=useRef<number|null>(null),fitFrame=useRef<number|null>(null),resizeFrame=useRef<number|null>(null),pendingDocument=useRef<{document:PageDocument;device:Device;pageSlug:string}|null>(null),pendingCustom=useRef<Viewport|null>(null);
 const homeDraft=useRef<PageDocument|undefined>(undefined);
 const initialPageId=useRef(pageId).current;
 const [ready,setReady]=useState(false),[scale,setScale]=useState(1),[zoom,setZoom]=useState<PreviewZoom>('fit');
 const viewport=mode==='responsive'?custom:VIEWPORTS[mode];
 const resolvedDevice=deviceForWidth(viewport.width);
 const src=useMemo(()=>'/preview/'+encodeURIComponent(initialPageId)+'?embed=1',[initialPageId]);
 const firstRoot=document.rootIds[0]??null;
 const firstLayer=document.nodes.find(node=>node.props.phonePart==='wallpaper')??document.nodes.find(node=>node.parentId===firstRoot);
 const firstLayerLabel=firstLayer?.label??firstLayer?.component??'';
 const previewTitle='Exact live draft preview'+(firstLayerLabel?' · Select '+firstLayerLabel:'');
 const postDocument=useCallback((nextDocument:PageDocument,nextDevice:Device,nextSlug:string)=>{pendingDocument.current={document:nextDocument,device:nextDevice,pageSlug:nextSlug};if(documentFrame.current!==null)return;documentFrame.current=requestAnimationFrame(()=>{documentFrame.current=null;const pending=pendingDocument.current;pendingDocument.current=null;if(!pending)return;if(pending.pageSlug==='home')homeDraft.current=pending.document;frame.current?.contentWindow?.postMessage({source:'wiffey-editor',type:'update',document:pending.document,device:pending.device,pageSlug:pending.pageSlug,homeDocument:homeDraft.current} satisfies EditorDocumentMessage,window.location.origin)})},[]);
 const postState=useCallback((nextSelected:string|null,nextInteractive:boolean)=>{frame.current?.contentWindow?.postMessage({source:'wiffey-editor',type:'state',selectedId:nextSelected,interactive:nextInteractive} satisfies EditorStateMessage,window.location.origin)},[]);
 useEffect(()=>{setReady(false)},[src]);
 useEffect(()=>{setZoom('fit')},[pageSlug]);
 useEffect(()=>{if(!ready)return;postDocument(document,resolvedDevice,pageSlug)},[ready,document,resolvedDevice,pageSlug,postDocument]);
 useEffect(()=>{if(!ready)return;postState(selectedId,interactive)},[ready,selectedId,interactive,postState]);
 useEffect(()=>()=>{if(documentFrame.current!==null)cancelAnimationFrame(documentFrame.current);if(fitFrame.current!==null)cancelAnimationFrame(fitFrame.current);if(resizeFrame.current!==null)cancelAnimationFrame(resizeFrame.current)},[]);
 useEffect(()=>{const receive=(event:MessageEvent<PreviewMessage>)=>{if(event.origin!==window.location.origin||event.source!==frame.current?.contentWindow)return;const message=event.data;if(!message||message.source!=='wiffey-preview')return;if(message.type==='ready'){setReady(true);return}if(message.type==='select'&&message.id){onSelect(message.id);return}if(message.type==='navigate'&&message.href){onNavigate(message.href);return}if(message.type==='insert'&&message.direction)onInsert(message.direction)};window.addEventListener('message',receive);return()=>window.removeEventListener('message',receive)},[onSelect,onNavigate,onInsert]);
 useEffect(()=>{const host=fitArea.current;if(!host)return;const fit=()=>{fitFrame.current=null;const next=previewScale(viewport,{width:host.clientWidth,height:host.clientHeight},zoom);setScale(current=>Math.abs(current-next)<.001?current:next)};const schedule=()=>{if(fitFrame.current!==null)return;fitFrame.current=requestAnimationFrame(fit)};schedule();const observer=new ResizeObserver(schedule);observer.observe(host);window.addEventListener('resize',schedule);window.visualViewport?.addEventListener('resize',schedule);return()=>{observer.disconnect();window.removeEventListener('resize',schedule);window.visualViewport?.removeEventListener('resize',schedule);if(fitFrame.current!==null){cancelAnimationFrame(fitFrame.current);fitFrame.current=null}}},[viewport.width,viewport.height,zoom]);
 const visualWidth=Math.max(1,Math.floor(viewport.width*scale)),visualHeight=Math.max(1,Math.floor(viewport.height*scale));
 const startResize=(event:ReactPointerEvent<HTMLButtonElement>)=>{if(mode!=='responsive')return;drag.current={x:event.clientX,y:event.clientY,width:custom.width,height:custom.height};event.currentTarget.setPointerCapture(event.pointerId)};
 const resize=(event:ReactPointerEvent<HTMLButtonElement>)=>{const current=drag.current;if(!current)return;pendingCustom.current={width:clamp(current.width+(event.clientX-current.x)/Math.max(scale,.01),320,1600),height:clamp(current.height+(event.clientY-current.y)/Math.max(scale,.01),568,1200)};if(resizeFrame.current!==null)return;resizeFrame.current=requestAnimationFrame(()=>{resizeFrame.current=null;const next=pendingCustom.current;pendingCustom.current=null;if(next)onCustom(next)})};
 const endResize=(event:ReactPointerEvent<HTMLButtonElement>)=>{drag.current=null;if(pendingCustom.current){const next=pendingCustom.current;pendingCustom.current=null;onCustom(next)}if(resizeFrame.current!==null){cancelAnimationFrame(resizeFrame.current);resizeFrame.current=null}if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId)};
 return <div data-editor-preview-stage data-preview-device={resolvedDevice} data-preview-mode={mode} data-preview-page={pageSlug} className="flex h-full min-h-0 w-full flex-col overflow-hidden">
  <div className="flex min-h-10 shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[#d2d5d8] bg-[#f6f6f7] px-3 text-[12px] text-[#616161]">
   <span>{interactive?'Interactive preview':'Edit preview · click to select'}</span>
   <div className="flex flex-wrap items-center gap-1 py-1" role="group" aria-label="Preview zoom">
    <span className="mr-1 tabular-nums">{viewport.width} × {viewport.height}</span>
    <button type="button" aria-label="Zoom out preview" className="h-7 w-7 rounded border bg-white" disabled={scale<=.25} onClick={()=>setZoom(Math.max(.25,Math.round((scale-.1)*100)/100))}>−</button>
    <button type="button" aria-label="Preview at 100%" className="h-7 min-w-12 rounded border bg-white px-1 tabular-nums" onClick={()=>setZoom(1)}>{Math.round(scale*100)}%</button>
    <button type="button" aria-label="Zoom in preview" className="h-7 w-7 rounded border bg-white" disabled={scale>=2} onClick={()=>setZoom(Math.min(2,Math.round((scale+.1)*100)/100))}>+</button>
    <button type="button" aria-pressed={zoom==='fit'} className="h-7 rounded border bg-white px-2" onClick={()=>setZoom('fit')}>Fit</button>
    <button type="button" aria-pressed={zoom==='width'} className="h-7 rounded border bg-white px-2" onClick={()=>setZoom('width')}>Fit width</button>
   </div>
  </div>
  <div ref={fitArea} className="relative flex min-h-0 flex-1 items-start overflow-auto bg-[#e8e8e8] p-3">
   {firstLayerLabel&&<span className="sr-only" data-preview-first-layer>Select {firstLayerLabel}</span>}
   <div data-editor-preview-viewport data-logical-width={viewport.width} data-logical-height={viewport.height} className="relative mx-auto shrink-0 bg-white shadow-sm" style={{width:visualWidth,height:visualHeight}}>
    <iframe ref={frame} src={src} title={previewTitle} className="absolute left-0 top-0 border-0 bg-white" style={{width:viewport.width,height:viewport.height,transform:`scale(${scale})`,transformOrigin:'top left'}} onLoad={()=>{setReady(false);frame.current?.contentWindow?.postMessage({source:'wiffey-editor',type:'request-ready'},window.location.origin)}}/>
    {mode==='responsive'&&<button type="button" aria-label="Resize responsive preview" title="Drag to resize responsive viewport" onPointerDown={startResize} onPointerMove={resize} onPointerUp={endResize} onPointerCancel={endResize} className="absolute bottom-0 right-0 z-20 h-5 w-5 translate-x-1/2 translate-y-1/2 cursor-nwse-resize rounded-full border-2 border-white bg-[#005bd3] shadow-md"/>}
    {!ready&&<div className="pointer-events-none absolute inset-0 grid place-items-center bg-white/80 text-[12px] text-[#6d7175]">Loading live preview…</div>}
   </div>
  </div>
 </div>;
}
