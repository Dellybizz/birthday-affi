export type NavigationItem={id:string;parentId:string|null;pageId:string|null;label:string;icon:string;description:string;visible:boolean;startHere:boolean;placement?:'grid'|'dock'|'journey';runtimeSlug?:'camera'|'vault'|'pieces'};
export function parseNavigation(input:unknown):NavigationItem[]{
 if(!Array.isArray(input)||input.length>50)throw new Error('Use at most 50 navigation items');
 const ids=new Set<string>();
 for(const n of input){
  if(!n||typeof n!=='object'||Object.keys(n).filter(key=>!['placement','runtimeSlug'].includes(key)).sort().join(',')!=='description,icon,id,label,pageId,parentId,startHere,visible')throw new Error('Invalid navigation item');
  if(typeof n.id!=='string'||!/^[a-zA-Z0-9_-]{1,100}$/.test(n.id)||ids.has(n.id))throw new Error('Invalid or duplicate navigation ID');ids.add(n.id);
  if(n.parentId!==null&&typeof n.parentId!=='string'||n.pageId!==null&&(typeof n.pageId!=='string'||! /^[0-9a-f-]{36}$/i.test(n.pageId)))throw new Error('Invalid navigation reference');
  if(typeof n.label!=='string'||!n.label.trim()||n.label.length>120||typeof n.icon!=='string'||n.icon.length>24||typeof n.description!=='string'||n.description.length>300||typeof n.visible!=='boolean'||typeof n.startHere!=='boolean')throw new Error('Invalid navigation fields');
 }
 for(const n of input){if(n.placement!==undefined&&!['grid','dock','journey'].includes(n.placement))throw new Error('Invalid navigation placement');if(n.runtimeSlug!==undefined&&(!['camera','vault','pieces'].includes(n.runtimeSlug)||n.pageId!==null))throw new Error('Invalid runtime destination');}
 const map=new Map(input.map(n=>[n.id,n]));
 for(const n of input){let parent=n.parentId;const seen=new Set([n.id]);let depth=0;while(parent!==null){if(seen.has(parent)||!map.has(parent)||++depth>3)throw new Error('Missing parent, cycle or excessive menu depth');seen.add(parent);parent=map.get(parent).parentId;}}
 return structuredClone(input);
}
