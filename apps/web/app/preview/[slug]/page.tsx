import { notFound } from 'next/navigation';
import { getPublishedDocument } from '../../../lib/cms';
import { CMSRenderer } from '@wiffeyyyy/ui/cms-renderer';
export default async function Preview({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const document=await getPublishedDocument(slug);if(!document)notFound();return <CMSRenderer document={document as any}/>;}
