import Link from 'next/link';
import {defaultSiteDocument,parseSiteDocument} from '@wiffeyyyy/content';
import {ConfigurationEditor} from '../../components/configuration-editor';
import {requireAdmin} from '../../lib/auth';
import {adminDb} from '../../lib/supabase';
import {changeUsername} from './actions';

export const dynamic='force-dynamic';
export const metadata={title:'Private site settings',robots:{index:false,follow:false}};

const LOGIN_DOMAIN='@admin.wiffeyyyy.invalid';

export default async function Settings({searchParams}:{searchParams:Promise<{usernameError?:string}>}){
 const admin=await requireAdmin();
 const {usernameError}=await searchParams;
 const db=await adminDb();
 const {data:site,error}=await db.from('sites').select('id').eq('slug',process.env.NEXT_PUBLIC_SITE_SLUG??'wiffeyyyy-os').single();if(error)throw new Error('Site unavailable');
 const {data:config,error:configError}=await db.from('site_configurations').select('draft,revision').eq('site_id',site.id).single();if(configError)throw new Error('Settings unavailable');
 const currentUsername=admin.email?.toLowerCase().endsWith(LOGIN_DOMAIN)?admin.email.slice(0,-LOGIN_DOMAIN.length):'';
 const usernameMessage=usernameError==='invalid'?'Use 3–32 characters: lowercase letters, numbers, underscores or hyphens.':usernameError==='taken'?'That username is already in use. Choose another one.':usernameError==='same'?'That is already your current username.':usernameError?'Username could not be changed. Please try again.':null;
 return <main className="min-h-screen bg-[#f7f5f3] p-6 text-[#302a28]">
  <Link href="/">← Pages</Link>
  <h1 className="my-6 text-2xl font-semibold">Personalization, theme and audio</h1>
  <Link className="mb-5 block underline" href="/hotline">Manage private Hotline links →</Link>

  <section className="mb-8 max-w-xl rounded-3xl border border-black/10 bg-white p-5 shadow-sm">
   <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#81736d]">Admin account</p>
   <h2 className="mt-2 text-lg font-semibold">Change username</h2>
   <p className="mt-1 text-sm text-[#6f625d]">Your username is used to sign in to this private control panel.</p>
   <form action={changeUsername} className="mt-4 space-y-3">
    <label className="block text-sm font-medium">Username
     <input className="mt-1 w-full rounded-xl border border-black/15 bg-white p-3 outline-none focus:border-[#d86f91]" name="username" type="text" autoComplete="username" defaultValue={currentUsername} minLength={3} maxLength={32} pattern="[a-z0-9][a-z0-9_-]{2,31}" required />
    </label>
    <p className="text-xs text-[#81736d]">3–32 characters. Lowercase letters, numbers, underscores and hyphens only.</p>
    {usernameMessage&&<p role="alert" className="rounded-xl bg-[#f7e5eb] p-3 text-sm text-[#6f2942]">{usernameMessage}</p>}
    <button className="min-h-11 rounded-xl bg-[#d86f91] px-5 py-3 font-semibold text-white transition-opacity hover:opacity-90" type="submit">Save username</button>
   </form>
  </section>

  <ConfigurationEditor siteId={site.id} initial={parseSiteDocument(config.draft??defaultSiteDocument)} initialRevision={Number(config.revision)} canWrite={admin.role==='owner'}/>
 </main>;
}
