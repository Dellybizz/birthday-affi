import { notFound } from 'next/navigation';
import { CMSRenderer } from '@wiffeyyyy/ui/cms-renderer';
import { parsePageDocument } from '@wiffeyyyy/content';
import { requireAdmin } from '../../../lib/auth';
import { adminDb } from '../../../lib/supabase';
export const dynamic='force-dynamic';
export const metadata={title:'Private draft preview',robots:{index:false,follow:false}};
export default async function DraftPreview({params,searchParams}:{params:Promise<{pageId:string}>;searchParams:Promise<{version?:string}>}) {
 await requireAdmin();const {pageId}=await params;const {version}=await searchParams;const db=await adminDb();
 if(!/^[0-9a-f-]{36}$/i.test(pageId)||(version&&!/^[0-9a-f-]{36}$/i.test(version)))notFound();
 const {data:page,error}=await db.from('pages').select('draft_document,title,slug').eq('id',pageId).maybeSingle();
 if(error)throw new Error('Unable to load preview');if(!page)notFound();
 let document=page.draft_document;
 if(version){const {data,error}=await db.from('page_versions').select('document').eq('id',version).eq('page_id',pageId).maybeSingle();if(error)throw new Error('Unable to load version');if(!data)notFound();document=data.document}
 return <><header className="border-b bg-white p-3 text-sm">Private {version?'version':'saved draft'} preview · {page.title} · <a href={'/editor/'+page.slug}>Back to editor</a></header><CMSRenderer document={parsePageDocument(document)}/></>;
}
