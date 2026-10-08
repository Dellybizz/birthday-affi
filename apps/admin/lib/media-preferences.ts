import type {MediaKind} from './media-policy';
export function readMediaPreferences(raw:string|null,kind?:MediaKind){
 const defaults={search:'',filter:kind??'' as MediaKind|'',archived:false,sort:'newest' as 'newest'|'oldest'|'name'|'largest'|'smallest',view:'list' as 'list'|'grid'};
 try{const value=JSON.parse(raw??'null');if(!value||typeof value!=='object')return defaults;
 return {...defaults,search:typeof value.search==='string'?value.search.slice(0,200):'',filter:kind??(['','image','video','audio'].includes(value.filter)?value.filter:defaults.filter),archived:value.archived===true,sort:['newest','oldest','name','largest','smallest'].includes(value.sort)?value.sort:defaults.sort,view:['list','grid'].includes(value.view)?value.view:defaults.view};
 }catch{return defaults}
}
