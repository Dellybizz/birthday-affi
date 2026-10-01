import { getPublishedDocument } from '../lib/cms';
import { CMSRenderer } from '@wiffeyyyy/ui/cms-renderer';
import {createDefaultPage} from '@wiffeyyyy/content';
export const dynamic='force-dynamic';
export default async function WelcomePage(){const document=await getPublishedDocument('welcome');return <main className="os-home">{!document&&<p className="mb-5 rounded-2xl border p-3 text-xs">Sample layout — personal messages and media have not been published yet.</p>}<CMSRenderer persistProgress document={document??createDefaultPage('welcome')} embedded/></main>}

export async function generateMetadata(){const {getPublicPageInfo}=await import('../lib/cms');const info=await getPublicPageInfo('welcome');return info?{title:info.metadata.title,description:info.metadata.description}:{};}
