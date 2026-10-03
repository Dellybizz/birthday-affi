import {AdminPageHeader} from '../../components/admin-page-header';
import {ReleaseManager} from '../../components/release-manager';
import {requireAdmin} from '../../lib/auth';
import {adminDb} from '../../lib/supabase';
import {documentsEqual} from '../../lib/control-panel';
import {can} from '../../lib/permissions';

export const dynamic='force-dynamic';

export default async function ReleasesPage(){
 const admin=await requireAdmin();const db=await adminDb();const slug=process.env.NEXT_PUBLIC_SITE_SLUG??'wiffeyyyy-os';
 const {data:site,error:siteError}=await db.from('sites').select('id').eq('slug',slug).single();if(siteError||!site)throw new Error('Site unavailable');
 const [pagesResult,configurationResult,navigationResult,releasesResult]=await Promise.all([
  db.from('pages').select('id,slug,title,settings,draft_document,published_version_id').eq('site_id',site.id),
  db.from('site_configurations').select('draft,published_id').eq('site_id',site.id).single(),
  db.from('site_navigation').select('draft,published_id').eq('site_id',site.id).single(),
  db.from('site_releases').select('id,release_number,note,created_at').eq('site_id',site.id).order('release_number',{ascending:false}).limit(25)
 ]);
 if(pagesResult.error||configurationResult.error||navigationResult.error||releasesResult.error)throw new Error('Unable to load release workspace');
 const pages=(pagesResult.data??[]).filter(page=>page.settings?.archived!==true);
 const publishedIds=pages.map(page=>page.published_version_id).filter((id):id is string=>Boolean(id));
 const publishedDocuments=new Map<string,unknown>();
 if(publishedIds.length){const {data,error}=await db.from('page_versions').select('id,document,metadata').in('id',publishedIds);if(error)throw new Error('Unable to load published pages');for(const row of data??[])publishedDocuments.set(row.id,{document:row.document,metadata:row.metadata})}
 let pendingCount=0;
 for(const page of pages){
  if(!page.published_version_id){pendingCount++;continue}
  const live=publishedDocuments.get(page.published_version_id) as {document:unknown;metadata:unknown}|undefined;
  const metadata={title:page.title,description:page.settings?.description??''};
  if(!live||!documentsEqual(page.draft_document,live.document)||!documentsEqual(metadata,live.metadata))pendingCount++;
 }
 const configuration=configurationResult.data;let configPublished:unknown|undefined;
 if(configuration.published_id){const {data,error}=await db.from('site_configuration_versions').select('document').eq('id',configuration.published_id).maybeSingle();if(error)throw new Error('Unable to load published settings');configPublished=data?.document}
 if(!configuration.published_id||configPublished===undefined||!documentsEqual(configuration.draft,configPublished))pendingCount++;
 const navigation=navigationResult.data;let navigationPublished:unknown|undefined;
 if(navigation.published_id){const {data,error}=await db.from('navigation_versions').select('document').eq('id',navigation.published_id).maybeSingle();if(error)throw new Error('Unable to load published navigation');navigationPublished=data?.document}
 if(!navigation.published_id||navigationPublished===undefined||!documentsEqual(navigation.draft,navigationPublished))pendingCount++;
 const releases=releasesResult.data??[];const ids=releases.map(release=>release.id);const pageCounts=new Map<string,number>();
 if(ids.length){const {data,error}=await db.from('site_release_pages').select('release_id').in('release_id',ids);if(error)throw new Error('Unable to load release pages');for(const row of data??[])pageCounts.set(row.release_id,(pageCounts.get(row.release_id)??0)+1)}
 return <div><AdminPageHeader eyebrow="Publishing" title="Releases" description="Review the site's unpublished work, publish every validated workspace atomically, and restore a previous published state without overwriting page draft documents."/><ReleaseManager siteId={site.id} canPublish={can(admin.role,'site:publish')} pendingCount={pendingCount} releases={releases.map(release=>({id:release.id,release_number:Number(release.release_number),note:release.note??'',created_at:release.created_at,pageCount:pageCounts.get(release.id)??0}))}/></div>;
}
