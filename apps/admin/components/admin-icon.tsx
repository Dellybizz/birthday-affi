import type {ReactNode} from 'react';
export type AdminIconName='dashboard'|'pages'|'navigation'|'media'|'settings'|'hotline'|'editor'|'external'|'menu'|'close'|'logout'|'publish'|'back'|'sections'|'apps'|'inspect'|'desktop'|'tablet'|'mobile'|'undo'|'redo'|'more'|'search'|'chevron'|'right'|'block'|'eye'|'hidden';
export function AdminIcon({name,className='h-5 w-5'}:{name:AdminIconName;className?:string}){
 const common={className,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.8,strokeLinecap:'round' as const,strokeLinejoin:'round' as const,'aria-hidden':true};
 const paths:Partial<Record<AdminIconName,ReactNode>>={
 publish:<><path d="M12 16V3m-5 5 5-5 5 5M4 15v6h16v-6"/></>,
 back:<path d="m10 5-7 7 7 7M3 12h18"/>,
 sections:<><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 9h18M9 9v12"/></>,
 apps:<><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><path d="M14 17h7m-3.5-3.5v7"/></>,
 inspect:<><path d="m4 3 6 17 3-7 7-3Z"/><path d="m13 13 6 6"/></>,
 desktop:<><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8m-4-4v4"/></>,
 tablet:<><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M11 18h2"/></>,
 mobile:<><rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/></>,
 undo:<><path d="m8 4-5 5 5 5M3 9h11a6 6 0 0 1 0 12"/></>,
 redo:<><path d="m16 4 5 5-5 5M21 9H10a6 6 0 0 0 0 12"/></>,
 more:<><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>,
 search:<><circle cx="10" cy="10" r="7"/><path d="m15 15 6 6"/></>,
 chevron:<path d="m6 9 6 6 6-6"/>,
 right:<path d="m9 6 6 6-6 6"/>,
 block:<path d="m12 3 9 9-9 9-9-9Z"/>,
 eye:<><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></>,
 hidden:<><path d="m3 3 18 18M9 5a12 12 0 0 1 3 0c6 0 10 7 10 7a20 20 0 0 1-3 4M6 6a20 20 0 0 0-4 6s4 7 10 7a12 12 0 0 0 5-1"/></>
 };
 if(paths[name])return <svg {...common}>{paths[name]}</svg>;
 if(name==='dashboard')return <svg {...common}><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></svg>;
 if(name==='pages')return <svg {...common}><path d="M7 3h8l4 4v14H7z"/><path d="M15 3v5h5M10 12h6M10 16h6"/></svg>;
 if(name==='navigation')return <svg {...common}><path d="M5 4v16M5 8h8a3 3 0 0 0 3-3V4M5 16h8a3 3 0 0 1 3 3v1"/><circle cx="5" cy="8" r="1.5"/><circle cx="5" cy="16" r="1.5"/></svg>;
 if(name==='media')return <svg {...common}><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="m5 18 5-5 3 3 2-2 4 4"/></svg>;
 if(name==='settings')return <svg {...common}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.8 1.8 0 0 0 .36 1.98l.05.05-2.78 2.78-.05-.05A1.8 1.8 0 0 0 15 19.4a1.8 1.8 0 0 0-1.1 1.64V21h-3.8v-.07A1.8 1.8 0 0 0 9 19.4a1.8 1.8 0 0 0-1.98.36l-.05.05-2.78-2.78.05-.05A1.8 1.8 0 0 0 4.6 15a1.8 1.8 0 0 0-1.64-1.1H3v-3.8h.07A1.8 1.8 0 0 0 4.6 9a1.8 1.8 0 0 0-.36-1.98l-.05-.05 2.78-2.78.05.05A1.8 1.8 0 0 0 9 4.6a1.8 1.8 0 0 0 1.1-1.64V3h3.8v.07A1.8 1.8 0 0 0 15 4.6a1.8 1.8 0 0 0 1.98-.36l.05-.05 2.78 2.78-.05.05A1.8 1.8 0 0 0 19.4 9a1.8 1.8 0 0 0 1.64 1.1H21v3.8h-.07A1.8 1.8 0 0 0 19.4 15Z"/></svg>;
 if(name==='hotline')return <svg {...common}><path d="M6.6 3.8 9 3l2 5-2.2 1.2a15 15 0 0 0 6 6L16 13l5 2-1 2.4a3 3 0 0 1-3.2 1.8C10.4 18.3 5.7 13.6 4.8 7.2A3 3 0 0 1 6.6 3.8Z"/></svg>;
 if(name==='editor')return <svg {...common}><path d="M4 20h4l11-11-4-4L4 16zM13.5 6.5l4 4M4 20l1-4"/></svg>;
 if(name==='external')return <svg {...common}><path d="M14 4h6v6M20 4l-9 9"/><path d="M19 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h6"/></svg>;
 if(name==='menu')return <svg {...common}><path d="M4 7h16M4 12h16M4 17h16"/></svg>;
 if(name==='close')return <svg {...common}><path d="m6 6 12 12M18 6 6 18"/></svg>;
 return <svg {...common}><path d="M10 5H5v14h5M14 8l4 4-4 4M18 12H9"/></svg>;
}

