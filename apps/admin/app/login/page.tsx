import { signIn } from './actions';
import { authConfigured } from '../../lib/auth-config';
export const dynamic = 'force-dynamic';
export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const configured = authConfigured();
  const message = !configured ? 'Admin sign-in is unavailable until the site is configured.' :
    error === 'access' ? 'This account has no admin access. Contact the site owner.' :
    error ? 'Unable to sign in. Check your username and password and try again.' : null;
  return <main className="grid min-h-screen place-items-center bg-[#f7f5f3] p-5 text-[#302a28]">
    <section className="w-full max-w-sm rounded-3xl border bg-white p-7 shadow-sm">
      <p className="text-sm text-[#81736d]">Wiffeyyyy OS · Control panel</p>
      <h1 className="mt-2 text-2xl font-semibold">Welcome back</h1>
      <p className="mt-2 text-sm">Sign in with your admin username and password.</p>
      {message && <p role="alert" className="mt-4 rounded-xl bg-[#f7e5eb] p-3 text-sm">{message}</p>}
      <form action={signIn} className="mt-6 space-y-4">
        <label className="block text-sm">Username<input className="mt-1 w-full rounded-xl border p-3" name="username" type="text" autoComplete="username" required maxLength={32} disabled={!configured}/></label>
        <label className="block text-sm">Password<input className="mt-1 w-full rounded-xl border p-3" name="password" type="password" autoComplete="current-password" required maxLength={1024} disabled={!configured}/></label>
        <button className="min-h-11 w-full rounded-xl bg-[#d86f91] p-3 font-semibold text-white disabled:opacity-50" disabled={!configured}>Sign in</button>
      </form>
    </section>
  </main>;
}
