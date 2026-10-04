'use server';
import {isRuntimeAppConfigSlug,parseRuntimeAppConfig} from '@wiffeyyyy/content';
import {revalidatePath} from 'next/cache';
import {requireAdmin} from './auth';
import {adminDb} from './supabase';

export async function changeRuntimeAppConfiguration(siteId:string,slug:string,document:unknown,revision:number,publish:boolean){
 await requireAdmin('site:settings');
 if(!isRuntimeAppConfigSlug(slug))throw new Error('Unknown runtime app.');
 const db=await adminDb(),parsed=publish?null:parseRuntimeAppConfig(slug,document);
 const {data,error}=await db.rpc('change_runtime_app_configuration',{p_site:siteId,p_app_slug:slug,p_document:parsed,p_revision:revision,p_publish:publish});
 if(error)throw new Error(error.code==='40001'?'Runtime app settings changed elsewhere. Reload before saving.':'Unable to save or publish runtime app settings.');
 revalidatePath('/runtime/'+slug);revalidatePath('/app/'+slug);
 return Number(data?.revision??revision);
}
