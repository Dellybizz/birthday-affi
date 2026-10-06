import {requireAdmin} from '../../lib/auth';
import {adminDb} from '../../lib/supabase';
import {parseSiteDocument} from '@wiffeyyyy/content';
import {AudioWorkspace} from '../../components/audio-workspace';
export const dynamic='force-dynamic';
export const metadata={title:'Birthday soundtrack',robots:{index:false,follow:false}};
export default async function Audio(){
 const admin=await requireAdmin();const db=await adminDb();const {data:site,error}=await db.from('sites').select('id').eq('slug',process.env.NEXT_PUBLIC_SITE_SLUG??'wiffeyyyy-os').single();if(error||!site)throw new Error('Site unavailable');
 const {data:config,error:configError}=await db.from('site_configurations').select('draft,revision').eq('site_id',site.id).single();if(configError||!config)throw new Error('Audio settings unavailable');
 return <AudioWorkspace siteId={site.id} initial={parseSiteDocument(config.draft)} initialRevision={Number(config.revision)} canWrite={admin.role==='owner'}/>;
}
