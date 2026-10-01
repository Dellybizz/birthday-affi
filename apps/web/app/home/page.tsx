import { getPublishedDocument } from '../../lib/cms';
import { CMSRenderer } from '@wiffeyyyy/ui/cms-renderer';
import { HomeScreen } from '../../components/home-screen';
export const dynamic='force-dynamic';
export default async function Home(){const document=await getPublishedDocument('home');return document?<main className="os-home"><CMSRenderer document={document} embedded/></main>:<HomeScreen/>}
