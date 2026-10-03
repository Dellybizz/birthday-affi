"use server";

import {revalidatePath} from 'next/cache';
import {adminDb} from './supabase';
import {requireAdmin} from './auth';

const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export type ReleaseActionState={status:'idle'|'success'|'error';message:string;releaseNumber?:number;cacheInvalidated?:boolean};
export const initialReleaseActionState:ReleaseActionState={status:'idle',message:''};

function cleanNote(value:FormDataEntryValue|null){return String(value??'').trim().slice(0,500)}
async function invalidatePublicCms(){
 const base=(process.env.NEXT_PUBLIC_WEB_URL??'').trim().replace(/\/+$/,'');
 const secret=process.env.CMS_REVALIDATE_SECRET??'';
 if(!base||!secret)return false;
 try{const response=await fetch(base+'/api/revalidate',{method:'POST',headers:{Authorization:`Bearer ${secret}`},cache:'no-store'});return response.ok}catch{return false}
}
function refreshAdmin(){for(const path of ['/','/releases','/pages','/navigation','/settings'])revalidatePath(path)}

export async function publishSiteRelease(_previous:ReleaseActionState,form:FormData):Promise<ReleaseActionState>{
 try{
  await requireAdmin('site:publish');
  const siteId=String(form.get('siteId')??'');if(!uuid.test(siteId))return {status:'error',message:'Site is unavailable. Reload and retry.'};
  const db=await adminDb();const {data,error}=await db.rpc('publish_site_release',{p_site:siteId,p_note:cleanNote(form.get('note'))});
  if(error){const message=error.code==='42501'?'Only the owner can publish a whole-site release.':error.message.includes('empty page')?error.message:error.message.includes('Invalid')?'A draft failed publication validation. Review the affected workspace and retry.':'Unable to publish the site release. Nothing was partially published.';return {status:'error',message}}
  refreshAdmin();const cacheInvalidated=await invalidatePublicCms();const releaseNumber=Number(data.releaseNumber);
  return {status:'success',releaseNumber,cacheInvalidated,message:cacheInvalidated?`Release #${releaseNumber} is live and the public cache was refreshed.`:`Release #${releaseNumber} is live. Public cache refresh is not configured, so visitors may see the previous version for up to 10 seconds.`};
 }catch{return {status:'error',message:'Unable to publish the site release. Check your session and retry.'}}
}

export async function rollbackSiteRelease(_previous:ReleaseActionState,form:FormData):Promise<ReleaseActionState>{
 try{
  await requireAdmin('site:publish');
  const siteId=String(form.get('siteId')??''),releaseId=String(form.get('releaseId')??'');if(!uuid.test(siteId)||!uuid.test(releaseId))return {status:'error',message:'Release is unavailable. Reload and retry.'};
  const db=await adminDb();const {data,error}=await db.rpc('rollback_site_release',{p_site:siteId,p_release:releaseId,p_note:cleanNote(form.get('note'))});
  if(error)return {status:'error',message:error.code==='42501'?'Only the owner can roll back a release.':error.message.includes('unavailable')?error.message:'Unable to roll back this release. No partial rollback was committed.'};
  refreshAdmin();const cacheInvalidated=await invalidatePublicCms();const releaseNumber=Number(data.releaseNumber);
  return {status:'success',releaseNumber,cacheInvalidated,message:cacheInvalidated?`Rollback completed as new release #${releaseNumber} and the public cache was refreshed.`:`Rollback completed as new release #${releaseNumber}. Public cache refresh is not configured, so visitors may see the previous version for up to 10 seconds.`};
 }catch{return {status:'error',message:'Unable to roll back this release. Check your session and retry.'}}
}

export async function listSiteReleases(siteId:string){
 await requireAdmin('site:read');if(!uuid.test(siteId))throw new Error('Invalid site');const db=await adminDb();
 const {data,error}=await db.from('site_releases').select('id,release_number,configuration_version_id,navigation_version_id,note,created_at,created_by').eq('site_id',siteId).order('release_number',{ascending:false}).limit(50);
 if(error)throw new Error('Unable to load release history.');return data??[];
}
