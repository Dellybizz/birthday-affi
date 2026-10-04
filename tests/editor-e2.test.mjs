import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
const cache=new Map();
function load(file){file=path.resolve(file);if(cache.has(file))return cache.get(file).exports;const module={exports:{}};cache.set(file,module);const code=ts.transpile(fs.readFileSync(file,'utf8'),{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022});new Function('require','module','exports',code)(name=>{if(!name.startsWith('.'))throw new Error('Unexpected dependency '+name);return load(path.resolve(path.dirname(file),name)+'.ts')},module,module.exports);return module.exports}
const capabilities=load('packages/content/src/inspector-capabilities.ts');
const {createNode}=load('packages/content/src/registry.ts');
function page(nodes,rootIds,layout){return {schemaVersion:2,nodes,rootIds,theme:{background:'#ffffff',surface:'#ffffff',text:'#111111',muted:'#777777',primary:'#ff78b4',radius:24},...(layout?{layout:{version:1,page:layout}}:{})}}

test('E2 hides unbound generic appearance controls on specialized app renderers',()=>{
 const section=createNode('section','root');section.children=['post'];const post=createNode('movie-scene','post','root');post.props.mediaKind='video';post.props.poster='';
 const doc=page([section,post],['root'],'movie'),caps=capabilities.getInspectorCapabilities('movie',doc,post);
 assert.ok(caps.some(c=>c.field.key==='src'&&c.group==='content'&&c.media?.kind==='video'));
 assert.ok(caps.some(c=>c.field.key==='poster'&&c.media?.kind==='image'));
 assert.ok(caps.some(c=>c.field.key==='mediaKind'&&c.group==='behavior'));
 assert.equal(caps.some(c=>c.field.key==='padding'||c.field.key==='borderWidth'||c.field.key==='shadow'),false);
 post.props.mediaKind='image';const imageCaps=capabilities.getInspectorCapabilities('movie',doc,post);assert.equal(imageCaps.some(c=>c.field.key==='poster'||c.field.key==='captions'),false);
});

test('E2 archive-only controls never leak onto unrelated sections',()=>{
 const root=createNode('section','root');root.props.archivePart='page';const child=createNode('section','child','root');root.children=['child'];const doc=page([root,child],['root']);
 const rootKeys=new Set(capabilities.getInspectorCapabilities('memories-archive',doc,root).map(c=>c.field.key));const childKeys=new Set(capabilities.getInspectorCapabilities('memories-archive',doc,child).map(c=>c.field.key));
 assert.ok(rootKeys.has('visualEffects'));assert.ok(rootKeys.has('transitionEnabled'));assert.equal(childKeys.has('visualEffects'),false);assert.equal(childKeys.has('transitionEnabled'),false);
});

test('E2 phone controls expose only renderer-backed settings',()=>{
 const root=createNode('section','home');root.props.phonePart='home';root.children=['wall'];const wall=createNode('image','wall','home');wall.props.phonePart='wallpaper';wall.props.src='';wall.props.dim=.15;const doc=page([root,wall],['home'],'home');
 const keys=new Set(capabilities.getInspectorCapabilities('home',doc,wall).map(c=>c.field.key));
 for(const key of ['src','alt','objectFit','focalX','focalY','dim','background','opacity'])assert.ok(keys.has(key),key);
 for(const key of ['borderWidth','shadow','maxWidth','album','date','body'])assert.equal(keys.has(key),false,key);
 assert.equal(capabilities.supportsPageTheme('home',doc),false);
});

test('E2 media targets are independent and secondary picks cannot replace primary src',()=>{
 const section=createNode('section','root');section.children=['post'];const post=createNode('movie-scene','post','root');post.props.src='/media/11111111-1111-1111-1111-111111111111';post.props.poster='';const doc=page([section,post],['root'],'movie');
 const caps=capabilities.getInspectorCapabilities('movie',doc,post),poster=caps.find(c=>c.field.key==='poster').media,primary=caps.find(c=>c.field.key==='src').media;
 const picked={id:'22222222-2222-2222-2222-222222222222',alt_text:'cover',width:800,height:1200,metadata:{variants:[480,960]}};
 const posterPatch=capabilities.mediaSelectionPatch(poster,picked);assert.deepEqual(posterPatch,{poster:'/media/22222222-2222-2222-2222-222222222222'});assert.equal(Object.hasOwn(posterPatch,'src'),false);
 const primaryPatch=capabilities.mediaSelectionPatch(primary,picked);assert.equal(primaryPatch.src,'/media/22222222-2222-2222-2222-222222222222');assert.equal(primaryPatch.mediaAssetId,picked.id);
});

test('E2 normalizes limits and reset preserves document identity/hierarchy',()=>{
 assert.equal(capabilities.normalizeInspectorValue({key:'padding',label:'Padding',type:'number',min:0,max:96},'999'),96);
 assert.equal(capabilities.normalizeInspectorValue({key:'columns',label:'Columns',type:'number',min:1,max:4},'2.7'),3);
 assert.throws(()=>capabilities.normalizeInspectorValue({key:'background',label:'Background',type:'color'},'red'));
 const root=createNode('section','root');root.props.padding=72;const doc=page([root],['root']);const cap=capabilities.getInspectorCapabilities('memories-archive',doc,root).find(c=>c.field.key==='padding');const reset=capabilities.resetNodeProperty(doc,'root','padding',cap.hasDefault,cap.defaultValue);
 assert.equal(reset.nodes[0].id,'root');assert.deepEqual(reset.rootIds,['root']);assert.equal(reset.nodes[0].props.padding,20);assert.equal(doc.nodes[0].props.padding,72);
});
