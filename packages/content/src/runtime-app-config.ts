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
 vault:{schemaVersion:1,slug:'vault',eyebrow:'A LOVE STORY, KEPT SAFE',title:'The most precious things stay close.',subtitle:'Our story. Protected by a memory only we share.',question:'What’s my favourite memory about us?',placeholder:'Write your memory…',unlockLabel:'Unlock our story',unlockingLabel:'Opening our story…',errorLabel:'That memory did not unlock the vault. Try the way you remember it.',backLabel:'‹ Home',footnote:'One memory. A key only we share.',background:'#100b0e',surface:'#1a1116',text:'#f8eff2',accent:'#d6a6b4'},
 pieces:{schemaVersion:1,slug:'pieces',appTitle:'Pieces of Us',subtitle:'We fit together.',instructions:'Piece by piece, bring us together. Your surprise waits after all three memories.',shuffleLabel:'Peek',resetLabel:'Restart this level',completionTitle:'Our three memories, complete.',completionBody:'A little promise is waiting for you.',giftLabel:'Open my mysterious gift ♡',puzzleImage:'',background:'#f3e8d7',surface:'#fffaf2',text:'#46362e',accent:'#c8848f'}
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
