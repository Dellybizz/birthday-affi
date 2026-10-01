import Link from 'next/link';
import {parseNavigation} from '@wiffeyyyy/content';
import {requireAdmin} from '../../lib/auth';
import {adminDb} from '../../lib/supabase';
import {NavigationEditor} from '../../components/navigation-editor';
export const dynamic='force-dynamic';
export default async function Navigation(){const admin=await requireAdmin(),db=await adminDb();const {data:site,error}=await db.from('sites').select('id').eq('slug',process.env.NEXT_PUBLIC_SITE_SLUG??'wiffeyyyy-os').single();if(error)throw new Error('Site unavailable');const {data:config,error:readError}=await db.from('site_navigation').select('draft,revision').eq('site_id',site.id).single();if(readError)throw new Error('Navigation unavailable');const {data:pages,error:pageError}=await db.from('pages').select('id,title,slug,settings').eq('site_id',site.id);if(pageError)throw new Error('Pages unavailable');return <main className="min-h-screen bg-[#f7f5f3] p-6"><Link href="/">← Dashboard</Link><h1 className="my-5 text-2xl">Home grid and navigation</h1><NavigationEditor siteId={site.id} initial={parseNavigation(config.draft)} initialRevision={Number(config.revision)} pages={(pages??[]).filter(p=>!p.settings?.archived)} canWrite={admin.role==='owner'}/></main>}
