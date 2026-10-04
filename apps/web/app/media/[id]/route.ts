import { createClient } from '@supabase/supabase-js';
export const dynamic='force-dynamic';
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,slug=process.env.NEXT_PUBLIC_SITE_SLUG;if(!url||!key||!slug||!/^[0-9a-f-]{36}$/i.test(id))return new Response(null,{status:404});
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});const {data:m,error}=await db.rpc('get_published_media',{site_slug:slug,asset_id:id});if(error)return new Response('Media unavailable',{status:503});if(!m)return new Response(null,{status:404});
 const variant=new URL(request.url).searchParams.get('variant');if(variant&&!((m.variants??[]).includes(Number(variant))&&['480','960','1600'].includes(variant)))return new Response(null,{status:404});const path=variant?m.path.replace(/original$/,variant+'.webp'):m.path;
 const {data,error:storageError}=await db.storage.from('wiffeyyyy-'+m.kind).createSignedUrl(path,60);if(storageError)return new Response('Media unavailable',{status:503});return new Response(null,{status:307,headers:{Location:data.signedUrl,'Cache-Control':'no-store','Referrer-Policy':'no-referrer'}});
}
