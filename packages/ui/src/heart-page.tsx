"use client";
import {useEffect,useMemo,useRef,type CSSProperties} from 'react';
import type {PageDocument} from '@wiffeyyyy/content';
import {HEART_SHELL,HEART_ENGINE,HEART_COLORS} from './heart-source';
import {HEART_BRIDGE} from './heart-bridge';
const source=HEART_SHELL+'<script>const ORIGINAL_HEART_COLORS='+JSON.stringify(HEART_COLORS)+';'+HEART_BRIDGE+'\n'+HEART_ENGINE+'</script></body></html>';
export function HeartPage({document,onSelect,selectedId,contained=false,liveVisual=false}:{document:PageDocument;onSelect?:(id:string)=>void;selectedId?:string;contained?:boolean;liveVisual?:boolean}){
 const frame=useRef<HTMLIFrameElement>(null),latest=useRef({document,onSelect,selectedId,liveVisual});latest.current={document,onSelect,selectedId,liveVisual};
 const visibleRoot=document.nodes.find(n=>n.props.heartPart==='page'&&n.parentId===null&&n.visible);
 const data=useMemo(()=>({type:'wiffey-heart:document',document,editing:!!onSelect&&!liveVisual,inspecting:!!onSelect&&liveVisual,selectedId}),[document,onSelect,selectedId,liveVisual]);
 const send=()=>{const current=latest.current;frame.current?.contentWindow?.postMessage({type:'wiffey-heart:document',document:current.document,editing:!!current.onSelect&&!current.liveVisual,inspecting:!!current.onSelect&&current.liveVisual,selectedId:current.selectedId,reducedMotion:!!window.document.querySelector('.birthday-os[data-reduced-motion="true"]')},'*')};
 useEffect(()=>{const receive=(event:MessageEvent)=>{if(event.source!==frame.current?.contentWindow)return;const message=event.data;if(message?.type==='wiffey-heart:ready')send();if(message?.type==='wiffey-heart:select'&&latest.current.document.nodes.some(n=>n.id===message.id))latest.current.onSelect?.(message.id);if(message?.type==='wiffey-heart:navigate'&&!latest.current.onSelect&&['/','/home'].includes(message.href))window.dispatchEvent(new CustomEvent('wiffey:journey',{detail:{href:message.href}}))};window.addEventListener('message',receive);return()=>window.removeEventListener('message',receive)},[]);
 useEffect(send,[data]);
 useEffect(()=>{const root=window.document.querySelector('.birthday-os');const observer=new MutationObserver(send);if(root)observer.observe(root,{attributes:true,attributeFilter:['data-reduced-motion']});const preference=window.matchMedia('(prefers-reduced-motion: reduce)');preference.addEventListener('change',send);return()=>{observer.disconnect();preference.removeEventListener('change',send)}},[]);
 if(!visibleRoot)return null;
 return <div className="heart-experience" data-node-id={visibleRoot.id} style={{width:'100%',height:contained?'760px':'100dvh',background:'#160811'} as CSSProperties}><iframe ref={frame} title="From My Heart · In My Heart" srcDoc={source} sandbox="allow-scripts allow-same-origin" allow="autoplay" onLoad={send} style={{display:'block',width:'100%',height:'100%',border:0}}/></div>;
}
