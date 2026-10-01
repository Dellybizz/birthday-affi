import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import ts from 'typescript';
const root=path.resolve(new URL('..',import.meta.url).pathname);
const req=createRequire(path.join(root,'apps/admin/package.json'));
const cache=new Map();
function load(file){
 if(cache.has(file))return cache.get(file).exports;
 const module={exports:{}};cache.set(file,module);
 const code=ts.transpile(fs.readFileSync(file,'utf8'),{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022});
 const localRequire=name=>{
  if(name==='@wiffeyyyy/content')return load(path.join(root,'packages/content/src/index.ts'));
  if(name==='@wiffeyyyy/ui/cms-renderer')return load(path.join(root,'packages/ui/src/cms-renderer.tsx'));
  if(name.endsWith('/media-library'))return {default:()=>null};
  if(name.endsWith('/site-actions'))return {saveDraft:()=>{throw Error('No server actions in rendering tests')},publishPage:()=>{throw Error('No server actions in rendering tests')}};
  if(name.startsWith('.'))return load(path.resolve(path.dirname(file),name+'.ts'));
  return req(name);
 };
 new Function('require','module','exports',code)(localRequire,module,module.exports);return module.exports;
}
const {createElement}=req('react');const {renderToStaticMarkup}=req('react-dom/server');
const Editor=load(path.join(root,'apps/admin/app/editor/[slug]/editor-client.tsx')).default;
const {CMSRenderer}=load(path.join(root,'packages/ui/src/cms-renderer.tsx'));
const {insertNode,updateNode}=load(path.join(root,'packages/content/src/index.ts'));
const empty={schemaVersion:2,nodes:[],rootIds:[]};
const render=(Component,props)=>renderToStaticMarkup(createElement(Component,props));
test('empty editor renders insertion controls and mobile panels',()=>{const html=render(Editor,{pageId:'test',initialDocument:empty});assert.match(html,/Add your first section/);assert.match(html,/Editor panels/);assert.match(html,/Live canvas/);assert.match(html,/Inspector/)});
test('viewer renders read-only controls and owner publication is disabled',()=>{const html=render(Editor,{pageId:'test',initialDocument:empty,canWrite:false,canPublish:false});assert.match(html,/read-only access/);assert.match(html,/<button[^>]*disabled=""[^>]*>Publish/);assert.match(html,/<fieldset disabled=""/)});
test('selected section exposes all registered insertion choices',()=>{const doc=insertNode(empty,'section','s',null);const html=render(Editor,{pageId:'test',initialDocument:doc,canPublish:false});for(const label of ['Heading','Paragraph','Image','App grid','Section'])assert.ok(html.includes('>'+label+'</option>'));assert.match(html,/Add component/)});
test('public renderer uses theme, hides subtrees, and editor has keyboard selection without navigation',()=>{let doc=insertNode(empty,'section','s',null);doc=insertNode(doc,'app-grid','apps','s');doc.theme={background:'#ffffff',primary:'#123456',surface:'#eeeeee',muted:'#111111',radius:12};const publicHtml=render(CMSRenderer,{document:doc});assert.match(publicHtml,/href="\/app\/reasons"/);assert.match(publicHtml,/--w-accent:#123456/);assert.match(publicHtml,/--w-radius:12px/);const editorHtml=render(CMSRenderer,{document:doc,onSelect:()=>{},embedded:true});assert.match(editorHtml,/aria-label="Select App grid"/);assert.match(editorHtml,/tabindex="0"/);assert.doesNotMatch(editorHtml,/href="\/app\//);doc=updateNode(doc,'s',{visible:false});assert.doesNotMatch(render(CMSRenderer,{document:doc}),/Reasons I/)});
test('image renderer preserves intrinsic dimensions, focal crop and responsive variants',()=>{let document=insertNode(empty,'section','s',null);document=insertNode(document,'image','i','s');document=updateNode(document,'i',{props:{src:'/media/00000000-0000-4000-8000-000000000020',mediaAssetId:'00000000-0000-4000-8000-000000000020',mediaWidth:1200,mediaHeight:800,variantWidths:'480,960',objectFit:'contain',focalX:25,focalY:75,displayHeight:320,alt:'Portrait'}});const html=render(CMSRenderer,{document});assert.match(html,/object-position:25% 75%/);assert.match(html,/object-fit:contain/);assert.match(html,/height:320px/);assert.match(html,/width="1200"/);assert.match(html,/height="800"/);assert.match(html,/variant=480 480w/);assert.match(html,/variant=960 960w/);assert.match(html,/loading="lazy"/);assert.match(html,/alt="Portrait"/)});
test('audio and video blocks use native controls without autoplay',()=>{let document=insertNode(empty,'section','s',null);for(const kind of ['audio','video']){document=insertNode(document,kind,kind,'s');document=updateNode(document,kind,{props:{src:'https://example.com/'+kind,alt:'Birthday '+kind}})}const html=render(CMSRenderer,{document});assert.match(html,/<audio[^>]*controls/);assert.match(html,/<video[^>]*controls/);assert.doesNotMatch(html,/autoplay/)});
