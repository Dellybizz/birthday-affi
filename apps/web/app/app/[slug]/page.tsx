import { getPublishedDocument } from '../../../lib/cms';
import { CMSRenderer } from '@wiffeyyyy/ui/cms-renderer';
export const dynamic='force-dynamic';
import {notFound} from "next/navigation";
import {getPublicApp} from "@wiffeyyyy/content";
import {AppExperience} from "@wiffeyyyy/ui/app-experience";
export default async function AppPage({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const app=getPublicApp(slug);if(!app)notFound();const document=await getPublishedDocument(slug);if(document)return <main className="os-home"><CMSRenderer document={document} embedded/></main>;return <AppExperience app={app} embedded/>;}
