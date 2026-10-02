'use server';

import { redirect } from 'next/navigation';
import { requireAdmin } from '../../lib/auth';
import { authConfig } from '../../lib/auth-config';
import { adminDb } from '../../lib/supabase';

const USERNAME_PATTERN = /^[a-z0-9][a-z0-9_-]{2,31}$/;
const LOGIN_DOMAIN = '@admin.wiffeyyyy.invalid';

export async function changeUsername(form: FormData) {
  const admin = await requireAdmin();
  const username = String(form.get('username') ?? '').trim().toLowerCase();

  if (!USERNAME_PATTERN.test(username)) redirect('/settings?usernameError=invalid');

  const currentUsername = admin.email?.toLowerCase().endsWith(LOGIN_DOMAIN)
    ? admin.email.slice(0, -LOGIN_DOMAIN.length).toLowerCase()
    : '';
  if (currentUsername === username) redirect('/settings?usernameError=same');

  const db = await adminDb();
  const { data: { session }, error: sessionError } = await db.auth.getSession();
  if (sessionError || !session) redirect('/login');

  const { url, key } = authConfig();
  const response = await fetch(`${url}/functions/v1/change-admin-username`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username }),
    cache: 'no-store',
  });

  let result: { ok?: boolean; code?: string } = {};
  try { result = await response.json(); } catch { /* handled as a generic failure below */ }

  if (!response.ok || !result.ok) {
    if (result.code === 'USERNAME_TAKEN') redirect('/settings?usernameError=taken');
    if (result.code === 'INVALID_USERNAME') redirect('/settings?usernameError=invalid');
    if (result.code === 'UNAUTHENTICATED') redirect('/login');
    redirect('/settings?usernameError=failed');
  }

  // Force a fresh login so the UI and future sessions immediately use the new login name.
  await db.auth.signOut({ scope: 'local' });
  redirect('/login?changed=1');
}
