"use client";
export default function AdminError({ reset }: { reset: () => void }) {
  return <main className="mx-auto max-w-md p-8"><h1 className="text-2xl font-semibold">Unable to load the control panel</h1><p className="my-4">Please retry. If this continues, check the site configuration.</p><button className="rounded-xl border px-4 py-3" onClick={reset}>Try again</button></main>;
}
