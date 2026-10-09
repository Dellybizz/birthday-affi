// Recover interrupted streams without restarting the song or taking app audio.
export class MusicRecovery {
 private lastTime=-1;private lastProgress=0;private attempts=0;private cooldown=0;
 constructor(private player:{currentTime:number;paused:boolean;ended:boolean;readyState:number;error:{code:number}|null},private reload:(time:number)=>void,private resume:()=>void){}
 check(now:number,allowed:boolean){
  if(!allowed||this.player.ended){this.lastProgress=now;return}
  if(this.player.currentTime!==this.lastTime){this.lastTime=this.player.currentTime;this.lastProgress=now}
  if(now<this.cooldown)return;
  if(this.player.error||(this.player.currentTime>0&&this.player.readyState<3&&now-this.lastProgress>=10000)){
   if(this.attempts>=3||this.player.error?.code===4)return;
   this.attempts++;this.cooldown=now+10000;this.lastProgress=now;this.reload(Math.max(0,this.player.currentTime));return;
  }
  if(this.player.paused&&!this.player.error&&this.player.currentTime>0)this.resume();
 }
}
