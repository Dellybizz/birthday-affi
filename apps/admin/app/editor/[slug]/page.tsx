"use client";
import {useState} from "react";
import {saveDraft,publishPage} from "../../../lib/site-actions";

type Node={id:string;label:string;type:"section"|"block";parent?:string};
const initial:Node[]=[
{id:"hero",label:"Welcome",type:"section"},
{id:"hero-title",label:"Birthday Heading",type:"block",parent:"hero"},
{id:"hero-copy",label:"Birthday Message",type:"block",parent:"hero"},
{id:"apps",label:"App Grid",type:"section"},
{id:"app-cards",label:"Six App Cards",type:"block",parent:"apps"},
{id:"notifications",label:"Notifications",type:"section"}
];

export default function Editor(){
 const [nodes,setNodes]=useState(initial);
 const [selected,setSelected]=useState("apps");
 const [history,setHistory]=useState<Node[][]>([]);
 const [future,setFuture]=useState<Node[][]>([]);
 const [saved,setSaved]=useState(true);
 const [device,setDevice]=useState<"mobile"|"tablet"|"desktop">("mobile");
 const [bg,setBg]=useState("#fbf5ef");
 const current=nodes.find(n=>n.id===selected);
 const commit=(next:Node[])=>{setHistory(h=>[...h,nodes].slice(-50));setFuture([]);setNodes(next);setSaved(false)};
 const undo=()=>{const prev=history.at(-1);if(!prev)return;setFuture(f=>[...f,nodes]);setNodes(prev);setHistory(h=>h.slice(0,-1));setSaved(false)};
 const redo=()=>{const next=future.at(-1);if(!next)return;setHistory(h=>[...h,nodes]);setNodes(next);setFuture(f=>f.slice(0,-1));setSaved(false)};
 const addSection=()=>commit([...nodes,{id:crypto.randomUUID(),label:"New Section",type:"section"}]);
 const document={schemaVersion:1,nodes:nodes.map(n=>({id:n.id,type:n.type,component:n.type==="section"?"Section":"Block",parentId:n.parent??null,props:{label:n.label},children:[]})),rootIds:nodes.filter(n=>n.type==="section").map(n=>n.id)};
 return <main className="flex h-screen flex-col overflow-hidden bg-[#f4f2f0]">
  <header className="flex h-14 shrink-0 items-center justify-between border-b bg-white px-3 sm:px-4">
   <div className="flex items-center gap-2"><a href="/" className="grid size-8 place-items-center rounded-lg border">←</a><strong className="hidden sm:block">Home</strong><span className="text-xs text-[#81736d]">{saved?"Saved":"Unsaved changes"}</span></div>
   <div className="flex items-center gap-1"><button onClick={undo} disabled={!history.length} className="rounded-lg border px-2 py-1.5 text-sm disabled:opacity-40">↶</button><button onClick={redo} disabled={!future.length} className="rounded-lg border px-2 py-1.5 text-sm disabled:opacity-40">↷</button><div className="mx-1 hidden h-6 w-px bg-[#e8e1dc] sm:block"/>{(["mobile","tablet","desktop"] as const).map(d=><button key={d} onClick={()=>setDevice(d)} className={"hidden rounded-lg px-2 py-1.5 text-xs sm:block "+(device===d?"bg-[#f7e5eb] font-semibold":"")}>{d}</button>)}<button onClick={async()=>{if(location.search.includes("pageId=")){await saveDraft(new URLSearchParams(location.search).get("pageId")!,document);setSaved(true)}}} className="rounded-lg border px-3 py-1.5 text-sm">Save</button><button className="rounded-lg bg-[#d86f91] px-3 py-1.5 text-sm font-semibold text-white">Publish</button></div>
  </header>
  <div className="grid min-h-0 flex-1 grid-cols-[220px_1fr] lg:grid-cols-[250px_1fr_300px]">
   <aside className="overflow-auto border-r bg-white p-3 sm:p-4">
    <h2 className="text-xs font-semibold uppercase tracking-wide text-[#81736d]">Navigator</h2>
    <div className="mt-3 space-y-1">{nodes.map(n=><div key={n.id} className={n.type==="block"?"ml-4":""}><button onClick={()=>setSelected(n.id)} className={"w-full rounded-lg px-3 py-2 text-left text-sm "+(selected===n.id?"bg-[#f7e5eb] font-medium":"")}>{n.type==="section"?"▾ ":"↳ "}{n.label}</button></div>)}</div>
    <button onClick={addSection} className="mt-4 w-full rounded-lg border px-3 py-2 text-sm">+ Add section</button>
   </aside>
   <section className="min-w-0 overflow-auto p-4 sm:p-6 lg:col-start-2">
    <div className={"mx-auto min-h-[700px] rounded-[32px] border-8 border-[#2f2b2a] bg-[var(--w-bg)] p-5 shadow-xl transition-all "+(device==="mobile"?"max-w-[430px]":device==="tablet"?"max-w-[760px]":"max-w-[1200px]")}>
     <div className="flex items-center justify-between"><span className="text-xs text-[var(--w-muted)]">Live canvas · {device}</span><span className="text-xs text-[var(--w-muted)]">Draft</span></div>
     <section onClick={()=>setSelected("hero")} className={"mt-5 rounded-3xl p-5 "+(selected==="hero"?"ring-2 ring-[#d86f91]":"")} style={{background:bg}}>
      <h1 onClick={()=>setSelected("hero-title")} className="text-2xl font-semibold">Happy birthday, favourite person. 💗</h1>
      <p onClick={()=>setSelected("hero-copy")} className="mt-2 text-[var(--w-muted)]">A little place made just for you.</p>
     </section>
     <section onClick={()=>setSelected("apps")} className={"mt-5 grid grid-cols-2 gap-3 "+(selected==="apps"?"ring-2 ring-[#d86f91] rounded-3xl p-2":"")}>{["💗 Reasons","☎️ Hotline","🧭 Adventure","🎬 Movie","💋 Kiss Shop","📻 Radio"].map(x=><div key={x} onClick={(e)=>{e.stopPropagation();setSelected("app-cards")}} className="rounded-2xl border bg-white p-4 text-sm">{x}</div>)}</section>
    </div>
   </section>
   <aside className="hidden overflow-auto border-l bg-white p-4 lg:block">
    <h2 className="text-xs font-semibold uppercase tracking-wide text-[#81736d]">Inspector</h2>
    <p className="mt-4 font-medium">{current?.label ?? "Nothing selected"}</p>
    <div className="mt-5 space-y-5">
     <label className="block text-xs text-[#81736d]">Background<input type="color" value={bg} onChange={e=>{setBg(e.target.value);setSaved(false)}} className="mt-2 h-10 w-full"/></label>
     <label className="block text-xs text-[#81736d]">Corner radius<input type="range" min="0" max="40" defaultValue="22" className="mt-2 w-full"/></label>
     <label className="block text-xs text-[#81736d]">Padding<input type="range" min="0" max="64" defaultValue="24" className="mt-2 w-full"/></label>
     <label className="block text-xs text-[#81736d]">Opacity<input type="range" min="0" max="100" defaultValue="100" className="mt-2 w-full"/></label>
     <label className="flex items-center justify-between text-sm">Visible<input type="checkbox" defaultChecked/></label>
    </div>
   </aside>
  </div>
 </main>;
}
