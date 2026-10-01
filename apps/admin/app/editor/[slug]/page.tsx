import { notFound } from 'next/navigation';
import { parsePageDocument } from '@wiffeyyyy/content';
import { adminDb } from '../../../lib/supabase';
import { can } from '../../../lib/permissions';
import { requireAdmin } from '../../../lib/auth';
import Editor from './editor-client';
export default async function EditorPage({params}:{params:Promise<{slug:string}>}) {
  const admin=await requireAdmin();
  const {slug}=await params;
  const db=await adminDb();
  const {data:site,error:siteError}=await db.from('sites').select('id').eq('slug',process.env.NEXT_PUBLIC_SITE_SLUG??'wiffeyyyy-os').single();
  if(siteError) throw new Error('Unable to load site');
  const {data:page,error}=await db.from('pages').select('id,draft_document').eq('site_id',site.id).eq('slug',slug).maybeSingle();
  if(error) throw new Error('Unable to load page');
  if(!page) notFound();
  return <Editor pageId={page.id} initialDocument={parsePageDocument(page.draft_document)} canWrite={can(admin.role,"site:write")} canPublish={can(admin.role,"site:publish")}/>;
}
