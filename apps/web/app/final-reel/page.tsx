import {FinalReel} from '../../components/final-reel';
import {renderFinalReelHtml} from '@wiffeyyyy/content';
import {getPublishedSiteConfiguration,getPublishedDocument} from '../../lib/cms';
export const dynamic='force-dynamic';
export const metadata={title:'Final Reel · Wiffeyyyy OS'};
export default async function FinalReelPage(){
 const [settings,heart]=await Promise.all([getPublishedSiteConfiguration(),getPublishedDocument('in-my-heart')]);
 const photo=heart?.nodes.find(n=>n.visible&&n.component==='image'&&typeof n.props.src==='string'&&/^\/(media|puzzles)\//.test(n.props.src))?.props.src;
 return <FinalReel html={renderFinalReelHtml(settings,photo?String(photo):undefined)}/>;
}
