export type EditorPageGroup='active'|'drafts'|'legacy'|'runtime';
export type EditorPageStatus='published'|'fallback'|'draft'|'legacy'|'archived'|'runtime'|'missing';
export type EditorDbPage={id:string;title:string;slug:string;settings?:{archived?:boolean;description?:string}|null;published_version_id?:string|null};
export type EditorPageItem={
 id:string|null;
 slug:string;
 title:string;
 sourceTitle?:string;
 editorHref:string|null;
 draftPreviewHref:string|null;
 livePath:string|null;
 group:EditorPageGroup;
 status:EditorPageStatus;
 badge:string;
 note:string;
 editorEnabled:boolean;
 published:boolean;
};

type ActiveMeta={title:string;livePath:string;order:number};
const activePages:Record<string,ActiveMeta>={
 'memories-archive':{title:'Memories Archive',livePath:'/',order:0},
 'in-my-heart':{title:'In My Heart',livePath:'/pages/in-my-heart',order:1},
 home:{title:'iPhone Home',livePath:'/home',order:2},
 reasons:{title:'Adore',livePath:'/app/reasons',order:3},
 hotline:{title:'Hotdial',livePath:'/app/hotline',order:4},
 adventure:{title:'Pardanasheen',livePath:'/app/adventure',order:5},
 movie:{title:'Saragram',livePath:'/app/movie',order:6},
 'kiss-shop':{title:'Kiss Shop',livePath:'/app/kiss-shop',order:7}
};
const legacySlugs=new Set(['welcome','radio']);
const runtimePages=[
 {slug:'camera',title:'Clicksara',livePath:'/app/camera'},
 {slug:'vault',title:'Vault',livePath:'/app/vault'},
 {slug:'pieces',title:'Pieces of Us',livePath:'/app/pieces'}
];

export function normalizePublicSiteUrl(value:string|undefined|null){return (value??'').trim().replace(/\/+$/,'')}
export function buildPublicHref(base:string,path:string|null){const normalized=normalizePublicSiteUrl(base);return normalized&&path?normalized+(path.startsWith('/')?path:'/'+path):null}

function fromRow(page:EditorDbPage):EditorPageItem{
 const archived=page.settings?.archived===true;
 const active=activePages[page.slug];
 const published=Boolean(page.published_version_id);
 const sourceTitle=active&&page.title!==active.title?page.title:undefined;
 if(archived)return {id:page.id,slug:page.slug,title:active?.title??page.title,sourceTitle,editorHref:null,draftPreviewHref:'/preview/'+page.id,livePath:null,group:'legacy',status:'archived',badge:'Archived',note:'Archived page · restore it in Page settings before editing.',editorEnabled:false,published};
 if(legacySlugs.has(page.slug))return {id:page.id,slug:page.slug,title:page.title,editorHref:'/editor/'+page.slug,draftPreviewHref:'/preview/'+page.id,livePath:null,group:'legacy',status:'legacy',badge:'Legacy saved page',note:'Saved for preservation; not part of the active birthday journey.',editorEnabled:true,published};
 if(active){
  const status:EditorPageStatus=published?'published':'fallback';
  return {id:page.id,slug:page.slug,title:active.title,sourceTitle,editorHref:'/editor/'+page.slug,draftPreviewHref:'/preview/'+page.id,livePath:active.livePath,group:'active',status,badge:published?'Published':'Live fallback · draft unpublished',note:published?'Published version is live.':'Public route currently uses its code fallback until this draft is published.',editorEnabled:true,published};
 }
 return {id:page.id,slug:page.slug,title:page.title,editorHref:'/editor/'+page.slug,draftPreviewHref:'/preview/'+page.id,livePath:published?'/pages/'+page.slug:null,group:'drafts',status:published?'published':'draft',badge:published?'Published custom page':'Draft only',note:published?'Custom page has a published version.':'Saved custom draft; no live version is exposed.',editorEnabled:true,published};
}

export function buildEditorPageCatalog(rows:EditorDbPage[]):EditorPageItem[]{
 const mapped=rows.map(fromRow);
 const known=new Set(rows.map(page=>page.slug));
 for(const [slug,meta] of Object.entries(activePages))if(!known.has(slug))mapped.push({id:null,slug,title:meta.title,editorHref:null,draftPreviewHref:null,livePath:meta.livePath,group:'active',status:'missing',badge:'Page record missing',note:'The public route exists but there is no editable page record.',editorEnabled:false,published:false});
 for(const runtime of runtimePages)mapped.push({id:null,slug:runtime.slug,title:runtime.title,editorHref:null,draftPreviewHref:null,livePath:runtime.livePath,group:'runtime',status:'runtime',badge:'Runtime · editor in E5',note:'The live app works independently; its CMS authoring adapter is scheduled for E5.',editorEnabled:false,published:false});
 const groupOrder:Record<EditorPageGroup,number>={active:0,drafts:1,legacy:2,runtime:3};
 return mapped.sort((a,b)=>{
  const group=groupOrder[a.group]-groupOrder[b.group];if(group)return group;
  if(a.group==='active'&&b.group==='active')return (activePages[a.slug]?.order??99)-(activePages[b.slug]?.order??99);
  return a.title.localeCompare(b.title);
 });
}
