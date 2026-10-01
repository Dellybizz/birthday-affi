import { getPublishedDocument } from '../lib/cms';
import { CMSRenderer } from '@wiffeyyyy/ui/cms-renderer';
import { Welcome } from '../components/welcome';
export const dynamic='force-dynamic';
export default async function WelcomePage(){const document=await getPublishedDocument('welcome');return <Welcome content={document?<CMSRenderer document={document} embedded/>:undefined}/>}
