export const vaultMotifs=['notebook','letters','touch','seat','dua','shawl','future'] as const;
export type VaultChapter={id:string;title:string;period:string;motif:typeof vaultMotifs[number];keepsake:string;quote:string;body:string;noteTitle:string;note:string};
export type VaultStory={title:string;subtitle:string;dedication:string;chapters:VaultChapter[]};
export type VaultConfiguration={answers:string[];story:VaultStory};
const object=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value);
export function parseVaultStory(value:unknown):VaultStory{
 if(!object(value)||Object.keys(value).some(k=>!['title','subtitle','dedication','chapters'].includes(k)))throw new Error('Invalid story');
 for(const key of ['title','subtitle','dedication'])if(typeof value[key]!=='string'||String(value[key]).length>2000)throw new Error('Invalid story '+key);
 if(!Array.isArray(value.chapters)||value.chapters.length<1||value.chapters.length>30)throw new Error('Use between 1 and 30 chapters');
 const ids=new Set<string>();for(const chapter of value.chapters){if(!object(chapter)||Object.keys(chapter).some(k=>!['id','title','period','motif','keepsake','quote','body','noteTitle','note'].includes(k)))throw new Error('Invalid chapter');for(const key of ['id','title','period','motif','keepsake','quote','body','noteTitle','note'])if(typeof chapter[key]!=='string'||String(chapter[key]).length>(['body','note'].includes(key)?20000:2000))throw new Error('Invalid chapter '+key);if(!/^[a-zA-Z0-9_-]{1,100}$/.test(String(chapter.id))||ids.has(String(chapter.id))||!vaultMotifs.includes(chapter.motif as never))throw new Error('Invalid chapter identity or motif');ids.add(String(chapter.id));}
 return structuredClone(value) as VaultStory;
}
export function parseVaultConfiguration(value:unknown):VaultConfiguration{if(new TextEncoder().encode(JSON.stringify(value)??'').byteLength>900000||!object(value)||Object.keys(value).some(k=>!['answers','story'].includes(k))||!Array.isArray(value.answers)||value.answers.length>20||value.answers.some(a=>typeof a!=='string'||!a.trim()||!/[\p{L}\p{N}]/u.test(a)||a.length>160))throw new Error('Use up to 20 answers, each between 1 and 160 characters');return {answers:value.answers.map(a=>a.trim()),story:parseVaultStory(value.story)}}
