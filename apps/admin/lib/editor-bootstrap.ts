import 'server-only';
import {cache} from 'react';
import {defaultSiteDocument,parseNavigation,parseSiteDocument} from '@wiffeyyyy/content';
import {adminDb} from './supabase';
import {requireAdmin} from './auth';
import {buildEditorPageCatalog,normalizePublicSiteUrl} from './editor-pages';
import {can} from './permissions';

export const getEditorSiteContext=cache(async()=>{
 const admin=await requireAdmin();
 const db=await adminDb();
 const siteSlug=process.env.NEXT_PUBLIC_SITE_SLUG??'wiffeyyyy-os';
 const {data:site,error}=await db.from('sites').select('id').eq('slug',siteSlug).single();
 if(error||!site)throw new Error('Unable to load site');
 return {admin,db,siteId:site.id as string,siteSlug};
});

export async function loadEditorBootstrap(){
 const {admin,db,siteId,siteSlug}=await getEditorSiteContext();
 const [{data:pages,error:pagesError},{data:configuration,error:configurationError},{data:navigation,error:navigationError}]=await Promise.all([
  db.from('pages').select('id,title,slug,settings,published_version_id').eq('site_id',siteId).order('slug'),
  db.from('site_configurations').select('draft').eq('site_id',siteId).maybeSingle(),
  db.from('site_navigation').select('draft').eq('site_id',siteId).maybeSingle()
 ]);
 if(pagesError)throw new Error('Unable to load page list');
 if(configurationError)throw new Error('Unable to load site settings');
 if(navigationError)throw new Error('Unable to load navigation');
 const settings=parseSiteDocument(configuration?.draft??defaultSiteDocument);
 const catalog=buildEditorPageCatalog(pages??[]);
 const hrefByPageId=new Map((pages??[]).map(row=>[row.id,catalog.find(item=>item.slug===row.slug)?.livePath??null]));
 const previewNavigation=parseNavigation(navigation?.draft??[]).map(item=>({...item,href:item.pageId?hrefByPageId.get(item.pageId)??null:null})).filter(item=>item.href!=='/app/radio');
 return {
  siteId,siteSlug,settings,catalog,previewNavigation,
  publicSiteUrl:normalizePublicSiteUrl(process.env.NEXT_PUBLIC_WEB_URL??process.env.NEXT_PUBLIC_SITE_URL),
  canWrite:can(admin.role,'site:write'),canPublish:can(admin.role,'site:publish')
 };
}
