import {parseNavigation} from '@wiffeyyyy/content';
import {requireAdmin} from '../../lib/auth';
import {adminDb} from '../../lib/supabase';
import {NavigationEditor} from '../../components/navigation-editor';
import {AdminPageHeader,AdminPanel} from '../../components/admin-page-header';

export const dynamic='force-dynamic';

export default async function Navigation(){
 const admin=await requireAdmin();
 const db=await adminDb();
 const {data:site,error}=await db.from('sites').select('id').eq('slug',process.env.NEXT_PUBLIC_SITE_SLUG??'wiffeyyyy-os').single();
 if(error)throw new Error('Site unavailable');
 const {data:config,error:readError}=await db.from('site_navigation').select('draft,revision').eq('site_id',site.id).single();
 if(readError)throw new Error('Navigation unavailable');
 const {data:pages,error:pageError}=await db.from('pages').select('id,title,slug,settings,published_version_id').eq('site_id',site.id);
 if(pageError)throw new Error('Pages unavailable');
 return <div>
  <AdminPageHeader eyebrow="Content" title="Navigation" description="Control the phone home grid and site journeys from one navigation workspace. Draft changes remain private until published through the existing navigation flow."/>
  <AdminPanel className="p-5 md:p-6"><NavigationEditor siteId={site.id} initial={parseNavigation(config.draft)} initialRevision={Number(config.revision)} pages={(pages??[]).filter(page=>!page.settings?.archived)} canWrite={admin.role==='owner'}/></AdminPanel>
 </div>;
}
