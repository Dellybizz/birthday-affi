import {publishedPageMetadata} from '../../../lib/page-metadata';
import { getPublishedDocument } from '../../../lib/cms';
import { CMSRenderer } from '@wiffeyyyy/ui/cms-renderer';
export const revalidate=10;
import {notFound} from "next/navigation";
import {getPublicApp,createDefaultPage,isBuiltinPage} from "@wiffeyyyy/content";
export default async function AppPage({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const app=getPublicApp(slug);if(!app)notFound();const document=await getPublishedDocument(slug);if(document)return <main className={slug==='hotline'?'os-home os-hotline-page':(slug==='reasons'||slug==='adventure'||slug==='movie'||slug==='kiss-shop')?'os-home os-adore-page':'os-home'}>{!document&&slug!=='hotline'&&slug!=='reasons'&&slug!=='adventure'&&slug!=='movie'&&slug!=='kiss-shop'&&<p className="mb-5 rounded-2xl border p-3 text-xs">Sample layout — personal messages and media have not been published yet.</p>}<CMSRenderer persistProgress document={document} embedded/></main>;return isBuiltinPage(slug)?<main className={slug==='hotline'?'os-home os-hotline-page':(slug==='reasons'||slug==='adventure'||slug==='movie'||slug==='kiss-shop')?'os-home os-adore-page':'os-home'}>{!document&&slug!=='hotline'&&slug!=='reasons'&&slug!=='adventure'&&slug!=='movie'&&slug!=='kiss-shop'&&<p className="mb-5 rounded-2xl border p-3 text-xs">Sample layout — personal messages and media have not been published yet.</p>}<CMSRenderer persistProgress document={createDefaultPage(slug)} embedded/></main>:null;}


export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const {slug}=await params;return publishedPageMetadata(slug);}
