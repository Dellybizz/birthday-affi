'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {CMSRenderer} from '@wiffeyyyy/ui/cms-renderer';
import {parsePageDocument,type PageDocument} from '@wiffeyyyy/content';

type Device='mobile'|'tablet'|'desktop';
type Box={top:number;left:number;width:number;height:number;label:string;root:boolean};
type EditorMessage={source:'wiffey-editor';type:'update';document:PageDocument;device:Device;selectedId:string|null;interactive:boolean};

const selector='[data-layout-node-id],[data-phone-node],[data-node-id]';
const idOf=(element:HTMLElement|null)=>element?.getAttribute('data-layout-node-id')??element?.getAttribute('data-phone-node')??element?.getAttribute('data-node-id')??null;

export default function DraftPreviewFrame({initialDocument}:{initialDocument:PageDocument}){
 const [document,setDocument]=useState(initialDocument),[device,setDevice]=useState<Device>('desktop'),[selectedId,setSelectedId]=useState<string|null>(initialDocument.rootIds[0]??null),[interactive,setInteractive]=useState(false),[box,setBox]=useState<Box|null>(null);
 const host=useRef<HTMLDivElement>(null),hovered=useRef<HTMLElement|null>(null);
 const post=(message:Record<string,unknown>)=>window.parent.postMessage({source:'wiffey-preview',...message},window.location.origin);
 const find=useCallback((id:string|null)=>{if(!id||!host.current)return null;const escaped=CSS.escape(id);return host.current.querySelector<HTMLElement>('[data-layout-node-id="'+escaped+'"],[data-phone-node="'+escaped+'"],[data-node-id="'+escaped+'"]')},[]);
 const measure=useCallback(()=>{if(interactive||!selectedId){setBox(null);return}const target=find(selectedId);if(!target){setBox(null);return}const rect=target.getBoundingClientRect(),node=document.nodes.find(item=>item.id===selectedId);setBox({top:rect.top,left:rect.left,width:rect.width,height:rect.height,label:node?.label??node?.component??'Section',root:!!node&&node.type==='section'&&node.parentId===null})},[document,find,interactive,selectedId]);
 useEffect(()=>{post({type:'ready'})},[]);
 useEffect(()=>{const receive=(event:MessageEvent<EditorMessage>)=>{if(event.origin!==window.location.origin||event.source!==window.parent)return;const message=event.data;if(!message||message.source!=='wiffey-editor'||message.type!=='update')return;try{setDocument(parsePageDocument(message.document));setDevice(message.device);setSelectedId(message.selectedId);setInteractive(message.interactive)}catch{}};window.addEventListener('message',receive);return()=>window.removeEventListener('message',receive)},[]);
 useEffect(()=>{if(interactive){hovered.current?.removeAttribute('data-editor-hovered');hovered.current=null;setBox(null);return}host.current?.querySelectorAll<HTMLMediaElement>('audio,video').forEach(media=>media.pause());const frame=requestAnimationFrame(()=>{const target=find(selectedId);target?.scrollIntoView({block:'nearest'});measure()});const resize=()=>requestAnimationFrame(measure);window.addEventListener('resize',resize);return()=>{cancelAnimationFrame(frame);window.removeEventListener('resize',resize)}},[document,device,find,interactive,measure,selectedId]);
 useEffect(()=>{const journey=(event:Event)=>{if(!interactive)return;const href=(event as CustomEvent<{href?:string}>).detail?.href;if(href)post({type:'navigate',href})};window.addEventListener('wiffey:journey',journey);return()=>window.removeEventListener('wiffey:journey',journey)},[interactive]);
 const select=(id:string)=>{setSelectedId(id);post({type:'select',id})};
 const click=(event:React.MouseEvent<HTMLDivElement>)=>{const element=(event.target as HTMLElement).closest<HTMLElement>(selector);if(!interactive){if(!element)return;const id=idOf(element);if(!id)return;event.preventDefault();event.stopPropagation();select(id);return}const anchor=(event.target as HTMLElement).closest<HTMLAnchorElement>('a[href]');const href=anchor?.getAttribute('href');if(!href||href.startsWith('#'))return;event.preventDefault();event.stopPropagation();post({type:'navigate',href})};
 const move=(event:React.MouseEvent<HTMLDivElement>)=>{if(interactive)return;const target=(event.target as HTMLElement).closest<HTMLElement>(selector);if(target===hovered.current)return;hovered.current?.removeAttribute('data-editor-hovered');hovered.current=target;if(target&&idOf(target)!==selectedId)target.setAttribute('data-editor-hovered','true')};
 const leave=()=>{hovered.current?.removeAttribute('data-editor-hovered');hovered.current=null};
 return <div ref={host} data-isolated-live-preview data-editor-inspect={!interactive?'true':undefined} onClickCapture={click} onMouseMoveCapture={move} onMouseLeave={leave} onScrollCapture={()=>requestAnimationFrame(measure)} className="relative min-h-screen bg-white">
  <style>{`html,body{margin:0;min-height:100%;background:white}[data-isolated-live-preview]{min-height:100vh}[data-editor-inspect="true"] *{animation-play-state:paused!important}[data-editor-inspect="true"] video,[data-editor-inspect="true"] audio{pointer-events:none}[data-editor-hovered="true"]{outline:1px solid #4f8cff!important;outline-offset:-1px}`}</style>
  <CMSRenderer document={document} embedded previewDevice={device} selectedId={selectedId??undefined} onSelect={interactive?undefined:select}/>
  {!document.nodes.length&&<p className="p-8 text-center text-sm">Add your first section from the Sections panel.</p>}
  {!interactive&&box&&<div aria-hidden className="pointer-events-none fixed z-[2147483640] border-2 border-[#1677ff]" style={{top:box.top,left:box.left,width:box.width,height:box.height}}><span className="absolute left-0 top-0 max-w-[220px] -translate-y-full truncate rounded-t-sm bg-[#1677ff] px-2 py-1 text-[11px] font-semibold text-white">{box.label}</span>{box.root&&<><button type="button" aria-label="Add section before" className="pointer-events-auto absolute left-1/2 top-0 grid h-5 w-5 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-0 bg-[#1677ff] text-[14px] leading-none text-white shadow" onClick={event=>{event.preventDefault();event.stopPropagation();post({type:'insert',direction:'before'})}}>+</button><button type="button" aria-label="Add section after" className="pointer-events-auto absolute bottom-0 left-1/2 grid h-5 w-5 -translate-x-1/2 translate-y-1/2 place-items-center rounded-full border-0 bg-[#1677ff] text-[14px] leading-none text-white shadow" onClick={event=>{event.preventDefault();event.stopPropagation();post({type:'insert',direction:'after'})}}>+</button></>}</div>}
 </div>;
}
