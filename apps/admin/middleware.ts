import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { authConfig, authConfigured } from './lib/auth-config';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  response.headers.set('Cache-Control', 'private, no-store');
  response.headers.set('X-Robots-Tag','noindex, nofollow');
  response.headers.set('Referrer-Policy','no-referrer');
  const redirectTo = (path: string) => {
    const target = request.nextUrl.clone();
    target.pathname = path;
    target.search = '';
    const result = NextResponse.redirect(target);
    for (const cookie of response.cookies.getAll()) result.cookies.set(cookie);
    result.headers.set('Cache-Control', 'private, no-store');
    result.headers.set('X-Robots-Tag','noindex, nofollow');
    result.headers.set('Referrer-Policy','no-referrer');
    return result;
  };
  if (!authConfigured()) return request.nextUrl.pathname === '/login' ? response : redirectTo('/login');
  const { url, key } = authConfig();
  const db = createServerClient(url, key, { cookies: {
    getAll: () => request.cookies.getAll(),
    setAll: (values) => {
      for (const { name, value } of values) request.cookies.set(name, value);
      response = NextResponse.next({ request });
      response.headers.set('Cache-Control', 'private, no-store');
      response.headers.set('X-Robots-Tag','noindex, nofollow');
      response.headers.set('Referrer-Policy','no-referrer');
      for (const { name, value, options } of values) response.cookies.set(name, value, options);
    },
  } });
  const { data: { user }, error } = await db.auth.getUser();
  const path = request.nextUrl.pathname;
  if (error || !user) return path === '/login' ? response : redirectTo('/login');
  const { data: admin, error: roleError } = await db.from('admin_users').select('role').eq('id', user.id).maybeSingle();
  if (roleError || !admin) return path === '/unauthorized' ? response : redirectTo('/unauthorized');
  return path === '/login' || path === '/unauthorized' ? redirectTo('/') : response;
}
export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|api/health|api/media-picker).*)'] };
