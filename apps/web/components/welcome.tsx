'use client';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { useBirthdayOS, useSiteSettings } from './os-provider';
export function Welcome({content}:{content?:ReactNode}){
 const {state,dispatch}=useBirthdayOS();const settings=useSiteSettings();
 return <main className="os-welcome"><div className="os-welcome-orbit" aria-hidden="true"><span>✧</span><span>♡</span><span>✦</span><div className="os-heart">♡</div></div><p className="os-eyebrow">A birthday world, made with love</p>{content??<><h1>Hey,<br/><em>{settings.nickname}.</em></h1><p className="os-welcome-copy">{settings.welcomeMessage}</p></>}<Link href="/home" className="os-primary" onClick={()=>dispatch({type:'enter'})}>{state.entered?'Back to your birthday home':settings.enterLabel} <span aria-hidden="true">→</span></Link><p className="os-welcome-note">No passwords. No rush. Just you.</p><div className="os-welcome-line" aria-hidden="true"/></main>;
}
