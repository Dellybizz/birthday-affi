"use client";
import {createContext,useContext,type ReactNode,type CSSProperties} from 'react';
import type {NavigationItem} from '@wiffeyyyy/content';
export type PublicNavigationItem=NavigationItem&{href:string|null};
const NavigationContext=createContext<PublicNavigationItem[]|null>(null);
export const SiteNavigationProvider=NavigationContext.Provider;
export const useSiteNavigation=()=>useContext(NavigationContext);
export function HomeNavigation({items,editing=false,style}:{items:PublicNavigationItem[];editing?:boolean;style?:CSSProperties}){
 const render=(parent:string|null):ReactNode=>items.filter(n=>n.parentId===parent&&n.visible).map(n=><div key={n.id} className="os-app-card rounded-2xl border p-4"><span className="os-app-icon" aria-hidden="true">{n.icon}</span>{n.startHere&&<span className="os-start">Start here</span>}{n.href?<a href={editing?undefined:n.href} tabIndex={editing?-1:undefined}><h2>{n.label}</h2></a>:<h2>{n.label}</h2>}<p>{n.description}</p>{items.some(x=>x.parentId===n.id&&x.visible)&&<details><summary>Open {n.label} menu</summary><div className="grid gap-3">{render(n.id)}</div></details>}</div>);
 return <section style={style} className="os-app-grid grid grid-cols-2 gap-3" aria-label="Home apps and menus">{render(null)}</section>;
}
