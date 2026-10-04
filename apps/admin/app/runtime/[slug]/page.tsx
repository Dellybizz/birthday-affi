import {notFound} from 'next/navigation';
import {defaultRuntimeAppConfig,isRuntimeAppConfigSlug,parseRuntimeAppConfig} from '@wiffeyyyy/content';
import RuntimeAppEditor from '../../../components/runtime-app-editor';
import {getEditorSiteContext,loadEditorBootstrap} from '../../../lib/editor-bootstrap';

export const dynamic='force-dynamic';

export default async function RuntimeAppEditorPage({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;if(!isRuntimeAppConfigSlug(slug))notFound();
 const [{db,siteId},bootstrap]=await Promise.all([getEditorSiteContext(),loadEditorBootstrap()]);
 const {data,error}=await db.from('runtime_app_configurations').select('draft,revision').eq('site_id',siteId).eq('app_slug',slug).maybeSingle();
 if(error)throw new Error('Unable to load runtime app settings. Apply the latest database migration first.');
 const document=parseRuntimeAppConfig(slug,data?.draft??defaultRuntimeAppConfig(slug));
 return <RuntimeAppEditor siteId={siteId} slug={slug} initialDocument={document} initialRevision={Number(data?.revision??0)} pages={bootstrap.catalog} publicSiteUrl={bootstrap.publicSiteUrl} canWrite={bootstrap.canWrite} canPublish={bootstrap.canPublish}/>;
}
