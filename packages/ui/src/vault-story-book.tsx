'use client';
import {useEffect,useRef,useState} from 'react';
import type {RefObject} from 'react';
import type {VaultStory,VaultChapter} from '@wiffeyyyy/content';

function Keepsake({motif}:{motif:VaultChapter['motif']}){
 const paths:Record<VaultChapter['motif'],React.ReactNode>={
  notebook:<><path d="M22 16h39v51H22zM29 16v51M36 29h18M36 37h18M36 45h11"/><path d="m56 61 11-25 5 2-11 25-6 5z"/></>,
  letters:<><rect x="16" y="23" width="52" height="37" rx="3"/><path d="m17 25 25 19 25-19M17 58l17-19M67 58 50 39"/><path d="M42 30c-8-9-15 1 0 10 15-9 8-19 0-10z"/></>,
  touch:<><path d="M17 56c8-1 12-11 19-12l15-2c7-1 9 6 2 9l-12 4M26 65l17-2 22-12c6-3 10 3 4 7L50 72H29M66 28c-10-13-22 1 0 15 22-14 10-28 0-15z"/></>,
  seat:<><path d="M19 22h19v24H19zM17 47h23v6H17zM20 53v16M37 53v16M46 22h19v24H46zM44 47h23v6H44zM47 53v16M64 53v16"/><path d="M42 11v6M38 14h8"/></>,
  dua:<><path d="M57 15c-25 0-38 33-14 46 13 8 28 3 35-7-34 15-46-27-21-39z"/><path d="m66 20 2 6 6 2-6 2-2 6-2-6-6-2 6-2zM25 70h30"/></>,
  shawl:<><path d="m23 15 27 2 13 46-29-4zM23 15l-6 47 17-3M34 59v11M40 61v11M46 62v12M52 63v12M58 64v12M31 25l21 2M28 33l26 3M28 43l28 4"/><path d="M41 48c-5-6-10 1 0 7 10-6 5-13 0-7z"/></>,
  future:<><path d="M13 22c13-5 24-3 29 3 5-6 16-8 29-3v40c-12-4-23-2-29 3-6-5-17-7-29-3zM42 25v40M22 33l12 2M22 41l12 2M51 36h11M56 31v10"/><path d="M56 50c-5-6-10 1 0 7 10-6 5-13 0-7z"/></>
 };
 return <svg className="book-keepsake-art" viewBox="0 0 84 84" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[motif]}</svg>;
}
export default function StoryBook({story,onLock,disabled,headingRef}:{story:VaultStory;onLock:()=>void;disabled:boolean;headingRef:RefObject<HTMLHeadingElement|null>}){
 const [page,setPage]=useState(-1),[noteOpen,setNoteOpen]=useState(false),[direction,setDirection]=useState('next');
 const [menu,setMenu]=useState<'closed'|'open'|'closing'>('closed');
 const readingWindow=useRef<HTMLDivElement>(null),dialog=useRef<HTMLDialogElement>(null),chapterHeading=useRef<HTMLHeadingElement>(null),touch=useRef<{x:number;y:number}|null>(null);
 const currentPage=Math.min(page,story.chapters.length-1),chapter=story.chapters[currentPage];
 useEffect(()=>{if(page>=story.chapters.length)setPage(story.chapters.length-1)},[page,story.chapters.length]);
 useEffect(()=>{readingWindow.current?.scrollTo({top:0});if(page>=0)chapterHeading.current?.focus({preventScroll:true})},[page]);
 useEffect(()=>{
  if(menu==='open'&&!dialog.current?.open)dialog.current?.showModal();
  if(menu==='closed')dialog.current?.close();
  if(menu==='closing'){const timer=setTimeout(()=>setMenu('closed'),200);return()=>clearTimeout(timer)}
 },[menu]);
 function go(next:number){if(disabled||next< -1||next>=story.chapters.length)return;setDirection(next>page?'next':'previous');setNoteOpen(false);setPage(next)}
 return <section className="love-book" aria-label="Our love story" onKeyDown={event=>{if(event.target!==event.currentTarget&&((event.target as HTMLElement).closest('button,summary,input,dialog')))return;if(event.key==='ArrowRight')go(page+1);if(event.key==='ArrowLeft')go(page-1)}}>
  <div className="book-toolbar"><span>{page<0?'A STORY, KEPT CLOSE':`CHAPTER ${String(page+1).padStart(2,'0')} OF ${String(story.chapters.length).padStart(2,'0')}`}</span><button onClick={()=>setMenu('open')} disabled={disabled} aria-haspopup="dialog">Contents <span aria-hidden="true">☷</span></button></div>
  <div ref={readingWindow} className="book-reading-window" onPointerDown={event=>{if((event.target as HTMLElement).closest('button'))return;touch.current={x:event.clientX,y:event.clientY}}} onPointerUp={event=>{const start=touch.current;touch.current=null;if(!start)return;const dx=event.clientX-start.x,dy=event.clientY-start.y;if(Math.abs(dx)>65&&Math.abs(dy)<40)go(page+(dx<0?1:-1))}} onPointerCancel={()=>{touch.current=null}}>
   {page<0?<div className="book-cover" key="cover"><div className="book-cover-border" aria-hidden="true"/><span className="book-edition">OUR PRIVATE EDITION · VOL. I</span><div className="book-cover-heart" aria-hidden="true">♡<span>✧</span></div><p className="book-dedication">{story.dedication}</p><h1 ref={headingRef} tabIndex={-1}>{story.title}</h1><div className="book-cover-rule" aria-hidden="true"><span/>✧<span/></div><p className="book-cover-subtitle">{story.subtitle}</p><p className="book-cover-caption">Seven chapters.<br/>All the things I wanted you to know.</p><button className="book-begin" onClick={()=>go(0)} disabled={disabled}>Begin our story <span aria-hidden="true">→</span></button><span className="book-cover-footer">WRITTEN FROM MY HEART, FOR YOU</span></div>:<article key={chapter.id} data-direction={direction} className={'book-page book-page-'+chapter.motif}>
    <div className="book-chapter-top"><span className="book-roman">{['I','II','III','IV','V','VI','VII'][page]??String(page+1)}</span><span>{chapter.period}</span></div>
    <h1 ref={chapterHeading} tabIndex={-1}>{chapter.title}</h1>
    <div className="book-keepsake"><Keepsake motif={chapter.motif}/><div><span>A LITTLE KEEPSAKE</span><p>{chapter.keepsake}</p></div></div>
    <blockquote>{chapter.quote}</blockquote>
    <span className="book-scene-label">WHAT HAPPENED</span>
    <div className="book-prose">{chapter.body.split('\n\n').map((paragraph,index)=><p key={index}>{paragraph}</p>)}</div>
    <div className={'book-sealed-note'+(noteOpen?' is-open':'')}><button disabled={disabled} aria-expanded={noteOpen} aria-controls={'note-'+chapter.id} onClick={()=>setNoteOpen(!noteOpen)}><span className="book-seal" aria-hidden="true">♡</span><span><small>WHAT YOU DIDN’T KNOW</small><strong>{chapter.noteTitle}</strong></span><span className="book-note-arrow" aria-hidden="true">⌄</span></button><div className="book-note-expand" id={'note-'+chapter.id} inert={!noteOpen}><div><p>{chapter.note}</p><span className="book-note-signature">Always, yours.</span></div></div></div>
    {page===story.chapters.length-1&&<div className="book-ending"><span aria-hidden="true">∞</span><p>To be continued…<br/><small>With you.</small></p></div>}
    <span className="book-page-number" aria-hidden="true">— {String(page+1).padStart(2,'0')} —</span>
   </article>}
  </div>
  {page>=0&&<nav className="book-navigation" aria-label="Chapter navigation"><div className="book-progress" aria-label={`Chapter ${page+1} of ${story.chapters.length}`}>{story.chapters.map((item,index)=><button key={item.id} aria-label={`Read chapter ${index+1}: ${item.title}`} aria-current={index===page?'step':undefined} className={index===page?'is-current':index<page?'is-read':''} disabled={disabled} onClick={()=>go(index)}/>)}</div><div className="book-navigation-buttons"><button disabled={disabled} onClick={()=>go(page-1)}><span aria-hidden="true">←</span> {page===0?'Cover':'Previous'}</button><span className="book-page-count">{String(page+1).padStart(2,'0')} / {String(story.chapters.length).padStart(2,'0')}</span>{page<story.chapters.length-1?<button disabled={disabled} onClick={()=>go(page+1)}>Next chapter <span aria-hidden="true">→</span></button>:<button disabled={disabled} onClick={()=>go(-1)}>Read again <span aria-hidden="true">↺</span></button>}</div></nav>}
  <button className="vault-lock-again book-close" disabled={disabled} onClick={onLock}><svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V6a4 4 0 0 1 8 0v4"/></svg> Close our story</button>
  <dialog ref={dialog} className="book-contents" data-state={menu} aria-labelledby="book-contents-heading" onCancel={event=>{event.preventDefault();setMenu('closing')}} onClick={event=>{if(event.target===event.currentTarget)setMenu('closing')}}><div className="book-contents-heading"><div><span>OUR STORY, IN SEVEN CHAPTERS</span><h2 id="book-contents-heading">The little things.<br/>The whole story.</h2></div><button aria-label="Close contents" onClick={()=>setMenu('closing')}>×</button></div><ol>{story.chapters.map((item,index)=><li key={item.id}><button aria-current={index===page?'page':undefined} disabled={menu==='closing'} onClick={()=>{go(index);setMenu('closing')}}><span>{String(index+1).padStart(2,'0')}</span><div><strong>{item.title}</strong><small>{item.period}</small></div><span aria-hidden="true">↗</span></button></li>)}</ol><button className="book-return-cover" onClick={()=>{go(-1);setMenu('closing')}}>Back to the cover</button></dialog>
 </section>;
}
