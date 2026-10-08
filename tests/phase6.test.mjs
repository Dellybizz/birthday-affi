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
 for(const [id,slug] of [[page,'home'],[other,'other']])await db.query('insert into public.pages(id,site_id,slug,title,draft_document)values($1,$2,$3,$3,$4)',[id,site,slug,JSON.stringify(doc('Initial'))]);
});after(()=>db.close());
async function role(user){await db.exec('set local role authenticated');await db.query("select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claim.session_id',$1,true)",[user]);}
async function run(user,fn){await db.exec('begin');try{await role(user);await fn()}finally{await db.exec('rollback')}}
const save=async(userDoc,revision=0,id=page)=>(await db.query('select public.save_page_draft($1,$2,$3) result',[id,JSON.stringify(userDoc),revision])).rows[0].result;
const publish=async(revision,id=page)=>(await db.query('select public.publish_page($1,$2) result',[id,revision])).rows[0].result;
const rollback=async(version,revision,id=page)=>(await db.query('select public.rollback_page($1,$2,$3) result',[id,version,revision])).rows[0].result;
async function rejects(fn,pattern){await db.exec('savepoint rejected');try{await assert.rejects(fn,pattern)}finally{await db.exec('rollback to rejected;release savepoint rejected')}}
const live=async()=>(await db.query("select public.get_published_document('phase5-test','home') doc")).rows[0].doc;

const asset='00000000-0000-4000-8000-000000000020';
const mediaDoc=()=>{const d=doc('Media');d.nodes[1].component='image';d.nodes[1].props={src:'/media/'+asset,mediaAssetId:asset,alt:'Portrait',variantWidths:'480,960',objectFit:'cover',focalX:25,focalY:75,displayHeight:320};return d};
async function reserve(){await db.query("insert into public.media_assets(id,site_id,kind,storage_path,filename,mime_type,byte_size)values($1,$2,'image',$3,'portrait.png','image/png',100)",[asset,site,site+'/'+asset+'/original'])}
async function ready(){await reserve();await db.query("update public.media_assets set status='ready',width=1200,height=800,metadata=$2 where id=$1",[asset,JSON.stringify({variants:[480,960]})])}
const publicMedia=async()=>(await db.query("select public.get_published_media('phase5-test',$1) m",[asset])).rows[0].m;
test('storage configuration creates private buckets with per-kind limits',async()=>{const buckets=(await db.query('select * from storage.buckets order by id')).rows;assert.equal(buckets.length,3);assert.ok(buckets.every(b=>!b.public));assert.equal(buckets.find(b=>b.id==='wiffeyyyy-video').file_size_limit,52428800)});
test('upload permissions require active writer and exact reserved immutable path',()=>run(editor,async()=>{await reserve();await db.query("insert into storage.objects(bucket_id,name)values('wiffeyyyy-image',$1)",[site+'/'+asset+'/original']);await rejects(()=>db.query("insert into storage.objects(bucket_id,name)values('wiffeyyyy-image','arbitrary.png')"),/row-level security/);await rejects(()=>db.query("insert into storage.objects(bucket_id,name)values('wiffeyyyy-video',$1)",[site+'/'+asset+'/480.webp']),/row-level security/);await readyFailGuard()}));
async function readyFailGuard(){await db.query("update public.media_assets set status='ready' where id=$1",[asset]);await rejects(()=>db.query("insert into storage.objects(bucket_id,name)values('wiffeyyyy-image',$1)",[site+'/'+asset+'/480.webp']),/row-level security/)}
test('viewer and signed-out user cannot reserve or upload',async()=>{await run(viewer,()=>rejects(reserve,/row-level security/));await db.exec('begin');try{await reserve();await db.query('delete from auth.sessions where id=$1',[editor]);await role(editor);await rejects(()=>db.query("insert into storage.objects(bucket_id,name)values('wiffeyyyy-image',$1)",[site+'/'+asset+'/original']),/row-level security/)}finally{await db.exec('rollback')}});
test('draft assets and media inventory are private; only active publication exposes its files',async()=>{await db.exec('begin');try{await role(owner);await ready();await save(mediaDoc());assert.equal(await publicMedia(),null);await publish(1);assert.ok(await publicMedia());await db.exec('set local role anon');assert.equal((await db.query('select public.is_published_media_object($1,$2) allowed',['wiffeyyyy-image',site+'/'+asset+'/480.webp'])).rows[0].allowed,true);assert.equal((await db.query('select public.is_published_media_object($1,$2) allowed',['wiffeyyyy-image',site+'/'+asset+'/1600.webp'])).rows[0].allowed,false);await rejects(()=>db.query('select * from public.media_assets'),/permission denied/);await role(owner);await save(doc('No media'),1);await publish(2);assert.equal(await publicMedia(),null)}finally{await db.exec('rollback')}});
test('archive is reversible and preserves publications and rollback media',()=>run(owner,async()=>{await ready();await save(mediaDoc());await publish(1);await db.query('select public.archive_media($1,true)',[asset]);assert.ok(await publicMedia());assert.ok((await db.query('select archived_at from media_assets where id=$1',[asset])).rows[0].archived_at);await db.query('select public.archive_media($1,false)',[asset]);assert.equal((await db.query('select archived_at from media_assets where id=$1',[asset])).rows[0].archived_at,null);await rejects(()=>db.query('delete from media_assets where id=$1',[asset]),/permission denied/)}));
test('pending, missing, cross-site and wrong-kind assets cannot enter saved versions',()=>run(owner,async()=>{await reserve();await rejects(()=>save(mediaDoc()),/unavailable/);await db.query("update media_assets set status='ready',metadata=$2 where id=$1",[asset,JSON.stringify({variants:[480,960]})]);const wrong=mediaDoc();wrong.nodes[1].component='audio';await rejects(()=>save(wrong),/unavailable/);await db.query('insert into sites(name,slug) values($1,$2)',['Other','other-site']);const foreign=(await db.query("select id from sites where slug='other-site'")).rows[0].id;await rejects(()=>db.query('insert into pages(site_id,slug,title,draft_document)values($1,$2,$3,$4)',[foreign,'home','Home',JSON.stringify(mediaDoc())]),/unavailable/)}));
test('verified identity, variants and metadata dimensions cannot be replaced',()=>run(owner,async()=>{await ready();await rejects(()=>db.query("update media_assets set storage_path='another/path' where id=$1",[asset]),/immutable/);await rejects(()=>db.query("update media_assets set metadata='{}' where id=$1",[asset]),/immutable/);await rejects(()=>db.query("update media_assets set status='pending' where id=$1",[asset]),/immutable/);await db.query("update media_assets set alt_text='New description' where id=$1",[asset])}));
test('SQL document validator rejects unsafe crop settings, variants and mismatched source',()=>run(owner,async()=>{await ready();for(const patch of [{focalX:101},{objectFit:'fill'},{displayHeight:2000},{variantWidths:'999'},{src:'/media/other'},{mediaWidth:0}]){const d=mediaDoc();Object.assign(d.nodes[1].props,patch);await rejects(()=>save(d),/Invalid|match/)}await save(mediaDoc())}));
test('anonymous clients cannot invoke storage configuration or archiving',async()=>{await db.exec('begin;set local role anon');try{await rejects(()=>db.query('select public.configure_media_storage()'),/permission denied/);await rejects(()=>db.query('select public.archive_media($1,true)',[asset]),/permission denied/)}finally{await db.exec('rollback')}});

