"use server";
import { parsePageDocument } from '@wiffeyyyy/content';
import { revalidatePath } from 'next/cache';
import { adminDb } from './supabase';
import { requireAdmin } from './auth';
export async function saveDraft(pageId:string,document:unknown,expectedRevision:number){
 try {
  await requireAdmin('site:write');const db=await adminDb();
  const {data,error}=await db.rpc('save_page_draft',{p_page_id:pageId,p_document:parsePageDocument(document),p_expected_revision:expectedRevision});
  if(error)return {ok:false as const,code:error.code==='40001'?'conflict' as const:'error' as const,message:error.code==='40001'?'This draft changed in another tab. Download your edits, then reload the latest draft.':'Unable to save draft. Please retry.'};
  return {ok:true as const,revision:Number(data.revision)};
 }catch{return {ok:false as const,code:'error' as const,message:'Unable to save. Check your session and document, then retry.'}};
}
export async function publishPage(pageId:string,expectedRevision:number){
 await requireAdmin('site:publish');const db=await adminDb();
 const {data:page,error:readError}=await db.from('pages').select('draft_document,settings').eq('id',pageId).single();
 if(readError)throw new Error('Unable to load draft');if(page.settings?.archived===true)throw new Error('Restore this archived draft before publishing.');parsePageDocument(page.draft_document);
 const {data,error}=await db.rpc('publish_page',{p_page_id:pageId,p_expected_revision:expectedRevision});
 if(error)throw new Error(error.code==='40001'?'Draft changed before publication. Reload the latest draft.':error.message);
 revalidatePath('/');return {ok:true,version:Number(data.versionNumber)};
}
export async function rollbackPage(pageId:string,versionId:string,expectedRevision:number){
 await requireAdmin('site:publish');const db=await adminDb();
 const {data:version,error:readError}=await db.from('page_versions').select('document').eq('id',versionId).eq('page_id',pageId).eq('status','published').single();
 if(readError)throw new Error('Published version not found');parsePageDocument(version.document);
 const {data,error}=await db.rpc('rollback_page',{p_page_id:pageId,p_version_id:versionId,p_expected_revision:expectedRevision});
 if(error)throw new Error(error.code==='40001'?'Draft changed before rollback. Reload the latest draft.':error.message);
 revalidatePath('/');return {ok:true,version:Number(data.versionNumber)};
}
export async function getVersionDocument(pageId:string,versionId:string){
 await requireAdmin();const db=await adminDb();
 const {data,error}=await db.from('page_versions').select('document').eq('id',versionId).eq('page_id',pageId).single();
 if(error)throw new Error('Version not found');return parsePageDocument(data.document);
}
export async function getVersionHistory(pageId:string){
 await requireAdmin();const db=await adminDb();
 const {data,error}=await db.from('page_versions').select('id,version_number,status,created_at').eq('page_id',pageId).order('version_number',{ascending:false}).limit(50);
 if(error)throw new Error('Unable to load versions');return data??[];
}
export async function saveSiteSettings(siteId:string,settings:Record<string,unknown>){await requireAdmin('site:settings');const db=await adminDb();const {error}=await db.from('site_settings').upsert({...settings,site_id:siteId,updated_at:new Date().toISOString()},{onConflict:'site_id'});if(error)throw new Error(error.message);return{ok:true};}
export async function saveAppItem(input:{siteId:string;appSlug:string;itemType:string;position:number;title?:string;body?:string;metadata?:Record<string,unknown>;enabled?:boolean}){await requireAdmin('site:write');const db=await adminDb();const row={site_id:input.siteId,app_slug:input.appSlug,item_type:input.itemType,position:input.position,title:input.title,body:input.body,metadata:input.metadata,enabled:input.enabled};const {error}=await db.from('app_content_items').upsert(row,{onConflict:'site_id,app_slug,item_type,position'});if(error)throw new Error(error.message);return{ok:true};}
