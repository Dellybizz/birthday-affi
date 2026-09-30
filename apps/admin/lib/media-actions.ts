"use server";
import { adminDb } from './supabase';
import { requireAdmin } from './auth';
export async function registerMedia(input:{siteId:string;kind:'image'|'video'|'audio';storagePath:string;filename:string;mimeType?:string;width?:number;height?:number;durationMs?:number;altText?:string}){await requireAdmin('media:write');const db=await adminDb();const {data,error}=await db.from('media_assets').insert({site_id:input.siteId,kind:input.kind,storage_path:input.storagePath,filename:input.filename,mime_type:input.mimeType,width:input.width,height:input.height,duration_ms:input.durationMs,alt_text:input.altText}).select().single();if(error)throw new Error(error.message);return data;}
export async function deleteMedia(mediaId:string){await requireAdmin('media:write');const db=await adminDb();const {error}=await db.from('media_assets').delete().eq('id',mediaId);if(error)throw new Error(error.message);return{ok:true};}