test('video posters append only at the reserved sidecar path and stay private',()=>run(editor,async()=>{
 await db.query("insert into public.media_assets(id,site_id,kind,storage_path,filename,mime_type,byte_size,status)values($1,$2,'video',$3,'clip.mp4','video/mp4',100,'ready')",[asset,site,site+'/'+asset+'/original']);
 assert.equal((await db.query("select private.can_upload_media_object('wiffeyyyy-video',$1) allowed",[site+'/'+asset+'/original'])).rows[0].allowed,false);
 await db.query("insert into storage.objects(bucket_id,name)values('wiffeyyyy-video',$1)",[site+'/'+asset+'/poster.webp']);
 await rejects(()=>db.query("insert into storage.objects(bucket_id,name)values('wiffeyyyy-video',$1)",[site+'/'+asset+'/other.webp']),/row-level security/);
 await rejects(()=>db.query("update media_assets set storage_path='replaced' where id=$1",[asset]),/immutable/);
 await db.query('update media_assets set poster_ready=true where id=$1',[asset]);
 assert.equal((await db.query("select private.can_upload_media_object('wiffeyyyy-video',$1) allowed",[site+'/'+asset+'/poster.webp'])).rows[0].allowed,false);
 assert.equal((await db.query("select public.is_published_media_object('wiffeyyyy-video',$1) allowed",[site+'/'+asset+'/poster.webp'])).rows[0].allowed,false);
 await db.exec('set local role anon');assert.equal((await db.query("select count(*)::int as n from storage.objects where name=$1",[site+'/'+asset+'/poster.webp'])).rows[0].n,0);
}));
test('viewer cannot append video posters and image records cannot advertise them',async()=>{
 await db.exec('begin');try{await role(owner);await ready();await rejects(()=>db.query('update media_assets set poster_ready=true where id=$1',[asset]),/video_poster_only/);await role(viewer);await rejects(()=>db.query("insert into storage.objects(bucket_id,name)values('wiffeyyyy-video',$1)",[site+'/'+asset+'/poster.webp']),/row-level security/)}finally{await db.exec('rollback')}
});

