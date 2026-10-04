"use client";
import {useEffect,useMemo,useRef,useState,type CSSProperties} from 'react';
import type {TransitionFrameMap,TransitionSceneId} from '@wiffeyyyy/content';

type Layer={id:number;scene:TransitionSceneId;src:string;state:'incoming'|'active'|'outgoing'};

function resolveFrame(frames:TransitionFrameMap,scene:TransitionSceneId,isMobile:boolean){
 const frame=frames[scene];
 return isMobile&&frame.mobile?frame.mobile:frame.desktop;
}

export function HeartPhoneFrameCompositor({sceneId,frames,isMobile,frameStyle,replayToken,blendMs=460}:{sceneId:TransitionSceneId;frames:TransitionFrameMap;isMobile:boolean;frameStyle:CSSProperties;replayToken:number;blendMs?:number}){
 const initialSrc=resolveFrame(frames,sceneId,isMobile);
 const sequence=useRef(0),cleanup=useRef<ReturnType<typeof setTimeout>|null>(null),latestScene=useRef(sceneId);
 const [layers,setLayers]=useState<Layer[]>(()=>initialSrc?[{id:sequence.current++,scene:sceneId,src:initialSrc,state:'active'}]:[]);
 const source=useMemo(()=>resolveFrame(frames,sceneId,isMobile),[frames,isMobile,sceneId]);

 useEffect(()=>{
  latestScene.current=sceneId;
  if(cleanup.current){clearTimeout(cleanup.current);cleanup.current=null}
  if(!source){setLayers([]);return}
  const current=layers.find(layer=>layer.state==='active');
  if(current?.scene===sceneId&&current.src===source)return;
  let cancelled=false;
  const image=new Image();image.decoding='async';image.src=source;
  const activate=()=>{
   if(cancelled||latestScene.current!==sceneId)return;
   const id=sequence.current++;
   setLayers(previous=>{
    const outgoing=previous.filter(layer=>layer.state==='active'||layer.state==='incoming').map(layer=>({...layer,state:'outgoing' as const}));
    return [...outgoing.slice(-1),{id,scene:sceneId,src:source,state:'incoming'}];
   });
   requestAnimationFrame(()=>requestAnimationFrame(()=>setLayers(previous=>previous.map(layer=>layer.id===id?{...layer,state:'active'}:layer))));
   cleanup.current=setTimeout(()=>setLayers(previous=>previous.filter(layer=>layer.id===id||layer.state!=='outgoing')),blendMs+100);
  };
  if(typeof image.decode==='function')void image.decode().then(activate).catch(activate);else image.onload=activate;
  return()=>{cancelled=true};
 },[blendMs,isMobile,replayToken,sceneId,source]);

 useEffect(()=>()=>{if(cleanup.current)clearTimeout(cleanup.current)},[]);

 return <div className="heart-phone-frame-compositor" style={{'--t9-frame-blend':blendMs+'ms'} as CSSProperties}>
  {layers.map(layer=><img key={layer.id+'-'+replayToken} data-frame-state={layer.state} data-frame-scene={layer.scene} className="heart-phone-transition-keyframe" src={layer.src} alt="" style={frameStyle}/>) }
 </div>;
}
