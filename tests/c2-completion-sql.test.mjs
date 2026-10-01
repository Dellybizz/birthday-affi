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
