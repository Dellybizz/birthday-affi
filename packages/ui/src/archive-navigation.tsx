"use client";
import {createContext,useContext,type ReactNode} from 'react';
export const ArchiveNavigationContext=createContext({backLabel:'‹ In My Heart',backHref:'/pages/in-my-heart'});
export function ArchiveNavigationProvider({backLabel,backHref='/pages/in-my-heart',children}:{backLabel:string;backHref?:string;children:ReactNode}){return <ArchiveNavigationContext.Provider value={{backLabel,backHref}}>{children}</ArchiveNavigationContext.Provider>}
export const useArchiveNavigation=()=>useContext(ArchiveNavigationContext);
