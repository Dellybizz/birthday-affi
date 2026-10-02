"use client";
import {useEffect,useRef,type ReactNode,type CSSProperties} from 'react';
export function ArchiveFrame({enabled,editing,effects=true,note='for you, always',children}:{enabled:boolean;editing:boolean;effects?:boolean;note?:string;children:ReactNode}){
 const ref=useRef<HTMLDivElement>(null);
 useEffect(()=>{if(!enabled||!effects||editing||!ref.current||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;const nodes=ref.current.querySelectorAll('[data-archive-part="memory"]');const o=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('archive-seen');o.unobserve(e.target)}}),{threshold:.08});nodes.forEach(n=>{n.classList.add('archive-await');o.observe(n)});return()=>{o.disconnect();nodes.forEach(n=>n.classList.remove('archive-await'))}},[enabled,editing,effects]);
 if(!enabled)return <>{children}</>;
 return <div ref={ref} className="archive-experience" data-editing={editing||undefined} data-effects={effects}><div className="archive-atmosphere" hidden={!effects} aria-hidden="true"><div className="archive-orbit"/><div className="archive-glow archive-glow-one"/><div className="archive-glow archive-glow-two"/>{Array.from({length:12},(_,i)=><span key={i} style={{'--i':i,left:(i*37%100)+'%',top:(i*23%100)+'%'} as CSSProperties}>{i%3===0?'♡':'✦'}</span>)}<div className="archive-heart">♡</div><div className="archive-orbit-note">{note}</div></div>{children}</div>
}
