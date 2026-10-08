import {NextResponse} from 'next/server';
import {getAdmin} from '../../../lib/auth';
import {adminDb} from '../../../lib/supabase';
import {can} from '../../../lib/permissions';
import {parsePickerQuery,pickerPage} from '../../../lib/media-picker-query';
export const dynamic='force-dynamic';
const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'private, no-store'}});
export async function GET(request:Request){
 let options;try{options=parsePickerQuery(new URL(request.url).searchParams)}catch{return reply({error:'Invalid media filter'},400)}
 try{
  const admin=await getAdmin();if(!admin)return reply({error:'Your session expired. Sign in again to choose media.'},401);if(!can(admin.role,'site:read'))return reply({error:'Media access is unavailable for your role.'},403);
  const db=await adminDb(),{data:site,error:siteError}=await db.from('sites').select('id').eq('id',options.siteId).eq('slug',process.env.NEXT_PUBLIC_SITE_SLUG??'wiffeyyyy-os').single();if(siteError||!site)return reply({error:'Site not found'},404);
  let query=db.from('media_assets').select('id,site_id,kind,filename,mime_type,byte_size,width,height,duration_ms,alt_text,caption,transcript,captions,metadata,status,poster_ready,created_at').eq('site_id',options.siteId).eq('kind',options.kind).is('archived_at',null).order('created_at',{ascending:false}).order('id',{ascending:false}).range(options.offset,options.offset+50);
  if(options.id)query=query.eq('id',options.id);
  else if(options.search)query=query.ilike('filename','%'+options.search.replace(/[\\%_]/g,char=>'\\'+char)+'%');
  const {data,error}=await query;if(error)return reply({error:'Unable to load media. Press Retry.'},500);
  return reply(pickerPage((data??[]).map(asset=>({...asset,previewUrl:'/media/'+asset.id}))));
 }catch{return reply({error:'Unable to load media. Refresh the editor and try again.'},500)}
}
