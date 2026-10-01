import 'server-only';
import { parsePageDocument } from '@wiffeyyyy/content';
import { createClient } from '@supabase/supabase-js';
export async function getPublishedDocument(slug: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const siteSlug = process.env.NEXT_PUBLIC_SITE_SLUG;
  if (!url || !key || !siteSlug) return null;
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await db.rpc('get_published_document', { site_slug: siteSlug, page_slug: slug });
  if (error) throw new Error('Unable to load published content.');
  return data == null ? null : parsePageDocument(data);
}
