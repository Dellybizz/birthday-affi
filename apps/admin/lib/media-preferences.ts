import {mediaUuid} from './media-organization';
import type {MediaKind} from './media-policy';
export function readMediaPreferences(raw:string|null,kind?:MediaKind,readyOnly=false){
 const defaults={collection:'',tag:'',favourites:false,state:'all' as 'all'|'ready'|'pending',unused:false,duplicates:false,search:'',filter:kind??'' as MediaKind|'',archived:false,sort:'newest' as 'newest'|'oldest'|'name'|'largest'|'smallest',view:'list' as 'list'|'grid'};
 try{const value=JSON.parse(raw??'null');if(!value||typeof value!=='object')return defaults;
 return {...defaults,collection:typeof value.collection==='string'&&(value.collection===''||value.collection==='unfiled'||mediaUuid.test(value.collection))?value.collection:'',tag:typeof value.tag==='string'&&value.tag.length<=40&&!/[,\x00-\x1f\x7f]/.test(value.tag)?value.tag:'',favourites:value.favourites===true,state:['all','ready','pending'].includes(value.state)&&!(readyOnly&&value.state==='pending')?value.state:defaults.state,unused:value.unused===true,duplicates:value.duplicates===true,search:typeof value.search==='string'?value.search.slice(0,200):'',filter:kind??(['','image','video','audio'].includes(value.filter)?value.filter:defaults.filter),archived:value.archived===true,sort:['newest','oldest','name','largest','smallest'].includes(value.sort)?value.sort:defaults.sort,view:['list','grid'].includes(value.view)?value.view:defaults.view};
 }catch{return defaults}
}
