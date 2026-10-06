import {parseOsSettings,type OsSettings} from './os-settings';
export const defaultSiteDocument={schemaVersion:1,name:'',nickname:'favourite person',birthdate:'',timezone:'Asia/Kolkata',siteTitle:'Wiffeyyyy OS',greeting:'Happy birthday',welcomeMessage:'A few little things to make you smile. A whole lot of love, tucked inside.',enterLabel:'Open your birthday world',background:'#fbf5ef',surface:'#fffaf7',text:'#403532',accent:'#a9476b',radius:24,defaultVolume:1,defaultMuted:false};
export type SiteDocument=typeof defaultSiteDocument & {os?:OsSettings};
export function parseSiteDocument(input:unknown):SiteDocument{
 if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('Invalid site settings');
 const value=input as Record<string,unknown>,keys=Object.keys(defaultSiteDocument);
 if(Object.keys(value).filter(key=>key!=='os').length!==keys.length||keys.some(k=>!Object.hasOwn(value,k)))throw new Error('Unknown or missing settings');
 for(const key of keys){if(typeof value[key]!==typeof defaultSiteDocument[key as keyof typeof defaultSiteDocument])throw new Error('Invalid '+key);}
 if(value.schemaVersion!==1)throw new Error('Unsupported settings version');
 for(const key of ['name','nickname','siteTitle','greeting','enterLabel'])if(String(value[key]).length>120)throw new Error(key+' is too long');
 if(!String(value.nickname).trim()||!String(value.siteTitle).trim()||String(value.welcomeMessage).length>2000)throw new Error('Invalid personal copy');
 if(value.birthdate!==''&&(!/^\d{4}-\d{2}-\d{2}$/.test(String(value.birthdate))||new Date(String(value.birthdate)+'T00:00:00Z').toISOString().slice(0,10)!==value.birthdate))throw new Error('Invalid birthdate');
 try{new Intl.DateTimeFormat('en',{timeZone:String(value.timezone)});}catch{throw new Error('Invalid timezone');}
 for(const key of ['background','surface','text','accent'])if(!/^#[0-9a-f]{6}$/i.test(String(value[key])))throw new Error('Invalid '+key);
 if(!Number.isFinite(value.radius)||Number(value.radius)<0||Number(value.radius)>64||!Number.isFinite(value.defaultVolume)||Number(value.defaultVolume)<0||Number(value.defaultVolume)>1)throw new Error('Invalid theme/audio value');
 if(Object.hasOwn(value,'os'))parseOsSettings(value.os);
 return structuredClone(value) as SiteDocument;
}

