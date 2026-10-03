import {requireAdmin} from '../../lib/auth';
import {adminDb} from '../../lib/supabase';
import {can} from '../../lib/permissions';
import MediaLibrary from '../../components/media-library';
import {AdminPageHeader,AdminPanel} from '../../components/admin-page-header';

export const dynamic='force-dynamic';

export default async function MediaPage(){
 const admin=await requireAdmin();
 const db=await adminDb();
 const {data:site,error}=await db.from('sites').select('id').eq('slug',process.env.NEXT_PUBLIC_SITE_SLUG??'wiffeyyyy-os').single();
 if(error||!site)throw new Error('Unable to load site');
 return <div>
  <AdminPageHeader eyebrow="Assets" title="Media library" description="Upload and reuse images, videos and audio without duplicating files across pages. Media selection stays separate from visitor runtime state."/>
  <AdminPanel className="p-4 md:p-6"><MediaLibrary siteId={site.id} canWrite={can(admin.role,'media:write')}/></AdminPanel>
 </div>;
}
