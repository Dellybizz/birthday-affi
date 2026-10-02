import { notFound } from 'next/navigation';
import { defaultSiteDocument, installPhoneHome, parseNavigation, parsePageDocument, parseSiteDocument } from '@wiffeyyyy/content';
import { DocumentSettingsProvider } from '@wiffeyyyy/ui/page-layout';
import { AudioDefaultsProvider } from '@wiffeyyyy/ui/media-player';
import { LiveEditorPreviewProvider } from '@wiffeyyyy/ui/cms-renderer';
import { SiteNavigationProvider } from '@wiffeyyyy/ui/navigation';
import { adminDb } from '../../../lib/supabase';
import { can } from '../../../lib/permissions';
import { requireAdmin } from '../../../lib/auth';
import { buildEditorPageCatalog, normalizePublicSiteUrl } from '../../../lib/editor-pages';
import Editor from './editor-client';
export const dynamic='force-dynamic';
export default async function EditorPage({params}:{params:Promise<{slug:string}>}) {
  const admin=await requireAdmin();
  const {slug}=await params;
  const db=await adminDb();
  const siteSlug=process.env.NEXT_PUBLIC_SITE_SLUG??'wiffeyyyy-os';
  const {data:site,error:siteError}=await db.from('sites').select('id').eq('slug',siteSlug).single();
  if(siteError) throw new Error('Unable to load site');
  const [{data:page,error},{data:pages,error:pagesError},{data:configuration,error:configurationError},{data:navigation,error:navigationError}]=await Promise.all([
    db.from('pages').select('id,title,slug,draft_document,draft_revision,settings,published_version_id').eq('site_id',site.id).eq('slug',slug).maybeSingle(),
    db.from('pages').select('id,title,slug,settings,published_version_id').eq('site_id',site.id).order('slug'),
    db.from('site_configurations').select('draft').eq('site_id',site.id).maybeSingle(),
    db.from('site_navigation').select('draft').eq('site_id',site.id).maybeSingle()
  ]);
  if(error) throw new Error('Unable to load page');
  if(pagesError) throw new Error('Unable to load page list');
  if(configurationError) throw new Error('Unable to load site settings');
  if(navigationError) throw new Error('Unable to load navigation');
  if(!page || page.settings?.archived===true) notFound();
  const settings=parseSiteDocument(configuration?.draft??defaultSiteDocument);
  const catalog=buildEditorPageCatalog(pages??[]);
  const hrefByPageId=new Map((pages??[]).map(row=>[row.id,catalog.find(item=>item.slug===row.slug)?.livePath??null]));
  const previewNavigation=parseNavigation(navigation?.draft??[]).map(item=>({...item,href:item.pageId?hrefByPageId.get(item.pageId)??null:null})).filter(item=>item.href!=='/app/radio');
  return <DocumentSettingsProvider value={settings}><AudioDefaultsProvider value={{volume:settings.defaultVolume,muted:settings.defaultMuted}}><SiteNavigationProvider value={previewNavigation}><LiveEditorPreviewProvider><Editor key={page.id} pageId={page.id} siteId={site.id} siteSlug={siteSlug} currentSlug={page.slug} pages={catalog} publicSiteUrl={normalizePublicSiteUrl(process.env.NEXT_PUBLIC_WEB_URL??process.env.NEXT_PUBLIC_SITE_URL)} initialRevision={Number(page.draft_revision)} initialDocument={slug==='home'?installPhoneHome(page.draft_document):parsePageDocument(page.draft_document)} canWrite={can(admin.role,"site:write")} canPublish={can(admin.role,"site:publish")}/></LiveEditorPreviewProvider></SiteNavigationProvider></AudioDefaultsProvider></DocumentSettingsProvider>;
}
