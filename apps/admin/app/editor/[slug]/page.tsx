import { notFound } from 'next/navigation';
import { installPhoneHome, parsePageDocument } from '@wiffeyyyy/content';
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
  const [{data:page,error},{data:pages,error:pagesError}]=await Promise.all([
    db.from('pages').select('id,title,slug,draft_document,draft_revision,settings,published_version_id').eq('site_id',site.id).eq('slug',slug).maybeSingle(),
    db.from('pages').select('id,title,slug,settings,published_version_id').eq('site_id',site.id).order('slug')
  ]);
  if(error) throw new Error('Unable to load page');
  if(pagesError) throw new Error('Unable to load page list');
  if(!page || page.settings?.archived===true) notFound();
  return <Editor key={page.id} pageId={page.id} siteId={site.id} siteSlug={siteSlug} currentSlug={page.slug} pages={buildEditorPageCatalog(pages??[])} publicSiteUrl={normalizePublicSiteUrl(process.env.NEXT_PUBLIC_WEB_URL??process.env.NEXT_PUBLIC_SITE_URL)} initialRevision={Number(page.draft_revision)} initialDocument={slug==='home'?installPhoneHome(page.draft_document):parsePageDocument(page.draft_document)} canWrite={can(admin.role,"site:write")} canPublish={can(admin.role,"site:publish")}/>;
}
