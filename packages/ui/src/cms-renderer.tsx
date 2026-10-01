"use client";
import {HomeNavigation,useSiteNavigation} from './navigation';
import { resolveResponsive, parsePageDocument, appComponents, getAppItems, getPublicApp, type CMSNode, type PageDocument } from '@wiffeyyyy/content';
import {MediaPlayer} from './media-player';
import {AppExperience} from './app-experience';
import {useEffect,useRef,useState,useMemo} from 'react';
import type { CSSProperties, ReactNode } from 'react';
const apps=[['💗','Reasons I’m Obsessed','reasons'],['☎️','Birthday Hotline','hotline'],['🧭','Our Next Adventure','adventure'],['🎬','Our Birthday Movie','movie'],['💋','The Kiss Shop','kiss-shop'],['📻','Birthday Radio','radio']];
function style(node:CMSNode):CSSProperties {
  const p=node.props;
  return {background:p.background as string|undefined,color:p.color as string|undefined,padding:p.padding as number|undefined,margin:p.margin as number|undefined,borderRadius:p.radius as number|undefined,opacity:p.opacity as number|undefined,fontSize:p.size as number|undefined,fontWeight:p.weight as number|undefined,textAlign:p.align as CSSProperties['textAlign']};
}
function Block({node,editing=false}:{node:CMSNode;editing?:boolean}) {
  const p=node.props;const navigation=useSiteNavigation();
  switch(node.component) {
    case 'heading': return <h1 style={style(node)} className="text-3xl font-semibold">{p.text??''}</h1>;
    case 'text': return <p style={style(node)} className="leading-7 text-[var(--w-muted)]">{p.text??''}</p>;
    case 'app-grid': if(navigation)return <HomeNavigation items={navigation} editing={editing} style={{...style(node),display:'grid',gridTemplateColumns:`repeat(${p.columns??2},minmax(0,1fr))`,gap:Number(p.gap??12)}}/>;return <div style={{...style(node),display:'grid',gridTemplateColumns:`repeat(${p.columns??2},minmax(0,1fr))`,gap:Number(p.gap??12)}}>{apps.map(([icon,title,slug])=><a key={slug} href={editing?undefined:'/app/'+slug} tabIndex={editing?-1:undefined} style={{background:"var(--w-surface)",borderColor:"var(--w-accent)",borderRadius:"var(--w-radius)"}} className="border p-5"><span className="text-2xl">{icon}</span><h2 className="mt-3 font-semibold">{title}</h2></a>)}</div>;
    case 'video':
    case 'audio': return p.src?<MediaPlayer identity={'block:'+node.id} src={String(p.src)} kind={node.component as 'audio'|'video'} title={String(p.alt??node.component)} captions={String(p.captions??'')} disabled={editing} style={style(node)} className="w-full rounded-3xl"/>:null;
    case 'image': return p.src?<img src={String(p.src)} srcSet={p.mediaAssetId&&p.variantWidths?String(p.variantWidths).split(',').map(w=>String(p.src)+'?variant='+w+' '+w+'w').concat(p.mediaWidth?[String(p.src)+' '+p.mediaWidth+'w']:[]).join(', '):undefined} sizes={p.mediaAssetId?'(max-width: 768px) 100vw, 672px':undefined} width={typeof p.mediaWidth==='number'?p.mediaWidth:undefined} height={typeof p.mediaHeight==='number'?p.mediaHeight:undefined} alt={String(p.alt??'')} loading="lazy" decoding="async" style={{...style(node),objectFit:(p.objectFit??'cover') as CSSProperties['objectFit'],objectPosition:`${p.focalX??50}% ${p.focalY??50}%`,height:p.displayHeight?Number(p.displayHeight):'auto'}} className="w-full rounded-3xl object-cover"/>:null;
    default: {if(Object.values(appComponents).includes(node.component))return <article style={style(node)} className="rounded-3xl border bg-white p-6"><p className="text-xs text-[var(--w-muted)]">{node.label}</p><h2 className="mt-2 text-xl font-semibold">{p.title??''}</h2><p className="mt-3 whitespace-pre-line leading-7">{p.body??''}</p>{p.category&&<p className="mt-3 text-sm">Category: {p.category}</p>}{p.price&&<p className="mt-3 text-sm">Price: {p.price}</p>}{p.invitation&&<p className="mt-3 text-sm">Invitation: {p.invitation}</p>}</article>;return null;} 
  }
}
export function CMSRenderer({document,onSelect,selectedId,embedded=false,previewDevice}:{document:PageDocument;onSelect?:(id:string)=>void;selectedId?:string;embedded?:boolean;previewDevice?:'mobile'|'tablet'|'desktop'}) {
  const container=useRef<HTMLDivElement>(null),[device,setDevice]=useState<'mobile'|'tablet'|'desktop'>('desktop');
  useEffect(()=>{if(previewDevice||!container.current)return;const observe=new ResizeObserver(([entry])=>setDevice(entry.contentRect.width<600?'mobile':entry.contentRect.width<960?'tablet':'desktop'));observe.observe(container.current);return()=>observe.disconnect()},[previewDevice]);
  const original=useMemo(()=>parsePageDocument(document),[document]),valid={...original,nodes:original.nodes.map(n=>resolveResponsive(n,previewDevice??device))};
  const byId=new Map(valid.nodes.map(n=>[n.id,n]));
  const groups=Object.entries(appComponents).map(([kind,component])=>({component,app:getPublicApp(kind==='shop'?'kiss-shop':kind)!,items:getAppItems(valid,kind as keyof typeof appComponents)}));
  const render=(id:string):ReactNode=>{
    const n=byId.get(id)!;
    if(!n.visible)return null;
    const group=!onSelect?groups.find(g=>g.component===n.component):undefined;
    if(group)return group.items[0]?.id===id?<AppExperience key={id} app={group.app} items={group.items} embedded/>:null;
    return <div key={id} data-node-id={id} role={onSelect?'button':undefined} tabIndex={onSelect?0:undefined} aria-label={onSelect?'Select '+(n.label??n.component):undefined} onKeyDown={onSelect?e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();onSelect(id)}}:undefined} onClick={onSelect?e=>{e.preventDefault();e.stopPropagation();onSelect(id)}:undefined} style={{...(n.type==='section'?style(n):{}),outline:selectedId===id?'2px solid #d86f91':undefined}} className={n.type==='section'?'space-y-4':''}>{n.type==='block'&&<Block node={n} editing={!!onSelect}/>} {n.children.map(render)}</div>;
  };
  return <div ref={container} className={embedded?'space-y-8':'min-h-screen px-5 py-8'} style={{background:String(valid.theme?.background??'#fbf5ef'),color:String(valid.theme?.text??'#302927'),'--w-accent':String(valid.theme?.primary??'#d86f91'),'--w-surface':String(valid.theme?.surface??'#ffffff'),'--w-muted':String(valid.theme?.muted??'#81736d'),'--w-radius':String(valid.theme?.radius??24)+'px'} as CSSProperties}><div className="mx-auto max-w-2xl space-y-8">{valid.rootIds.map(render)}</div></div>;
}
