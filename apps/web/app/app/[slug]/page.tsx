import {notFound} from "next/navigation";
import {getPublicApp} from "@wiffeyyyy/content";
import {AppExperience} from "@wiffeyyyy/ui/app-experience";
export default async function AppPage({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const app=getPublicApp(slug);if(!app)notFound();return <AppExperience app={app}/>;}
