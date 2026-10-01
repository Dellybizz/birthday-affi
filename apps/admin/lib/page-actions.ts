"use server";
import {appendTemplate, emptyPage, parsePageDocument} from '@wiffeyyyy/content';
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
  let document=emptyPage();const sourceId=String(form.get('sourceId')??'');
  if(sourceId){
   const {data:source,error}=await db.from('pages').select('draft_document').eq('id',sourceId).eq('site_id',site.id).single();
   if(error)return {error:'Source page unavailable.'};
   document=parsePageDocument(source.draft_document);
  }else{
   const template=String(form.get('template')??'blank');
   if(template!=='blank')document=appendTemplate(document,template,randomUUID);
  }
  const {error}=await db.from('pages').insert({site_id:site.id,title,slug,draft_document:document});
  if(error)return {error:error.code==='23505'?'That slug already exists.':'Unable to create page. Check your session and try again.'};
 }catch{return {error:'Unable to create page. Check your permissions and try again.'};}
 revalidatePath('/');redirect('/editor/'+slug);
}
