import 'server-only';
export type VaultChapter={id:string;title:string;period:string;motif:'notebook'|'letters'|'touch'|'seat'|'dua'|'shawl'|'future';keepsake:string;quote:string;body:string;noteTitle:string;note:string};
export type VaultStory={title:string;subtitle:string;dedication:string;chapters:VaultChapter[]};
// Personal chapters live in a private database table, never in the source or client bundle.
// The database independently checks the memory before returning any content.
export async function getVaultStory(answer:string):Promise<VaultStory>{
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!url||!key)throw new Error('Story unavailable');
 const response=await fetch(`${url}/rest/v1/rpc/unlock_vault_story`,{
  method:'POST',headers:{apikey:key,'Content-Type':'application/json'},
  body:JSON.stringify({p_site_slug:process.env.NEXT_PUBLIC_SITE_SLUG??'wiffeyyyy-os',p_answer:answer.normalize('NFKD').replace(/[\u0300-\u036f]/g,'')}),
  cache:'no-store',signal:AbortSignal.timeout(10000)
 });
 if(!response.ok)throw new Error('Story unavailable');
 const story=await response.json();
 if(!story||typeof story.title!=='string'||!Array.isArray(story.chapters)||story.chapters.length!==7||story.chapters.some((c:VaultChapter)=>!c||typeof c.body!=='string'||typeof c.note!=='string'))throw new Error('Story unavailable');
 return story as VaultStory;
}
