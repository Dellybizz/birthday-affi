import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { adminDb } from './supabase';
import { authConfigured } from './auth-config';
import { can, type AdminRole } from './permissions';

export const getAdmin = cache(async () => {
  if (!authConfigured()) return null;
  const db = await adminDb();
  const { data: { user }, error } = await db.auth.getUser();
  if (error || !user) return null;
  const { data, error: roleError } = await db.from('admin_users').select('role').eq('id', user.id).maybeSingle();
  if (roleError) throw new Error('Unable to verify admin access. Check the database migrations.');
  if (!data || !['owner', 'editor', 'viewer'].includes(data.role)) return null;
  return { id: user.id, email: user.email, role: data.role as AdminRole };
});

export async function requireAdmin(permission = 'site:read') {
  const admin = await getAdmin();
  if (!admin) redirect('/login');
  if (!can(admin.role, permission)) throw new Error('Your role does not allow this action.');
  return admin;
}
