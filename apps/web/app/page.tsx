const apps = [
  ["💗","Reasons I’m Obsessed","Little things I love about you."],
  ["☎️","Birthday Hotline","A call, a voice, a little affection."],
  ["🧭","Our Next Adventure","Pick the kind of day we should have."],
  ["🎬","Our Birthday Movie","A tiny film about us."],
  ["💋","The Kiss Shop","Gifts, promises, and things to redeem."],
  ["📻","Birthday Radio","Songs with a reason behind them."],
] as const;
const slugs=["reasons","hotline","adventure","movie","kiss-shop","radio"] as const;
export default function Home() {
  return (
    <main className="min-h-screen px-5 py-8 sm:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-2xl flex-col">
        <header className="mb-8">
          <p className="text-sm font-medium tracking-wide text-[var(--w-muted)]">Wiffeyyyy OS · September 2026</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Happy birthday, favourite person. 💗</h1>
          <p className="mt-2 text-[var(--w-muted)]">A little place made just for you.</p>
        </header>
        <section aria-label="Wiffeyyyy OS apps" className="grid grid-cols-2 gap-4">
          {apps.map(([icon,title,description], index) => (
            <a key={title} href={`/app/${slugs[index]}`} className="group rounded-[var(--w-radius)] border border-[var(--w-border)] bg-[var(--w-surface)] p-5 shadow-sm transition-transform hover:-translate-y-0.5">
              <span className="grid size-12 place-items-center rounded-2xl bg-[var(--w-accent-soft)] text-2xl">{icon}</span>
              <h2 className="mt-4 font-semibold">{title}</h2>
              <p className="mt-1 text-sm leading-5 text-[var(--w-muted)]">{description}</p>
              {index === 1 && <span className="mt-4 inline-block rounded-full bg-[var(--w-accent)] px-3 py-1 text-xs font-semibold text-white">Start here</span>}
            </a>
          ))}
        </section>
      </div>
    </main>
  );
}