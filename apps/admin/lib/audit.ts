import 'server-only';
import { requireAdmin } from './auth';
import { adminDb } from './supabase';

// Database triggers record successful mutations atomically. Clients cannot forge audit rows.
export async function listAudit(limit = 50) {
  await requireAdmin('audit:read');
  const db = await adminDb();
  const { data, error } = await db.from('audit_logs').select('id,site_id,actor_id,action,entity_type,entity_id,created_at')
    .order('created_at', { ascending: false }).limit(Math.max(1, Math.min(200, limit)));
  if (error) throw new Error(error.message);
  return data ?? [];
}
