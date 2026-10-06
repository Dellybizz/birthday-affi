'use client';
import {useEffect,useState,type CSSProperties,type ReactNode} from 'react';
import {resolveOsSettings,type SiteDocument} from '@wiffeyyyy/content';
import {NotificationShade,useNotificationShade,type PhoneNotification} from './notification-shade';

export type PublicShellApp={icon:string;title:string}|null;

function PublicChrome({settings,date,unreadCount,app,children}:{settings:SiteDocument;date:string;unreadCount:number;app:PublicShellApp;children:ReactNode}){
 const showNotifications=useNotificationShade();
 return <>
  <a className="os-skip" href="#birthday-content">Skip to content</a>
  <header className="os-topbar"><div className="os-topbar-inner"><a href="/home" className="os-brand" aria-label={settings.siteTitle+' home'}><span aria-hidden="true">♡</span> {settings.siteTitle}</a><div className="os-status"><span>{date}</span><button className="os-icon-button" aria-label={'Notifications'+(unreadCount?', '+unreadCount+' unread':'')} onClick={()=>showNotifications?.()}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" style={{margin:'auto'}}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M9 20a3 3 0 0 0 6 0"/></svg>{unreadCount>0&&<span className="os-badge">{unreadCount}</span>}</button></div></div></header>
  {app&&<nav className="os-app-nav" aria-label="App navigation"><a href="/home" className="os-back">← Home</a><h1 style={{margin:0,fontSize:'inherit'}}>{app.icon} {app.title}</h1></nav>}
  <div id="birthday-content" tabIndex={-1}>{children}</div>
  <footer className="os-footer"><span>A little world, just for you.</span><a href="/">Welcome screen</a></footer>
 </>;
}

export function PublicPageShell({settings,notifications,notificationTitle='Notifications',notificationEmptyMessage='All caught up. ♡',notificationBackground,reducedMotion=false,unreadCount=notifications.length,app=null,children}:{settings:SiteDocument;notifications:PhoneNotification[];notificationTitle?:string;notificationEmptyMessage?:string;notificationBackground?:string;reducedMotion?:boolean;unreadCount?:number;app?:PublicShellApp;children:ReactNode}){
 const os=resolveOsSettings(settings);
 const [date,setDate]=useState('Birthday edition');
 useEffect(()=>{setDate(new Intl.DateTimeFormat('en',{month:'short',day:'numeric',timeZone:settings.timezone}).format(new Date()))},[settings.timezone]);
 return <div style={{'--phone-scale':1,'--phone-fit-top':'23px',background:settings.background,color:settings.text,'--w-accent':settings.accent,'--w-surface':settings.surface,'--w-text':settings.text,'--w-radius':settings.radius+'px'} as CSSProperties} className="birthday-os" data-reduced-motion={reducedMotion||os.reducedMotion||!os.motionEnabled?'true':undefined}>
  <NotificationShade title={notificationTitle} emptyMessage={notificationEmptyMessage} background={notificationBackground} notifications={notifications} enabled={os.notificationsEnabled} duration={os.shadeDuration} swipeThreshold={os.swipeThreshold} siteTitle={settings.siteTitle} reducedMotion={reducedMotion||os.reducedMotion||!os.motionEnabled}>
   <PublicChrome settings={settings} date={date} unreadCount={unreadCount} app={app}>{children}</PublicChrome>
  </NotificationShade>
 </div>;
}
