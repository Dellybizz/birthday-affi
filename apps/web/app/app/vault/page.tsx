import {CMSRenderer} from '@wiffeyyyy/ui/cms-renderer';
import {createRuntimeAppDocument} from '@wiffeyyyy/content';
import {getPublishedDocument} from '../../../lib/cms';
import {publishedPageMetadata} from '../../../lib/page-metadata';
export const revalidate=10;
export async function generateMetadata(){return {...await publishedPageMetadata('vault'),robots:{index:false,follow:false}}}
export default async function Page(){const document=await getPublishedDocument('vault')??createRuntimeAppDocument('vault');return <CMSRenderer document={document} persistProgress/>}
