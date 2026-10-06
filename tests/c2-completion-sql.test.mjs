import {loadContentModule} from './load-content-module.mjs';
const osContent={...loadContentModule('packages/content/src/site-document.ts'),...loadContentModule('packages/content/src/os-settings.ts')};
import {execFileSync} from 'node:child_process';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {content as layoutContent,phone} from '../scripts/export-default-pages.mjs';
import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
let db;
const owner='00000000-0000-4000-8000-000000000001',editor='00000000-0000-4000-8000-000000000002',viewer='00000000-0000-4000-8000-000000000003';
const site='00000000-0000-4000-8000-000000000010',page='00000000-0000-4000-8000-000000000011',other='00000000-0000-4000-8000-000000000012';
const doc=text=>({schemaVersion:2,nodes:[{id:'s',type:'section',component:'section',parentId:null,props:{padding:20},visible:true,children:['t']},{id:'t',type:'block',component:'text',parentId:'s',props:{text},children:[],visible:true}],rootIds:['s']});
before(async()=>{
 db=new PGlite();await db.exec(`create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text,unique(bucket_id,name));alter table storage.objects enable row level security;create role anon nologin;create role authenticated nologin;create schema auth;create table auth.users(id uuid primary key);create table auth.sessions(id uuid primary key,user_id uuid references auth.users(id),not_after timestamptz);create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;create function auth.jwt() returns jsonb language sql stable as $$ select jsonb_build_object('session_id',nullif(current_setting('request.jwt.claim.session_id',true),'')) $$;grant usage on schema public,auth,storage to anon,authenticated;grant select,insert,update,delete on storage.objects to anon,authenticated;`);
 for(const file of readdirSync('supabase/migrations').filter(x=>x.endsWith('.sql')).sort())await db.exec(readFileSync('supabase/migrations/'+file,'utf8').replace('create extension if not exists pgcrypto;',''));
 await db.exec(`insert into auth.users values('${owner}'),('${editor}'),('${viewer}');insert into auth.sessions(id,user_id)select id,id from auth.users;insert into public.admin_users(id,role)values('${owner}','owner'),('${editor}','editor'),('${viewer}','viewer');insert into public.sites(id,name,slug,public_delivery_enabled)values('${site}','Test','phase5-test',true);`);
 await db.query('insert into public.site_navigation(site_id)values($1)',[site]);
 await db.query('insert into public.site_configurations(site_id)values($1)',[site]);
 for(const [id,slug] of [[page,'home'],[other,'other']])await db.query('insert into public.pages(id,site_id,slug,title,draft_document)values($1,$2,$3,$3,$4)',[id,site,slug,JSON.stringify(doc('Initial'))]);
});after(()=>db.close());
async function role(user){await db.exec('set local role authenticated');await db.query("select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claim.session_id',$1,true)",[user]);}
async function run(user,fn){await db.exec('begin');try{await role(user);await fn()}finally{await db.exec('rollback')}}
const save=async(userDoc,revision=0,id=page)=>(await db.query('select public.save_page_draft($1,$2,$3) result',[id,JSON.stringify(userDoc),revision])).rows[0].result;
const publish=async(revision,id=page)=>(await db.query('select public.publish_page($1,$2) result',[id,revision])).rows[0].result;
const rollback=async(version,revision,id=page)=>(await db.query('select public.rollback_page($1,$2,$3) result',[id,version,revision])).rows[0].result;
async function rejects(fn,pattern){await db.exec('savepoint rejected');try{await assert.rejects(fn,pattern)}finally{await db.exec('rollback to rejected;release savepoint rejected')}}
const live=async()=>(await db.query("select public.get_published_document('phase5-test','home') doc")).rows[0].doc;

