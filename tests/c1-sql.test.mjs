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
test('C1 owner saves private draft, stale revision rejects, publication stays immutable',async()=>{
 await run(owner,async()=>{
  const initial=(await db.query('select draft from public.site_configurations where site_id=$1',[site])).rows[0].draft;
  const changed={...initial,nickname:'Sweetheart'};
  await db.query('select public.change_site_configuration($1,$2,0,false)',[site,JSON.stringify(changed)]);
  assert.equal((await db.query("select public.get_published_site_configuration('phase5-test') doc")).rows[0].doc,null);
  await db.query('select public.change_site_configuration($1,null,1,true)',[site]);
  await db.query('select public.change_site_configuration($1,$2,1,false)',[site,JSON.stringify({...changed,nickname:'Private'})]);
  assert.equal((await db.query("select public.get_published_site_configuration('phase5-test') doc")).rows[0].doc.nickname,'Sweetheart');
 });
 await assert.rejects(()=>run(owner,()=>db.query('select public.change_site_configuration($1,null,99,true)',[site])));
});
test('C1 editor/viewer cannot mutate or publish; anonymous cannot read configuration tables',async()=>{
 for(const user of [editor,viewer])await assert.rejects(()=>run(user,()=>db.query('select public.change_site_configuration($1,null,0,true)',[site])));
 await db.exec('begin;set local role anon');
 try{await assert.rejects(()=>db.query('select * from public.site_configurations'));}finally{await db.exec('rollback');}
});
