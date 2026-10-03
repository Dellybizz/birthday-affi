import {requireAdmin} from '../../lib/auth';
import {AdminPageHeader,AdminPanel} from '../../components/admin-page-header';
import {HotlineLinks} from './links';

export default async function HotlineSettings(){
 await requireAdmin();
 return <div>
  <AdminPageHeader eyebrow="Site" title="Private Hotline" description="Manage the private caller and receiver links used by Hotdial. These operational links are intentionally separate from editable page content."/>
  <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
   <AdminPanel className="p-5 md:p-6"><HotlineLinks/></AdminPanel>
   <AdminPanel className="h-fit p-5"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#9a6a7a]">Runtime note</p><h2 className="mt-1 text-base font-semibold">Receiver availability</h2><p className="mt-2 text-sm leading-6 text-[#756963]">The receiver page must remain open for browser calls. Android background ringing requires the receiver APK and push service and is not implied by the CMS editor.</p></AdminPanel>
  </div>
 </div>;
}
