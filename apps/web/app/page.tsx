import {getPublishedDocument,getPublicPageInfo} from '../lib/cms';
import {CMSRenderer} from '@wiffeyyyy/ui/cms-renderer';
import {createMemoriesArchive} from '@wiffeyyyy/content';
export const revalidate=10;
export default async function WelcomePage(){let i=0;const document=await getPublishedDocument('memories-archive');return <main className="os-archive-page"><CMSRenderer persistProgress document={document??createMemoriesArchive(()=> 'archive-'+(++i))} embedded/></main>}
export async function generateMetadata(){const info=await getPublicPageInfo('memories-archive');return info?{title:info.metadata.title,description:info.metadata.description}:{title:'Memories Archive · Wiffeyyyy OS'};}
