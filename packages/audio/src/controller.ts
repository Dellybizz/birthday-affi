export type Player = { pause(): void };
// One coordinator per browser module, shared by generic blocks and all six apps.
export class PlaybackCoordinator {
  private active: Player | null = null;
  private listeners = new Set<()=>void>();
  current() {return this.active;}
  subscribe(listener:()=>void) {this.listeners.add(listener);return()=>{this.listeners.delete(listener)};}
  private notify() {for(const listener of this.listeners)listener();}
  claim(player: Player) {
    if(this.active===player)return;
    const previous=this.active;this.active=player;previous?.pause();this.notify();
  }
  pauseActive() {const player=this.active;this.active=null;player?.pause();this.notify();}
  release(player: Player) {if(this.active===player){this.active=null;this.notify();}}
}
export const playbackCoordinator = new PlaybackCoordinator();
export type PlaybackState = { version: 1; time: number; volume: number; muted: boolean };
export function parsePlayback(raw: string | null): PlaybackState {
  const fallback: PlaybackState = { version: 1, time: 0, volume: 1, muted: false };
  try {
    if (!raw || raw.length > 500) return fallback;
    const v = JSON.parse(raw);
    if (v?.version !== 1) return fallback;
    return { version: 1, time: Number.isFinite(v.time) && v.time >= 0 && v.time <= 604800 ? v.time : 0,
      volume: Number.isFinite(v.volume) && v.volume >= 0 && v.volume <= 1 ? v.volume : 1, muted: v.muted === true };
  } catch { return fallback; }
}
export function resumeTime(time: number, duration: number) {
  return Number.isFinite(duration) && duration > 0 && time < duration - 1 ? Math.max(0, time) : 0;
}
export type Caption = { start: number; end: number; text: string };
// Plain text cues: start seconds | end seconds | words. No HTML or remote track URLs.
export function parseCaptions(raw: string): Caption[] {
  if (!raw.trim()) return [];
  if (raw.length > 20000) throw new Error('Captions are too long');
  const lines = raw.split(/\r?\n/).filter(x => x.trim());
  if (lines.length > 200) throw new Error('Use at most 200 caption cues');
  let previous = -1;
  return lines.map(line => {
    const match = line.match(/^\s*(\d+(?:\.\d+)?)\s*\|\s*(\d+(?:\.\d+)?)\s*\|\s*(.+)$/);
    if (!match) throw new Error('Use start seconds | end seconds | caption text');
    const start = Number(match[1]), end = Number(match[2]), text = match[3].trim();
    if (start < previous || end <= start || end > 604800 || text.length > 500 || !text)
      throw new Error('Caption times must be ordered and end after start; text is limited to 500 characters');
    previous = start;
    return { start, end, text };
  });
}
