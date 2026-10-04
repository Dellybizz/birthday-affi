import { adminDb } from '../../../lib/supabase';
import { requireAdmin } from '../../../lib/auth';
import { mediaBucket } from '../../../lib/media-policy';
export const dynamic='force-dynamic';
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){
 await requireAdmin();const {id}=await params;if(!/^[0-9a-f-]{36}$/i.test(id))return new Response(null,{status:404});const db=await adminDb();const {data:m,error}=await db.from('media_assets').select('storage_path,kind,metadata,status,sites!inner(slug)').eq('id',id).eq('status','ready').eq('sites.slug',process.env.NEXT_PUBLIC_SITE_SLUG??'wiffeyyyy-os').maybeSingle();if(error||!m)return new Response(null,{status:404});
 const variant=new URL(request.url).searchParams.get('variant');if(variant&&!((m.metadata?.variants??[]).includes(Number(variant))&&['480','960','1600'].includes(variant)))return new Response(null,{status:404});const path=variant?m.storage_path.replace(/original$/,variant+'.webp'):m.storage_path;
 const {data,error:storageError}=await db.storage.from(mediaBucket(m.kind)).createSignedUrl(path,60);if(storageError)return new Response('Media unavailable',{status:503,headers:{'Cache-Control':'private, no-store'}});return new Response(null,{status:307,headers:{Location:data.signedUrl,'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer'}});
}
