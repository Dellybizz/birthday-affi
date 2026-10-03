import Link from 'next/link';
import {activeDocumentExperiences} from '@wiffeyyyy/content';
import {AdminPageHeader,AdminPanel} from '../components/admin-page-header';
import {requireAdmin} from '../lib/auth';
import {adminDb} from '../lib/supabase';
import {summarizeControlPanel,type PublicationState,type ControlPanelPage} from '../lib/control-panel';

export const dynamic='force-dynamic';

const statePresentation:Record<PublicationState,{label:string;className:string;detail:string}>={
 published:{label:'Published',className:'bg-emerald-50 text-emerald-700 ring-emerald-600/15',detail:'Draft matches the published version.'},
 changed:{label:'Unpublished changes',className:'bg-amber-50 text-amber-800 ring-amber-600/15',detail:'A published version is live, with newer draft changes.'},
 draft:{label:'Draft only',className:'bg-[#f7e7ed] text-[#9b4361] ring-[#d86f91]/20',detail:'No CMS version has been published yet.'},
 missing:{label:'Missing record',className:'bg-red-50 text-red-700 ring-red-600/15',detail:'The canonical experience has no editable page record.'},
 broken:{label:'Pointer issue',className:'bg-red-50 text-red-700 ring-red-600/15',detail:'A published pointer does not resolve to its version.'}
};

