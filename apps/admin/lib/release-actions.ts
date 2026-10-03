'use server';
import {adminDb} from './supabase';
import {requireAdmin} from './auth';

const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// F0 only snapshots the current published pointers. It does not publish or roll back content.
export async function captureCurrentRelease(siteId:string,note=''){
 await requireAdmin('site:publish');
 if(!uuid.test(siteId))throw new Error('Invalid site');
 const clean=note.trim();if(clean.length>500)throw new Error('Release note must be 500 characters or less.');
 const db=await adminDb();
 const {data,error}=await db.rpc('capture_site_release',{p_site:siteId,p_note:clean});
 if(error)throw new Error('Unable to capture the current published release.');
 return {id:String(data)};
}

export async function listSiteReleases(siteId:string){
 await requireAdmin('site:read');
 if(!uuid.test(siteId))throw new Error('Invalid site');
 const db=await adminDb();
 const {data,error}=await db.from('site_releases').select('id,release_number,configuration_version_id,navigation_version_id,note,created_at,created_by').eq('site_id',siteId).order('release_number',{ascending:false}).limit(50);
 if(error)throw new Error('Unable to load release history.');
 return data??[];
}