const components=['reason','hotline-message','adventure-choice','movie-scene','kiss-gift','radio-track'];
const appDoc=component=>{const d=doc('App');d.nodes[1].component=component;d.nodes[1].props={title:'Personal title',body:'A personal message',src:'',category:'Together',price:'2 kisses',invitation:'It is a date.'};return d};
test('C2 navigation is private until published and rejects missing destinations and cycles',async()=>{
 await run(owner,async()=>{
  const item={id:'item',parentId:null,pageId:page,label:'Home',icon:'♡',description:'Hello',visible:true,startHere:true};
  await db.query('select public.change_navigation($1,$2,0,false)',[site,JSON.stringify([item])]);
  assert.equal((await db.query("select public.get_public_navigation('phase5-test') doc")).rows[0].doc,null);
  await db.query('select public.change_navigation($1,null,1,true)',[site]);
  assert.equal((await db.query("select public.get_public_navigation('phase5-test') doc")).rows[0].doc[0].href,'/home');
  await db.query('select public.change_navigation($1,$2,1,false)',[site,JSON.stringify([{...item,label:'Private'}])]);
  assert.equal((await db.query("select public.get_public_navigation('phase5-test') doc")).rows[0].doc[0].label,'Home');
 });
 await assert.rejects(()=>run(owner,()=>db.query('select public.change_navigation($1,$2,0,false)',[site,JSON.stringify([{id:'x',parentId:'x',pageId:null,label:'Cycle',icon:'',description:'',visible:true,startHere:false}])])));
});
test('C2 custom published rename resolves to one canonical route and metadata stays draft-isolated',async()=>{
 await run(owner,async()=>{
  await publish(0,other);
  await db.query("update public.pages set slug='new-other',title='Draft title',settings='{\"description\":\"Private description\"}' where id=$1",[other]);
  let info=(await db.query("select public.get_public_page_info('phase5-test','other') info")).rows[0].info;
  assert.equal(info.slug,'new-other');assert.equal(info.metadata.title,'other');
  await publish(1,other);
  info=(await db.query("select public.get_public_page_info('phase5-test','other') info")).rows[0].info;
  assert.equal(info.metadata.title,'Draft title');assert.equal(info.metadata.description,'Private description');
  await db.query("update public.pages set settings=settings||'{\"archived\":true}' where id=$1",[other]);
  assert.equal((await db.query("select public.get_public_page_info('phase5-test','other') info")).rows[0].info,null);
  assert.equal((await db.query("select public.get_published_document('phase5-test','new-other') doc")).rows[0].doc,null);
 });
});
test('C2 published navigation references prevent archive; editor cannot publish navigation',async()=>{
 await db.exec('begin;set local role anon');try{await assert.rejects(()=>db.query('select * from public.site_navigation'));}finally{await db.exec('rollback');}
 await assert.rejects(()=>run(editor,()=>db.query('select public.change_navigation($1,null,0,true)',[site])));
 await assert.rejects(()=>run(owner,async()=>{
  await publish(0,other);
  const item={id:'item',parentId:null,pageId:other,label:'Other',icon:'',description:'',visible:true,startHere:false};
  await db.query('select public.change_navigation($1,$2,0,false)',[site,JSON.stringify([item])]);
  await db.query("update public.pages set settings='{\"archived\":true}' where id=$1",[other]);
 }));
});

test('valid page theme saves regardless of the last layer property; invalid themes fail',async()=>{
 await run(owner,async()=>{
  const document=doc('Theme regression');document.theme={background:'#fbf5ef',primary:'#d86f91',radius:24};
  const result=await save(document);assert.equal(result.revision,1);
  await rejects(()=>save({...document,theme:{background:'invalid'}},1),/Invalid theme color/);
 });
});

test('complete default layouts save and publish with preserved private draft isolation',async()=>{await run(owner,async()=>{let revision=0;for(const slug of layoutContent.builtinPages){const document=layoutContent.createDefaultPage(slug);const saved=await save(document,revision);revision=saved.revision;const published=await publish(revision);assert.equal((await live()).layout.page,slug);}assert.ok(revision>=8);});});
test('new layout references and section kinds are validated at the database boundary',async()=>{await run(owner,async()=>{const document=layoutContent.createDefaultPage('movie');document.nodes.find(n=>n.component==='chapter').props.sceneId='missing';await rejects(()=>save(document),/Missing layout reference/);const invalid=layoutContent.createDefaultPage('home');invalid.nodes[0].props.sectionKind='unknown';await rejects(()=>save(invalid),/Invalid section kind/);});});

