'use client';
import {createContext,useCallback,useContext,useEffect,useRef,useState,type ReactNode} from 'react';
import {usePathname} from 'next/navigation';
import {NotificationShade} from '@wiffeyyyy/ui/notification-shade';
import {OsSettingsSurface} from '@wiffeyyyy/ui/os-settings-surface';
import {PublicPageShell} from '@wiffeyyyy/ui/public-page-shell';
import {defaultSiteDocument,resolveOsSettings,installPhoneHome,createDefaultPage,getExperience,getExperienceByLivePath,type PageDocument,type SiteDocument} from '@wiffeyyyy/content';
import {DocumentSettingsProvider} from '@wiffeyyyy/ui/page-layout';
import {AudioDefaultsProvider} from '@wiffeyyyy/ui/media-player';
import {PhoneAppTransition} from './phone-app-transition';
import {VISITOR_KEY,initialVisitorState,parseVisitorState,reduceVisitorState,type VisitorState,type VisitorAction} from '../lib/visitor-state';

const notifications=[
 {id:'welcome',title:'Your birthday home is ready',body:'Six little places to explore, all in one birthday world.',href:'/home'},
 {id:'hotline',title:'Start with the Birthday Hotline',body:'A little birthday message is waiting for you.',href:'/app/hotline'},
 {id:'explore',title:'Take your time',body:'You can come back to your favourite apps whenever you like.',href:'/home'}
];
const SettingsContext=createContext<SiteDocument>(defaultSiteDocument);
export const useSiteSettings=()=>useContext(SettingsContext);
const Context=createContext<{state:VisitorState;ready:boolean;dispatch:(action:VisitorAction)=>void}>({state:initialVisitorState(),ready:false,dispatch:()=>{}});
export const useBirthdayOS=()=>useContext(Context);

export function OSProvider({children,settings=defaultSiteDocument,homeDocument}:{children:ReactNode;settings?:SiteDocument;homeDocument?:PageDocument|null}){
 const [state,setState]=useState(initialVisitorState),[ready,setReady]=useState(false),[storageAvailable,setStorageAvailable]=useState(true);
 const os=resolveOsSettings(settings),[systemMotion,setSystemMotion]=useState(false);
 useEffect(()=>{const query=window.matchMedia('(prefers-reduced-motion: reduce)');const update=()=>setSystemMotion(query.matches);update();query.addEventListener('change',update);return()=>query.removeEventListener('change',update)},[]);
 const pathname=usePathname(),stateRef=useRef(state),readyRef=useRef(false);
 const currentExperience=getExperienceByLivePath(pathname);
 const phonePath=currentExperience?.surface==='phone';

 const dispatch=useCallback((action:VisitorAction)=>{if(!readyRef.current)return;const next=reduceVisitorState(stateRef.current,action);stateRef.current=next;setState(next);try{localStorage.setItem(VISITOR_KEY,JSON.stringify(next))}catch{setStorageAvailable(false)}},[]);
 useEffect(()=>{let restored=initialVisitorState();try{restored=parseVisitorState(localStorage.getItem(VISITOR_KEY))}catch{setStorageAvailable(false)}stateRef.current=restored;readyRef.current=true;setState(restored);setReady(true);const sync=(e:StorageEvent)=>{if(e.key===VISITOR_KEY){const next=parseVisitorState(e.newValue);stateRef.current=next;setState(next)}};window.addEventListener('storage',sync);return()=>window.removeEventListener('storage',sync)},[]);
 useEffect(()=>{if(!ready)return;const slug=pathname.startsWith('/app/')?pathname.split('/')[2]:null;if(slug)dispatch({type:'visit',slug});else if(pathname==='/home')dispatch({type:'enter'})},[pathname,ready,dispatch]);

 const home=homeDocument??installPhoneHome(createDefaultPage('home'));
 const inbox=home.nodes.find(n=>n.visible&&n.props.phonePart==='notifications');
 const shadeNotifications=(inbox?.children??[]).map(id=>home.nodes.find(n=>n.id===id)!).filter(n=>n?.visible).map(n=>{
  const destination=getExperience(String(n.props.pageSlug??''))?.livePath??'/home';
  return {id:n.id,title:String(n.props.title??''),body:String(n.props.body??''),icon:String(n.props.icon??'♡'),href:destination};
 });
 const app=currentExperience&&currentExperience.surface==='phone'&&currentExperience.slug!=='home'?currentExperience:null;
 const unread=notifications.filter(n=>!state.readNotifications.includes(n.id)).length;
 return <DocumentSettingsProvider value={settings}><SettingsContext.Provider value={settings}><AudioDefaultsProvider value={{volume:settings.defaultVolume,muted:settings.defaultMuted}}><Context.Provider value={{state,ready,dispatch}}>{phonePath?<OsSettingsSurface settings={settings} reducedMotion={state.reducedMotion||systemMotion}><PhoneAppTransition pathname={pathname} reducedMotion={state.reducedMotion||systemMotion||os.reducedMotion||!os.motionEnabled||os.appAnimation==='none'} duration={os.appDuration} animationKind={os.appAnimation}><NotificationShade title={String(inbox?.props.title??'Notifications')} emptyMessage={String(inbox?.props.emptyMessage??'All caught up. ♡')} background={inbox?.props.background?String(inbox.props.background):undefined} notifications={shadeNotifications} app={pathname!=='/home'} enabled={os.notificationsEnabled} duration={os.shadeDuration} swipeThreshold={os.swipeThreshold} siteTitle={settings.siteTitle} reducedMotion={state.reducedMotion||systemMotion||os.reducedMotion||!os.motionEnabled}><a className="os-skip" href="#birthday-content">Skip to content</a><div id="birthday-content" tabIndex={-1}>{children}</div></NotificationShade></PhoneAppTransition></OsSettingsSurface>:<PublicPageShell settings={settings} notifications={shadeNotifications} notificationTitle={String(inbox?.props.title??'Notifications')} notificationEmptyMessage={String(inbox?.props.emptyMessage??'All caught up. ♡')} notificationBackground={inbox?.props.background?String(inbox.props.background):undefined} reducedMotion={state.reducedMotion||systemMotion} unreadCount={unread} app={app?{icon:app.icon??'♡',title:app.title}:null}>{children}</PublicPageShell>}</Context.Provider></AudioDefaultsProvider></SettingsContext.Provider></DocumentSettingsProvider>;
}