function StatusPill({state}:{state:PublicationState}){const presentation=statePresentation[state];return <span title={presentation.detail} className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${presentation.className}`}>{presentation.label}</span>}
function StatCard({label,value,caption}:{label:string;value:string|number;caption:string}){return <AdminPanel className="p-5"><p className="text-xs font-medium text-[#81756f]">{label}</p><p className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-[#302a28]">{value}</p><p className="mt-1 text-xs leading-5 text-[#998c86]">{caption}</p></AdminPanel>}
function formatDate(value:string|null|undefined){if(!value)return 'Never';const date=new Date(value);return Number.isNaN(date.getTime())?'Unknown':new Intl.DateTimeFormat('en-IN',{dateStyle:'medium',timeStyle:'short'}).format(date)}
function absoluteLiveHref(base:string,path:string|null){if(!base||!path)return null;return base+(path==='/'?'':path)}

export default async function AdminHome(){
 const admin=await requireAdmin();
 const db=await adminDb();
 const siteSlug=process.env.NEXT_PUBLIC_SITE_SLUG??'wiffeyyyy-os';
 const publicSiteUrl=(process.env.NEXT_PUBLIC_WEB_URL??'').trim().replace(/\/+$/,'');
 const {data:site,error:siteError}=await db.from('sites').select('id,slug').eq('slug',siteSlug).single();
 if(siteError||!site)throw new Error('Unable to load site');

 const [pagesResult,configurationResult,navigationResult,mediaResult,releasesResult]=await Promise.all([
  db.from('pages').select('id,slug,title,settings,draft_document,published_version_id,draft_revision,updated_at').eq('site_id',site.id).order('slug'),
  db.from('site_configurations').select('draft,revision,published_id').eq('site_id',site.id).maybeSingle(),
  db.from('site_navigation').select('draft,revision,published_id').eq('site_id',site.id).maybeSingle(),
  db.from('media_assets').select('id',{count:'exact',head:true}).eq('site_id',site.id).is('archived_at',null),
  db.from('site_releases').select('release_number,created_at',{count:'exact'}).eq('site_id',site.id).order('release_number',{ascending:false}).limit(1)
 ]);
 if(pagesResult.error)throw new Error('Unable to load page status');
 if(configurationResult.error)throw new Error('Unable to load site settings status');
 if(navigationResult.error)throw new Error('Unable to load navigation status');
 if(mediaResult.error)throw new Error('Unable to load media status');
 if(releasesResult.error)throw new Error('Unable to load release history');
 const pages=(pagesResult.data??[]) as ControlPanelPage[];

 const publishedIds=pages.map(page=>page.published_version_id).filter((id):id is string=>Boolean(id));
 const publishedDocuments:Record<string,unknown>={};
 if(publishedIds.length){
  const {data,error}=await db.from('page_versions').select('id,document').in('id',publishedIds);
  if(error)throw new Error('Unable to load published page versions');
  for(const row of data??[])publishedDocuments[row.id]=row.document;
 }

 let configurationPublishedDocument:unknown|undefined;
 const configuration=configurationResult.data;
 if(configuration?.published_id){
  const {data,error}=await db.from('site_configuration_versions').select('document').eq('id',configuration.published_id).maybeSingle();
  if(error)throw new Error('Unable to load published site configuration');
  configurationPublishedDocument=data?.document;
 }
 let navigationPublishedDocument:unknown|undefined;
 const navigation=navigationResult.data;
 if(navigation?.published_id){
  const {data,error}=await db.from('navigation_versions').select('document').eq('id',navigation.published_id).maybeSingle();
  if(error)throw new Error('Unable to load published navigation');
  navigationPublishedDocument=data?.document;
 }

 const latestRelease=(releasesResult.data??[])[0]??null;
 const summary=summarizeControlPanel({
  activeExperiences:activeDocumentExperiences.map(experience=>({slug:experience.slug,title:experience.title,livePath:experience.livePath})),
  pages,
  publishedDocuments,
  configuration:configuration?{draft:configuration.draft,publishedId:configuration.published_id,publishedDocument:configurationPublishedDocument,revision:Number(configuration.revision)}:null,
  navigation:navigation?{draft:navigation.draft,publishedId:navigation.published_id,publishedDocument:navigationPublishedDocument,revision:Number(navigation.revision)}:null,
  mediaCount:mediaResult.count??0,
  releaseCount:releasesResult.count??0,
  lastRelease:latestRelease?{release_number:Number(latestRelease.release_number),created_at:latestRelease.created_at}:null
 });

 return <div>
  <AdminPageHeader eyebrow="Overview" title="Dashboard" description="A single view of what is published, what still has draft changes, and where to manage every part of Wiffeyyyy OS." actions={<Link href="/pages" className="inline-flex min-h-10 items-center rounded-xl border border-black/10 bg-white px-4 text-sm font-semibold text-[#4f4541] shadow-sm hover:bg-[#faf8f7]">Manage pages</Link>}/>

  {summary.unpublishedChanges>0&&<div className="mb-6 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5 text-sm text-amber-950 sm:flex-row sm:items-center sm:justify-between"><div><span className="font-semibold">{summary.unpublishedChanges} unpublished workspace{summary.unpublishedChanges===1?'':'s'}.</span> Drafts are safe; F1 does not publish them automatically.</div><Link href="/pages" className="font-semibold underline decoration-amber-400 underline-offset-4">Review content</Link></div>}

  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
   <StatCard label="CMS publication" value={`${summary.publishedPages}/${summary.activePages}`} caption="Canonical experiences with a valid published CMS version"/>
   <StatCard label="Unpublished work" value={summary.unpublishedChanges} caption="Page, navigation or site-setting workspaces ahead of live"/>
   <StatCard label="Media assets" value={summary.mediaCount} caption="Active assets available to the visual editor and apps"/>
   <StatCard label="Site releases" value={summary.releaseCount} caption={summary.lastRelease?`Latest snapshot #${summary.lastRelease.release_number}`:'Release manifests are ready for F2'}/>
  </div>

  <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,.8fr)]">
   <AdminPanel className="overflow-hidden">
    <div className="flex items-center justify-between border-b border-black/[.07] px-5 py-4"><div><h2 className="font-semibold text-[#302a28]">Publishing status</h2><p className="mt-1 text-xs text-[#887b75]">The eight canonical editable experiences from the F0 registry.</p></div><Link href="/pages" className="text-xs font-semibold text-[#a34a69] hover:underline">All page settings</Link></div>
    <div className="divide-y divide-black/[.06]">{summary.pages.map((page,index)=>{
     const liveHref=absoluteLiveHref(publicSiteUrl,page.livePath);
     return <div key={page.slug} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#f6f2f0] text-xs font-semibold text-[#796d67]">{index+1}</span><div className="min-w-0"><p className="truncate text-sm font-semibold text-[#3f3733]">{page.title}</p><p className="mt-0.5 truncate text-xs text-[#998c86]">{page.livePath??'No public route'}</p></div></div>
      <StatusPill state={page.state}/>
      <div className="flex items-center gap-2 text-xs font-semibold"><Link href={page.pageId?`/editor/${page.slug}`:'/pages'} className="rounded-lg border border-black/10 bg-white px-2.5 py-1.5 text-[#574c47] hover:bg-[#faf8f7]">{page.pageId?'Edit':'Repair'}</Link>{liveHref&&<a href={liveHref} target="_blank" rel="noreferrer" className="rounded-lg px-2.5 py-1.5 text-[#a34a69] hover:bg-[#fff1f5]">View</a>}</div>
     </div>;
    })}</div>
   </AdminPanel>

   <div className="space-y-6">
    <AdminPanel className="p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-medium uppercase tracking-[0.12em] text-[#978a84]">Backend health</p><h2 className="mt-1 text-lg font-semibold">{summary.healthy?'Canonical model healthy':'Needs attention'}</h2></div><span className={`mt-1 h-2.5 w-2.5 rounded-full ${summary.healthy?'bg-emerald-500':'bg-red-500'}`} aria-hidden="true"/></div><div className="mt-5 space-y-3 text-sm">
     <div className="flex items-center justify-between gap-3"><span className="text-[#746863]">Missing canonical pages</span><strong className={summary.missingPages?'text-red-700':'text-[#3f3733]'}>{summary.missingPages}</strong></div>
     <div className="flex items-center justify-between gap-3"><span className="text-[#746863]">Broken published pointers</span><strong className={summary.brokenPages?'text-red-700':'text-[#3f3733]'}>{summary.brokenPages}</strong></div>
     <div className="flex items-center justify-between gap-3"><span className="text-[#746863]">Custom active pages</span><strong className="text-[#3f3733]">{summary.customPages}</strong></div>
     <div className="flex items-center justify-between gap-3"><span className="text-[#746863]">Admin role</span><strong className="capitalize text-[#3f3733]">{admin.role}</strong></div>
    </div></AdminPanel>

    <AdminPanel className="overflow-hidden"><div className="border-b border-black/[.07] px-5 py-4"><h2 className="font-semibold">Site-wide state</h2></div><div className="divide-y divide-black/[.06]">
     <Link href="/settings" className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-[#fcfbfa]"><div><p className="text-sm font-semibold">Site settings</p><p className="mt-0.5 text-xs text-[#91847e]">Personalization, theme and audio</p></div><StatusPill state={summary.configurationState}/></Link>
     <Link href="/navigation" className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-[#fcfbfa]"><div><p className="text-sm font-semibold">Navigation</p><p className="mt-0.5 text-xs text-[#91847e]">Home grid and journeys</p></div><StatusPill state={summary.navigationState}/></Link>
     <div className="flex items-center justify-between gap-3 px-5 py-4"><div><p className="text-sm font-semibold">Release manifest</p><p className="mt-0.5 text-xs text-[#91847e]">Last snapshot: {formatDate(summary.lastRelease?.created_at)}</p></div><span className="text-sm font-semibold text-[#5b504b]">{summary.releaseCount}</span></div>
    </div></AdminPanel>
   </div>
  </div>

  <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
   {[{href:'/editor/home',title:'Visual editor',copy:'Open the Shopify-style page editor and preview.'},{href:'/media',title:'Media library',copy:'Upload and manage reusable images, video and audio.'},{href:'/navigation',title:'Navigation',copy:'Arrange the phone home grid and journey links.'},{href:'/hotline',title:'Hotline',copy:'Manage private caller and receiver links.'}].map(action=><Link key={action.href} href={action.href} className="group rounded-2xl border border-black/[.08] bg-white p-5 shadow-[0_1px_2px_rgba(53,43,39,.04)] transition hover:-translate-y-0.5 hover:shadow-md"><p className="text-sm font-semibold text-[#403733]">{action.title} <span className="inline-block transition-transform group-hover:translate-x-0.5">→</span></p><p className="mt-1.5 text-xs leading-5 text-[#8e817b]">{action.copy}</p></Link>)}
  </div>
 </div>;
}
