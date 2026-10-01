import Link from 'next/link';
import { requireAdmin } from '../../lib/auth';
import { adminDb } from '../../lib/supabase';
import { can } from '../../lib/permissions';
import MediaLibrary from '../../components/media-library';
export const dynamic='force-dynamic';
export default async function MediaPage(){const admin=await requireAdmin();const db=await adminDb();const {data:site,error}=await db.from('sites').select('id').eq('slug',process.env.NEXT_PUBLIC_SITE_SLUG??'wiffeyyyy-os').single();if(error||!site)throw new Error('Unable to load site');return <main className="min-h-screen bg-[#f7f5f3] p-5 text-[#302927] md:p-8"><div className="mx-auto max-w-6xl rounded-3xl border bg-white p-5 md:p-8"><Link className="mb-6 inline-block text-sm underline" href="/">← Back to pages</Link><MediaLibrary siteId={site.id} canWrite={can(admin.role,'media:write')}/></div></main>}
