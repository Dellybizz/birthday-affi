import {HomeNavigation} from '../../components/home-navigation';
import {getPublicNavigation} from '../../lib/cms';
import { getPublishedDocument } from '../../lib/cms';
import { CMSRenderer } from '@wiffeyyyy/ui/cms-renderer';
import {createDefaultPage} from '@wiffeyyyy/content';
export const dynamic='force-dynamic';
export default async function Home(){const [document,navigation]=await Promise.all([getPublishedDocument('home'),getPublicNavigation()]);const page=document??createDefaultPage('home');return <main className="os-home">{!document&&<p className="mb-5 rounded-2xl border p-3 text-xs">Sample layout — personal messages and media have not been published yet.</p>}<CMSRenderer persistProgress document={page} embedded/>{navigation&&!page.nodes.some(n=>n.component==='app-grid')&&<HomeNavigation items={navigation}/>}</main>}

export async function generateMetadata(){const {getPublicPageInfo}=await import('../../lib/cms');const info=await getPublicPageInfo('home');return info?{title:info.metadata.title,description:info.metadata.description}:{};}
