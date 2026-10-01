import {notFound} from 'next/navigation';
import {CMSRenderer} from '@wiffeyyyy/ui/cms-renderer';
import {getPublishedDocument} from '../../../lib/cms';
export const dynamic='force-dynamic';
export default async function CustomPage({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;const document=await getPublishedDocument(slug);
 if(!document)notFound();
 return <main className="os-home"><CMSRenderer document={document} embedded/></main>;
}
