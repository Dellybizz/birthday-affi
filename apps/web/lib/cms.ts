import 'server-only';
import { unstable_cache } from 'next/cache';
import { parsePageDocument, defaultSiteDocument, parseSiteDocument } from '@wiffeyyyy/content';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const PUBLIC_REVALIDATE_SECONDS=10;
let sharedPublicDb:SupabaseClient|null|undefined;
function getPublicDb(){
 if(sharedPublicDb!==undefined)return sharedPublicDb;
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 sharedPublicDb=url&&key?createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}}):null;
 return sharedPublicDb;
}

async function readPublishedDocument(slug:string){
 const db=getPublicDb(),siteSlug=process.env.NEXT_PUBLIC_SITE_SLUG;
 if(!db||!siteSlug)return null;
 const {data,error}=await db.rpc('get_published_document',{site_slug:siteSlug,page_slug:slug});
 if(error)throw new Error('Unable to load published content.');
 return data==null?null:parsePageDocument(data);
}
export const getPublishedDocument=unstable_cache(readPublishedDocument,['public-published-document-v2'],{revalidate:PUBLIC_REVALIDATE_SECONDS,tags:['public-cms']});

async function readPublishedSiteConfiguration(){
 const db=getPublicDb(),slug=process.env.NEXT_PUBLIC_SITE_SLUG;
 if(!db||!slug)return defaultSiteDocument;
 const {data,error}=await db.rpc('get_published_site_configuration',{p_slug:slug});
 if(error)throw new Error('Unable to load published settings');
 return data?parseSiteDocument(data):defaultSiteDocument;
}
export const getPublishedSiteConfiguration=unstable_cache(readPublishedSiteConfiguration,['public-site-configuration-v2'],{revalidate:PUBLIC_REVALIDATE_SECONDS,tags:['public-cms']});

async function publicRpc(name:string,args:Record<string,string>){
 const db=getPublicDb();if(!db)return null;
 const {data,error}=await db.rpc(name,args);if(error)throw new Error('Public content unavailable');return data;
}
export const getPublicNavigation=unstable_cache(async()=>publicRpc('get_public_navigation',{p_slug:process.env.NEXT_PUBLIC_SITE_SLUG??'wiffeyyyy-os'}),['public-navigation-v2'],{revalidate:PUBLIC_REVALIDATE_SECONDS,tags:['public-cms']});
export const getPublicPageInfo=unstable_cache(async(slug:string)=>publicRpc('get_public_page_info',{p_site_slug:process.env.NEXT_PUBLIC_SITE_SLUG??'wiffeyyyy-os',p_slug:slug}),['public-page-info-v2'],{revalidate:PUBLIC_REVALIDATE_SECONDS,tags:['public-cms']});
