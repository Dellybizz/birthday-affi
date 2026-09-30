import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { authConfig } from './auth-config';

// Uses the caller's verified session, never a service-role key.
export async function adminDb() {
  const { url, key } = authConfig();
  const jar = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (values) => {
        // Server Components cannot set cookies; middleware handles refresh there.
        try { for (const { name, value, options } of values) jar.set(name, value, options); }
        catch { /* Cookie writes are supported in actions and middleware. */ }
      },
    },
  });
}
