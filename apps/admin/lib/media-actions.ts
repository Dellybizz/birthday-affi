"use server";
import { adminDb } from './supabase';
export async function registerMedia(input:{siteId:string;kind:'image'|'video'|'audio';storagePath:string;filename:string;mimeType?:string;width?:number;height?:number;durationMs?:number;altText?:string}){const db=adminDb();const {data,error}=await db.from('media_assets').insert(input).select().single();if(error)throw new Error(error.message);return data;}
export async function deleteMedia(mediaId:string){const db=adminDb();const {error}=await db.from('media_assets').delete().eq('id',mediaId);if(error)throw new Error(error.message);return{ok:true};}
