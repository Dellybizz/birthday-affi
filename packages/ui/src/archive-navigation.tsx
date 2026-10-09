"use client";
import {createContext,useContext,type ReactNode} from 'react';
export const ArchiveNavigationContext=createContext({backLabel:'‹ In My Heart',backHref:'/pages/in-my-heart',nextHref:'/final-reel',nextLabel:'Final Reel'});
export function ArchiveNavigationProvider({backLabel,backHref='/pages/in-my-heart',nextHref='/final-reel',nextLabel='Final Reel',children}:{nextHref?:string;nextLabel?:string;backLabel:string;backHref?:string;children:ReactNode}){return <ArchiveNavigationContext.Provider value={{backLabel,backHref,nextHref,nextLabel}}>{children}</ArchiveNavigationContext.Provider>}
export const useArchiveNavigation=()=>useContext(ArchiveNavigationContext);
