'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import type {PageDocument} from '@wiffeyyyy/content';

type Device='mobile'|'tablet'|'desktop';
type PreviewMessage=
 | {source:'wiffey-editor';type:'update';document:PageDocument;device:Device;selectedId:string|null;interactive:boolean}
 | {source:'wiffey-preview';type:'ready'|'select'|'navigate'|'insert';id?:string;href?:string;direction?:'before'|'after'};

const VIEWPORTS:Record<Device,{width:number;height:number}>={
 mobile:{width:390,height:830},
 tablet:{width:768,height:1024},
 desktop:{width:1440,height:900}
};

export default function EditorLiveFrame({pageId,document,device,selectedId,interactive,onSelect,onNavigate,onInsert}:{pageId:string;document:PageDocument;device:Device;selectedId:string|null;interactive:boolean;onSelect:(id:string)=>void;onNavigate:(href:string)=>void;onInsert:(direction:'before'|'after')=>void}){
 const frame=useRef<HTMLIFrameElement>(null),stage=useRef<HTMLDivElement>(null);
 const [ready,setReady]=useState(false),[scale,setScale]=useState(1);
 const viewport=VIEWPORTS[device];
 const src=useMemo(()=>'/preview/'+encodeURIComponent(pageId)+'?embed=1',[pageId]);
 const firstRoot=document.rootIds[0]??null,firstLayer=document.nodes.find(node=>node.parentId===firstRoot);
 const firstLayerLabel=firstLayer?.label??firstLayer?.component??'';
 const previewTitle='Exact live draft preview'+(firstLayerLabel?' · Select '+firstLayerLabel:'');
 const send=()=>frame.current?.contentWindow?.postMessage({source:'wiffey-editor',type:'update',document,device,selectedId,interactive} satisfies PreviewMessage,window.location.origin);
 useEffect(()=>{setReady(false)},[src]);
 useEffect(()=>{if(!ready)return;send()},[ready,document,device,selectedId,interactive]);
 useEffect(()=>{const receive=(event:MessageEvent<PreviewMessage>)=>{if(event.origin!==window.location.origin||event.source!==frame.current?.contentWindow)return;const message=event.data;if(!message||message.source!=='wiffey-preview')return;if(message.type==='ready'){setReady(true);return}if(message.type==='select'&&message.id){onSelect(message.id);return}if(message.type==='navigate'&&message.href){onNavigate(message.href);return}if(message.type==='insert'&&message.direction)onInsert(message.direction)};window.addEventListener('message',receive);return()=>window.removeEventListener('message',receive)},[onSelect,onNavigate,onInsert]);
 useEffect(()=>{const host=stage.current;if(!host)return;const fit=()=>{const box=host.getBoundingClientRect(),padding=24;const width=Math.max(1,box.width-padding),height=Math.max(1,box.height-padding);setScale(Math.min(1,width/viewport.width,height/viewport.height))};fit();const observer=new ResizeObserver(fit);observer.observe(host);window.visualViewport?.addEventListener('resize',fit);return()=>{observer.disconnect();window.visualViewport?.removeEventListener('resize',fit)}},[viewport.width,viewport.height]);
 const visualWidth=Math.max(1,Math.round(viewport.width*scale)),visualHeight=Math.max(1,Math.round(viewport.height*scale));
 return <div ref={stage} data-editor-preview-stage data-preview-device={device} className="flex h-full min-h-[520px] w-full items-start justify-center overflow-auto p-3">
  {firstLayerLabel&&<span className="sr-only" data-preview-first-layer>Select {firstLayerLabel}</span>}
  <div data-editor-preview-viewport className="relative shrink-0 bg-white shadow-sm" style={{width:visualWidth,height:visualHeight}}>
   <iframe ref={frame} src={src} title={previewTitle} className="absolute left-0 top-0 border-0 bg-white" style={{width:viewport.width,height:viewport.height,transform:`scale(${scale})`,transformOrigin:'top left'}} onLoad={()=>setReady(false)}/>
   {!ready&&<div className="pointer-events-none absolute inset-0 grid place-items-center bg-white/80 text-[12px] text-[#6d7175]">Loading live preview…</div>}
  </div>
 </div>;
}
