"use server";
import {parseSiteDocument} from '@wiffeyyyy/content';
import {adminDb} from './supabase';
import {requireAdmin} from './auth';
import {revalidatePath} from 'next/cache';
export async function changeConfiguration(siteId:string,document:unknown,revision:number,publish:boolean){
 await requireAdmin('site:settings');const db=await adminDb();
 const {data,error}=await db.rpc('change_site_configuration',{p_site:siteId,p_document:publish?null:parseSiteDocument(document),p_revision:revision,p_publish:publish});
 if(error)throw new Error(error.code==='40001'?'Settings changed elsewhere. Reload before saving.':'Unable to save or publish settings.');
 revalidatePath('/settings');return Number(data.revision);
}
