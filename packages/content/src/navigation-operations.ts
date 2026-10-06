import {parseNavigation,type NavigationItem} from './navigation';
export function navigationDescendants(items:NavigationItem[],id:string):Set<string>{const found=new Set<string>();const visit=(parent:string)=>{for(const item of items)if(item.parentId===parent&&!found.has(item.id)){found.add(item.id);visit(item.id)}};visit(id);return found;}
export function moveNavigationItem(items:NavigationItem[],id:string,parentId:string|null,beforeId:string|null=null){
 const moving=items.find(item=>item.id===id);if(!moving)throw new Error('Navigation item not found.');
 const descendants=navigationDescendants(items,id);
 if(parentId===id||parentId&&descendants.has(parentId))throw new Error('A menu cannot be moved inside itself or its children.');
 if(parentId&&!items.some(item=>item.id===parentId))throw new Error('Destination menu not found.');
 if(beforeId===id)return items;
 const before=beforeId?items.find(item=>item.id===beforeId):undefined;
 if(beforeId&&(!before||before.parentId!==parentId||descendants.has(beforeId)))throw new Error('Invalid insertion position.');
 const rest=items.filter(item=>item.id!==id);const index=beforeId?rest.findIndex(item=>item.id===beforeId):rest.length;
 rest.splice(index,0,{...moving,parentId});return parseNavigation(rest);
}
export function removeNavigationItem(items:NavigationItem[],id:string){const item=items.find(item=>item.id===id);if(!item)return items;return parseNavigation(items.filter(n=>n.id!==id).map(n=>n.parentId===id?{...n,parentId:item.parentId}:n));}
export function navigationVisible(items:NavigationItem[],item:NavigationItem){const byId=new Map(items.map(n=>[n.id,n]));const seen=new Set<string>();let current:NavigationItem|undefined=item;while(current){if(!current.visible||seen.has(current.id))return false;seen.add(current.id);if(current.parentId===null)return true;current=byId.get(current.parentId)}return false;}
export function navigationPlacement(items:NavigationItem[],item:NavigationItem):'grid'|'dock'|'journey'{const map=new Map(items.map(n=>[n.id,n]));let root=item;const seen=new Set<string>();while(root.parentId&&map.has(root.parentId)&&!seen.has(root.id)){seen.add(root.id);root=map.get(root.parentId)!}return root.placement??'grid';}
export function upgradeNavigation(items:NavigationItem[]):NavigationItem[]{
 if(items.some(item=>item.placement!==undefined||item.runtimeSlug!==undefined))return items;
 const next:NavigationItem[]=items.map(item=>({...item,placement:'grid' as const}));
 const add=(id:string,label:string,pageId:string|null,runtimeSlug:NavigationItem['runtimeSlug'],placement:'grid'|'dock',icon:string)=>{if(next.length>=50)return;let unique=id;while(next.some(n=>n.id===unique))unique+='-copy';next.push({id:unique,parentId:null,pageId,label,icon,description:'',visible:true,startHere:false,placement,...(runtimeSlug?{runtimeSlug}:{})})};
 for(const [slug,label,icon] of [['camera','Clicksara','📷'],['vault','Vault','🔐'],['pieces','Pieces of Us','🧩']] as const){add('runtime-'+slug,label,null,slug,'grid',icon);if(slug==='camera')add('dock-camera',label,null,slug,'dock',icon)}
 for(const slug of ['hotline','adventure']){const original=items.find(n=>n.id===slug);if(original)add('dock-'+slug,original.label,original.pageId,undefined,'dock',original.icon)}
 return parseNavigation(next);
}
export function orderedNavigation<T extends NavigationItem>(items:T[]):T[]{const result:T[]=[],seen=new Set<string>();const visit=(parent:string|null)=>{for(const item of items)if(item.parentId===parent&&!seen.has(item.id)){seen.add(item.id);result.push(item);visit(item.id)}};visit(null);return result;}
