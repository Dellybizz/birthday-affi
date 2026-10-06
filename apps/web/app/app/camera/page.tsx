import {CMSRenderer} from '@wiffeyyyy/ui/cms-renderer';
import {createRuntimeAppDocument} from '@wiffeyyyy/content';
import {getPublishedDocument} from '../../../lib/cms';
import {publishedPageMetadata} from '../../../lib/page-metadata';
export const revalidate=10;
export async function generateMetadata(){return publishedPageMetadata('camera')}
export default async function Page(){const document=await getPublishedDocument('camera')??createRuntimeAppDocument('camera');return <CMSRenderer document={document} persistProgress/>}
