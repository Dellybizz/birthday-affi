import 'server-only';
import { adminDb } from './supabase';
import { requireAdmin } from './auth';
export async function getPageDraft(pageId:string){await requireAdmin();const db=await adminDb();const {data,error}=await db.from('pages').select('id,site_id,slug,title,settings,draft_document,published_version_id,updated_at').eq('id',pageId).single();if(error)throw new Error(error.message);return data;}
export async function listPageVersions(pageId:string){await requireAdmin();const db=await adminDb();const {data,error}=await db.from('page_versions').select('id,version_number,status,created_at,created_by').eq('page_id',pageId).order('version_number',{ascending:false});if(error)throw new Error(error.message);return data??[];}
export async function listMedia(siteId:string){await requireAdmin();const db=await adminDb();const {data,error}=await db.from('media_assets').select('*').eq('site_id',siteId).order('created_at',{ascending:false});if(error)throw new Error(error.message);return data??[];}
export async function listAppItems(siteId:string,appSlug:string){await requireAdmin();const db=await adminDb();const {data,error}=await db.from('app_content_items').select('*').eq('site_id',siteId).eq('app_slug',appSlug).order('position');if(error)throw new Error(error.message);return data??[];}
