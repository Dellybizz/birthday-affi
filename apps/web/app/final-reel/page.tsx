import {FinalReel} from '../../components/final-reel';
import {finalReelSource} from '../../lib/final-reel-source';
import {getPublishedSiteConfiguration,getPublishedDocument} from '../../lib/cms';
export const dynamic='force-dynamic';
export const metadata={title:'Final Reel · Wiffeyyyy OS'};
export default async function FinalReelPage(){
 const [settings,heart]=await Promise.all([getPublishedSiteConfiguration(),getPublishedDocument('in-my-heart')]);
 const photo=heart?.nodes.find(n=>n.visible&&n.component==='image'&&typeof n.props.src==='string'&&/^\/(media|puzzles)\//.test(n.props.src))?.props.src;
 const config=JSON.stringify({nickname:settings.nickname,favoritePhoto:photo?String(photo):null}).replace(/</g,'\\u003c');
 return <FinalReel html={finalReelSource.replace('__FINAL_REEL_CONFIG__',config)}/>;
}
