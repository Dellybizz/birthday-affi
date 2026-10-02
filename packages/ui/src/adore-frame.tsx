'use client';
import {useContext,useEffect,useState,type ReactNode} from 'react';
import {DocumentSettingsContext} from './page-layout';
export function AdoreFrame({enabled,children}:{enabled:boolean;children:ReactNode}){
 const settings=useContext(DocumentSettingsContext),[clock,setClock]=useState('9:41');
 useEffect(()=>{if(!enabled)return;const tick=()=>setClock(new Intl.DateTimeFormat('en-GB',{hour:'2-digit',minute:'2-digit'}).format(new Date()));tick();const timer=setInterval(tick,30000);return()=>clearInterval(timer)},[enabled]);
 if(!enabled)return <>{children}</>;
 return <div className="adore-app"><div className="adore-status"><span>{clock}</span><span className="adore-island" aria-hidden="true"/><span aria-label="Connected to network">▥ ◔ ▰</span></div><header className="adore-header"><a href="/home" aria-label="Return to home screen">‹ Home</a><span>For {settings.nickname==='favourite person'?'Wiffeyyyy':settings.nickname} ♡</span></header><div className="adore-content">{children}</div><a href="/home" className="adore-home" aria-label="Return to home screen"/></div>;
}
