'use client';
import {useEffect,useRef,useState} from 'react';
import {CAMERA_ROLL_EVENT,listCameraCaptures,type CameraCapture} from './camera-roll-store';
export type CameraRollItem=CameraCapture&{url:string};
export function useCameraRoll(enabled=true){
 const [items,setItems]=useState<CameraRollItem[]>([]),[loading,setLoading]=useState(enabled),[error,setError]=useState('');
 const urls=useRef(new Map<string,string>());
 useEffect(()=>{
  if(!enabled)return;let active=true,sequence=0;
  const refresh=async()=>{const request=++sequence;try{const captures=await listCameraCaptures();if(!active||request!==sequence)return;const ids=new Set(captures.map(c=>c.id));for(const [id,url] of urls.current)if(!ids.has(id)){URL.revokeObjectURL(url);urls.current.delete(id)}
   setItems(captures.map(c=>{let url=urls.current.get(c.id);if(!url){url=URL.createObjectURL(c.blob);urls.current.set(c.id,url)}return {...c,url}}));setError('');
  }catch(e){if(active&&request===sequence)setError(e instanceof Error?e.message:'Could not load saved captures.')}finally{if(active&&request===sequence)setLoading(false)}};
  const onChange=()=>{void refresh()};void refresh();window.addEventListener(CAMERA_ROLL_EVENT,onChange);window.addEventListener('focus',onChange);
  let channel:BroadcastChannel|undefined;try{channel=new BroadcastChannel(CAMERA_ROLL_EVENT);channel.onmessage=onChange}catch{}
  return()=>{active=false;sequence++;window.removeEventListener(CAMERA_ROLL_EVENT,onChange);window.removeEventListener('focus',onChange);channel?.close();for(const url of urls.current.values())URL.revokeObjectURL(url);urls.current.clear()};
 },[enabled]);
 return {items,loading,error};
}