test('live installer aborts atomically on conflicts, backs up drafts and preserves published pointers',async()=>{
 const target=(await db.query("insert into public.sites(name,slug,public_delivery_enabled)values('Layout test','wiffeyyyy-os',true)returning id")).rows[0].id;
 for(const slug of layoutContent.builtinPages)await db.query('insert into public.pages(site_id,slug,title,draft_document)values($1,$2,$2,$3)',[target,slug,JSON.stringify(slug==='adventure'?doc('My existing content'):{schemaVersion:2,nodes:[],rootIds:[]})]);
 const directory=mkdtempSync(path.join(tmpdir(),'wiffeyyyy-layout-')),input=path.join(directory,'snapshot.json'),output=path.join(directory,'install.sql');
 const prepare=async()=>{const rows=(await db.query('select slug,draft_revision,draft_document from public.pages where site_id=$1',[target])).rows;writeFileSync(input,JSON.stringify(rows));execFileSync(process.execPath,['scripts/prepare-layout-install.mjs',input,output]);return readFileSync(output,'utf8')};
 try{
 const stale=await prepare();await db.query("update public.pages set title='Changed elsewhere' where site_id=$1 and slug='radio'",[target]);
 await assert.rejects(()=>db.exec(stale),/Draft changed/);await db.exec('rollback');
 assert.equal(Number((await db.query('select count(*) count from private.page_layout_backups')).rows[0].count),0);
 assert.equal(Number((await db.query("select count(*) count from public.pages where site_id=$1 and draft_document ? 'layout'",[target])).rows[0].count),0);
 const current=await prepare();await db.exec(current);assert.equal(Number((await db.query('select count(*) count from private.page_layout_backups')).rows[0].count),8);
 const adventure=(await db.query("select draft_document,published_version_id from public.pages where site_id=$1 and slug='adventure'",[target])).rows[0];assert.ok(adventure.draft_document.nodes.some(n=>n.props.text==='My existing content'));assert.equal(adventure.published_version_id,null);
 const revisions=(await db.query('select slug,draft_revision from public.pages where site_id=$1 order by slug',[target])).rows;await db.exec(current);assert.deepEqual((await db.query('select slug,draft_revision from public.pages where site_id=$1 order by slug',[target])).rows,revisions);
 }finally{rmSync(directory,{recursive:true,force:true})}
});

test('photo libraries reject incompatible blocks at the database boundary',async()=>{
 await run(owner,async()=>{
  const document=layoutContent.createDefaultPage('adventure');
  const item=document.nodes.find(n=>n.component==='image');
  item.component='text';item.props={text:'Not a library photo'};
  await rejects(()=>save(document),/Incompatible section block/);
 });
});

test('Android home saves and publishes through the existing SQL schema with wallpaper media and app icons',async()=>{
 await run(owner,async()=>{
  const document=phone.installPhoneHome(layoutContent.createDefaultPage('home'));
  const wallpaper=document.nodes.find(n=>n.props.phonePart==='wallpaper');wallpaper.props.src='https://example.com/wallpaper.jpg';
  const icon=document.nodes.find(n=>n.props.phonePart==='app-icon');icon.props.src='https://example.com/icon.jpg';
  const saved=await save(document);await publish(saved.revision);const published=await live();
  assert.equal(published.nodes.find(n=>n.id===wallpaper.id).props.src,wallpaper.props.src);
  assert.equal(published.nodes.find(n=>n.id===icon.id).props.pageSlug,icon.props.pageSlug);
 });
});

