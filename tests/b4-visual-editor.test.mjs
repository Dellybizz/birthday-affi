import test from 'node:test';
import assert from 'node:assert/strict';
import {loadContentModule} from './load-content-module.mjs';
const {insertNode,updateNode,reorderNode,moveNode,duplicateNode,deleteNode,editorReducer}=loadContentModule('packages/content/src/editor-operations.ts');
const {getOrderedNodes}=loadContentModule('packages/content/src/tree-order.ts');
const {exportSection,importSection,compareDocuments}=loadContentModule('packages/content/src/power-editor.ts');
const {getInspectorCapabilities,resetInspectorGroup}=loadContentModule('packages/content/src/inspector-capabilities.ts');
const {deviceForWidth,clampViewport,VIEWPORTS}=loadContentModule('apps/admin/lib/editor-viewport.ts');
const empty=()=>({schemaVersion:2,nodes:[],rootIds:[]});
const sample=()=>{let d=insertNode(empty(),'section','s',null);d=insertNode(d,'text','one','s');d=insertNode(d,'text','two','s');d=insertNode(d,'section','other',null);return d};

test('B4 drag reorder preserves parentage, moves before/after and rejects cross-parent moves',()=>{
 const original=sample(),before=structuredClone(original);
 let next=reorderNode(original,'two','one','before');
 assert.deepEqual(next.nodes.find(n=>n.id==='s').children,['two','one']);
 assert.deepEqual(getOrderedNodes(next).map(n=>n.id),['s','two','one','other']);
 next=reorderNode(next,'two','one','after');assert.deepEqual(next.nodes.find(n=>n.id==='s').children,['one','two']);
 assert.deepEqual(reorderNode(next,'other','s','before').rootIds,['other','s']);
 assert.throws(()=>reorderNode(next,'one','other'),/same section/);
 assert.throws(()=>reorderNode(next,'missing','one'),/Layer not found/);
 assert.equal(reorderNode(next,'one','one'),next);assert.deepEqual(original,before);
});

test('B4 keyboard reorder, removal and copy participate in undo/redo without losing document content',()=>{
 const initial=sample();let state={document:initial,selectedId:'two',past:[],future:[]};
 state=editorReducer(state,{type:'commit',document:moveNode(initial,'two',-1)});
 state=editorReducer(state,{type:'commit',document:deleteNode(state.document,'s'),selectedId:null});
 assert.equal(state.document.nodes.length,1);
 state=editorReducer(state,{type:'undo'});assert.deepEqual(state.document.nodes.find(n=>n.id==='s').children,['two','one']);
 state=editorReducer(state,{type:'undo'});assert.deepEqual(state.document,initial);
 state=editorReducer(state,{type:'redo'});assert.deepEqual(state.document.nodes.find(n=>n.id==='s').children,['two','one']);
});

test('B4 reusable and duplicated sections remap internal references and remain independent',()=>{
 let d=insertNode(empty(),'section','s',null);d=insertNode(d,'movie-scene','scene','s');d=insertNode(d,'chapter','chapter','s');
 d=updateNode(d,'chapter',{props:{sceneId:'scene',title:'My chapter'}});
 let count=0;const nextId=()=>`copy-${++count}`;
 const copied=exportSection(d,'s'),imported=importSection(empty(),copied,nextId);
 const scene=imported.nodes.find(n=>n.component==='movie-scene'),chapter=imported.nodes.find(n=>n.component==='chapter');
 assert.equal(chapter.props.sceneId,scene.id);assert.notEqual(scene.id,'scene');
 const changed=updateNode(imported,chapter.id,{props:{title:'Edited copy'}});assert.equal(copied.nodes.find(n=>n.id==='chapter').props.title,'My chapter');
 assert.equal(changed.nodes.find(n=>n.id===chapter.id).props.title,'Edited copy');
 const duplicate=duplicateNode(d,'s',nextId),copyRoot=duplicate.document.nodes.find(n=>n.id===duplicate.selectedId);
 const copyChapter=duplicate.document.nodes.find(n=>n.parentId===copyRoot.id&&n.component==='chapter');
 assert.ok(copyRoot.children.includes(copyChapter.props.sceneId));
 assert.throws(()=>importSection(empty(),{...copied,rootIds:[]},nextId));
});

