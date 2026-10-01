"use client";
import { parsePageDocument, type CMSNode, type PageDocument } from '@wiffeyyyy/content';
import type { CSSProperties, ReactNode } from 'react';
const apps=[['💗','Reasons I’m Obsessed','reasons'],['☎️','Birthday Hotline','hotline'],['🧭','Our Next Adventure','adventure'],['🎬','Our Birthday Movie','movie'],['💋','The Kiss Shop','kiss-shop'],['📻','Birthday Radio','radio']];
function style(node:CMSNode):CSSProperties {
  const p=node.props;
  return {background:p.background as string|undefined,color:p.color as string|undefined,padding:p.padding as number|undefined,margin:p.margin as number|undefined,borderRadius:p.radius as number|undefined,opacity:p.opacity as number|undefined,fontSize:p.size as number|undefined,fontWeight:p.weight as number|undefined,textAlign:p.align as CSSProperties['textAlign']};
}
function Block({node}:{node:CMSNode}) {
  const p=node.props;
  switch(node.component) {
    case 'heading': return <h1 style={style(node)} className="text-3xl font-semibold">{p.text??''}</h1>;
    case 'text': return <p style={style(node)} className="leading-7 text-[var(--w-muted)]">{p.text??''}</p>;
    case 'app-grid': return <div style={{...style(node),display:'grid',gridTemplateColumns:`repeat(${p.columns??2},minmax(0,1fr))`,gap:Number(p.gap??12)}}>{apps.map(([icon,title,slug])=><a key={slug} href={'/app/'+slug} className="rounded-3xl border bg-white p-5"><span className="text-2xl">{icon}</span><h2 className="mt-3 font-semibold">{title}</h2></a>)}</div>;
    case 'image': return p.src?<img src={String(p.src)} alt={String(p.alt??'')} loading="lazy" style={style(node)} className="w-full rounded-3xl object-cover"/>:null;
    default:return null;
  }
}
export function CMSRenderer({document,onSelect,selectedId,embedded=false}:{document:PageDocument;onSelect?:(id:string)=>void;selectedId?:string;embedded?:boolean}) {
  const valid=parsePageDocument(document);
  const byId=new Map(valid.nodes.map(n=>[n.id,n]));
  const render=(id:string):ReactNode=>{
    const n=byId.get(id)!;
    if(!n.visible)return null;
    return <div key={id} data-node-id={id} onClick={onSelect?e=>{e.preventDefault();e.stopPropagation();onSelect(id)}:undefined} style={{...(n.type==='section'?style(n):{}),outline:selectedId===id?'2px solid #d86f91':undefined}} className={n.type==='section'?'space-y-4':''}>{n.type==='block'&&<Block node={n}/>} {n.children.map(render)}</div>;
  };
  return <div className={embedded?'space-y-8':'min-h-screen px-5 py-8'} style={{background:String(valid.theme?.background??'#fbf5ef'),color:String(valid.theme?.text??'#302927')}}><div className="mx-auto max-w-2xl space-y-8">{valid.rootIds.map(render)}</div></div>;
}
