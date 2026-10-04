import {getPublishedSiteConfiguration} from '../../lib/cms';
import {countdownSource} from '../../lib/countdown-source';

export const revalidate = 10;
export const metadata = {title: 'Until Your Birthday · Wiffeyyyy OS'};

export default async function CountdownPage() {
  const site = await getPublishedSiteConfiguration();
  const birthdayISO = site.birthdate
    ? (site.birthdate.includes('T') ? site.birthdate : `${site.birthdate}T00:00:00+05:30`)
    : '2026-10-10T00:00:00+05:30';
  const config = JSON.stringify({nickname: site.nickname || 'wiffeyyyy', birthdayISO}).replace(/</g, '\\u003c');
  const html = countdownSource.replace('__COUNTDOWN_CONFIG__', config);
  return <iframe title="Birthday countdown" srcDoc={html} style={{position:'fixed',inset:0,width:'100%',height:'100%',border:0,zIndex:100}} />;
}
