export type AudioTrack={assetId:string;title:string;transcript:string};
export type AudioSettings={tracks:AudioTrack[];defaultTrack:string|null;loop:boolean;background:'continue'|'home-only';interruption:'pause'};
export const defaultAudioSettings:AudioSettings={tracks:[],defaultTrack:null,loop:false,background:'continue',interruption:'pause'};
export function parseAudioSettings(input:unknown):AudioSettings{
 if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('Invalid audio settings');const v=input as Record<string,unknown>;
 if(Object.keys(v).sort().join(',')!=='background,defaultTrack,interruption,loop,tracks'||typeof v.loop!=='boolean'||!['continue','home-only'].includes(String(v.background))||v.interruption!=='pause'||!Array.isArray(v.tracks)||v.tracks.length>50)throw new Error('Invalid audio settings');
 const ids=new Set<string>();for(const track of v.tracks){if(!track||typeof track!=='object'||Object.keys(track).sort().join(',')!=='assetId,title,transcript'||typeof track.assetId!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(track.assetId)||ids.has(track.assetId)||typeof track.title!=='string'||!track.title.trim()||track.title.length>120||typeof track.transcript!=='string'||track.transcript.length>20000)throw new Error('Invalid soundtrack track');ids.add(track.assetId)}
 if(v.defaultTrack!==null&&(typeof v.defaultTrack!=='string'||!ids.has(v.defaultTrack)))throw new Error('Default track must be in the soundtrack');if(v.tracks.length&&!v.defaultTrack)throw new Error('Choose a default track');return structuredClone(v) as AudioSettings;
}
