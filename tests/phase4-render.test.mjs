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
  if(name.startsWith('.'))return load(path.resolve(path.dirname(file),name+(fs.existsSync(path.resolve(path.dirname(file),name+'.tsx'))?'.tsx':'.ts')));
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

test('published app blocks render interactive experiences in hierarchy order',()=>{let document=insertNode(empty,'section','s',null);document=insertNode(document,'reason','first','s');document=insertNode(document,'reason','second','s');document=updateNode(document,'first',{props:{title:'My first reason',body:'One'}});document=updateNode(document,'second',{props:{title:'My second reason',body:'Two'}});const html=render(CMSRenderer,{document});assert.match(html,/Save favourite/);assert.equal((html.match(/My first reason<\/h2>/g)??[]).length,1);assert.ok(html.indexOf('My first reason')<html.indexOf('My second reason'));assert.doesNotMatch(html,/Sample content/);const editor=render(CMSRenderer,{document,onSelect:()=>{}});assert.match(editor,/data-node-id="first"/);assert.doesNotMatch(editor,/Save favourite/);document=updateNode(document,'s',{visible:false});assert.doesNotMatch(render(CMSRenderer,{document}),/My first reason/)});

const {builtinPages,createDefaultPage,updateNode:edit,installDefaultLayout}=load(path.join(root,'packages/content/src/index.ts'));
test('complete default pages render the same real layout in selection and interactive modes',()=>{
 const checks={welcome:'Open your birthday world',home:'Birthday Hotline',reasons:'1 / 10 reasons',hotline:'Your future husband',adventure:'Choose an atmosphere',movie:'Our Birthday Movie','kiss-shop':'Your bag',radio:'Choose a station'};
 for(const slug of builtinPages){const document=createDefaultPage(slug);for(const editing of [false,true]){const html=render(CMSRenderer,{document,onSelect:editing?()=>{}:undefined});assert.ok(html.includes(checks[slug]),slug);assert.doesNotMatch(html,/Something lovely is on its way|There’s no content/);if(slug!=='hotline')assert.doesNotMatch(html,/autoplay/);}}
});
test('typed app sections retain edited labels and media in the real editor layout',()=>{
 let document=createDefaultPage('hotline');const message=document.nodes.find(n=>n.component==='hotline-message');document=edit(document,message.id,{props:{title:'My real message',body:'My own transcript',src:'https://example.com/greeting.mp3'}});const html=render(CMSRenderer,{document,onSelect:()=>{},selectedId:message.id});assert.match(html,/My real message/);assert.match(html,/My own transcript/);assert.match(html,/data-layout-node-id/);assert.match(html,/greeting.mp3/);
});
test('receipt images escape user copy instead of injecting SVG markup',()=>{const {giftReceiptSvg}=load(path.join(root,'packages/ui/src/page-layout.tsx'));const svg=giftReceiptSvg([{id:'gift',props:{title:'<script>alert(1)</script>'}}],'A & B','No expiry');assert.doesNotMatch(svg,/<script>/);assert.match(svg,/&lt;script&gt;/);assert.match(svg,/A &amp; B/)});

test('providers exported across the RSC boundary are component functions and render their children',()=>{for(const [file,key,value] of [['navigation','SiteNavigationProvider',null],['page-layout','DocumentSettingsProvider',load(path.join(root,'packages/content/src/site-document.ts')).defaultSiteDocument],['media-player','AudioDefaultsProvider',{volume:1,muted:false}]]){const Provider=load(path.join(root,'packages/ui/src/'+file+'.tsx'))[key];assert.equal(typeof Provider,'function');assert.match(render(Provider,{value,children:createElement('p',null,'Provider content')}),/Provider content/)}});

test('Android home renders wallpaper, six full icon links, notification shade and selectable editor layers',()=>{
 const {installPhoneHome}=load(path.join(root,'packages/content/src/index.ts'));
 let document=installPhoneHome(createDefaultPage('home'));
 const wallpaper=document.nodes.find(n=>n.props.phonePart==='wallpaper');
 document=edit(document,wallpaper.id,{props:{src:'https://example.com/wallpaper.jpg',focalX:25,focalY:75,dim:0.3}});
 const html=render(CMSRenderer,{document});
 assert.match(html,/phone-wallpaper-image/);assert.match(html,/object-position:25% 75%/);assert.match(html,/Open notification shade/);assert.match(html,/Phone navigation/);assert.match(html,/Clear all/);
 for(const slug of ['reasons','hotline','adventure','movie','kiss-shop','radio'])assert.match(html,new RegExp('href="/app/'+slug+'"'));
 const selected=document.nodes.find(n=>n.props.phonePart==='app-icon');
 const editor=render(CMSRenderer,{document,onSelect:()=>{},selectedId:selected.id});
 assert.match(editor,/Select Reasons/);assert.doesNotMatch(editor,/href="\/app\//);
 const inspector=render(Editor,{pageId:'test',siteId:'site',initialDocument:document});assert.match(inspector,/iPhone home screen/);assert.match(inspector,/Select Wallpaper/);
});

test('iPhone home presents six destinations once, removes Android navigation and unnecessary copy',()=>{
 const {installPhoneHome}=load(path.join(root,'packages/content/src/index.ts'));const document=installPhoneHome(createDefaultPage('home')),html=render(CMSRenderer,{document});
 assert.match(html,/phone-island/);assert.match(html,/phone-dock/);assert.match(html,/phone-home-indicator/);assert.doesNotMatch(html.split('<dialog')[0],/aria-label="Back"|href="\/home"|Six little places|A little world, just for you|Your birthday edition|phone-folder-link/);
 for(const slug of ['reasons','hotline','adventure','movie','kiss-shop','radio'])assert.equal((html.match(new RegExp('aria-label="Open '+({'reasons':'Reasons','hotline':'Hotline','adventure':'Adventure','movie':'Movie','kiss-shop':'Kiss Shop','radio':'Radio'}[slug])+'"','g'))??[]).length,1);
});

test('live Hotline keeps editable section labels and a disabled editor call preview',()=>{
 let document=createDefaultPage('hotline');const node=document.nodes.find(n=>n.props.sectionKind==='incoming-call');
 document=edit(document,node.id,{props:{incomingTitle:'My private priority line',callerName:'Zaid',answerLabel:'Call Zaid'}});
 const live=render(CMSRenderer,{document});assert.match(live,/My private priority line/);assert.match(live,/Zaid/);assert.match(live,/Call Zaid/);assert.doesNotMatch(live,/Open your private link/);
 const preview=render(CMSRenderer,{document,onSelect:()=>{}});assert.match(preview,/One tap away/);assert.match(preview,/disabled=""[^>]*><span[^>]*>☎<\/span> Call Zaid/);
});
