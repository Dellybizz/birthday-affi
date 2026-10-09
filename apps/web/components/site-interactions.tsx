'use client';
import {useEffect} from 'react';
export function SiteInteractions(){
 useEffect(()=>{const preventNativeDrag=(event:DragEvent)=>{const target=event.target;if(target instanceof Element&&!target.closest('input,textarea,[contenteditable],[draggable="true"]'))event.preventDefault()};document.addEventListener('dragstart',preventNativeDrag);return()=>document.removeEventListener('dragstart',preventNativeDrag)},[]);
 return null;
}