test('B4 group reset restores default/inheritance only in the selected scope',()=>{
 let doc=sample();doc=updateNode(doc,'one',{props:{text:'Keep my message',padding:30,'mobile:padding':12,'tablet:padding':16,color:'#ffffff'}});
 const node=doc.nodes.find(n=>n.id==='one'),caps=getInspectorCapabilities('letter',doc,node).filter(cap=>cap.field.key==='padding');
 let next=resetInspectorGroup(doc,node.id,caps,'mobile');
 assert.equal(next.nodes.find(n=>n.id==='one').props['mobile:padding'],undefined);
 assert.equal(next.nodes.find(n=>n.id==='one').props.padding,30);
 assert.equal(next.nodes.find(n=>n.id==='one').props['tablet:padding'],16);
 next=resetInspectorGroup(next,node.id,caps);
 assert.equal(next.nodes.find(n=>n.id==='one').props.padding,caps[0].defaultValue);
 assert.equal(next.nodes.find(n=>n.id==='one').props.text,'Keep my message');
 assert.equal(doc.nodes.find(n=>n.id==='one').props['mobile:padding'],12);
});

test('B4 version comparisons expose the previous and current field values',()=>{
 const before=sample(),after=updateNode(before,'one',{props:{text:'A revised message'}}),change=compareDocuments(before,after).find(c=>c.id==='one');
 assert.deepEqual(change.details.find(d=>d.field==='settings.text'),{field:'settings.text',before:before.nodes.find(n=>n.id==='one').props.text,after:'A revised message'});
 assert.deepEqual(compareDocuments(before,before),[]);
});

test('B4 one viewport model drives presets, resize bounds and responsive breakpoints',()=>{
 assert.deepEqual(VIEWPORTS['large-phone'],{width:430,height:932});
 assert.equal(deviceForWidth(599),'mobile');assert.equal(deviceForWidth(600),'tablet');assert.equal(deviceForWidth(960),'desktop');
 assert.equal(clampViewport(200,320,1600),320);assert.equal(clampViewport(2000,320,1600),1600);assert.equal(clampViewport(NaN,320,1600),320);
});

test('Adore photo controls are editable and Heart replacement preserves the memory and other images',()=>{
 let adore=insertNode(empty(),'section','deck',null);adore=insertNode(adore,'reason','note','deck');
 const caps=getInspectorCapabilities('reasons',adore,adore.nodes.find(n=>n.id==='note'));
 for(const key of ['src','objectFit','focalX','focalY','imageHeight','imageRadius','imageRotation'])assert.ok(caps.some(c=>c.field.key===key&&c.group==='content'),key);
 const {createHeartPage}=loadContentModule('packages/content/src/heart-page.ts');
 const {mediaSelectionPatch}=loadContentModule('packages/content/src/inspector-capabilities.ts');
 let id=0;const heart=createHeartPage(()=>String(++id)),images=heart.nodes.filter(n=>n.component==='image');
 const selected=images[0],mediaCap=getInspectorCapabilities('in-my-heart',heart,selected).find(c=>c.field.key==='src');
 assert.equal(mediaCap.media.kind,'image');
 const next=updateNode(heart,selected.id,{props:mediaSelectionPatch(mediaCap.media,{id:'11111111-1111-4111-8111-111111111111',alt_text:'New photo'})});
 const memory=next.nodes.find(n=>n.id===selected.id);
 assert.equal(memory.props.src,'/media/11111111-1111-4111-8111-111111111111');assert.equal(memory.props.body,selected.props.body);assert.equal(memory.parentId,selected.parentId);
 assert.deepEqual(next.nodes.find(n=>n.id===images[1].id),images[1]);
});
