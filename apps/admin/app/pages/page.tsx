import Link from 'next/link';
import {requireAdmin} from '../../lib/auth';
import {adminDb} from '../../lib/supabase';
import {can} from '../../lib/permissions';
import {PageManager} from '../../components/page-manager';
export const dynamic='force-dynamic';
export default async function Pages(){
 const admin=await requireAdmin();const db=await adminDb();
 const {data:site,error}=await db.from('sites').select('id').eq('slug',process.env.NEXT_PUBLIC_SITE_SLUG??'wiffeyyyy-os').single();if(error)throw new Error('Site unavailable');
 const {data:pages,error:pageError}=await db.from('pages').select('id,title,slug,settings,published_version_id').eq('site_id',site.id).order('slug');if(pageError)throw new Error('Pages unavailable');
 return <main className="min-h-screen bg-[#f7f5f3] p-6"><Link href="/">← Dashboard</Link><h1 className="mt-5 text-2xl">Page settings</h1><PageManager pages={pages??[]} canWrite={can(admin.role,'site:write')}/></main>;
}