test('B2 runtime placement publishes safely and SEO stays private until a new publication',async()=>{
 await run(owner,async()=>{
  const item={id:'camera',parentId:null,pageId:null,runtimeSlug:'camera',placement:'dock',label:'Our camera',icon:'📷',description:'Capture us',visible:true,startHere:false};
  await db.query('select public.change_navigation($1,$2,0,false)',[site,JSON.stringify([item])]);
  await db.query('select public.change_navigation($1,null,1,true)',[site]);
  const nav=(await db.query("select public.get_public_navigation('phase5-test') doc")).rows[0].doc;
  assert.equal(nav[0].href,'/app/camera');assert.equal(nav[0].placement,'dock');
  await rejects(()=>db.query('select public.change_navigation($1,$2,1,false)',[site,JSON.stringify([{...item,runtimeSlug:'external'}])]),/Invalid runtime/);
  await rejects(()=>db.query('select public.change_navigation($1,$2,1,false)',[site,JSON.stringify([{...item,placement:'external'}])]),/Invalid navigation placement/);
  await publish(0,other);
  await db.query('update public.pages set settings=$1 where id=$2',[JSON.stringify({seoTitle:'Search title',seoDescription:'Search description',socialImage:'/media/cover.jpg',noIndex:true}),other]);
  const read=async()=>(await db.query("select public.get_public_page_info('phase5-test','other') info")).rows[0].info;
  assert.equal((await read()).metadata.seoTitle,undefined);
  const first=await publish(1,other);assert.equal((await read()).metadata.seoTitle,'Search title');assert.equal((await read()).metadata.noIndex,true);
  assert.equal((await publish(1,other)).versionId,first.versionId);
  await rejects(()=>db.query('update public.pages set settings=$1 where id=$2',[JSON.stringify({socialImage:'javascript:bad'}),other]),/Invalid SEO/);
  await rejects(()=>db.query('update public.pages set settings=$1 where id=$2',[JSON.stringify({seoTitle:'x'.repeat(71)}),other]),/Invalid SEO/);
 });
});

test('B2 whole-site releases snapshot SEO changes, deduplicate unchanged pages and rollback metadata only',async()=>{
 await run(owner,async()=>{
  const release=async()=>(await db.query("select public.publish_site_release($1,'B2 regression') result",[site])).rows[0].result;
  const first=await release();
  await db.query("update public.pages set settings=settings||'{\"seoTitle\":\"New search title\"}'::jsonb where id=$1",[other]);
  const changed=await release();assert.equal(changed.changedPages,1);
  assert.equal((await release()).changedPages,0);
  await db.query("select public.rollback_site_release($1,$2,'B2 rollback')",[site,first.releaseId]);
  const info=(await db.query("select public.get_public_page_info('phase5-test','other') info")).rows[0].info;
  assert.equal(info.metadata.seoTitle,undefined);
  assert.equal((await db.query('select settings from public.pages where id=$1',[other])).rows[0].settings.seoTitle,'New search title');
 });
});

test('B3 OS configuration saves privately, publishes immutable snapshots and rejects stale writes',async()=>{
 await run(owner,async()=>{
  const document={...osContent.defaultSiteDocument,os:{...osContent.defaultOsSettings,width:450}};
  await db.query('select public.change_site_configuration($1,$2,0,false)',[site,JSON.stringify(document)]);
  assert.equal((await db.query("select public.get_published_site_configuration('phase5-test') doc")).rows[0].doc,null);
  await db.query('select public.change_site_configuration($1,null,1,true)',[site]);
  await db.query('select public.change_site_configuration($1,$2,1,false)',[site,JSON.stringify({...document,os:{...document.os,width:380}})]);
  assert.equal((await db.query("select public.get_published_site_configuration('phase5-test') doc")).rows[0].doc.os.width,450);
  await rejects(()=>db.query('select public.change_site_configuration($1,$2,1,false)',[site,JSON.stringify(document)]),/Settings changed/);
  for(const patch of [{width:319},{height:1101},{gridColumns:3.5},{wallpaper:'javascript:bad'},{clockMode:'other'},{fixedTime:'25:00'},{motionEnabled:null},{unknown:true}]){
   await rejects(()=>db.query('select public.change_site_configuration($1,$2,2,false)',[site,JSON.stringify({...document,os:{...document.os,...patch}})]),/Invalid OS/);
  }
  const first=(await db.query("select public.publish_site_release($1,'B3 original') result",[site])).rows[0].result;
  await db.query('select public.change_site_configuration($1,$2,2,false)',[site,JSON.stringify(document)]);
  await db.query("select public.publish_site_release($1,'B3 changed')",[site]);
  await db.query("select public.rollback_site_release($1,$2,'B3 rollback')",[site,first.releaseId]);
  assert.equal((await db.query("select public.get_published_site_configuration('phase5-test') doc")).rows[0].doc.os.width,380);
  assert.equal((await db.query('select draft from public.site_configurations where site_id=$1',[site])).rows[0].draft.os.width,450);
 });
 await assert.rejects(()=>run(editor,()=>db.query('select public.change_site_configuration($1,$2,0,false)',[site,JSON.stringify({...osContent.defaultSiteDocument,os:osContent.defaultOsSettings})])),/Owner required/);
});

