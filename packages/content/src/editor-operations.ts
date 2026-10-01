import type { CMSField, PageDocument } from './cms';
import { createNode, type ComponentName } from './registry';
import { parsePageDocument } from './validate';
export type EditorState = { document: PageDocument; selectedId: string | null; past: PageDocument[]; future: PageDocument[] };
export type EditorAction = { type: 'commit'; document: PageDocument; selectedId?: string | null } | { type: 'select'; id: string | null } | { type: 'undo' | 'redo' };
export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  if(action.type==='select')return {...state,selectedId:action.id};
  if(action.type==='commit') {
    const document=parsePageDocument(action.document);
    if(JSON.stringify(document)===JSON.stringify(state.document))return state;
    return {document,selectedId:action.selectedId===undefined?state.selectedId:action.selectedId,past:[...state.past,state.document].slice(-50),future:[]};
  }
  const source=action.type==='undo'?state.past:state.future;
  const document=source.at(-1);
  if(!document)return state;
  return {...state,document,selectedId:document.nodes.some(n=>n.id===state.selectedId)?state.selectedId:null,
    past:action.type==='undo'?state.past.slice(0,-1):[...state.past,state.document].slice(-50),
    future:action.type==='undo'?[...state.future,state.document]:state.future.slice(0,-1)};
}
const copy=(doc:PageDocument):PageDocument=>structuredClone(doc);
export function insertNode(doc:PageDocument,component:ComponentName,id:string,parentId:string|null):PageDocument {
  const next=copy(doc);
  const parent=parentId?next.nodes.find(n=>n.id===parentId):null;
  if(parentId&&(!parent||parent.type!=='section'))throw new Error('Choose a section to contain this component');
  if(!parentId&&component!=='section')throw new Error('Blocks require a section');
  next.nodes.push(createNode(component,id,parentId));
  if(parent)parent.children.push(id);else next.rootIds.push(id);
  return parsePageDocument(next);
}
export function updateNode(doc:PageDocument,id:string,update:{label?:string;visible?:boolean;props?:Record<string,CMSField>}):PageDocument {
  const next=copy(doc);const node=next.nodes.find(n=>n.id===id);if(!node)throw new Error('Node not found');
  if(update.label!==undefined)node.label=update.label;
  if(update.visible!==undefined)node.visible=update.visible;
  if(update.props)node.props={...node.props,...update.props};
  return parsePageDocument(next);
}
function subtree(doc:PageDocument,id:string):Set<string> {
  const ids=new Set<string>();const byId=new Map(doc.nodes.map(n=>[n.id,n]));
  const visit=(key:string)=>{if(ids.has(key))return;const n=byId.get(key);if(!n)throw new Error('Node not found');ids.add(key);n.children.forEach(visit)};
  visit(id);return ids;
}
export function deleteNode(doc:PageDocument,id:string):PageDocument {
  const ids=subtree(doc,id);const next=copy(doc);
  next.nodes=next.nodes.filter(n=>!ids.has(n.id)).map(n=>({...n,children:n.children.filter(key=>!ids.has(key))}));
  next.rootIds=next.rootIds.filter(key=>!ids.has(key));return parsePageDocument(next);
}
export function duplicateNode(doc:PageDocument,id:string,newId:()=>string):{document:PageDocument;selectedId:string} {
  const ids=subtree(doc,id);const remap=new Map([...ids].map(key=>[key,newId()]));const next=copy(doc);
  const original=next.nodes.find(n=>n.id===id)!;const selectedId=remap.get(id)!;
  next.nodes.push(...doc.nodes.filter(n=>ids.has(n.id)).map(n=>({...structuredClone(n),id:remap.get(n.id)!,label:n.id===id?(n.label??n.component)+' Copy':n.label,parentId:n.parentId&&ids.has(n.parentId)?remap.get(n.parentId)!:n.parentId,children:n.children.map(key=>remap.get(key)!)})));
  const siblings=original.parentId?next.nodes.find(n=>n.id===original.parentId)!.children:next.rootIds;
  siblings.splice(siblings.indexOf(id)+1,0,selectedId);
  return {document:parsePageDocument(next),selectedId};
}
export function moveNode(doc:PageDocument,id:string,direction:-1|1):PageDocument {
  const next=copy(doc);const node=next.nodes.find(n=>n.id===id);if(!node)throw new Error('Node not found');
  const siblings=node.parentId?next.nodes.find(n=>n.id===node.parentId)!.children:next.rootIds;
  const index=siblings.indexOf(id);const target=index+direction;
  if(target<0||target>=siblings.length)return doc;
  [siblings[index],siblings[target]]=[siblings[target],siblings[index]];
  return parsePageDocument(next);
}
