import type {PageDocument} from './cms';
export type LayoutProgress={version:1;selections:Record<string,string>;bag:string[];receipt:string[];favorites:string[]};
export const emptyLayoutProgress=():LayoutProgress=>({version:1,selections:{},bag:[],receipt:[],favorites:[]});
export function parseLayoutProgress(raw:string|null,document:PageDocument):LayoutProgress{
 try{if(!raw||raw.length>100000)return emptyLayoutProgress();const value=JSON.parse(raw);if(value?.version!==1)return emptyLayoutProgress();const ids=new Set<string>(),byId=new Map(document.nodes.map(n=>[n.id,n]));const visit=(id:string)=>{const node=byId.get(id);if(!node?.visible)return;ids.add(id);node.children.forEach(visit)};document.rootIds.forEach(visit);
 const list=(key:string,component:string)=>Array.isArray(value[key])?[...new Set(value[key].filter((id:unknown)=>typeof id==='string'&&ids.has(id)&&byId.get(id)?.component===component))].slice(0,500) as string[]:[];
 const selections:Record<string,string>={};if(value.selections&&typeof value.selections==='object'&&!Array.isArray(value.selections))for(const [group,id] of Object.entries(value.selections))if(typeof id==='string'&&ids.has(id)&&(ids.has(group)||['movie','station','track'].includes(group)))selections[group]=id;
 return {version:1,selections,bag:list('bag','kiss-gift').filter(id=>![false,'false'].includes(byId.get(id)!.props.available as never)),receipt:list('receipt','kiss-gift'),favorites:list('favorites','reason')};
 }catch{return emptyLayoutProgress()}
}
