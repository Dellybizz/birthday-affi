'use client';
import {createContext,useContext,useLayoutEffect,useState,type Dispatch,type ReactNode,type SetStateAction} from 'react';
import type {PageDocument} from '@wiffeyyyy/content';
import type {EditorPageItem} from '../../lib/editor-pages';
import Editor from './[slug]/editor-client';

type EditorBootstrap={siteId:string;siteSlug:string;pages:EditorPageItem[];publicSiteUrl:string;canWrite:boolean;canPublish:boolean};
export type EditorRoutePage={pageId:string;currentSlug:string;initialDocument:PageDocument;initialRevision:number};
const PageContext=createContext<Dispatch<SetStateAction<EditorRoutePage|null>>|null>(null);

export function EditorWorkspace({bootstrap,children}:{bootstrap:EditorBootstrap;children:ReactNode}){
 const [page,setPage]=useState<EditorRoutePage|null>(null);
 return <PageContext.Provider value={setPage}>
  {page?<Editor pageId={page.pageId} siteId={bootstrap.siteId} siteSlug={bootstrap.siteSlug} currentSlug={page.currentSlug} pages={bootstrap.pages} publicSiteUrl={bootstrap.publicSiteUrl} initialRevision={page.initialRevision} initialDocument={page.initialDocument} canWrite={bootstrap.canWrite} canPublish={bootstrap.canPublish}/>:<main className="grid h-screen place-items-center bg-[#f6f6f7] text-sm text-[#6d7175]">Loading editor…</main>}
  {children}
 </PageContext.Provider>;
}

export function EditorRoutePayload({page}:{page:EditorRoutePage}){
 const setPage=useContext(PageContext);
 if(!setPage)throw new Error('Editor route payload must be inside the editor workspace.');
 useLayoutEffect(()=>{setPage(current=>current?.pageId===page.pageId&&current.initialRevision===page.initialRevision&&current.initialDocument===page.initialDocument?current:page)},[page,setPage]);
 return null;
}
