import test from 'node:test';
import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
import {readFileSync} from 'node:fs';
test('live documents hide archived, deleted and missing files while retaining valid media and captions',async()=>{
 const db=new PGlite(),site='11111111-1111-1111-1111-111111111111';
 try{
 await db.exec(`create schema private;create schema storage;create role anon;create role authenticated;create table public.media_assets(id uuid,site_id uuid,kind text,storage_path text,status text,archived_at timestamptz);create table storage.objects(bucket_id text,name text);`);
 const ids=[1,2,3,4].map(n=>`00000000-0000-0000-0000-00000000000${n}`);
 for(const [i,id] of ids.entries())if(i<3){await db.query('insert into media_assets values($1,$2,$3,$4,$5,$6)',[id,site,'image',id,'ready',i===1?'2026-10-09T00:00:00Z':null]);if(i<2)await db.query('insert into storage.objects values($1,$2)',['wiffeyyyy-image',id]);}
 const sql=readFileSync(new URL('../supabase/migrations/20261009002040_hide_deleted_public_media.sql',import.meta.url),'utf8').split('create or replace function private.public_page_info')[0];await db.exec(sql);
 const doc={nodes:ids.map((id,i)=>({id:'photo-'+i,component:'image',visible:true,props:{src:'/media/'+id,mediaAssetId:id,body:'My caption'}}))};
 const {rows}=await db.query('select private.live_media_document($1::jsonb,$2::uuid) document',[JSON.stringify(doc),site]);
 assert.deepEqual(rows[0].document.nodes.map(n=>n.visible),[true,false,false,false]);
 assert.equal(rows[0].document.nodes[0].props.src,doc.nodes[0].props.src);
 assert.ok(rows[0].document.nodes.every(n=>n.props.body==='My caption'));
 assert.ok(rows[0].document.nodes.slice(1).every(n=>n.props.src===''&&!n.props.mediaAssetId));
 assert.ok(doc.nodes.every(n=>n.visible));
 }finally{await db.close();}
});
