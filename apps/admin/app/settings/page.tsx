import Link from 'next/link';
import {defaultSiteDocument,parseSiteDocument} from '@wiffeyyyy/content';
import {ConfigurationEditor} from '../../components/configuration-editor';
import {requireAdmin} from '../../lib/auth';
import {adminDb} from '../../lib/supabase';
export const dynamic='force-dynamic';
export const metadata={title:'Private site settings',robots:{index:false,follow:false}};
export default async function Settings(){
 const admin=await requireAdmin();const db=await adminDb();
 const {data:site,error}=await db.from('sites').select('id').eq('slug',process.env.NEXT_PUBLIC_SITE_SLUG??'wiffeyyyy-os').single();if(error)throw new Error('Site unavailable');
 const {data:config,error:configError}=await db.from('site_configurations').select('draft,revision').eq('site_id',site.id).single();if(configError)throw new Error('Settings unavailable');
 return <main className="min-h-screen bg-[#f7f5f3] p-6"><Link href="/">← Pages</Link><h1 className="my-6 text-2xl">Personalization, theme and audio</h1><Link className="mb-5 block underline" href="/hotline">Manage private Hotline links →</Link><ConfigurationEditor siteId={site.id} initial={parseSiteDocument(config.draft??defaultSiteDocument)} initialRevision={Number(config.revision)} canWrite={admin.role==='owner'}/></main>;
}
