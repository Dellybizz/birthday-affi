'use client';
import {useEffect,useRef,useState} from 'react';
import type {CMSNode} from '@wiffeyyyy/content';
export default function EditorMediaThumbnail({node}:{node:CMSNode}){
 const root=useRef<HTMLSpanElement>(null),[visible,setVisible]=useState(false),[failed,setFailed]=useState(false);
 const video=node.component==='video'||node.component==='movie-scene'&&node.props.mediaKind!=='image';
 const src=String(node.props.src??''),poster=String(node.props.poster??'')||(video&&/^\/media\/[^?]+$/.test(src)?src+'?poster=1':'');
 const image=video?poster:src;
 useEffect(()=>{setFailed(false)},[image,src]);
 useEffect(()=>{const element=root.current;if(!element)return;const observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){setVisible(true);observer.disconnect()}},{rootMargin:'80px'});observer.observe(element);return()=>observer.disconnect()},[]);
 return <span ref={root} className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded bg-[#eee8e3] text-[#6d7175]" aria-label={video?'Video thumbnail':'Photo thumbnail'}>
  {visible&&image&&!failed?<img src={image} alt={String(node.props.alt??'')} loading="lazy" className="h-full w-full object-cover" onError={()=>setFailed(true)}/>:visible&&video&&src?<video src={src} muted playsInline preload="metadata" className="h-full w-full object-cover" onLoadedMetadata={event=>{event.currentTarget.currentTime=Math.min(.1,event.currentTarget.duration/2)}}/>:<span aria-hidden>{video?'▶':'▧'}</span>}
  {video&&<span aria-hidden className="absolute bottom-0 right-0 rounded-tl bg-black/60 px-1 text-[10px] text-white">▶</span>}
 </span>;
}
