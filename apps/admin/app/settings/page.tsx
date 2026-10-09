import Link from 'next/link';
import {defaultSiteDocument,parseSiteDocument,parseNavigation,getExperience,installPhoneHome,type PageDocument} from '@wiffeyyyy/content';
import {ConfigurationEditor} from '../../components/configuration-editor';
import {AdminPageHeader,AdminPanel} from '../../components/admin-page-header';
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
 const {data:site,error}=await db.from('sites').select('id').eq('slug',process.env.NEXT_PUBLIC_SITE_SLUG??'wiffeyyyy-os').single();
 if(error)throw new Error('Site unavailable');
 const {data:config,error:configError}=await db.from('site_configurations').select('draft,revision').eq('site_id',site.id).single();
 if(configError)throw new Error('Settings unavailable');
 const [{data:pages,error:pagesError},{data:nav,error:navError}]=await Promise.all([db.from('pages').select('id,slug,draft_document,settings').eq('site_id',site.id),db.from('site_navigation').select('draft').eq('site_id',site.id).single()]);
 if(pagesError||navError)throw new Error('Settings preview unavailable');
 const home=(pages??[]).find(page=>page.slug==='home');
 const heart=(pages??[]).find(page=>page.slug==='in-my-heart'&&!page.settings?.archived)?.draft_document as PageDocument|undefined;
 const revealPhoto=heart?.nodes.find(node=>node.visible&&node.component==='image'&&typeof node.props.src==='string'&&/^\/(media|puzzles)\//.test(node.props.src))?.props.src;
 const navigation=parseNavigation(nav.draft).map(item=>{const page=(pages??[]).find(page=>page.id===item.pageId);return {...item,href:item.runtimeSlug?getExperience(item.runtimeSlug)?.livePath??null:page&&!page.settings?.archived?getExperience(page.slug)?.livePath??'/pages/'+page.slug:null}});
 const currentUsername=admin.email?.toLowerCase().endsWith(LOGIN_DOMAIN)?admin.email.slice(0,-LOGIN_DOMAIN.length):'';
 const usernameMessage=usernameError==='invalid'?'Use 3–32 characters: lowercase letters, numbers, underscores or hyphens.':usernameError==='taken'?'That username is already in use. Choose another one.':usernameError==='same'?'That is already your current username.':usernameError?'Username could not be changed. Please try again.':null;
 const passwordMessage=passwordError==='mismatch'?'The new password and confirmation do not match.':passwordError==='same'?'Choose a password that is different from the existing password.':passwordError==='weak'?'Use a stronger password with at least 8 characters.':passwordError==='reauth'?'Your session is too old to change the password. Sign out and sign back in, then try again.':passwordError==='invalid'?'Enter and confirm the new password.':passwordError?'Password could not be changed. Please try again.':null;
 return <div>
  <AdminPageHeader eyebrow="Site" title="Site settings" description="Manage the shared personalization, theme, audio defaults and private admin account. These settings are versioned independently from page documents." actions={<Link href="/hotline" className="inline-flex min-h-10 items-center rounded-xl border border-black/10 bg-white px-4 text-sm font-semibold text-[#514742] shadow-sm hover:bg-[#faf8f7]">Hotline settings</Link>}/>

  <div className="grid gap-6 3xl:grid-cols-[minmax(0,1fr)_340px]">
   <AdminPanel className="p-5 md:p-6"><div className="mb-6 border-b border-black/[.07] pb-4"><p className="text-xs font-semibold uppercase tracking-[0.13em] text-[#9a6a7a]">Website configuration</p><h2 className="mt-1 text-lg font-semibold">Global site and OS controls</h2><p className="mt-1 text-sm text-[#7f726c]">Edit the canonical site-level draft. Publishing here changes site settings only; pages remain independently versioned.</p></div><ConfigurationEditor revealPhoto={typeof revealPhoto==='string'?revealPhoto:undefined} siteId={site.id} initial={parseSiteDocument(config.draft??defaultSiteDocument)} initialRevision={Number(config.revision)} canWrite={admin.role==='owner'} homeDocument={home?installPhoneHome(home.draft_document):undefined} navigation={navigation}/></AdminPanel>

   <AdminPanel className="h-fit p-5 md:p-6" ><p className="text-xs font-semibold uppercase tracking-[0.13em] text-[#9a6a7a]">Admin account</p><h2 className="mt-1 text-lg font-semibold">Private access</h2><p className="mt-1 text-sm leading-6 text-[#7a6e68]">Change the username or password used for this private control panel.</p>
    <div className="mt-6"><h3 className="text-sm font-semibold">Username</h3><form action={changeUsername} className="mt-3 space-y-3"><label className="block text-xs font-medium text-[#665b56]">Username<input className="mt-1.5 w-full rounded-xl border border-black/15 bg-white p-3 text-sm outline-none focus:border-[#d86f91] focus:ring-2 focus:ring-[#d86f91]/10" name="username" type="text" autoComplete="username" defaultValue={currentUsername} minLength={3} maxLength={32} pattern="[a-z0-9][a-z0-9_-]{2,31}" required /></label><p className="text-[11px] leading-5 text-[#958882]">3–32 characters. Lowercase letters, numbers, underscores and hyphens only.</p>{usernameMessage&&<p role="alert" className="rounded-xl bg-[#f7e5eb] p-3 text-xs text-[#6f2942]">{usernameMessage}</p>}<button className="min-h-10 rounded-xl bg-[#302a28] px-4 text-sm font-semibold text-white transition hover:bg-black" type="submit">Save username</button></form></div>
    <div className="my-6 border-t border-black/[.08]"/>
    <div><h3 className="text-sm font-semibold">Password</h3><form action={changePassword} className="mt-3 space-y-3"><label className="block text-xs font-medium text-[#665b56]">New password<input className="mt-1.5 w-full rounded-xl border border-black/15 bg-white p-3 text-sm outline-none focus:border-[#d86f91] focus:ring-2 focus:ring-[#d86f91]/10" name="newPassword" type="password" autoComplete="new-password" minLength={8} maxLength={128} required /></label><label className="block text-xs font-medium text-[#665b56]">Confirm new password<input className="mt-1.5 w-full rounded-xl border border-black/15 bg-white p-3 text-sm outline-none focus:border-[#d86f91] focus:ring-2 focus:ring-[#d86f91]/10" name="confirmPassword" type="password" autoComplete="new-password" minLength={8} maxLength={128} required /></label><p className="text-[11px] leading-5 text-[#958882]">At least 8 characters. A successful change signs this admin account out on all devices.</p>{passwordMessage&&<p role="alert" className="rounded-xl bg-[#f7e5eb] p-3 text-xs text-[#6f2942]">{passwordMessage}</p>}<button className="min-h-10 rounded-xl border border-[#d86f91] bg-white px-4 text-sm font-semibold text-[#a84e6c] transition hover:bg-[#fff4f7]" type="submit">Change password</button></form></div>
   </AdminPanel>
  </div>
 </div>;
}
