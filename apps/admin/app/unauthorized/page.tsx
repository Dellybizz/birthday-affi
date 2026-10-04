import { signOut } from '../login/actions';
export default function Unauthorized() {
  return <main className="mx-auto max-w-md p-8"><h1 className="text-2xl font-semibold">Admin access required</h1><p className="my-4">Your account has no admin role. Ask the site owner to invite you.</p><form action={signOut}><button className="rounded-xl border px-4 py-3">Sign out</button></form></main>;
}
