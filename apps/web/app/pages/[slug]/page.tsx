import {notFound,permanentRedirect} from 'next/navigation';
import {CMSRenderer} from '@wiffeyyyy/ui/cms-renderer';
import {parsePageDocument} from '@wiffeyyyy/content';
import {getPublicPageInfo} from '../../../lib/cms';
export const dynamic='force-dynamic';
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const {slug}=await params,info=await getPublicPageInfo(slug);return info?{title:info.metadata.title,description:info.metadata.description,alternates:{canonical:'/pages/'+info.slug}}:{};}
export default async function CustomPage({params}:{params:Promise<{slug:string}>}){const {slug}=await params,info=await getPublicPageInfo(slug);if(!info)notFound();if(info.slug!==slug)permanentRedirect('/pages/'+info.slug);return <main className="os-home"><CMSRenderer document={parsePageDocument(info.document)} embedded/></main>;}
