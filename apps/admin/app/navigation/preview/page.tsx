import Link from 'next/link';
import {parseNavigation} from '@wiffeyyyy/content';
import {HomeNavigation} from '@wiffeyyyy/ui/navigation';
import {adminDb} from '../../../lib/supabase';
import {requireAdmin} from '../../../lib/auth';
export const dynamic='force-dynamic';
export const metadata={title:'Private navigation preview',robots:{index:false,follow:false}};
export default async function Preview(){await requireAdmin();const db=await adminDb();const {data:site,error}=await db.from('sites').select('id').eq('slug',process.env.NEXT_PUBLIC_SITE_SLUG??'wiffeyyyy-os').single();if(error)throw new Error('Site unavailable');const {data:config,error:readError}=await db.from('site_navigation').select('draft,revision').eq('site_id',site.id).single();if(readError)throw new Error('Navigation unavailable');const items=parseNavigation(config.draft).map(n=>({...n,href:n.pageId?'#':null}));return <main className="min-h-screen bg-[#fbf5ef] p-6"><Link href="/navigation">← Navigation editor</Link><p className="my-5">Private saved navigation preview · revision {config.revision}. Destination links are disabled.</p><div className="mx-auto max-w-[430px]"><HomeNavigation items={items} editing style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:12}}/></div></main>}
