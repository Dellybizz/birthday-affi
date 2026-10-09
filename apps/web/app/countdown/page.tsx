import {renderCountdownHtml} from '@wiffeyyyy/content';
import {getPublishedSiteConfiguration} from '../../lib/cms';
export const dynamic='force-dynamic';
export const metadata={title:'Birthday countdown · Wiffeyyyy OS'};
export default async function CountdownPage(){
 const site=await getPublishedSiteConfiguration();
 return <iframe title="Birthday countdown" srcDoc={renderCountdownHtml(site)} style={{position:'fixed',inset:0,width:'100%',height:'100%',border:0,zIndex:100}}/>;
}
