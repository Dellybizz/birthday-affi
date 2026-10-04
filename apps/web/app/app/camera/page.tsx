import {CameraApp} from '@wiffeyyyy/ui/camera-app';
import {getPublishedRuntimeAppConfiguration} from '../../../lib/cms';
export const metadata={title:'Clicksara'};
export default async function CameraPage(){const config=await getPublishedRuntimeAppConfiguration('camera');return <CameraApp config={config.slug==='camera'?config:undefined}/>;}
