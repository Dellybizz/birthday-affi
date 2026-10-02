import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import ts from 'typescript';
const nodeRequire=createRequire(import.meta.url),cache=new Map();
function load(file){if(cache.has(file))return cache.get(file);const module={exports:{}};const require=name=>name==='server-only'?{}:name.startsWith('node:')?nodeRequire(name):load(path.resolve(path.dirname(file),name)+'.ts');new Function('require','module','exports',ts.transpile(fs.readFileSync(file,'utf8'),{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}))(require,module,module.exports);cache.set(file,module.exports);return module.exports}
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
test('Only a correct server-checked answer receives story content',{skip:!expected&&'Set VAULT_TEST_ANSWER to test a successful unlock'},async()=>{
 const locked=await api.POST(request('first kiss'));assert.equal(locked.status,401);const error=await locked.json();assert.equal(error.story,undefined);assert.doesNotMatch(JSON.stringify(error),/How I fell/);assert.equal(JSON.stringify(error).includes(expected),false);
 const unlocked=await api.POST(request(expected));assert.equal(unlocked.status,200);const content=await unlocked.json();assert.equal(content.story.title,'How I fell in love with you');assert.deepEqual(content.story.chapters,[]);assert.match(unlocked.headers.get('cache-control'),/no-store/);
});
test('Cross-site and oversized unlock requests are rejected',async()=>{
 assert.equal((await api.POST(request('guess',{headers:{origin:'https://other.example'}}))).status,403);
 const large=new Request('https://wiffeyyyy-os.vercel.app/api/vault',{method:'POST',headers:{origin:'https://wiffeyyyy-os.vercel.app','content-type':'application/json'},body:'x'.repeat(1200)});assert.equal((await api.POST(large)).status,413);
});
test('Vault client never receives the answer matcher or private story at build time',()=>{
 const client=fs.readFileSync('apps/web/app/app/vault/vault-client.tsx','utf8'),page=fs.readFileSync('apps/web/app/app/vault/page.tsx','utf8');assert.doesNotMatch(client,/matchesVaultAnswer|getVaultStory/);assert.doesNotMatch(page,/getVaultStory|matchesVaultAnswer/);assert.match(client,/import type \{VaultStory\}/);if(expected)assert.equal(client.includes(expected),false);
});