const b5=loadContentModule('packages/content/src/app-settings.ts');
const privateVault={answers:['test memory only'],story:{title:'Test story',subtitle:'Example',dedication:'Tests only',chapters:[{id:'one',title:'One',period:'',motif:'letters',keepsake:'',quote:'',body:'Private test fixture',noteTitle:'Note',note:'For testing'}]}};
test('B5 Vault configuration is owner-only and denies direct anonymous reads',async()=>{
 for(const user of [editor,viewer])await run(user,async()=>{await rejects(()=>db.query('select public.read_vault_configuration($1)',[site]),/Not authorized/);await rejects(()=>db.query('select public.change_vault_configuration($1,$2,0,false)',[site,JSON.stringify(privateVault)]),/Not authorized/)});
 await db.exec('begin;set local role anon');try{await rejects(()=>db.query('select * from private.vault_configurations'),/permission denied/);await rejects(()=>db.query('select public.read_vault_configuration($1)',[site]),/permission denied/)}finally{await db.exec('rollback')}
});
test('B5 private Vault drafts, publication and revision conflicts protect live answers',async()=>{await run(owner,async()=>{
 const change=async(document,rev,pub)=>(await db.query('select public.change_vault_configuration($1,$2,$3,$4) result',[site,JSON.stringify(document),rev,pub])).rows[0].result;
 assert.equal((await change(privateVault,0,false)).revision,1);
 const unlock=async(answer)=>(await db.query("select public.unlock_vault_story('phase5-test',$1) story",[answer])).rows[0].story;
 assert.equal(await unlock('test memory only'),null);await rejects(()=>change(privateVault,0,true),/DRAFT_CONFLICT/);
 await change(privateVault,1,true);assert.equal((await unlock('TEST memory only!!')).title,'Test story');assert.equal(await unlock('wrong memory'),null);
 const next={...privateVault,answers:['different test memory'],story:{...privateVault.story,title:'New test draft'}};await change(next,2,false);
 assert.equal((await unlock('test memory only')).title,'Test story');assert.equal(await unlock('different test memory'),null);
 assert.equal((await db.query('select public.read_vault_configuration($1) result',[site])).rows[0].result.hasChanges,true);
 await change(next,3,true);assert.equal(await unlock('test memory only'),null);assert.equal((await unlock('different test memory')).title,'New test draft');
 await rejects(()=>change({...next,answers:['']},4,false),/Invalid Vault answer/);
})});
test('B5 public app SQL validation matches the editor and blocks private fields',async()=>{await run(owner,async()=>{
 for(const app of ['camera','vault','pieces'])await db.query('select private.assert_page_document($1)',[JSON.stringify(b5.createRuntimeAppDocument(app))]);
 for(const props of [{cols:1},{rows:2.5},{ratio:0},{difficulty:'unknown'},{cols:null}]){const d=b5.createRuntimeAppDocument('pieces');Object.assign(d.nodes[1].props,props);await rejects(()=>db.query('select private.assert_page_document($1)',[JSON.stringify(d)]),/Invalid puzzle/)}
 for(const props of [{answers:'private'},{story:'private'},{savedDestination:'https://evil.test'},{videoEnabled:'unknown'}]){const d=b5.createRuntimeAppDocument('camera');Object.assign(d.nodes[0].props,props);await rejects(()=>db.query('select private.assert_page_document($1)',[JSON.stringify(d)]),/Private Vault|Invalid app/)}
})});
