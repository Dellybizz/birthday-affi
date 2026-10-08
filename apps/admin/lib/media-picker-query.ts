import type {MediaKind} from './media-policy';
export function parsePickerQuery(params:URLSearchParams){
 const siteId=params.get('siteId')??'',kind=params.get('kind')??'',search=(params.get('search')??'').trim(),offset=Number(params.get('offset')??'0'),id=params.get('id')??'';
 const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
 if(!uuid.test(siteId)||!['image','video','audio'].includes(kind)||search.length>200||!Number.isSafeInteger(offset)||offset<0||offset>100000||id&&!uuid.test(id))throw new Error('Invalid media filter');
 return {siteId,kind:kind as MediaKind,search,offset,id};
}
export function pickerPage<T>(rows:T[]){return {assets:rows.slice(0,50),hasMore:rows.length>50}}
