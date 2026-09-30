import Link from "next/link";
const pages=["Home","Reasons I’m Obsessed","Birthday Hotline","Our Next Adventure","Our Birthday Movie","The Kiss Shop","Birthday Radio"];
export default function AdminHome(){
 return <main className="min-h-screen bg-[#f7f5f3] text-[#302a28]"><div className="flex min-h-screen">
  <aside className="hidden w-64 border-r bg-white p-5 md:block"><div className="text-lg font-semibold">Wiffeyyyy OS</div><p className="mt-1 text-xs text-[#81736d]">Control panel</p><nav className="mt-8 space-y-1 text-sm">{["Pages","Theme","Media","Audio","Settings"].map((x,i)=><a key={x} className={`block rounded-xl px-3 py-2 ${i===0?"bg-[#f7e5eb] font-medium":""}`} href="#">{x}</a>)}</nav></aside>
  <section className="flex-1 p-5 md:p-8"><header className="flex items-center justify-between"><div><p className="text-sm text-[#81736d]">Website</p><h1 className="text-2xl font-semibold">Pages</h1></div><Link href="/editor/home" className="rounded-xl bg-[#d86f91] px-4 py-2 text-sm font-semibold text-white">Open editor</Link></header>
  <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{pages.map(page=><Link key={page} href={page==="Home"?"/editor/home":"#"} className="rounded-2xl border border-[#e8e1dc] bg-white p-5 shadow-sm hover:-translate-y-0.5"><p className="font-medium">{page}</p><p className="mt-1 text-xs text-[#81736d]">Page · Draft</p></Link>)}</div></section>
 </div></main>;
}