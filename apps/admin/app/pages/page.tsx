import Link from 'next/link';
import {requireAdmin} from '../../lib/auth';
import {adminDb} from '../../lib/supabase';
import {can} from '../../lib/permissions';
import {PageManager} from '../../components/page-manager';
import {catalogPage} from '../../lib/page-catalog';
import {AdminPageHeader,AdminPanel} from '../../components/admin-page-header';

export const dynamic='force-dynamic';

export default async function Pages(){
 const admin=await requireAdmin();
 const db=await adminDb();
 const {data:site,error}=await db.from('sites').select('id').eq('slug',process.env.NEXT_PUBLIC_SITE_SLUG??'wiffeyyyy-os').single();
 if(error)throw new Error('Site unavailable');
 const {data:pages,error:pageError}=await db.from('pages').select('id,title,slug,settings,published_version_id,updated_at,draft_revision,draft_document').eq('site_id',site.id).order('slug');
 if(pageError)throw new Error('Pages unavailable');
 const publishedIds=(pages??[]).map(page=>page.published_version_id).filter((id):id is string=>Boolean(id));
 const {data:versions,error:versionsError}=publishedIds.length?await db.from('page_versions').select('id,page_id,document,metadata').in('id',publishedIds):{data:[],error:null};
 if(versionsError)throw new Error('Publication status unavailable');
 const catalog=(pages??[]).map(page=>catalogPage(page,(versions??[]).find(version=>version.id===page.published_version_id&&version.page_id===page.id)));
 const canWrite=can(admin.role,'site:write');
 return <div>
  <AdminPageHeader eyebrow="Content" title="Pages" description="Manage page identity, draft metadata and archived pages. Open any active page in the visual editor for section and element editing." actions={<Link href="/editor/home" className="inline-flex min-h-10 items-center rounded-xl bg-[#302a28] px-4 text-sm font-semibold text-white shadow-sm hover:bg-black">Open visual editor</Link>}/>
  {/* PageCreate is integrated with the searchable page manager. */}
  <AdminPanel className="mt-6 p-5 md:p-6"><div className="mb-1 flex items-center justify-between gap-3"><div><h2 className="font-semibold">Page settings</h2><p className="mt-1 text-xs text-[#8b7e78]">Built-in page addresses are protected to keep your site links working.</p></div><span className="rounded-full bg-[#f7f5f3] px-3 py-1 text-xs font-semibold text-[#6d615c]">{(pages??[]).length} records</span></div><PageManager pages={catalog} canWrite={canWrite} canPublish={can(admin.role,'site:publish')} publicSiteUrl={process.env.NEXT_PUBLIC_WEB_URL??''}/></AdminPanel>
 </div>;
}