test('collections and tags save atomically without changing a verified original',()=>run(editor,async()=>{
 await ready();const collection=(await db.query("insert into media_collections(site_id,name) values($1,'Memories') returning id",[site])).rows[0].id;
 await db.query('select save_media_organization($1,$2,true,$3)',[asset,['birthday','memories'],[collection]]);
 const result=(await db.query('select favourite,tags,collection_ids,storage_path from media_library_assets where id=$1',[asset])).rows[0];assert.equal(result.favourite,true);assert.deepEqual(result.tags,['birthday','memories']);assert.deepEqual(result.collection_ids,[collection]);assert.equal(result.storage_path,site+'/'+asset+'/original');
 await rejects(()=>db.query("insert into media_collections(site_id,name) values($1,'MEMORIES')",[site]),/unique/);
 await rejects(()=>db.query('select save_media_organization($1,$2,false,$3)',[asset,['duplicate','duplicate'],[collection]]),/Invalid organization/);
 assert.equal((await db.query('select favourite from media_assets where id=$1',[asset])).rows[0].favourite,true);
 await db.query('delete from media_collections where id=$1',[collection]);assert.equal((await db.query('select cardinality(collection_ids) n from media_library_assets where id=$1',[asset])).rows[0].n,0);assert.equal((await db.query('select count(*)::int n from media_assets where id=$1',[asset])).rows[0].n,1);
}));
test('cross-site collection assignments fail before any tags or membership change',()=>run(owner,async()=>{
 await ready();const foreign=(await db.query("insert into sites(name,slug) values('Other','collection-other') returning id")).rows[0].id;const collection=(await db.query("insert into media_collections(site_id,name) values($1,'Other collection') returning id",[foreign])).rows[0].id;
 await rejects(()=>db.query('select save_media_organization($1,$2,true,$3)',[asset,['changed'],[collection]]),/unavailable in this site/);
 assert.deepEqual((await db.query('select tags from media_assets where id=$1',[asset])).rows[0].tags,[]);
 await rejects(()=>db.query('insert into media_collection_assets(site_id,collection_id,asset_id) values($1,$2,$3)',[site,collection,asset]),/foreign key/);
 await rejects(()=>db.query('select add_media_to_collection($1,$2,$3)',[site,collection,[asset]]),/unavailable in this site/);
}));
test('unused excludes draft, settings and historical media references',()=>run(owner,async()=>{
 await ready();const unused=async()=>(await db.query('select is_unused from media_library_assets where id=$1',[asset])).rows[0].is_unused;
 assert.equal(await unused(),true);await save(mediaDoc());assert.equal(await unused(),false);await publish(1);await save(doc('Removed from current draft'),1);assert.equal(await unused(),false);
}));
test('unused detects media in URL query strings and page settings',()=>run(owner,async()=>{
 await ready();await db.query('update pages set settings=$1 where id=$2',[JSON.stringify({backgroundUrl:'/media/'+asset+'?variant=480'}),page]);assert.equal((await db.query('select is_unused from media_library_assets where id=$1',[asset])).rows[0].is_unused,false);
}));
test('duplicate groups use fingerprints and archive membership, never filenames',()=>run(owner,async()=>{
 await ready();const second='00000000-0000-4000-8000-000000000021',hash='a'.repeat(64);
 await db.query("insert into media_assets(id,site_id,kind,storage_path,filename,mime_type,byte_size,status,content_sha256) values($1,$2,'image',$3,'different.png','image/png',100,'ready',$4)",[second,site,site+'/'+second+'/original',hash]);
 await db.query('update media_assets set content_sha256=$1 where id=$2',[hash,asset]);assert.equal((await db.query('select duplicate_count from media_library_assets where id=$1',[asset])).rows[0].duplicate_count,2);
 await rejects(()=>db.query('update media_assets set content_sha256=$1 where id=$2',['b'.repeat(64),asset]),/immutable/);
 await db.query('select archive_media($1,true)',[second]);assert.equal((await db.query('select duplicate_count from media_library_assets where id=$1',[asset])).rows[0].duplicate_count,1);
}));
test('viewer may read organization but cannot change it; anonymous inventory stays private',async()=>{
 await db.exec('begin');try{await role(owner);await ready();await role(viewer);assert.equal((await db.query('select count(*)::int n from media_library_assets')).rows[0].n,1);await rejects(()=>db.query('select save_media_organization($1,$2,true,$3)',[asset,['tag'],[]]),/Not authorized/);await rejects(()=>db.query("insert into media_collections(site_id,name) values($1,'Denied')",[site]),/row-level security/);await db.exec('set local role anon');await rejects(()=>db.query('select * from media_library_assets'),/permission denied/);await rejects(()=>db.query('select * from media_collections'),/permission denied/)}finally{await db.exec('rollback')}
});
