import {getPublicApp} from "@wiffeyyyy/content";
import {AppExperience} from "@wiffeyyyy/ui/app-experience";
export default async function Preview({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const app=getPublicApp(slug);if(!app)return <div>Preview not found</div>;return <AppExperience app={app}/>;}
