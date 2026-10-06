'use client';
import {useEffect,useRef,useState} from 'react';
import StoryBook from './vault-story-book';
import {getAppSettings,type PageDocument,type VaultStory} from '@wiffeyyyy/content';
function Lock({open=false}:{open?:boolean}){return <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="3"/>{open?<path d="M8 10V6a4 4 0 0 1 8 0"/>:<path d="M8 10V6a4 4 0 0 1 8 0v4"/>}<path d="M12 14v3"/></svg>}
export function VaultApp({document,editing=false}:{document?:PageDocument;editing?:boolean}){
 const settings=getAppSettings(document,'vault'),label=(key:string)=>String(settings[key]);
 const [answer,setAnswer]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[story,setStory]=useState<VaultStory|null>(null);
 const [phase,setPhase]=useState<'locked'|'opening'|'open'|'closing'>('locked');
 useEffect(()=>{
  if(phase!=='opening'&&phase!=='closing')return;
  // Animation events can be lost when a tab is backgrounded or styles change.
  const timer=window.setTimeout(()=>{
   if(phase==='opening')setPhase('open');
   else{setStory(null);setPhase('locked')}
  },phase==='opening'?Number(settings.unlockDuration):600);
  return()=>window.clearTimeout(timer);
 },[phase,settings.unlockDuration]);
 useEffect(()=>{if(phase==='open')heading.current?.focus();if(phase==='locked')input.current?.focus()},[phase]);
 const input=useRef<HTMLInputElement>(null),heading=useRef<HTMLHeadingElement>(null),pending=useRef(false);
 const unlock=async(event:React.FormEvent)=>{
  event.preventDefault();if(editing){setError('Unlock is disabled in the page preview. Preview private chapters from Vault settings.');return}if(pending.current||!answer.trim())return;pending.current=true;setBusy(true);setError('');
  try{const response=await fetch('/api/vault',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({answer}),cache:'no-store'});const data=await response.json();
   if(!response.ok)throw new Error(data.error||'Vault couldn’t open. Please try again.');
   if(!data.story||!Array.isArray(data.story.chapters))throw new Error('Vault couldn’t open. Please try again.');
   setStory(data.story);setAnswer('');setPhase('opening');
  }catch(e){setError(e instanceof Error?e.message:'Connection lost. Please try again.');input.current?.focus()}finally{pending.current=false;setBusy(false)}
 };
 const lock=()=>{if(phase!=='open')return;setPhase('closing');setAnswer('');setError('')};
 const completeTransition=()=>{if(phase==='opening')setPhase('open');else if(phase==='closing'){setStory(null);setPhase('locked')}};
 return <main data-layout-node-id={document?.rootIds[0]} style={{background:story?undefined:label('appBackground'),'--app-accent':label('appAccent'),'--vault-gold':label('appAccent'),'--vault-open-duration':String(settings.unlockDuration)+'ms'} as React.CSSProperties} data-phase={phase} className={'vault-app'+(story?' is-unlocked':'')}><div className="vault-grain" aria-hidden="true"/><header className="vault-header"><a href="/home" aria-label="Return to home screen">‹ Home</a><span>{label('appTitle')}</span>{story?<button onClick={lock} disabled={phase!=='open'} aria-label="Lock Vault"><Lock/></button>:<span className="vault-secure" aria-label="Vault is locked"><Lock/></span>}</header>
 {story?<StoryBook story={story} onLock={lock} disabled={phase!=='open'} headingRef={heading}/>:<section className="vault-entrance"><div className="vault-eyebrow"><span/> A LOVE STORY, KEPT SAFE</div><div className="vault-door" aria-hidden="true"><div className="vault-dial"><span className="vault-dial-center">♡</span><i/><i/><i/></div><span className="vault-door-hinge"/><span className="vault-door-label">{label('doorLabel')}</span></div><h1>{label('lockedTitle')}</h1><p className="vault-intro">{label('lockedMessage')}</p><form onSubmit={unlock} className="vault-form"><label htmlFor="vault-answer">{label('question')}</label><div className={'vault-input-wrap'+(error?' has-error':'')}><input ref={input} id="vault-answer" value={answer} onChange={event=>{setAnswer(event.target.value);if(error)setError('')}} maxLength={160} autoComplete="off" autoCapitalize="sentences" placeholder={label('answerPlaceholder')} disabled={busy} aria-invalid={!!error} aria-describedby={error?'vault-error':'vault-answer-note'}/><span aria-hidden="true">♡</span></div><p id="vault-answer-note" className="vault-answer-note">{label('answerHint')}</p>{error&&<p id="vault-error" className="vault-error" role="alert">{error}</p>}<button className="vault-unlock" type="submit" disabled={busy||!answer.trim()}>{busy?<span className="vault-spinner" aria-hidden="true"/>:<Lock open/>}{busy?label('openingLabel'):label('unlockLabel')}<span aria-hidden="true">→</span></button></form><p className="vault-footnote">One memory. A key only we share.</p></section>}
 {(phase==='opening'||phase==='closing')&&<div className="vault-cinematic" aria-hidden="true" onAnimationEnd={event=>{if(event.target===event.currentTarget)completeTransition()}}><div className="vault-inner-light"/><div className="vault-door-leaf vault-door-left"><div className="vault-door-inlay"/><span className="vault-cinematic-monogram">♡</span><span className="vault-cinematic-label">OUR STORY</span></div><div className="vault-door-leaf vault-door-right"><div className="vault-door-inlay"/><div className="vault-cinematic-lock"><Lock open={phase==='opening'}/></div><span className="vault-cinematic-label">KEPT CLOSE</span></div><div className="vault-light-dust"><i/><i/><i/><i/><i/></div></div>}
 <span className="vault-transition-status" role="status">{phase==='opening'?'Unlocking your precious story…':phase==='closing'?'Keeping our story safe.':''}</span>
 <a className="vault-home" href="/home" aria-label="Return to home screen"><span/></a></main>;
}
