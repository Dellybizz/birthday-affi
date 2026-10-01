'use client';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { useBirthdayOS } from './os-provider';
export function Welcome({content}:{content?:ReactNode}){
 const {state,dispatch}=useBirthdayOS();
 return <main className="os-welcome"><div className="os-welcome-orbit" aria-hidden="true"><span>✧</span><span>♡</span><span>✦</span><div className="os-heart">♡</div></div><p className="os-eyebrow">A birthday world, made with love</p>{content??<><h1>Hey, favourite<br/><em>person.</em></h1><p className="os-welcome-copy">A few little things to make you smile.<br/>A whole lot of love, tucked inside.</p></>}<Link href="/home" className="os-primary" onClick={()=>dispatch({type:'enter'})}>{state.entered?'Back to your birthday home':'Open your birthday world'} <span aria-hidden="true">→</span></Link><p className="os-welcome-note">No passwords. No rush. Just you.</p><div className="os-welcome-line" aria-hidden="true"/></main>;
}
