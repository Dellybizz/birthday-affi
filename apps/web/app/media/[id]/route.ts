import {unstable_cache} from 'next/cache';
import { createClient,type SupabaseClient } from '@supabase/supabase-js';
export const dynamic='force-dynamic';
let sharedDb:SupabaseClient|null=null;
const publishedMedia=unstable_cache(async(slug:string,id:string)=>{const {data,error}=await sharedDb!.rpc('get_published_media',{site_slug:slug,asset_id:id});if(error)throw error;return data},['public-media-v1'],{revalidate:10,tags:['public-cms']});
const signedMedia=unstable_cache(async(kind:string,path:string)=>{const {data,error}=await sharedDb!.storage.from('wiffeyyyy-'+kind).createSignedUrl(path,300);if(error||!data)throw error??new Error('Missing media');return data.signedUrl},['public-media-signed-v1'],{revalidate:30,tags:['public-cms']});
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,slug=process.env.NEXT_PUBLIC_SITE_SLUG;if(!url||!key||!slug||!/^[0-9a-f-]{36}$/i.test(id))return new Response(null,{status:404});
 const db=sharedDb??=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});let m;try{m=await publishedMedia(slug,id)}catch{return new Response('Media unavailable',{status:503})}if(!m)return new Response(null,{status:404});
 const query=new URL(request.url).searchParams,download=query.get('download')==='1',poster=!download&&query.get('poster')==='1';
 if(poster&&(m.kind!=='video'||!m.posterReady))return new Response(null,{status:404});
 const available=(m.variants??[]).map(Number).filter((w:number)=>[480,960,1600].includes(w)).sort((a:number,b:number)=>a-b);
 const variant=download||poster?null:query.get('variant')||(query.get('thumbnail')==='1'&&m.kind==='image'&&available.length?String(available[0]):null);
 if(variant&&!(available.includes(Number(variant))&&['480','960','1600'].includes(variant)))return new Response(null,{status:404});
 const path=poster?m.path.replace(/original$/,'poster.webp'):variant?m.path.replace(/original$/,variant+'.webp'):m.path;
 let location:string;try{if(download){const {data,error}=await db.storage.from('wiffeyyyy-'+m.kind).createSignedUrl(path,60,{download:m.filename||'memory'});if(error||!data)throw error;location=data.signedUrl}else location=await signedMedia(m.kind,path)}catch{return new Response('Media unavailable',{status:503})}
 return new Response(null,{status:307,headers:{Location:location,'Cache-Control':download?'no-store':'private, max-age=10','Referrer-Policy':'no-referrer'}});
}
