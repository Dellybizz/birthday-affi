"use server";
import { redirect } from 'next/navigation';
import { adminDb } from '../../lib/supabase';
import { authConfigured } from '../../lib/auth-config';

export async function signIn(form: FormData) {
  if (!authConfigured()) redirect('/login?error=configuration');
  const email = String(form.get('email') ?? '').trim();
  const password = String(form.get('password') ?? '');
  if (!email || email.length > 254 || !password || password.length > 1024) redirect('/login?error=credentials');
  const db = await adminDb();
  const { data, error } = await db.auth.signInWithPassword({ email, password });
  if (error || !data.user) redirect('/login?error=credentials');
  const { data: admin, error: roleError } = await db.from('admin_users').select('role').eq('id', data.user.id).maybeSingle();
  if (roleError || !admin) {
    await db.auth.signOut();
    redirect('/login?error=access');
  }
  redirect('/');
}
export async function signOut() {
  const db = await adminDb();
  const { error } = await db.auth.signOut({ scope: 'local' });
  if (error) throw new Error('Unable to sign out. Please retry.');
  redirect('/login');
}
