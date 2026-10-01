import 'server-only';
import { cache } from 'react';
import { parsePageDocument, defaultSiteDocument, parseSiteDocument } from '@wiffeyyyy/content';
import { createClient } from '@supabase/supabase-js';
export const getPublishedDocument = cache(async (slug: string) => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const siteSlug = process.env.NEXT_PUBLIC_SITE_SLUG;
  if (!url || !key || !siteSlug) return null;
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await db.rpc('get_published_document', { site_slug: siteSlug, page_slug: slug });
  if (error) throw new Error('Unable to load published content.');
  return data == null ? null : parsePageDocument(data);
});

export const getPublishedSiteConfiguration = cache(async () => {
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,slug=process.env.NEXT_PUBLIC_SITE_SLUG;
 if(!url||!key||!slug)return defaultSiteDocument;
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data,error}=await db.rpc('get_published_site_configuration',{p_slug:slug});
 if(error)throw new Error('Unable to load published settings');
 return data?parseSiteDocument(data):defaultSiteDocument;
});

async function publicRpc(name:string,args:Record<string,string>){const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;if(!url||!key)return null;const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});const {data,error}=await db.rpc(name,args);if(error)throw new Error('Public content unavailable');return data;}
export const getPublicNavigation=cache(async()=>publicRpc('get_public_navigation',{p_slug:process.env.NEXT_PUBLIC_SITE_SLUG??'wiffeyyyy-os'}));
export const getPublicPageInfo=cache(async(slug:string)=>publicRpc('get_public_page_info',{p_site_slug:process.env.NEXT_PUBLIC_SITE_SLUG??'wiffeyyyy-os',p_slug:slug}));
