import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

let db;
const owner = '00000000-0000-4000-8000-000000000001';
const editor = '00000000-0000-4000-8000-000000000002';
const viewer = '00000000-0000-4000-8000-000000000003';
const stranger = '00000000-0000-4000-8000-000000000004';
const site = '00000000-0000-4000-8000-000000000010';
const page = '00000000-0000-4000-8000-000000000011';
const version = '00000000-0000-4000-8000-000000000012';

async function as(role, id, sql) {
  await db.exec(`begin; set local role ${role};`);
  try {
    await db.query("select set_config('request.jwt.claim.sub', $1, true)", [id ?? '']);
    return await db.query(sql);
  } finally { await db.exec('rollback'); }
}

before(async () => {
  db = new PGlite();
  await db.exec(`
    create role anon nologin; create role authenticated nologin;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth, public to anon, authenticated;
    grant execute on function auth.uid() to anon, authenticated;
  `);
  for (const file of readdirSync('supabase/migrations').filter(f => f.endsWith('.sql')).sort()) {
    // PGlite has built-in gen_random_uuid but no pgcrypto extension package.
    const sql = readFileSync(`supabase/migrations/${file}`, 'utf8').replace('create extension if not exists pgcrypto;', '');
    await db.exec(sql);
  }
  await db.exec(`
    insert into auth.users values ('${owner}'),('${editor}'),('${viewer}'),('${stranger}');
    insert into public.admin_users(id,role) values ('${owner}','owner'),('${editor}','editor'),('${viewer}','viewer');
    insert into public.sites(id,name,slug) values ('${site}','Test','test-site');
    insert into public.pages(id,site_id,slug,title,draft_document) values
      ('${page}','${site}','home','Home','{"draftSecret":"hidden"}');
    insert into public.page_versions(id,page_id,version_number,status,document) values
      ('${version}','${page}',1,'published','{"published":"safe"}');
    update public.pages set published_version_id='${version}' where id='${page}';
  `);
});
after(async () => { await db?.close(); });

test('anon cannot read published page rows or raw drafts/settings/app content', async () => {
  for (const table of ['pages','page_versions','site_settings','app_content','app_content_items','media_assets']) {
    await assert.rejects(as('anon', null, `select * from public.${table}`), /permission denied/);
  }
});
test('a signed-in non-admin sees no drafts and cannot create pages', async () => {
  assert.equal((await as('authenticated', stranger, 'select * from public.pages')).rows.length, 0);
  await assert.rejects(as('authenticated', stranger, `insert into public.pages(site_id,slug,title) values('${site}','attack','Attack')`), /row-level security/);
});
test('private-by-default published RPC returns no content', async () => {
  const result = await as('anon', null, "select public.get_published_document('test-site','home') as document");
  assert.equal(result.rows[0].document, null);
});
test('explicit public delivery returns only the active published document', async () => {
  await db.exec(`update public.sites set public_delivery_enabled=true where id='${site}'`);
  const result = await as('anon', null, "select public.get_published_document('test-site','home') as document");
  assert.deepEqual(result.rows[0].document, { published: 'safe' });
  assert.equal((await as('anon', null, "select public.get_published_document('other-site','home') as document")).rows[0].document, null);
});
test('viewer can read drafts but cannot update or insert', async () => {
  assert.equal((await as('authenticated', viewer, 'select * from public.pages')).rows.length, 1);
  assert.equal((await as('authenticated', viewer, `update public.pages set title='Attack' returning id`)).rows.length, 0);
  await assert.rejects(as('authenticated', viewer, `insert into public.pages(site_id,slug,title) values('${site}','attack','Attack')`), /row-level security/);
});
test('editor may save drafts but cannot change the live pointer or site settings', async () => {
  assert.equal((await as('authenticated', editor, `update public.pages set draft_document='{"edited":true}' where id='${page}' returning id`)).rows.length, 1);
  await assert.rejects(as('authenticated', editor, `update public.pages set published_version_id=null where id='${page}'`), /Only the owner/);
  assert.equal((await as('authenticated', editor, `update public.sites set public_delivery_enabled=false returning id`)).rows.length, 0);
  await assert.rejects(as('authenticated', editor, `insert into public.page_versions(page_id,version_number,document) values('${page}',2,'{}')`), /row-level security/);
});
test('owner can create and edit drafts and switch publishing state', async () => {
  assert.equal((await as('authenticated', owner, `insert into public.pages(site_id,slug,title) values('${site}','new','New') returning id`)).rows.length, 1);
  assert.equal((await as('authenticated', owner, `update public.pages set published_version_id=null where id='${page}' returning id`)).rows.length, 1);
});
test('cannot point a page at another page version', async () => {
  await assert.rejects(as('authenticated', owner, `insert into public.pages(site_id,slug,title,published_version_id) values('${site}','other','Other','${version}')`), /must belong/);
});
test('roles cannot self-escalate and only the caller role is readable', async () => {
  await assert.rejects(as('authenticated', viewer, `update public.admin_users set role='owner' where id='${viewer}'`), /permission denied/);
  assert.equal((await as('authenticated', viewer, 'select * from public.admin_users')).rows.length, 1);
});
test('successful mutations append authenticated audit rows; audit cannot be forged', async () => {
  const result = await as('authenticated', editor, `with changed as (update public.pages set title='Edited' where id='${page}' returning id)
    select id from changed`);
  assert.equal(result.rows.length, 1);
  await db.exec('begin; set local role authenticated;');
  try {
    await db.query("select set_config('request.jwt.claim.sub',$1,true)", [editor]);
    await db.exec(`update public.pages set title='Audit test' where id='${page}'`);
    const audit = await db.query(`select actor_id,site_id from public.audit_logs where actor_id='${editor}' order by id desc limit 1`);
    assert.deepEqual(audit.rows[0], { actor_id: editor, site_id: site });
  } finally { await db.exec('rollback'); }
  await assert.rejects(as('authenticated', owner, "insert into public.audit_logs(action,entity_type) values('forged','pages')"), /permission denied/);
  await assert.rejects(as('authenticated', owner, 'delete from public.audit_logs'), /permission denied/);
});
test('revoking an admin role removes database access immediately', async () => {
  await db.exec(`delete from public.admin_users where id='${viewer}'`);
  assert.equal((await as('authenticated', viewer, 'select * from public.pages')).rows.length, 0);
});
