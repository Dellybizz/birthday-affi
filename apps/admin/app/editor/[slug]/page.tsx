import { notFound } from 'next/navigation';
import { defaultSiteDocument, installPhoneHome, parsePageDocument, parseSiteDocument } from '@wiffeyyyy/content';
import { DocumentSettingsProvider } from '@wiffeyyyy/ui/page-layout';
import { AudioDefaultsProvider } from '@wiffeyyyy/ui/media-player';
import { LiveEditorPreviewProvider } from '@wiffeyyyy/ui/cms-renderer';
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
  const [{data:page,error},{data:pages,error:pagesError},{data:configuration,error:configurationError}]=await Promise.all([
    db.from('pages').select('id,title,slug,draft_document,draft_revision,settings,published_version_id').eq('site_id',site.id).eq('slug',slug).maybeSingle(),
    db.from('pages').select('id,title,slug,settings,published_version_id').eq('site_id',site.id).order('slug'),
    db.from('site_configurations').select('draft').eq('site_id',site.id).maybeSingle()
  ]);
  if(error) throw new Error('Unable to load page');
  if(pagesError) throw new Error('Unable to load page list');
  if(configurationError) throw new Error('Unable to load site settings');
  if(!page || page.settings?.archived===true) notFound();
  const settings=parseSiteDocument(configuration?.draft??defaultSiteDocument);
  return <DocumentSettingsProvider value={settings}><AudioDefaultsProvider value={{volume:settings.defaultVolume,muted:settings.defaultMuted}}><LiveEditorPreviewProvider><Editor key={page.id} pageId={page.id} siteId={site.id} siteSlug={siteSlug} currentSlug={page.slug} pages={buildEditorPageCatalog(pages??[])} publicSiteUrl={normalizePublicSiteUrl(process.env.NEXT_PUBLIC_WEB_URL??process.env.NEXT_PUBLIC_SITE_URL)} initialRevision={Number(page.draft_revision)} initialDocument={slug==='home'?installPhoneHome(page.draft_document):parsePageDocument(page.draft_document)} canWrite={can(admin.role,"site:write")} canPublish={can(admin.role,"site:publish")}/></LiveEditorPreviewProvider></AudioDefaultsProvider></DocumentSettingsProvider>;
}
