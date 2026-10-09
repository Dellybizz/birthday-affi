import {CountdownFrame} from '../../components/countdown-frame';
import {renderCountdownHtml} from '@wiffeyyyy/content';
import {getPublishedSiteConfiguration} from '../../lib/cms';
export const revalidate=10;
export const metadata={title:'Birthday countdown · Wiffeyyyy OS'};
export default async function CountdownPage(){
 const site=await getPublishedSiteConfiguration();
 return <CountdownFrame html={renderCountdownHtml(site)}/>;
}
