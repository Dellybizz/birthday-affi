import type {EditorPageItem} from './editor-pages';

export type PreviewNavigationResult=
 |{kind:'same-page';href:string}
 |{kind:'editor-page';href:string;page:EditorPageItem}
 |{kind:'external';href:string}
 |{kind:'blocked';href:string;message:string};

function pathname(value:string){
 const raw=value.trim();
 if(!raw||raw.startsWith('#'))return null;
 if(/^(mailto:|tel:|sms:)/i.test(raw))return {external:true,href:raw,path:''};
 try{
  if(/^https?:\/\//i.test(raw))return {external:true,href:raw,path:new URL(raw).pathname};
  const url=new URL(raw,'https://editor.invalid');
  return {external:false,href:raw,path:url.pathname.replace(/\/+$/,'')||'/'};
 }catch{return null}
}

function candidateSlug(path:string){
 if(path==='/')return 'memories-archive';
 if(path==='/home')return 'home';
 const app=path.match(/^\/app\/([^/]+)$/);if(app)return decodeURIComponent(app[1]);
 const page=path.match(/^\/pages\/([^/]+)$/);if(page)return decodeURIComponent(page[1]);
 return null;
}

export function resolvePreviewNavigation(href:string,pages:EditorPageItem[],currentSlug:string):PreviewNavigationResult{
 const parsed=pathname(href);
 if(!parsed)return {kind:'same-page',href};
 if(parsed.external)return {kind:'external',href:parsed.href};
 const page=pages.find(item=>item.livePath===parsed.path)||pages.find(item=>item.slug===candidateSlug(parsed.path));
 if(!page)return {kind:'blocked',href,message:'This preview destination is not an editable page in this site.'};
 if(page.slug===currentSlug)return {kind:'same-page',href};
 if(page.editorEnabled&&page.editorHref)return {kind:'editor-page',href:page.editorHref,page};
 return {kind:'blocked',href,message:page.status==='runtime'?'This app is runtime-only in the editor until E5. Open View live to use it.':page.note||'This destination cannot be edited yet.'};
}
