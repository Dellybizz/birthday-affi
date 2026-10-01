'use client';
import { useEffect, useReducer, useState, useSyncExternalStore } from 'react';
import { CMSRenderer } from '@wiffeyyyy/ui/cms-renderer';
import { DraftSaveQueue, componentRegistry, componentFields, designFields, insertNode, updateNode, deleteNode, duplicateNode, moveNode, editorReducer, type PageDocument, type ComponentName, type CMSNode, type CMSField, type InspectorField } from '@wiffeyyyy/content';
import { saveDraft, publishPage, rollbackPage, getVersionHistory, getVersionDocument } from '../../../lib/site-actions';
const button='rounded-lg border px-3 py-2 text-sm disabled:opacity-40';
const input='mt-1 w-full rounded-lg border bg-white p-2 text-sm';
function Field({field,value,onApply}:{field:InspectorField;value:CMSField|undefined;onApply:(value:CMSField)=>void}) {
 const apply=(raw:string)=>onApply(field.type==='number'?Number(raw):raw);
 const common={className:input,defaultValue:String(value??''),onBlur:(e:React.FocusEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>)=>{if(e.target.value!==String(value??''))apply(e.target.value)}};
 return <label className="block text-sm">{field.label}{field.type==='textarea'?<textarea {...common} rows={3}/>:field.type==='select'?<select {...common}>{field.options?.map(x=><option key={x}>{x}</option>)}</select>:<input {...common} type={field.type==='number'?'number':'text'} min={field.min} max={field.max} step={field.step} placeholder={field.type==='color'?'#ffffff or transparent':undefined}/>}</label>;
}
function Navigator({document,selected,onSelect,onToggle}:{document:PageDocument;selected:string|null;onSelect:(id:string)=>void;onToggle:(node:CMSNode)=>void}) {
 const [collapsed,setCollapsed]=useState<Set<string>>(new Set());
 const byId=new Map(document.nodes.map(n=>[n.id,n]));
 const render=(id:string):React.ReactNode=>{const node=byId.get(id)!;return <li key={id}><div className={'flex items-center rounded-lg '+(selected===id?'bg-[#f7e5eb]':'')}>
 {node.type==='section'&&<button className="p-2" aria-label={(collapsed.has(id)?'Expand ':'Collapse ')+(node.label??node.component)} aria-expanded={!collapsed.has(id)} onClick={()=>setCollapsed(old=>{const next=new Set(old);if(next.has(id))next.delete(id);else next.add(id);return next})}>{collapsed.has(id)?'▸':'▾'}</button>}
 <button className="min-w-0 flex-1 truncate p-2 text-left text-sm" aria-current={selected===id?'true':undefined} onClick={()=>onSelect(id)}>{node.label??node.component}</button>
 <button className="p-2 text-xs" aria-label={(node.visible?'Hide ':'Show ')+(node.label??node.component)} onClick={()=>onToggle(node)}>{node.visible?'◉':'○'}</button></div>
 {!collapsed.has(id)&&node.children.length>0&&<ul className="ml-4 border-l pl-2">{node.children.map(render)}</ul>}</li>};
 return <ul className="mt-3 space-y-1">{document.rootIds.map(render)}</ul>;
}
export default function Editor({pageId,initialDocument,initialRevision=0,canWrite=true,canPublish=true}:{pageId:string;initialDocument:PageDocument;initialRevision?:number;canWrite?:boolean;canPublish?:boolean}) {
 const [state,dispatch]=useReducer(editorReducer,{document:initialDocument,selectedId:initialDocument.rootIds[0]??null,past:[],future:[]});
 const [saver]=useState(()=>new DraftSaveQueue(initialDocument,initialRevision,(document,revision)=>saveDraft(pageId,document,revision)));
 const saveState=useSyncExternalStore(saver.subscribe,saver.getSnapshot,saver.getSnapshot);
 const [versions,setVersions]=useState<Array<{id:string;version_number:number;status:string;created_at:string}>>([]);
 const [showVersions,setShowVersions]=useState(false);
 const [notice,setNotice]=useState('');
 const [error,setError]=useState('');const [busy,setBusy]=useState(false);
 const [device,setDevice]=useState<'mobile'|'tablet'|'desktop'>('mobile');
 const [panel,setPanel]=useState<'layers'|'canvas'|'settings'>('canvas');
 const [tab,setTab]=useState<'content'|'design'|'page'>('content');
 const [component,setComponent]=useState<ComponentName>('text');
 const doc=state.document;const current=doc.nodes.find(n=>n.id===state.selectedId);
 const dirty=JSON.stringify(doc)!==saveState.saved;
 useEffect(()=>{
  if(!canWrite)return;saver.stage(doc);
  if(busy||saver.getSnapshot().status==='conflict'||saver.getSnapshot().status==='error')return;
  const timer=setTimeout(()=>{saver.flush().catch(()=>{})},1500);
  return ()=>clearTimeout(timer);
 },[doc,canWrite,busy,saver]);
 useEffect(()=>{
  if(!dirty)return;
  const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue=''};
  window.addEventListener('beforeunload',warn);return ()=>window.removeEventListener('beforeunload',warn);
 },[dirty]);
 const refreshVersions=async()=>{try{setVersions(await getVersionHistory(pageId))}catch(e){setError(e instanceof Error?e.message:'Unable to load versions')}};
 const downloadDraft=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(doc,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='draft-'+pageId+'.json';a.click();URL.revokeObjectURL(url)};
 const act=(operation:()=>PageDocument|{document:PageDocument;selectedId:string|null})=>{if(!canWrite||busy)return;setError('');try{const result=operation();dispatch('document' in result?{type:'commit',...result}:{type:'commit',document:result})}catch(e){setError(e instanceof Error?e.message:'Unable to edit')}};
 const patch=(props:Record<string,CMSField>)=>current&&act(()=>updateNode(doc,current.id,{props}));
 const add=(kind:ComponentName,parent:string|null)=>{const id=crypto.randomUUID();act(()=>({document:insertNode(doc,kind,id,parent),selectedId:id}));setPanel('settings')};
 const persist=async(publish=false)=>{if(busy)return;setBusy(true);setError('');setNotice('');try{saver.stage(doc);await saver.flush();if(publish){const result=await publishPage(pageId,saver.getSnapshot().revision);setNotice('Published version '+result.version)}if(showVersions)await refreshVersions()}catch(e){setError(e instanceof Error?e.message:'Unable to save')}finally{setBusy(false)}};
 const restore=async(versionId:string)=>{if(busy||!canWrite)return;setBusy(true);setError('');try{const document=await getVersionDocument(pageId,versionId);dispatch({type:'commit',document,selectedId:document.rootIds[0]??null});setNotice('Restored to draft. The live page is unchanged.')}catch(e){setError(e instanceof Error?e.message:'Unable to restore')}finally{setBusy(false)}};
 const rollback=async(versionId:string)=>{if(busy||!canPublish)return;setBusy(true);setError('');try{saver.stage(doc);await saver.flush();const result=await rollbackPage(pageId,versionId,saver.getSnapshot().revision);setNotice('Live page rolled back as version '+result.version+'. Your draft is unchanged.');await refreshVersions()}catch(e){setError(e instanceof Error?e.message:'Unable to roll back')}finally{setBusy(false)}};
 const siblings=current?(current.parentId?doc.nodes.find(n=>n.id===current.parentId)!.children:doc.rootIds):[];
 const position=current?siblings.indexOf(current.id):-1;
 return <main className="flex h-screen flex-col overflow-hidden bg-[#f4f2f0] text-[#302927]">
 <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b bg-white p-3"><div className="flex items-center gap-3"><a href="/" aria-label="Back to pages" className={button}>←</a><strong>Wiffeyyyy Editor</strong><span role="status" className="text-xs">{busy?'Working…':saveState.status==='saving'?'Autosaving…':saveState.status==='conflict'?'Conflict':saveState.status==='error'?'Save failed':dirty?'Waiting to save…':'Saved'}</span></div><div className="flex gap-2"><button className={button} aria-label="Undo" disabled={!canWrite||busy||!state.past.length} onClick={()=>dispatch({type:'undo'})}>Undo</button><button className={button} aria-label="Redo" disabled={!canWrite||busy||!state.future.length} onClick={()=>dispatch({type:'redo'})}>Redo</button><button className={button} onClick={()=>{setShowVersions(x=>!x);refreshVersions()}}>Versions</button><a className={button} href={"/preview/"+pageId} target="_blank" rel="noreferrer">Saved draft preview</a><button className={button} disabled={!canWrite||busy||!dirty||saveState.status==='conflict'} onClick={()=>persist()}>Save</button><button className={button+' bg-[#d86f91] text-white'} disabled={!canPublish||busy||saveState.status==='conflict'} onClick={()=>persist(true)}>Publish</button></div></header>
 {(error||saveState.message)&&<div role="alert" className="bg-red-50 p-3 text-sm text-red-800"><p>{error||saveState.message}</p><button className={button+' mt-2'} onClick={downloadDraft}>Download local draft</button>{saveState.status==='conflict'?<button className={button+' ml-2'} onClick={()=>location.reload()}>Reload latest (discards local edits)</button>:<button className={button+' ml-2'} disabled={busy||!canWrite} onClick={()=>persist()}>Retry save</button>}</div>}
 {notice&&<p role="status" className="bg-green-50 p-3 text-sm">{notice}</p>}
 {showVersions&&<section aria-label="Version history" className="max-h-64 shrink-0 overflow-auto border-b bg-white p-3"><div className="flex justify-between"><h2 className="font-semibold">Version history</h2><button className={button} onClick={refreshVersions}>Refresh versions</button></div><p className="my-2 text-xs">Restore creates a draft edit. Rollback changes the live page and retains your draft. Latest 50 snapshots.</p>{!versions.length&&<p className="text-sm">No saved versions yet.</p>}<ul className="space-y-2">{versions.map(v=><li key={v.id} className="flex flex-wrap items-center gap-2 text-sm"><span>Version {v.version_number} · {v.status} · {v.created_at.slice(0,19).replace('T',' ')} UTC</span><a className={button} href={'/preview/'+pageId+'?version='+v.id} target="_blank" rel="noreferrer">Preview</a><button className={button} disabled={!canWrite||busy} onClick={()=>restore(v.id)}>Restore to draft</button>{v.status==='published'&&<button className={button} disabled={!canPublish||busy} onClick={()=>rollback(v.id)}>Rollback live</button>}</li>)}</ul></section>}
 <nav aria-label="Editor panels" className="flex border-b bg-white lg:hidden">{(['layers','canvas','settings'] as const).map(x=><button key={x} aria-pressed={panel===x} className={'flex-1 p-3 text-sm '+(panel===x?'bg-[#f7e5eb]':'')} onClick={()=>setPanel(x)}>{x}</button>)}</nav>
 <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)_300px]">
 <aside aria-label="Layers" className={(panel==='layers'?'block':'hidden')+' overflow-auto border-r bg-white p-4 lg:block'}><h2 className="font-semibold">Layers</h2><button className={button+' mt-3 w-full'} disabled={!canWrite||busy} onClick={()=>add('section',null)}>+ Section</button><Navigator document={doc} selected={state.selectedId} onSelect={id=>dispatch({type:'select',id})} onToggle={node=>act(()=>updateNode(doc,node.id,{visible:!node.visible}))}/>{!doc.nodes.length&&<p className="mt-4 text-sm text-[#81736d]">Add your first section to begin.</p>}</aside>
 <section aria-label="Live canvas" className={(panel==='canvas'?'block':'hidden')+' min-w-0 overflow-auto p-4 lg:block'}><div className="mb-4 flex justify-center gap-2">{(['mobile','tablet','desktop'] as const).map(d=><button className={button} key={d} aria-pressed={device===d} onClick={()=>setDevice(d)}>{d}</button>)}</div><div className="mx-auto min-h-[600px] rounded-3xl border-4 border-[#302927] bg-white p-4 shadow-lg" style={{width:device==='mobile'?390:device==='tablet'?768:1100,maxWidth:'100%'}}><CMSRenderer document={doc} embedded selectedId={state.selectedId??undefined} onSelect={id=>{dispatch({type:'select',id});setPanel('settings')}}/>{!doc.nodes.length&&<p className="p-8 text-center text-sm text-[#81736d]">Your draft is empty. Add a section from Layers.</p>}</div><p className="mt-3 text-center text-xs text-[#81736d]">{device} preview · draft</p></section>
 <aside aria-label="Inspector" className={(panel==='settings'?'block':'hidden')+' overflow-auto border-l bg-white p-4 lg:block'}><div className="mb-4 flex gap-2">{(['content','design','page'] as const).map(t=><button className={button} key={t} aria-pressed={tab===t} onClick={()=>setTab(t)}>{t}</button>)}</div>
 <fieldset disabled={!canWrite||busy} className="space-y-4 disabled:opacity-60">
 {tab==='page'?<><h2 className="font-semibold">Page theme</h2>{['background','text','primary','surface','muted'].map(key=><Field key={key+String(doc.theme?.[key])} field={{key,label:key,type:'color'}} value={doc.theme?.[key]} onApply={value=>act(()=>({...doc,theme:{...doc.theme,[key]:value}}))}/>)}<Field key={'theme-radius'+String(doc.theme?.radius)} field={{key:'radius',label:'App card radius',type:'number',min:0,max:64}} value={doc.theme?.radius??24} onApply={value=>act(()=>({...doc,theme:{...doc.theme,radius:value}}))}/></>:current?<>
 <h2 className="font-semibold">{current.label??current.component}</h2>
 <div className="flex flex-wrap gap-2"><button className={button} disabled={position<=0} onClick={()=>act(()=>moveNode(doc,current.id,-1))}>Move up</button><button className={button} disabled={position===siblings.length-1} onClick={()=>act(()=>moveNode(doc,current.id,1))}>Move down</button><button className={button} onClick={()=>act(()=>duplicateNode(doc,current.id,()=>crypto.randomUUID()))}>Duplicate</button><button className={button} onClick={()=>act(()=>({document:deleteNode(doc,current.id),selectedId:current.parentId}))}>Delete</button></div>
 <label className="flex justify-between text-sm">Visible<input type="checkbox" checked={current.visible} onChange={e=>act(()=>updateNode(doc,current.id,{visible:e.target.checked}))}/></label>
 {tab==='content'?<><Field key={current.id+current.label} field={{key:'label',label:'Layer name',type:'text'}} value={current.label??current.component} onApply={value=>act(()=>updateNode(doc,current.id,{label:String(value)}))}/>{(componentFields[current.component]??[]).map(field=><Field key={current.id+field.key+String(current.props[field.key])} field={field} value={current.props[field.key]} onApply={value=>patch({[field.key]:value})}/>)}</>:designFields.map(field=><Field key={current.id+field.key+String(current.props[field.key])} field={field} value={current.props[field.key]} onApply={value=>patch({[field.key]:value})}/>)}
 {current.type==='section'&&<div className="border-t pt-4"><label className="block text-sm">Add inside this section<select className={input} value={component} onChange={e=>setComponent(e.target.value as ComponentName)}>{Object.entries(componentRegistry).map(([key,value])=><option key={key} value={key}>{value.label}</option>)}</select></label><button className={button+' mt-2'} onClick={()=>add(component,current.id)}>Add component</button></div>}
 </>:<p className="text-sm text-[#81736d]">Select a layer to edit its settings.</p>}
 </fieldset>{!canWrite&&<p className="mt-4 text-sm">Your role has read-only access.</p>}
 </aside></div></main>;
}
