import type {MediaKind} from './media-policy';
export type MediaOrganizationFilters={collection?:string;tag?:string;favourites?:boolean;state?:'all'|'ready'|'pending';unused?:boolean;duplicates?:boolean};
export type MediaListOptions=MediaOrganizationFilters&{search?:string;kind?:MediaKind|'';offset?:number;sort?:'newest'|'oldest'|'name'|'largest'|'smallest'};
export type MediaCollection={id:string;name:string};
export const mediaUuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function normalizeMediaTags(input:string|string[]){
 const values=typeof input==='string'?input.split(','):input;if(!Array.isArray(values)||values.some(value=>typeof value!=='string'))throw new Error('Invalid tags');
 const tags=[...new Set(values.map(value=>value.trim().replace(/ +/g,' ').toLowerCase()).filter(Boolean))];
 if(tags.length>20||tags.some(tag=>tag.length>40||/[,\x00-\x1f\x7f]/.test(tag)))throw new Error('Use up to 20 tags, each up to 40 characters');return tags;
}
export function validateOrganizationFilters(options:MediaOrganizationFilters){
 if(options.collection&&options.collection!=='unfiled'&&!mediaUuid.test(options.collection)||options.tag!==undefined&&(typeof options.tag!=='string'||options.tag.length>40||/[,\x00-\x1f\x7f]/.test(options.tag))||options.state&&!['all','ready','pending'].includes(options.state)||[options.favourites,options.unused,options.duplicates].some(value=>value!==undefined&&typeof value!=='boolean'))throw new Error('Invalid organization filter');
}
export function collectionName(value:string){if(typeof value!=='string'||!value.trim()||value.trim().length>80||/[\x00-\x1f\x7f]/.test(value))throw new Error('Use a collection name between 1 and 80 characters');return value.trim()}
