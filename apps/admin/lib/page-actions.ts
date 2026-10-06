"use server";
import {appendTemplate, emptyPage, parsePageDocument, parsePageSettings, protectedPageSlugs} from '@wiffeyyyy/content';
import {randomUUID} from 'node:crypto';
import {redirect} from 'next/navigation';
import {revalidatePath} from 'next/cache';
import {requireAdmin} from './auth';
import {adminDb} from './supabase';
export async function createPage(_state:{error:string},form:FormData):Promise<{error:string}>{
 let slug='';
 try{
  await requireAdmin('site:write');
  const title=String(form.get('title')??'').trim();slug=String(form.get('slug')??'').trim();
  if(!title||title.length>120)return {error:'Enter a title of 1–120 characters.'};
  if(!/^[a-z][a-z0-9-]{0,63}$/.test(slug))return {error:'Use a lowercase slug starting with a letter (maximum 64 characters).'};
  const db=await adminDb();
  const {data:site,error:siteError}=await db.from('sites').select('id').eq('slug',process.env.NEXT_PUBLIC_SITE_SLUG??'wiffeyyyy-os').single();
  if(siteError)throw new Error('Site unavailable');
  let document=emptyPage();let settings:Record<string,unknown>={};const sourceId=String(form.get('sourceId')??'');
  if(sourceId){
   const {data:source,error}=await db.from('pages').select('draft_document,settings').eq('id',sourceId).eq('site_id',site.id).single();
   if(error)return {error:'Source page unavailable.'};
   document=parsePageDocument(source.draft_document);settings={...source.settings,archived:false};
  }else{
   const template=String(form.get('template')??'blank');
   if(template!=='blank')document=appendTemplate(document,template,randomUUID);
  }
  const {error}=await db.from('pages').insert({site_id:site.id,title,slug,draft_document:document,settings});
  if(error)return {error:error.code==='23505'?'That slug already exists.':'Unable to create page. Check your session and try again.'};
 }catch{return {error:'Unable to create page. Check your permissions and try again.'};}
 revalidatePath('/');revalidatePath('/pages');revalidatePath('/editor','layout');redirect('/editor/'+slug);
}
export async function updatePageSettings(pageId:string,input:{title:string;slug:string;description:string;seoTitle?:string;seoDescription?:string;socialImage?:string;noIndex?:boolean},archived:boolean,expectedUpdatedAt?:string){
 await requireAdmin('site:write');const values=parsePageSettings(input);const db=await adminDb();
 const {data:site,error:siteError}=await db.from('sites').select('id').eq('slug',process.env.NEXT_PUBLIC_SITE_SLUG??'wiffeyyyy-os').single();if(siteError)throw new Error('Site unavailable');
 const {data:page,error:readError}=await db.from('pages').select('slug,settings,published_version_id,updated_at').eq('id',pageId).eq('site_id',site.id).single();if(readError)throw new Error('Page unavailable');
 if(expectedUpdatedAt&&page.updated_at!==expectedUpdatedAt)throw new Error('Page changed elsewhere. Refresh before saving to keep the newer changes.');
 if(protectedPageSlugs.includes(page.slug)&&(values.slug!==page.slug||archived))throw new Error('Built-in routes cannot be renamed or archived.');
 if(page.published_version_id&&(values.slug!==page.slug||archived))await requireAdmin('site:publish');
 const {data,error}=await db.from('pages').update({title:values.title,slug:values.slug,settings:{...page.settings,description:values.description,...('seoTitle' in values?{seoTitle:values.seoTitle}:{}),...('seoDescription' in values?{seoDescription:values.seoDescription}:{}),...('socialImage' in values?{socialImage:values.socialImage}:{}),...('noIndex' in values?{noIndex:values.noIndex}:{}),archived}}).eq('id',pageId).eq('site_id',site.id).eq('updated_at',page.updated_at).select('id,title,slug,settings,published_version_id,updated_at,draft_revision');
 if(error)throw new Error(error.code==='23505'?'That slug already exists.':'Unable to save page settings. Check owner permissions, navigation references and reserved redirect slugs.');
 if(!data?.length)throw new Error('Page changed elsewhere. Reload before saving.');
 revalidatePath('/');revalidatePath('/pages');revalidatePath('/editor','layout');return {ok:true,page:data[0]};
}
