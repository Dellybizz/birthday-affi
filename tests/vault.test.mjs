import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import ts from 'typescript';
const nodeRequire=createRequire(import.meta.url),cache=new Map();
function load(file){if(cache.has(file))return cache.get(file);const module={exports:{}};const require=name=>name==='@wiffeyyyy/content'?load(path.resolve('packages/content/src/vault-contract.ts')):name==='server-only'?{}:name.startsWith('node:')?nodeRequire(name):load(path.resolve(path.dirname(file),name)+'.ts');new Function('require','module','exports',ts.transpile(fs.readFileSync(file,'utf8'),{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}))(require,module,module.exports);cache.set(file,module.exports);return module.exports}
const answer=load(path.resolve('apps/web/lib/vault-answer.ts')),api=load(path.resolve('apps/web/app/api/vault/route.ts'));
// Positive fixtures are supplied privately; do not publish the riddle answer in this repository.
const expected=process.env.VAULT_TEST_ANSWER;
const request=(value,options={})=>new Request('https://wiffeyyyy-os.vercel.app/api/vault',{method:'POST',headers:{origin:'https://wiffeyyyy-os.vercel.app','content-type':'application/json',...options.headers},body:JSON.stringify({answer:value})});
test('Vault accepts the private answer, natural rephrasing and punctuation',{skip:!expected&&'Set VAULT_TEST_ANSWER to run positive private fixtures'},()=>{
 const variants=JSON.parse(process.env.VAULT_TEST_VARIANTS||'[]');
 for(const value of [expected,expected.toUpperCase()+'!',`  ${expected}  `,...variants])assert.equal(answer.matchesVaultAnswer(value),true,`Rejected private variant`);
});
test('Vault rejects unrelated memories, empty or oversized answers',()=>{
 for(const value of ['our first kiss','someone else','a random memory','','one memory or another',null,{},'x'.repeat(161)])assert.equal(answer.matchesVaultAnswer(value),false);
 if(expected)assert.equal(answer.matchesVaultAnswer('not '+expected),false);
});
test('Only a correct server-checked answer receives story content',{skip:!expected&&'Set VAULT_TEST_ANSWER to test a successful unlock'},async(t)=>{
 const oldUrl=process.env.NEXT_PUBLIC_SUPABASE_URL,oldKey=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 process.env.NEXT_PUBLIC_SUPABASE_URL='https://test.supabase.co';process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY='test-public-key';
 t.after(()=>{if(oldUrl===undefined)delete process.env.NEXT_PUBLIC_SUPABASE_URL;else process.env.NEXT_PUBLIC_SUPABASE_URL=oldUrl;if(oldKey===undefined)delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;else process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=oldKey});
 const calls=[];t.mock.method(globalThis,'fetch',async(url,options)=>{calls.push({url,options});return Response.json({title:'How I fell in love with you',subtitle:'Test',dedication:'Test',chapters:Array.from({length:7},(_,i)=>({id:String(i),title:'Test',period:'Test',motif:'letters',keepsake:'Test',quote:'Test',body:'Test',noteTitle:'Test',note:'Test'}))})});
 const locked=await api.POST(request('first kiss'));assert.equal(locked.status,401);const error=await locked.json();assert.equal(error.story,undefined);assert.doesNotMatch(JSON.stringify(error),/How I fell/);assert.equal(JSON.stringify(error).includes(expected),false);
 const unlocked=await api.POST(request(expected));assert.equal(unlocked.status,200);const content=await unlocked.json();assert.equal(content.story.title,'How I fell in love with you');assert.equal(content.story.chapters.length,7);assert.equal(calls.length,1);assert.match(calls[0].url,/rpc\/unlock_vault_story$/);assert.equal(JSON.parse(calls[0].options.body).p_answer,expected);assert.equal(calls[0].options.cache,'no-store');assert.match(unlocked.headers.get('cache-control'),/no-store/);
});
test('Cross-site and oversized unlock requests are rejected',async()=>{
 assert.equal((await api.POST(request('guess',{headers:{origin:'https://other.example'}}))).status,403);
 const large=new Request('https://wiffeyyyy-os.vercel.app/api/vault',{method:'POST',headers:{origin:'https://wiffeyyyy-os.vercel.app','content-type':'application/json'},body:'x'.repeat(1200)});assert.equal((await api.POST(large)).status,413);
});
test('Vault client never receives the answer matcher or private story at build time',()=>{
 const client=fs.readFileSync('packages/ui/src/vault-app.tsx','utf8'),page=fs.readFileSync('apps/web/app/app/vault/page.tsx','utf8');assert.doesNotMatch(client,/matchesVaultAnswer|getVaultStory/);assert.doesNotMatch(page,/getVaultStory|matchesVaultAnswer/);assert.match(client,/type VaultStory/);if(expected)assert.equal(client.includes(expected),false);
});

test('Story delivery fails closed when the database refuses access',async(t)=>{
 const oldUrl=process.env.NEXT_PUBLIC_SUPABASE_URL,oldKey=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 process.env.NEXT_PUBLIC_SUPABASE_URL='https://test.supabase.co';process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY='test-public-key';
 t.after(()=>{if(oldUrl===undefined)delete process.env.NEXT_PUBLIC_SUPABASE_URL;else process.env.NEXT_PUBLIC_SUPABASE_URL=oldUrl;if(oldKey===undefined)delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;else process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=oldKey});
 const {getVaultStory}=load(path.resolve('apps/web/lib/vault-story.ts'));
 t.mock.method(globalThis,'fetch',async()=>Response.json(null));await assert.rejects(getVaultStory('incorrect'),/Answer rejected/);
 t.mock.method(globalThis,'fetch',async()=>Response.json({error:'denied'},{status:403}));await assert.rejects(getVaultStory('incorrect'),/unavailable/);
});
