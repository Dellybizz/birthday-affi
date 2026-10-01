'use client';
import {useContext,useEffect,useRef,useState,type CSSProperties,type ReactNode} from 'react';
import {getPublicApp,safeMediaUrl,type CMSNode,type PageDocument} from '@wiffeyyyy/content';
import {DocumentSettingsContext} from './page-layout';
import {useSiteNavigation} from './navigation';

const text=(node:CMSNode,key:string,fallback='')=>String(node.props[key]??fallback);
function Glyph({kind}:{kind:'wifi'|'signal'|'battery'|'back'|'home'|'recent'}){
 const paths={wifi:<><path d="M3 8a15 15 0 0 1 18 0M6 12a10 10 0 0 1 12 0M9 16a5 5 0 0 1 6 0"/><circle cx="12" cy="20" r="1"/></>,signal:<><path d="M4 20v-3M9 20v-7M14 20V9M19 20V4"/></>,battery:<><rect x="3" y="6" width="16" height="12" rx="3"/><path d="M22 10v4M6 9h10v6H6z"/></>,back:<path d="m15 5-7 7 7 7"/>,home:<circle cx="12" cy="12" r="7"/>,recent:<rect x="5" y="5" width="14" height="14" rx="2"/>};
 return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[kind]}</svg>;
}
export function PhoneHome({document,onSelect,selectedId,persist=false,contained=false,renderNode}:{document:PageDocument;onSelect?:(id:string)=>void;selectedId?:string;persist?:boolean;contained?:boolean;renderNode?:(id:string)=>ReactNode}){
 const settings=useContext(DocumentSettingsContext),navigation=useSiteNavigation(),editing=!!onSelect;
 const byId=new Map(document.nodes.map(n=>[n.id,n]));const root=document.nodes.find(n=>n.parentId===null&&n.props.phonePart==='home')!;
 const nodes=root.children.map(id=>byId.get(id)!).filter(n=>n.visible);
 const wallpaper=nodes.find(n=>n.props.phonePart==='wallpaper'),status=nodes.find(n=>n.props.phonePart==='status'),inbox=nodes.find(n=>n.props.phonePart==='notifications');
 const notifications=inbox?inbox.children.map(id=>byId.get(id)!).filter(n=>n.visible):[];
 const [now,setNow]=useState<Date|null>(null),[open,setOpen]=useState(false),[dismissed,setDismissed]=useState<string[]>([]),[reduceMotion,setReduceMotion]=useState(false),[folder,setFolder]=useState<string|null>(null),[imageFailed,setImageFailed]=useState(false);
 const dialog=useRef<HTMLDialogElement>(null),gesture=useRef<{x:number;y:number;id:number}|null>(null);
 useEffect(()=>{const tick=()=>setNow(new Date());tick();const timer=setInterval(tick,1000*30);return()=>clearInterval(timer)},[]);
 useEffect(()=>{setImageFailed(false)},[wallpaper?.props.src]);
 useEffect(()=>{if(!persist)return;try{const saved=JSON.parse(localStorage.getItem('wiffeyyyy:phone-home')??'{}');if(Array.isArray(saved.dismissed))setDismissed(saved.dismissed.filter((id:unknown)=>typeof id==='string'));setReduceMotion(saved.reduceMotion===true)}catch{}},[persist]);
 const save=(ids:string[],motion=reduceMotion)=>{setDismissed(ids);setReduceMotion(motion);if(persist)try{localStorage.setItem('wiffeyyyy:phone-home',JSON.stringify({version:1,dismissed:ids.slice(-500),reduceMotion:motion}))}catch{}};
 useEffect(()=>{if(open&&!dialog.current?.open){if(editing||contained)dialog.current?.show();else dialog.current?.showModal();}else if(!open&&dialog.current?.open)dialog.current.close()},[open,editing,contained]);
 useEffect(()=>{if(!editing)return;const selected=byId.get(selectedId??'');if(selected&&(selected.id===inbox?.id||selected.parentId===inbox?.id))setOpen(true)},[selectedId,editing,inbox?.id]);
 const mark=(node:CMSNode,content:ReactNode,className='',style:CSSProperties={})=><div key={node.id} data-phone-node={node.id} className={className} style={{color:node.props.color?String(node.props.color):undefined,padding:node.props.padding?Number(node.props.padding):undefined,margin:node.props.margin?Number(node.props.margin):undefined,opacity:node.props.opacity!==undefined?Number(node.props.opacity):undefined,background:node.props.phonePart!=='wallpaper'&&node.props.background&&node.props.background!=='transparent'?String(node.props.background):undefined,...style,outline:editing&&selectedId===node.id?'2px solid #ffb3d0':undefined}} onClick={editing?e=>{e.stopPropagation();e.preventDefault();onSelect(node.id)}:undefined} onKeyDown={editing?e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();onSelect(node.id)}}:undefined} role={editing?'button':undefined} tabIndex={editing?0:undefined} aria-label={editing?'Select '+node.label:undefined}>{content}</div>;
 const clock=now?new Intl.DateTimeFormat('en',{hour:'numeric',minute:'2-digit',hour12:nodes.find(n=>n.props.phonePart==='widget')?.props.clockFormat!=='24',timeZone:settings.timezone}).format(now):'—:—';
 const date=now?new Intl.DateTimeFormat('en',{weekday:'short',month:'long',day:'numeric',timeZone:settings.timezone}).format(now):'Birthday edition';
 const route=(slug:string)=>slug==='home'?'/home':getPublicApp(slug)?'/app/'+slug:'/pages/'+slug;
 const active=notifications.filter(n=>editing||!dismissed.includes(n.id));
 const src=wallpaper&&safeMediaUrl(wallpaper.props.src)?text(wallpaper,'src'):'';
 const renderText=(n:CMSNode)=>{if(!n.visible)return null;const value=n.props.binding==='nickname'?settings.nickname:text(n,'text');return mark(n,n.component==='heading'?<h1>{value}</h1>:<p>{value}</p>,'phone-widget-line',{fontSize:n.props.size?Number(n.props.size):undefined,color:n.props.color?String(n.props.color):undefined,textAlign:n.props.align as CSSProperties['textAlign']});};
 const appIcon=(n:CMSNode)=>{
  const slug=text(n,'pageSlug'),target=navigation?.find(item=>item.href===route(slug));
  if(navigation&&!target)return null;
  if(target&&!target.visible)return null;
  const visibleParent=(id:string|null):boolean=>{if(!id)return true;const item=navigation?.find(x=>x.id===id);return !!item&&item.visible&&visibleParent(item.parentId)};
  if(target&&!visibleParent(target.parentId))return null;
  const custom=text(n,'src'),icon=text(n,'icon',target?.icon??'♡');
  return mark(n,<a className="phone-app-link" href={editing?undefined:target?.href??route(slug)} tabIndex={editing?-1:undefined} aria-label={'Open '+text(n,'text',target?.label??slug)}><span className="phone-icon" style={{background:text(n,'iconBackground','#e8b4d0'),borderRadius:Number(n.props.radius??19)}}>{custom&&safeMediaUrl(custom)?<img src={custom} alt="" loading="lazy"/>:<span aria-hidden="true">{icon}</span>}</span><span className="phone-icon-label">{text(n,'text',target?.label??slug)}</span></a>,'phone-app');
 };
 const launcher=(node:CMSNode)=>{const children=node.children.map(id=>byId.get(id)!).filter(n=>n.visible),grid=children.find(n=>n.component==='app-grid'),icons=children.filter(n=>n.props.phonePart==='app-icon');
  const extra=navigation?.filter(item=>item.parentId===null&&item.visible&&!icons.some(icon=>route(text(icon,'pageSlug'))===item.href))??[];
  return mark(node,<>{grid&&editing&&mark(grid,<span>App grid settings</span>,'phone-grid-settings')}<div className="phone-apps" style={{gridTemplateColumns:`repeat(${Math.min(4,Math.max(1,Number(grid?.props.columns??3)))},minmax(0,1fr))`,gap:Number(grid?.props.gap??18)}}>{icons.map(appIcon)}{extra.map(item=><div key={item.id} className="phone-app"><button className="phone-app-link" onClick={()=>!editing&&setFolder(item.id)} disabled={editing||!navigation?.some(n=>n.parentId===item.id&&n.visible)}><span className="phone-icon">{item.icon||'▦'}</span><span className="phone-icon-label">{item.label}</span></button>{item.href&&<a className="phone-folder-link" href={editing?undefined:item.href}>Open</a>}</div>)}</div></>,'phone-launcher');};
 return <div className="phone-home" data-reduce-motion={reduceMotion||undefined} style={{color:root.props.color?String(root.props.color):'#ffffff',backgroundColor:wallpaper?text(wallpaper,'background','#593f65'):'#593f65'}}>
  {root.visible&&<>
  {wallpaper&&mark(wallpaper,<>{src&&!imageFailed&&<img className="phone-wallpaper-image" src={src} alt={text(wallpaper,'alt')} fetchPriority="high" onError={()=>setImageFailed(true)} style={{objectFit:text(wallpaper,'objectFit','cover') as CSSProperties['objectFit'],objectPosition:`${wallpaper.props.focalX??50}% ${wallpaper.props.focalY??50}%`}}/>}<div className="phone-wallpaper-dim" style={{background:`rgba(0,0,0,${wallpaper.props.dim??0.15})`}}/></>,'phone-wallpaper')}
  <div className="phone-surface">
   {status&&mark(status,<button className="phone-status-button" aria-label={`Open notification shade, ${active.length} notifications`} aria-expanded={open} onClick={()=>setOpen(true)} style={{touchAction:'none'}} onPointerDown={e=>{gesture.current={x:e.clientX,y:e.clientY,id:e.pointerId};e.currentTarget.setPointerCapture(e.pointerId)}} onPointerUp={e=>{const start=gesture.current;gesture.current=null;if(start&&e.clientY-start.y>35&&Math.abs(e.clientX-start.x)<100)setOpen(true)}} onPointerCancel={()=>{gesture.current=null}}><span>{clock.replace(/\s?(AM|PM)$/,'')}</span><span className="phone-status-right"><span className="phone-network-label">{text(status,'networkLabel')}</span><Glyph kind="signal"/><Glyph kind="wifi"/><span>{text(status,'battery','100')}%</span><Glyph kind="battery"/></span></button>,'phone-status')}
   <div className="phone-content">{nodes.filter(n=>!['wallpaper','status','notifications','navigation'].includes(text(n,'phonePart'))).map(n=>{
    if(n.props.phonePart==='launcher')return launcher(n);
    if(n.props.phonePart==='widget')return mark(n,<>{n.children.map(id=>byId.get(id)!).filter(child=>child.visible).map(renderText)}{n.children.some(id=>byId.get(id)?.props.binding==='nickname')&&<div className="phone-clock"><span>{clock.replace(/\s?(AM|PM)$/,'')}</span><p>{date}</p></div>}</>,'phone-widget');
    return <div key={n.id} className="phone-note">{renderNode?renderNode(n.id):mark(n,<>{n.children.map(id=>renderText(byId.get(id)!))}</>)}</div>;
   })}</div>
   {nodes.filter(n=>n.props.phonePart==='navigation').map(n=>mark(n,<nav className="phone-navigation" aria-label="Phone navigation"><button aria-label="Back" onClick={()=>{if(open)setOpen(false);else if(folder)setFolder(null);else window.location.assign('/')}}><Glyph kind="back"/></button><a href={editing?undefined:'/home'} aria-label="Home"><Glyph kind="home"/></a><button aria-label="Open birthday apps" onClick={()=>{setOpen(false);const apps=document.nodes.find(n=>n.props.phonePart==='launcher');if(apps)window.document.querySelector(`[data-phone-node="${apps.id}"]`)?.scrollIntoView({behavior:reduceMotion?'auto':'smooth',block:'center'})}}><Glyph kind="recent"/></button></nav>,'phone-navigation-layer'))}
  </div>
  {inbox&&<dialog ref={dialog} className={'phone-shade'+(editing||contained?' phone-shade-contained':'')} data-reduce-motion={reduceMotion||undefined} aria-labelledby="phone-shade-title" onCancel={()=>setOpen(false)} onClose={()=>setOpen(false)} style={{'--phone-shade-color':inbox.props.background&&inbox.props.background!=='transparent'?String(inbox.props.background):'#f3eaf3'} as CSSProperties}>
   <div className="phone-shade-handle" style={{touchAction:'none'}} onPointerDown={e=>{gesture.current={x:e.clientX,y:e.clientY,id:e.pointerId};e.currentTarget.setPointerCapture(e.pointerId)}} onPointerUp={e=>{const start=gesture.current;gesture.current=null;if(start&&start.y-e.clientY>35)setOpen(false)}}><span/></div>
   {mark(inbox,<><header className="phone-shade-heading"><div><p>{date}</p><h2 id="phone-shade-title">{text(inbox,'title','Notifications')}</h2></div><button className="phone-round-button" onClick={()=>setOpen(false)} aria-label="Close notification shade">×</button></header><div className="phone-quick-settings"><button aria-pressed={reduceMotion} onClick={()=>save(dismissed,!reduceMotion)}><span aria-hidden="true">◌</span>Reduce motion</button><a href={editing?undefined:'/app/radio'}><span aria-hidden="true">♫</span>Birthday Radio</a></div></>)}
   <div className="phone-notifications">{active.length?active.map(n=>mark(n,<article className="phone-notification"><span className="phone-notification-icon" aria-hidden="true">{text(n,'icon','♡')}</span><a href={editing?undefined:route(text(n,'pageSlug','home'))} onClick={()=>{save([...new Set([...dismissed,n.id])]);setOpen(false)}}><span className="phone-notification-source">{settings.siteTitle}</span><h3>{text(n,'title')}</h3><p>{text(n,'body')}</p></a><button aria-label={'Dismiss '+text(n,'title')} onClick={()=>save([...new Set([...dismissed,n.id])])}>×</button></article>)):<p className="phone-inbox-empty">{text(inbox,'emptyMessage','All caught up. ♡')}</p>}</div>
   {active.length>0&&<button className="phone-clear" disabled={editing} onClick={()=>save(notifications.map(n=>n.id))}>Clear all</button>}
   <button className="phone-shade-close" onClick={()=>setOpen(false)}>Swipe up or tap to close <span aria-hidden="true">⌃</span></button>
  </dialog>}
  {folder&&<div className="phone-folder" role="region" aria-label="App folder"><button onClick={()=>setFolder(null)} aria-label="Close app folder">×</button><h2>{navigation?.find(n=>n.id===folder)?.label}</h2>{navigation?.filter(n=>n.parentId===folder&&n.visible).map(n=>n.href?<a key={n.id} href={n.href}><span>{n.icon}</span>{n.label}</a>:<button key={n.id} onClick={()=>setFolder(n.id)}>{n.icon} {n.label}</button>)}</div>}
  </>}
 </div>;
}
