export function applyCallControls(tracks:Array<{enabled:boolean}>,audio:{muted:boolean}|null,muted:boolean,held:boolean){
 for(const track of tracks)track.enabled=!muted&&!held;
 if(audio)audio.muted=held;
}
export function formatCallTime(seconds:number){const value=Math.max(0,Math.floor(seconds));return `${Math.floor(value/60)}:${String(value%60).padStart(2,'0')}`}
