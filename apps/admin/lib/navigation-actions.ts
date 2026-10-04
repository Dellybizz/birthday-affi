"use server";
import {parseNavigation} from '@wiffeyyyy/content';
import {requireAdmin} from './auth';
import {adminDb} from './supabase';
import {revalidatePath} from 'next/cache';
export async function saveNavigation(siteId:string,document:unknown,revision:number,publish:boolean){
 await requireAdmin('site:settings');const db=await adminDb();
 const {data,error}=await db.rpc('change_navigation',{p_site:siteId,p_document:publish?null:parseNavigation(document),p_revision:revision,p_publish:publish});
 if(error)throw new Error(error.code==='40001'?'Navigation changed. Reload before saving.':'Check navigation destinations and hierarchy, then retry.');revalidatePath('/navigation');return Number(data);
}
