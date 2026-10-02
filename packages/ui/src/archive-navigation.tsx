"use client";
import {createContext,useContext,type ReactNode} from 'react';
export const ArchiveNavigationContext=createContext({backLabel:'‹ Memories Archive'});
export function ArchiveNavigationProvider({backLabel,children}:{backLabel:string;children:ReactNode}){return <ArchiveNavigationContext.Provider value={{backLabel}}>{children}</ArchiveNavigationContext.Provider>}
export const useArchiveNavigation=()=>useContext(ArchiveNavigationContext);
