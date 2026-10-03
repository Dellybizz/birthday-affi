import { getPublishedDocument } from '../../lib/cms';
import { CMSRenderer } from '@wiffeyyyy/ui/cms-renderer';
import {createDefaultPage,installPhoneHome} from '@wiffeyyyy/content';
export const revalidate=10;
export default async function Home(){const document=await getPublishedDocument('home');const page=installPhoneHome(document??createDefaultPage('home'));return <main className="os-phone-home"><CMSRenderer persistProgress document={page} embedded/></main>}

export async function generateMetadata(){const {getPublicPageInfo}=await import('../../lib/cms');const info=await getPublicPageInfo('home');return info?{title:info.metadata.title,description:info.metadata.description}:{};}
