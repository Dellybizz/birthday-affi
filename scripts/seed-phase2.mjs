// Run against the selected project only, after applying migrations and creating an auth user.
import { createRequire } from 'node:module';
const require = createRequire(new URL('../apps/admin/package.json', import.meta.url));
const { createClient } = require('@supabase/supabase-js');
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ownerId = process.env.OWNER_USER_ID;
if (!url || !key || !ownerId || !/^[0-9a-f-]{36}$/i.test(ownerId)) {
  throw new Error('Set NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and OWNER_USER_ID.');
}
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const check = (result) => { if (result.error) throw new Error(result.error.message); return result.data; };
const { data: owner, error } = await db.auth.admin.getUserById(ownerId);
if (error || !owner.user) throw new Error('OWNER_USER_ID must identify an existing invited auth user.');
check(await db.from('admin_users').upsert({ id: ownerId, role: 'owner' }, { onConflict: 'id' }));
const slug = process.env.NEXT_PUBLIC_SITE_SLUG || 'wiffeyyyy-os';
let site = check(await db.from('sites').select('id').eq('slug', slug).maybeSingle());
if (!site) site = check(await db.from('sites').insert({ name: 'Wiffeyyyy OS', slug }).select('id').single());
const pages = ['welcome', 'home', 'reasons', 'hotline', 'adventure', 'movie', 'kiss-shop', 'radio'];
for (const pageSlug of pages) {
  const existing = check(await db.from('pages').select('id').eq('site_id', site.id).eq('slug', pageSlug).maybeSingle());
  if (!existing) check(await db.from('pages').insert({ site_id: site.id, slug: pageSlug, title: pageSlug,
    draft_document: { schemaVersion: 2, nodes: [], rootIds: [], theme: { background: '#fbf5ef' } } }));
}
const settings = check(await db.from('site_settings').select('id').eq('site_id', site.id).maybeSingle());
if (!settings) check(await db.from('site_settings').insert({ site_id: site.id }));
console.log('Owner and eight empty draft pages are ready. Existing drafts were preserved. Nothing was published.');
