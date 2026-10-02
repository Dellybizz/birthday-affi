import 'server-only';
import { cache } from 'react';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { authConfig } from './auth-config';

// Reuse one caller-scoped client across auth and data reads in the same request/action.
// This keeps the verified user session boundary while avoiding repeated client/cookie setup.
export const adminDb=cache(async () => {
  const { url, key } = authConfig();
  const jar = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (values) => {
        try { for (const { name, value, options } of values) jar.set(name, value, options); }
        catch { /* Cookie writes are supported in actions and middleware. */ }
      },
    },
  });
});
