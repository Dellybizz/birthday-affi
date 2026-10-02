import Link from 'next/link';
import {defaultSiteDocument,parseSiteDocument} from '@wiffeyyyy/content';
import {ConfigurationEditor} from '../../components/configuration-editor';
import {requireAdmin} from '../../lib/auth';
import {adminDb} from '../../lib/supabase';
import {changePassword,changeUsername} from './actions';

export const dynamic='force-dynamic';
export const metadata={title:'Private site settings',robots:{index:false,follow:false}};

const LOGIN_DOMAIN='@admin.wiffeyyyy.invalid';

export default async function Settings({searchParams}:{searchParams:Promise<{usernameError?:string;passwordError?:string}>}){
 const admin=await requireAdmin();
 const {usernameError,passwordError}=await searchParams;
 const db=await adminDb();
 const {data:site,error}=await db.from('sites').select('id').eq('slug',process.env.NEXT_PUBLIC_SITE_SLUG??'wiffeyyyy-os').single();if(error)throw new Error('Site unavailable');
 const {data:config,error:configError}=await db.from('site_configurations').select('draft,revision').eq('site_id',site.id).single();if(configError)throw new Error('Settings unavailable');
 const currentUsername=admin.email?.toLowerCase().endsWith(LOGIN_DOMAIN)?admin.email.slice(0,-LOGIN_DOMAIN.length):'';
 const usernameMessage=usernameError==='invalid'?'Use 3–32 characters: lowercase letters, numbers, underscores or hyphens.':usernameError==='taken'?'That username is already in use. Choose another one.':usernameError==='same'?'That is already your current username.':usernameError?'Username could not be changed. Please try again.':null;
 const passwordMessage=passwordError==='current'?'Your current password is incorrect.':passwordError==='mismatch'?'The new password and confirmation do not match.':passwordError==='same'?'Choose a new password that is different from your current password.':passwordError==='weak'?'Use a stronger password with at least 8 characters.':passwordError==='reauth'?'For security, sign out and sign back in before changing your password.':passwordError==='invalid'?'Complete all password fields.':passwordError?'Password could not be changed. Please try again.':null;
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

   <div className="my-6 border-t border-black/10" />

   <h2 className="text-lg font-semibold">Change password</h2>
   <p className="mt-1 text-sm text-[#6f625d]">Confirm your current password, then choose a new one. A successful change signs this admin account out on all devices.</p>
   <form action={changePassword} className="mt-4 space-y-3">
    <label className="block text-sm font-medium">Current password
     <input className="mt-1 w-full rounded-xl border border-black/15 bg-white p-3 outline-none focus:border-[#d86f91]" name="currentPassword" type="password" autoComplete="current-password" maxLength={1024} required />
    </label>
    <label className="block text-sm font-medium">New password
     <input className="mt-1 w-full rounded-xl border border-black/15 bg-white p-3 outline-none focus:border-[#d86f91]" name="newPassword" type="password" autoComplete="new-password" minLength={8} maxLength={128} required />
    </label>
    <label className="block text-sm font-medium">Confirm new password
     <input className="mt-1 w-full rounded-xl border border-black/15 bg-white p-3 outline-none focus:border-[#d86f91]" name="confirmPassword" type="password" autoComplete="new-password" minLength={8} maxLength={128} required />
    </label>
    <p className="text-xs text-[#81736d]">Use at least 8 characters. A longer, unique password is recommended.</p>
    {passwordMessage&&<p role="alert" className="rounded-xl bg-[#f7e5eb] p-3 text-sm text-[#6f2942]">{passwordMessage}</p>}
    <button className="min-h-11 rounded-xl border border-[#d86f91] bg-white px-5 py-3 font-semibold text-[#a84e6c] transition-colors hover:bg-[#fff4f7]" type="submit">Change password</button>
   </form>
  </section>

  <ConfigurationEditor siteId={site.id} initial={parseSiteDocument(config.draft??defaultSiteDocument)} initialRevision={Number(config.revision)} canWrite={admin.role==='owner'}/>
 </main>;
}
