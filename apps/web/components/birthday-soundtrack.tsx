'use client';
import {useEffect,useRef,useState} from 'react';
import {usePathname} from 'next/navigation';
import {defaultAudioSettings,type SiteDocument} from '@wiffeyyyy/content';
import {playbackCoordinator} from '../../../packages/audio/src/controller';
import {BackgroundMusic,MUSIC_PREFERENCE_KEY,musicRouteAllowed,parseMusicPreference,type MusicStatus} from '../../../packages/audio/src/background-music';
import '../app/soundtrack.css';
export function BirthdaySoundtrack({settings}:{settings:SiteDocument}){
 const playlist=settings.audio??defaultAudioSettings,pathname=usePathname();
 const [id,setId]=useState(playlist.defaultTrack),[enabled,setEnabled]=useState(!settings.defaultMuted),[ready,setReady]=useState(false),[unlocked,setUnlocked]=useState(false),[visible,setVisible]=useState(true),[status,setStatus]=useState<MusicStatus>('waiting'),[volume,setVolume]=useState(settings.defaultVolume);
 const ref=useRef<HTMLAudioElement>(null),engine=useRef<BackgroundMusic|null>(null);
 const routeAllowed=musicRouteAllowed(pathname,playlist.background),track=playlist.tracks.find(t=>t.assetId===id)??playlist.tracks.find(t=>t.assetId===playlist.defaultTrack)??playlist.tracks[0];
 const context=useRef({enabled:false,unlocked:false,visible:true,routeAllowed});context.current={enabled:ready&&enabled,unlocked,visible,routeAllowed};
 useEffect(()=>{try{setEnabled(parseMusicPreference(localStorage.getItem(MUSIC_PREFERENCE_KEY),!settings.defaultMuted))}catch{setEnabled(!settings.defaultMuted)}setReady(true)},[settings.defaultMuted]);
 useEffect(()=>{setId(playlist.defaultTrack)},[playlist.defaultTrack]);
 useEffect(()=>{setVolume(settings.defaultVolume)},[settings.defaultVolume]);
 useEffect(()=>{const player=ref.current;if(!player)return;player.volume=volume;player.muted=false;const music=new BackgroundMusic(player,playbackCoordinator,setStatus);engine.current=music;music.update(context.current);return()=>{music.dispose();if(engine.current===music)engine.current=null}},[track?.assetId]);
 useEffect(()=>{engine.current?.update(context.current)},[ready,enabled,unlocked,visible,routeAllowed]);
 useEffect(()=>{if(ref.current){ref.current.volume=volume;ref.current.muted=false}},[volume,track?.assetId]);
 useEffect(()=>{
  if(!track)return;
  const unlock=()=>{context.current={...context.current,unlocked:true};setUnlocked(true);engine.current?.update(context.current)};
  const visibility=()=>{const visible=!document.hidden;context.current={...context.current,visible};setVisible(visible);engine.current?.update(context.current)};
  const bind=(doc:Document,iframe=false)=>{
   doc.addEventListener('pointerdown',unlock,true);doc.addEventListener('keydown',unlock,true);
   const players=new Set<HTMLMediaElement>();
   const play=(event:Event)=>{const player=event.target as HTMLMediaElement;if(!['AUDIO','VIDEO'].includes(player.tagName))return;players.add(player);playbackCoordinator.claim(player)};
   const pause=(event:Event)=>{const player=event.target as HTMLMediaElement;players.delete(player);playbackCoordinator.release(player)};
   if(iframe){doc.addEventListener('play',play,true);doc.addEventListener('pause',pause,true);doc.addEventListener('ended',pause,true)}
   return()=>{doc.removeEventListener('pointerdown',unlock,true);doc.removeEventListener('keydown',unlock,true);if(iframe){doc.removeEventListener('play',play,true);doc.removeEventListener('pause',pause,true);doc.removeEventListener('ended',pause,true);for(const player of players){player.pause();playbackCoordinator.release(player)}}};
  };
  const cleanup=bind(document),frames=new Map<HTMLIFrameElement,{load:()=>void;cleanup:()=>void}>();
  const scan=()=>{
   for(const [frame,entry] of frames)if(!frame.isConnected){frame.removeEventListener('load',entry.load);entry.cleanup();frames.delete(frame)}
   for(const frame of document.querySelectorAll('iframe'))if(!frames.has(frame)){
    const entry={load:()=>{},cleanup:()=>{}};entry.load=()=>{entry.cleanup();entry.cleanup=()=>{};try{if(frame.contentDocument)entry.cleanup=bind(frame.contentDocument,true)}catch{}};
    frames.set(frame,entry);frame.addEventListener('load',entry.load);entry.load();
   }
  };
  scan();const observer=new MutationObserver(scan);observer.observe(document.body,{subtree:true,childList:true});document.addEventListener('visibilitychange',visibility);visibility();
  const storage=(event:StorageEvent)=>{if(event.key===MUSIC_PREFERENCE_KEY)setEnabled(parseMusicPreference(event.newValue,!settings.defaultMuted))};window.addEventListener('storage',storage);
  return()=>{cleanup();observer.disconnect();document.removeEventListener('visibilitychange',visibility);window.removeEventListener('storage',storage);for(const [frame,entry] of frames){frame.removeEventListener('load',entry.load);entry.cleanup()}};
 },[Boolean(track),settings.defaultMuted]);
 const toggle=()=>{const next=!enabled;context.current={...context.current,enabled:next,unlocked:true};setEnabled(next);setUnlocked(true);engine.current?.update(context.current);try{localStorage.setItem(MUSIC_PREFERENCE_KEY,JSON.stringify({version:1,enabled:next}))}catch{}};
 const select=(next:string)=>{setId(next);setUnlocked(true)};
 const ended=()=>{engine.current?.paused();const index=playlist.tracks.findIndex(t=>t.assetId===track?.assetId);if(index+1<playlist.tracks.length||playlist.loop){if(playlist.tracks.length===1&&ref.current){ref.current.currentTime=0;engine.current?.reconcile()}else setId(playlist.tracks[(index+1)%playlist.tracks.length].assetId)}};
 if(!track)return null;
 return <aside className="birthday-music" aria-label="Site music"><button type="button" className="birthday-music-toggle" aria-label={enabled?'Turn music off':'Turn music on'} aria-pressed={enabled} onClick={toggle}><span aria-hidden="true">{enabled?'♫':'♪'}</span><span>Music {enabled?status==='playing'?'on':status==='paused'?'paused':'on':'off'}</span></button><details><summary aria-label="Music controls">⌃</summary><div className="birthday-music-controls"><label>Track<select aria-label="Music track" value={track.assetId} onChange={event=>select(event.target.value)}>{playlist.tracks.map((item,i)=><option key={item.assetId} value={item.assetId}>Track {i+1}</option>)}</select></label><label>Volume<input aria-label="Music volume" type="range" min={0} max={1} step={.05} value={volume} onChange={event=>setVolume(Number(event.target.value))}/></label><p role="status">{status==='off'?'Music is off.':status==='paused'?'Music pauses for this app or other audio.':status==='error'?'This song could not play. Try again or choose another track.':status==='finished'?'The playlist has finished.':status==='waiting'?'Music starts after your first tap.':'Playing your birthday soundtrack.'}</p>{(status==='error'||status==='finished')&&<button type="button" onClick={()=>{if(ref.current)ref.current.currentTime=0;engine.current?.retry()}}>Play again</button>}</div></details><audio key={track.assetId} ref={ref} data-birthday-soundtrack preload="none" src={'/media/'+track.assetId} onPlay={()=>engine.current?.played()} onPause={()=>engine.current?.paused()} onError={()=>engine.current?.error()} onEnded={ended}/></aside>;
}
