export const LEVELS=[
 {title:'The little beginning',difficulty:'Easy',cols:3,rows:3,ratio:1599/899,photo:'/puzzles/level-one.jpg',note:'Nine pieces. One lovely beginning.'},
 {title:'A little closer',difficulty:'Moderate',cols:4,rows:4,ratio:780/1040,photo:'/puzzles/level-two.jpg',note:'Sixteen pieces, and a little more patience.'},
 {title:'Together, at last',difficulty:'Hard',cols:5,rows:4,ratio:2048/1152,photo:'/puzzles/our-moment.jpg',note:'Twenty pieces. Our final memory.'}
] as const;
export type LevelProgress={placed:number[];order:number[]};
export type PuzzleJourney={version:2;levels:LevelProgress[]};
export function shuffledPieces(count:number,random=Math.random){const a=Array.from({length:count},(_,i)=>i);for(let i=a.length-1;i>0;i--){const j=Math.min(i,Math.max(0,Math.floor(random()*(i+1))));[a[i],a[j]]=[a[j],a[i]]}return a}
export const pieceCount=(level:number)=>LEVELS[level].cols*LEVELS[level].rows;
export const freshLevel=(level:number):LevelProgress=>({placed:[],order:shuffledPieces(pieceCount(level))});
export const freshJourney=():PuzzleJourney=>({version:2,levels:LEVELS.map((_,i)=>freshLevel(i))});
export const levelSolved=(state:PuzzleJourney,level:number)=>state.levels[level].placed.length===pieceCount(level);
export const levelUnlocked=(state:PuzzleJourney,level:number)=>Number.isInteger(level)&&level>=0&&level<LEVELS.length&&state.levels.slice(0,level).every((_,i)=>levelSolved(state,i));
export const journeySolved=(state:PuzzleJourney)=>LEVELS.every((_,i)=>levelSolved(state,i));
export function placePiece(state:PuzzleJourney,level:number,piece:number,slot:number):PuzzleJourney{if(!levelUnlocked(state,level)||piece!==slot||!Number.isInteger(piece)||piece<0||piece>=pieceCount(level)||state.levels[level].placed.includes(piece))return state;return {...state,levels:state.levels.map((p,i)=>i===level?{...p,placed:[...p.placed,piece]}:p)}}
export function restartFrom(state:PuzzleJourney,level:number):PuzzleJourney{return levelUnlocked(state,level)?{...state,levels:state.levels.map((p,i)=>i>=level?freshLevel(i):p)}:state}
export function readJourney(raw:string|null):PuzzleJourney|null{try{const d=JSON.parse(raw??'null');if(d?.version!==2||!Array.isArray(d.levels)||d.levels.length!==LEVELS.length)return null;const levels:LevelProgress[]=[];for(let i=0;i<LEVELS.length;i++){const p=d.levels[i],count=pieceCount(i),valid=(x:unknown)=>Number.isInteger(x)&&Number(x)>=0&&Number(x)<count;if(!Array.isArray(p?.placed)||!Array.isArray(p?.order)||p.order.length!==count||new Set(p.order).size!==count||!p.order.every(valid))return null;const unlocked=levels.every((l,j)=>l.placed.length===pieceCount(j));levels.push({order:p.order,placed:unlocked?[...new Set<number>(p.placed.filter(valid))]:[]})}return {version:2,levels}}catch{return null}}
// Adjacent pieces share tab geometry; outer edges stay straight.
export function piecePath(id:number,cols:number,rows:number){const c=id%cols,r=Math.floor(id/cols);const top=r?'L35 0 C35 0 35 -17 50 -17 C65 -17 65 0 65 0 L100 0':'L100 0';const right=c<cols-1?'L100 35 C100 35 117 35 117 50 C117 65 100 65 100 65 L100 100':'L100 100';const bottom=r<rows-1?'L65 100 C65 100 65 83 50 83 C35 83 35 100 35 100 L0 100':'L0 100';const left=c?'L0 65 C0 65 17 65 17 50 C17 35 0 35 0 35 L0 0':'L0 0';return `M0 0 ${top} ${right} ${bottom} ${left} Z`}
