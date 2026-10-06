import {getExperience, safeMediaUrl} from '@wiffeyyyy/content';
import {documentsEqual} from './control-panel';
export type ManagedPage={id:string;title:string;slug:string;settings:{description?:string;archived?:boolean;seoTitle?:string;seoDescription?:string;socialImage?:string;noIndex?:boolean};published_version_id:string|null;updated_at:string;draft_revision:number;status:'published'|'changed'|'draft'|'error';thumbnail:string|null};
export type PageTab='all'|'active'|'draft'|'archived';
export function pageMetadata(title:string,settings:ManagedPage['settings']){
 return {title,description:settings.description??'',...(settings.seoTitle?{seoTitle:settings.seoTitle}:{}),...(settings.seoDescription?{seoDescription:settings.seoDescription}:{}),...(settings.socialImage?{socialImage:settings.socialImage}:{}),...(settings.noIndex?{noIndex:true}:{})};
}
export function catalogPage(row:{id:string;title:string;slug:string;settings?:ManagedPage['settings']|null;published_version_id:string|null;updated_at:string;draft_revision:number;draft_document:unknown},version?:{document:unknown;metadata:unknown}):ManagedPage{
 const settings=row.settings??{};
 const status=!row.published_version_id?'draft':!version?'error':documentsEqual(row.draft_document,version.document)&&documentsEqual(pageMetadata(row.title,settings),version.metadata)?'published':'changed';
 const doc=row.draft_document as {nodes?:{component?:string;props?:{src?:unknown}}[]}|null;
 const src=doc?.nodes?.filter(node=>node.component==='image'||node.component==='gallery-item').map(node=>node.props?.src).find(value=>typeof value==='string'&&value&&safeMediaUrl(value));
 return {id:row.id,title:row.title,slug:row.slug,settings,published_version_id:row.published_version_id,updated_at:row.updated_at,draft_revision:row.draft_revision,status,thumbnail:typeof src==='string'?src:null};
}
export function filterPages(pages:ManagedPage[],query:string,tab:PageTab){
 const needle=query.trim().toLowerCase();
 return pages.filter(page=>{const archived=page.settings.archived===true;const matches=tab==='all'||tab==='archived'?tab==='all'||archived:!archived&&(tab==='active'||page.status==='draft'||page.status==='changed');return matches&&(!needle||[page.title,page.slug,page.settings.description,getExperience(page.slug)?.title].some(value=>value?.toLowerCase().includes(needle)))});
}
