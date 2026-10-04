export const runtimeAppConfigSlugs=['camera','vault','pieces'] as const;
export type RuntimeAppConfigSlug=typeof runtimeAppConfigSlugs[number];

type BaseRuntimeConfig={schemaVersion:1;slug:RuntimeAppConfigSlug;background:string;surface:string;text:string;accent:string};
export type CameraRuntimeConfig=BaseRuntimeConfig&{
 slug:'camera';appTitle:string;permissionTitle:string;permissionBody:string;enableLabel:string;retryLabel:string;openingLabel:string;photoLabel:string;videoLabel:string;galleryTitle:string;galleryEmptyTitle:string;galleryEmptyBody:string;savedLabel:string;pardanasheenLabel:string;gridDefault:boolean;
};
export type VaultRuntimeConfig=BaseRuntimeConfig&{
 slug:'vault';eyebrow:string;title:string;subtitle:string;question:string;placeholder:string;unlockLabel:string;unlockingLabel:string;errorLabel:string;backLabel:string;footnote:string;
};
export type PiecesRuntimeConfig=BaseRuntimeConfig&{
 slug:'pieces';appTitle:string;subtitle:string;instructions:string;shuffleLabel:string;resetLabel:string;completionTitle:string;completionBody:string;giftLabel:string;puzzleImage:string;
};
export type RuntimeAppConfig=CameraRuntimeConfig|VaultRuntimeConfig|PiecesRuntimeConfig;

export const defaultRuntimeAppConfigs:{camera:CameraRuntimeConfig;vault:VaultRuntimeConfig;pieces:PiecesRuntimeConfig}={
 camera:{schemaVersion:1,slug:'camera',appTitle:'Clicksara',permissionTitle:'A little moment, captured.',permissionBody:'Photos and videos save automatically to the Camera album in Pardanasheen on this device.',enableLabel:'Enable camera',retryLabel:'Try again',openingLabel:'Opening camera…',photoLabel:'PHOTO',videoLabel:'VIDEO',galleryTitle:'Camera roll',galleryEmptyTitle:'Your moments start here.',galleryEmptyBody:'Take a photo and it will appear here and in Pardanasheen’s Camera album.',savedLabel:'Automatically saved to Pardanasheen · Camera',pardanasheenLabel:'Open in Pardanasheen ↗',gridDefault:true,background:'#000000',surface:'#171717',text:'#ffffff',accent:'#ffd60a'},
 vault:{schemaVersion:1,slug:'vault',eyebrow:'Private archive',title:'Vault',subtitle:'One memory unlocks what I kept here for you.',question:'Which little memory belongs to us?',placeholder:'Type the memory…',unlockLabel:'Unlock',unlockingLabel:'Unlocking…',errorLabel:'That memory did not unlock the vault. Try the way you remember it.',backLabel:'Back to Wiffeyyyy OS',footnote:'Only you should know the answer.',background:'#0b0a12',surface:'#171522',text:'#f8f4ff',accent:'#c8a8ff'},
 pieces:{schemaVersion:1,slug:'pieces',appTitle:'Pieces of Us',subtitle:'Put the little pieces back together.',instructions:'Move the pieces until the picture feels whole again.',shuffleLabel:'Shuffle',resetLabel:'Reset',completionTitle:'You found us.',completionBody:'Somehow every little piece still leads back to you.',giftLabel:'Open your little reward',puzzleImage:'',background:'#f5eee8',surface:'#fffaf7',text:'#403532',accent:'#d86f91'}
};

const colors=['background','surface','text','accent'] as const;
const isHex=(value:unknown)=>typeof value==='string'&&/^#[0-9a-f]{6}$/i.test(value);
function exactObject(input:unknown,defaults:Record<string,unknown>){
 if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('Invalid runtime app settings');
 const value=input as Record<string,unknown>,keys=Object.keys(defaults);
 if(Object.keys(value).length!==keys.length||keys.some(key=>!Object.hasOwn(value,key)))throw new Error('Unknown or missing runtime app settings');
 return value;
}
function parseAgainst<T extends RuntimeAppConfig>(input:unknown,defaults:T):T{
 const value=exactObject(input,defaults as unknown as Record<string,unknown>);
 if(value.schemaVersion!==1||value.slug!==defaults.slug)throw new Error('Unsupported runtime app settings');
 for(const [key,expected] of Object.entries(defaults)){
  if(key==='schemaVersion')continue;
  if(typeof value[key]!==typeof expected)throw new Error('Invalid '+key);
  if(typeof expected==='string'&&String(value[key]).length>(key==='permissionBody'||key==='instructions'||key==='completionBody'||key==='subtitle'?1000:240))throw new Error(key+' is too long');
 }
 for(const key of colors)if(!isHex(value[key]))throw new Error('Invalid '+key);
 if(defaults.slug==='pieces'&&String(value.puzzleImage)&&!String(value.puzzleImage).startsWith('/')&&!/^https:\/\//.test(String(value.puzzleImage)))throw new Error('Invalid puzzle image');
 return structuredClone(value) as T;
}
export function isRuntimeAppConfigSlug(value:string):value is RuntimeAppConfigSlug{return (runtimeAppConfigSlugs as readonly string[]).includes(value)}
export function defaultRuntimeAppConfig(slug:RuntimeAppConfigSlug):RuntimeAppConfig{return structuredClone(defaultRuntimeAppConfigs[slug])}
export function parseRuntimeAppConfig(slug:RuntimeAppConfigSlug,input:unknown):RuntimeAppConfig{return parseAgainst(input,defaultRuntimeAppConfigs[slug] as RuntimeAppConfig)}
