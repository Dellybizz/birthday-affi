import {birthdayInstant,birthdayPassword,defaultSiteDocument} from '@wiffeyyyy/content';
import {getPublishedSiteConfiguration} from '../../lib/cms';
import {countdownSource} from '../../lib/countdown-source';
export const dynamic='force-dynamic';
export const metadata={title:'Birthday countdown · Wiffeyyyy OS'};
export default async function CountdownPage(){
 const site=await getPublishedSiteConfiguration();
 const config=JSON.stringify({name:site.name||'Sara',nickname:site.nickname===defaultSiteDocument.nickname?'Sara':site.nickname,birthdayISO:birthdayInstant(site.birthdate,site.birthtime,site.timezone),birthdayPassword:birthdayPassword(site.birthdate)}).replace(/</g,'\\u003c');
 return <iframe title="Birthday countdown" srcDoc={countdownSource.replace('__COUNTDOWN_CONFIG__',config)} style={{position:'fixed',inset:0,width:'100%',height:'100%',border:0,zIndex:100}}/>;
}
