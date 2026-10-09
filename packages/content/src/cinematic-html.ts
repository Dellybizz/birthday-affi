import {birthdayInstant,birthdayPassword} from './birthday-settings';
import {defaultSiteDocument,type SiteDocument} from './site-document';
import {resolveCinematicSettings,defaultCinematicSettings} from './cinematic-settings';
import {countdownSource} from './countdown-source';
import {finalReelSource} from './final-reel-source';
const json=(value:unknown)=>JSON.stringify(value).replace(/</g,'\\u003c');
export function renderCountdownHtml(site:SiteDocument,preview?:{seconds:number;view:'before'|'after';access?:boolean}){
 const cinematic=resolveCinematicSettings(site);
 return countdownSource.replace('__COUNTDOWN_CONFIG__',json({name:site.name||'Sara',nickname:site.nickname===defaultSiteDocument.nickname?'Sara':site.nickname,birthdayISO:birthdayInstant(site.birthdate,site.birthtime,site.timezone),birthdayPassword:birthdayPassword(site.birthdate),pages:{countdown:cinematic.countdown},editorPreview:Boolean(preview),previewSeconds:preview?.seconds,previewView:preview?.view,previewAccess:preview?.access})).replace('</body>',preview?`<script>document.addEventListener('click',event=>{if(event.target.closest('a'))event.preventDefault();});if(window.SITE_CONFIG.previewAccess)document.getElementById('birthdayLock')?.click();</script></body>`:'</body>');
}
export function renderFinalReelHtml(site:SiteDocument,photo?:string,previewScene?:number){
 const reel=resolveCinematicSettings(site).reel;
 return finalReelSource.replace('__FINAL_REEL_CONFIG__',json({nickname:site.nickname,favoritePhoto:reel.favoritePhoto||photo||null,reel:{...reel,copy:reel.copy.filter((field,i)=>field.text!==defaultCinematicSettings.reel.copy[i].text||field.text.includes('{nickname}'))},editorPreview:previewScene!==undefined,previewScene})).replace('</body>',previewScene!==undefined?`<style>[data-reel-field]:hover{outline:1px dashed #e7c9a3;outline-offset:6px;cursor:pointer}</style><script>document.addEventListener('click',event=>{const field=event.target.closest('[data-reel-field]');if(field)parent.postMessage({type:'cinematic:select',key:field.dataset.reelField,scene:Number(field.closest('.scene').id.replace('scene',''))},'*');if(event.target.closest('a'))event.preventDefault();});</script></body>`:'</body>');
}
