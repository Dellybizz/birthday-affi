import {notFound} from 'next/navigation';
import {installPhoneHome,parsePageDocument} from '@wiffeyyyy/content';
import {getEditorSiteContext} from '../../../lib/editor-bootstrap';
import {EditorRoutePayload} from '../editor-workspace';

export const dynamic='force-dynamic';

export default async function EditorPage({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;
 const {db,siteId}=await getEditorSiteContext();
 const {data:page,error}=await db.from('pages').select('id,slug,draft_document,draft_revision,settings,published_version_id').eq('site_id',siteId).eq('slug',slug).maybeSingle();
 if(error)throw new Error('Unable to load page');
 if(!page||page.settings?.archived===true)notFound();
 let publishedDocument:unknown=undefined;
 if(page.published_version_id){const {data:version,error:versionError}=await db.from('page_versions').select('document').eq('page_id',page.id).eq('id',page.published_version_id).maybeSingle();if(versionError)throw new Error('Unable to load publication status');publishedDocument=version?.document;}
 const document=slug==='home'?installPhoneHome(page.draft_document):parsePageDocument(page.draft_document);
 return <EditorRoutePayload page={{pageId:page.id,currentSlug:page.slug,initialRevision:Number(page.draft_revision),initialDocument:document,publishedId:page.published_version_id,publishedDocument}}/>;
}
