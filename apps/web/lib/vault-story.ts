import 'server-only';
import {parseVaultStory} from '@wiffeyyyy/content';
export type {VaultChapter,VaultStory} from '@wiffeyyyy/content';
import type {VaultStory} from '@wiffeyyyy/content';
export class VaultAnswerRejected extends Error {}
// Personal chapters live in a private database table, never in the source or client bundle.
// The database independently checks the memory before returning any content.
export async function getVaultStory(answer:string):Promise<VaultStory>{
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!url||!key)throw new Error('Story unavailable');
 const response=await fetch(`${url}/rest/v1/rpc/unlock_vault_story`,{
  method:'POST',headers:{apikey:key,'Content-Type':'application/json'},
  body:JSON.stringify({p_site_slug:process.env.NEXT_PUBLIC_SITE_SLUG??'wiffeyyyy-os',p_answer:answer}),
  cache:'no-store',signal:AbortSignal.timeout(10000)
 });
 if(!response.ok)throw new Error('Story unavailable');
 const story=await response.json();
 if(story===null)throw new VaultAnswerRejected('Answer rejected');
 return parseVaultStory(story);
}
