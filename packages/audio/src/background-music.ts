import {PlaybackCoordinator,type Player} from './controller';
export type MusicPlayer=Player&{play():Promise<void>;paused:boolean;ended:boolean};
export type MusicContext={enabled:boolean;unlocked:boolean;visible:boolean;routeAllowed:boolean};
export type MusicStatus='off'|'waiting'|'paused'|'playing'|'error'|'finished';
export const MUSIC_PREFERENCE_KEY='wiffeyyyy:background-music:v1';
export function parseMusicPreference(raw:string|null,defaultEnabled:boolean){
 try{const value=JSON.parse(raw??'null');if(value?.version===1&&typeof value.enabled==='boolean')return value.enabled}catch{}
 return defaultEnabled;
}
export function musicRouteAllowed(path:string|null,background:'continue'|'home-only'){
 path=path??'/home';
 if(background==='home-only'&&path!=='/home')return false;
 return !['/app/movie','/app/hotline','/app/adventure','/app/camera','/app/radio','/hotline/receive'].some(route=>path===route||path.startsWith(route+'/'));
}
// The soundtrack never steals playback from an app. An enabled visitor preference
// survives automatic pauses; returning to a quiet page resumes the same track.
export class BackgroundMusic {
 private context:MusicContext={enabled:false,unlocked:false,visible:true,routeAllowed:true};
 private failed=false;private disposed=false;private pending=false;private generation=0;private unsubscribe:()=>void;
 constructor(private player:MusicPlayer,private coordinator:PlaybackCoordinator,private changed:(status:MusicStatus)=>void){this.unsubscribe=coordinator.subscribe(()=>this.reconcile())}
 private allowed(){return !this.disposed&&!this.failed&&this.context.enabled&&this.context.unlocked&&this.context.visible&&this.context.routeAllowed&&!this.player.ended&&(!this.coordinator.current()||this.coordinator.current()===this.player)}
 status():MusicStatus{
  if(!this.context.enabled)return 'off';if(this.failed)return 'error';if(!this.context.unlocked)return 'waiting';
  if(!this.context.visible||!this.context.routeAllowed||this.coordinator.current()&&this.coordinator.current()!==this.player)return 'paused';
  if(this.player.ended)return 'finished';return this.player.paused?'waiting':'playing';
 }
 update(context:MusicContext){this.context={...context};this.reconcile()}
 reconcile(){
  if(this.disposed)return;
  if(!this.allowed()){
   this.generation++;this.pending=false;if(!this.player.paused)this.player.pause();this.coordinator.release(this.player);this.changed(this.status());return;
  }
  this.changed(this.status());if(!this.player.paused||this.pending)return;
  const generation=++this.generation;this.pending=true;
  this.player.play().then(()=>{if(this.disposed)return;if(generation!==this.generation){if(!this.allowed()){this.player.pause();this.coordinator.release(this.player)}return}this.pending=false;if(!this.allowed()){this.player.pause();this.coordinator.release(this.player)}else this.coordinator.claim(this.player);this.changed(this.status())}).catch(error=>{if(this.disposed||generation!==this.generation)return;this.pending=false;this.failed=error?.name!=='NotAllowedError'&&error?.name!=='AbortError';this.changed(this.status())});
 }
 played(){if(!this.allowed()){this.player.pause();return}this.coordinator.claim(this.player);this.changed(this.status())}
 paused(){this.coordinator.release(this.player);if(!this.disposed)this.changed(this.status())}
 error(){this.failed=true;this.reconcile()}
 retry(){this.failed=false;this.reconcile()}
 dispose(){this.disposed=true;this.generation++;this.unsubscribe();this.player.pause();this.coordinator.release(this.player)}
}
