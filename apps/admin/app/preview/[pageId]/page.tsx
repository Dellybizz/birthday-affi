import {notFound} from 'next/navigation';
import {createDefaultPage,defaultSiteDocument,installPhoneHome,parseNavigation,parsePageDocument,parseSiteDocument,type CMSField} from '@wiffeyyyy/content';
import {DocumentSettingsProvider} from '@wiffeyyyy/ui/page-layout';
import {AudioDefaultsProvider} from '@wiffeyyyy/ui/media-player';
import {LiveEditorPreviewProvider} from '@wiffeyyyy/ui/cms-renderer';
import {SiteNavigationProvider} from '@wiffeyyyy/ui/navigation';
import {requireAdmin} from '../../../lib/auth';
import {adminDb} from '../../../lib/supabase';
import {buildEditorPageCatalog} from '../../../lib/editor-pages';
import DraftPreviewFrame from './preview-client';
export const dynamic='force-dynamic';
export const metadata={title:'Private draft preview',robots:{index:false,follow:false}};
export default async function DraftPreview({params,searchParams}:{params:Promise<{pageId:string}>;searchParams:Promise<{version?:string;embed?:string}>}) {
 await requireAdmin();const {pageId}=await params;const {version,embed}=await searchParams;const db=await adminDb();
 if(!/^[0-9a-f-]{36}$/i.test(pageId)||(version&&!/^[0-9a-f-]{36}$/i.test(version)))notFound();
 const {data:page,error}=await db.from('pages').select('id,site_id,draft_document,title,slug').eq('id',pageId).maybeSingle();
 if(error)throw new Error('Unable to load preview');if(!page)notFound();
 let rawDocument=page.draft_document;
 if(version){const {data,error:versionError}=await db.from('page_versions').select('document').eq('id',version).eq('page_id',pageId).maybeSingle();if(versionError)throw new Error('Unable to load version');if(!data)notFound();rawDocument=data.document}
 const [{data:configuration,error:configurationError},{data:navigation,error:navigationError},{data:pages,error:pagesError}]=await Promise.all([
  db.from('site_configurations').select('draft').eq('site_id',page.site_id).maybeSingle(),
  db.from('site_navigation').select('draft').eq('site_id',page.site_id).maybeSingle(),
  db.from('pages').select('id,title,slug,settings,published_version_id,draft_document').eq('site_id',page.site_id).order('slug')
 ]);
 if(configurationError)throw new Error('Unable to load preview settings');if(navigationError)throw new Error('Unable to load preview navigation');if(pagesError)throw new Error('Unable to load preview pages');
 const settings=parseSiteDocument(configuration?.draft??defaultSiteDocument),catalog=buildEditorPageCatalog(pages??[]),hrefByPageId=new Map((pages??[]).map(row=>[row.id,catalog.find(item=>item.slug===row.slug)?.livePath??null]));
 const previewNavigation=parseNavigation(navigation?.draft??[]).map(item=>({...item,href:item.pageId?hrefByPageId.get(item.pageId)??null:null})).filter(item=>item.href!=='/app/radio');
 const document=page.slug==='home'?installPhoneHome(rawDocument):parsePageDocument(rawDocument),embedded=embed==='1';
 const homeRow=(pages??[]).find(row=>row.slug==='home'),homeDocument=homeRow?installPhoneHome(homeRow.draft_document):installPhoneHome(createDefaultPage('home'));
 const archiveRow=(pages??[]).find(row=>row.slug==='memories-archive'),archiveDocument=archiveRow?parsePageDocument(archiveRow.draft_document):null;
 const initialArchiveSettings:Record<string,CMSField>={...(archiveDocument?.nodes.find(node=>node.props.archivePart==='page'&&node.parentId===null)?.props??{})};
 return <DocumentSettingsProvider value={settings}><AudioDefaultsProvider value={{volume:settings.defaultVolume,muted:settings.defaultMuted}}><SiteNavigationProvider value={previewNavigation}><LiveEditorPreviewProvider>{!embedded&&<header className="border-b bg-white p-3 text-sm">Private {version?'version':'saved draft'} preview · {page.title} · <a href={'/editor/'+page.slug}>Back to editor</a></header>}<DraftPreviewFrame initialDocument={document} pageSlug={page.slug} siteSettings={settings} homeDocument={homeDocument} initialArchiveSettings={initialArchiveSettings}/></LiveEditorPreviewProvider></SiteNavigationProvider></AudioDefaultsProvider></DocumentSettingsProvider>;
}
