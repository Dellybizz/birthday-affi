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
 const checks={welcome:'Open your birthday world',home:'Hotdial',reasons:'1 / 10 reasons',hotline:'Your future husband',adventure:'Pardanasheen',movie:'saragram','kiss-shop':'Made for you.',radio:'Choose a station'};
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
 for(const slug of ['reasons','hotline','adventure','movie','kiss-shop','camera','vault'])assert.match(html,new RegExp('href="/app/'+slug+'"'));
 const selected=document.nodes.find(n=>n.props.phonePart==='app-icon');
 const editor=render(CMSRenderer,{document,onSelect:()=>{},selectedId:selected.id});
 assert.match(editor,/Select Adore/);assert.doesNotMatch(editor,/href="\/app\//);
 const inspector=render(Editor,{pageId:'test',siteId:'site',initialDocument:document});assert.match(inspector,/iPhone home screen/);assert.match(inspector,/Select Wallpaper/);
});

test('iPhone home presents seven destinations with Hotdial, Pardanasheen and Clicksara in both grid and dock, removes Android navigation and unnecessary copy',()=>{
 const {installPhoneHome}=load(path.join(root,'packages/content/src/index.ts'));const document=installPhoneHome(createDefaultPage('home')),html=render(CMSRenderer,{document});
 assert.match(html,/phone-island/);assert.match(html,/phone-dock/);assert.match(html,/phone-home-indicator/);assert.doesNotMatch(html.split('<dialog')[0],/aria-label="Back"|href="\/home"|Six little places|A little world, just for you|Your birthday edition|phone-folder-link/);
 for(const slug of ['reasons','hotline','adventure','movie','kiss-shop','camera','vault'])assert.equal((html.match(new RegExp('aria-label="Open '+({'reasons':'Adore','hotline':'Hotdial','adventure':'Pardanasheen','movie':'Saragram','kiss-shop':'Kiss Shop','camera':'Clicksara','vault':'Vault'}[slug])+'"','g'))??[]).length,['hotline','camera','adventure'].includes(slug)?2:1);
});

test('live Hotline keeps editable section labels and a disabled editor call preview',()=>{
 let document=createDefaultPage('hotline');const node=document.nodes.find(n=>n.props.sectionKind==='incoming-call');
 document=edit(document,node.id,{props:{incomingTitle:'My private priority line',callerName:'Zaid',answerLabel:'Call Zaid'}});
 const live=render(CMSRenderer,{document});assert.match(live,/My private priority line/);assert.match(live,/Zaid/);assert.match(live,/Call Zaid/);assert.doesNotMatch(live,/Open your private link/);
 const preview=render(CMSRenderer,{document,onSelect:()=>{}});assert.match(preview,/One tap away/);assert.match(preview,/disabled=""[^>]*><span[^>]*>☎<\/span> Call Zaid/);
});

 test('Pardanasheen retains editable photo/video layers and shows only supplied public media',()=>{
 let document=createDefaultPage('adventure');const image=document.nodes.find(n=>n.component==='image'),video=document.nodes.find(n=>n.component==='video');
 assert.match(render(CMSRenderer,{document}),/No Photos or Videos/);
 document=edit(document,image.id,{props:{src:'https://example.com/fit.jpg',title:'Evening look',album:'Evenings'}});document=edit(document,video.id,{props:{src:'https://example.com/fit.mp4',title:'In motion'}});
 const publicHtml=render(CMSRenderer,{document});assert.match(publicHtml,/fit.jpg/);assert.match(publicHtml,/fit.mp4/);assert.match(publicHtml,/Open Evening look/);assert.doesNotMatch(publicHtml,/Choose an atmosphere|It’s a date/);
 const editor=render(CMSRenderer,{document,onSelect:()=>{},selectedId:image.id});assert.ok(editor.includes('data-layout-node-id="'+image.id+'"'));assert.match(editor,/Select First fit check/);
 document=edit(document,image.parentId,{visible:false});assert.doesNotMatch(render(CMSRenderer,{document}),/fit.jpg|fit.mp4/);
 });

test('Adore journal keeps voice notes and selected reason and letter layers editable',()=>{
 let document=createDefaultPage('reasons');const reason=document.nodes.find(n=>n.component==='reason');document=edit(document,reason.id,{props:{voiceSrc:'https://example.com/love.mp3',transcript:'My spoken words'}});
 const live=render(CMSRenderer,{document});assert.match(live,/love.mp3/);assert.match(live,/My spoken words/);assert.match(live,/Treasured/);
 const second=document.nodes.filter(n=>n.component==='reason')[1];assert.match(render(CMSRenderer,{document,onSelect:()=>{},selectedId:second.id}),/Your little expressions/);
 const letter=document.nodes.find(n=>n.props.sectionKind==='heartfelt-card');const editor=render(CMSRenderer,{document,onSelect:()=>{},selectedId:letter.id});assert.match(editor,/And my favourite reason/);assert.match(editor,/Select Heartfelt message/);
});

test('shared notifications expose an app trigger and reuse home editable messages without duplicate shades',()=>{
 const {NotificationShade}=load(path.join(root,'packages/ui/src/notification-shade.tsx'));
 const document=load(path.join(root,'packages/content/src/index.ts')).installPhoneHome(createDefaultPage('home'));
 const notifications=[{id:'custom',title:'An edited notification',body:'My personal copy',href:'/app/reasons',icon:'♡'}];
 const html=render(NotificationShade,{notifications,app:true,children:createElement(CMSRenderer,{document})});
 assert.match(html,/My personal copy/);assert.match(html,/href="\/app\/reasons"/);assert.match(html,/Open notification shade, 1 notifications/);assert.equal((html.match(/<dialog/g)??[]).length,1);
});

test('Saragram uses supplied media, keeps photo and reel selection editable, and hides removed media',()=>{
 let document=createDefaultPage('movie');const profile=document.nodes.find(n=>n.props.sectionKind==='movie-credits'),scenes=document.nodes.filter(n=>n.component==='movie-scene');
 assert.match(render(CMSRenderer,{document}),/Your moments belong here/);
 document=edit(document,profile.id,{props:{username:'sara',profileName:'Sara',bio:'Our little memories'}});
 document=edit(document,scenes[0].id,{props:{mediaKind:'image',src:'https://example.com/photo.jpg',body:'My photo caption'}});
 document=edit(document,scenes[1].id,{props:{mediaKind:'video',src:'https://example.com/reel.mp4',body:'My reel caption'}});
 const live=render(CMSRenderer,{document});assert.match(live,/saragram/);assert.match(live,/photo.jpg/);assert.match(live,/reel.mp4/);assert.match(live,/My photo caption/);assert.match(live,/Saragram navigation/);assert.doesNotMatch(live,/Cinema|Watch our film|PRIVATE SCREENING/);
 const preview=render(CMSRenderer,{document,onSelect:()=>{},selectedId:scenes[1].id});assert.match(preview,/reel.mp4/);assert.match(preview,/Select Our favourite memories/);assert.doesNotMatch(preview,/controls=|autoPlay/);
 document=edit(document,scenes[1].parentId,{visible:false});assert.doesNotMatch(render(CMSRenderer,{document,onSelect:()=>{},selectedId:scenes[1].id}),/photo.jpg|reel.mp4/);
});

test('Camera requires an explicit permission action and exposes photo and video controls',()=>{
 const {CameraApp}=load(path.join(root,'packages/ui/src/camera-app.tsx'));const html=render(CameraApp,{});
 assert.match(html,/Enable camera/);assert.match(html,/Take photo/);assert.match(html,/Switch camera/);assert.match(html,/VIDEO/);assert.match(html,/PHOTO/);assert.match(html,/href="\/home"/);
});
test('Saved iPhone homes replace Radio with Camera and move Hotdial into the grid',()=>{
 const {installPhoneHome}=load(path.join(root,'packages/content/src/index.ts'));const document=installPhoneHome(createDefaultPage('home'));
 const phone=document.nodes.find(n=>n.props.pageSlug==='hotline'&&n.props.phonePart==='app-icon');phone.props.placement='dock';
 const camera=document.nodes.find(n=>n.props.pageSlug==='camera'&&n.props.phonePart==='app-icon');camera.props.pageSlug='radio';
 const html=render(CMSRenderer,{document});assert.doesNotMatch(html,/href="\/app\/radio"/);assert.match(html,/href="\/app\/camera"/);
 assert.match(html.split('phone-dock')[0],/aria-label="Open Hotdial"/);
});

test('Pardanasheen includes every saved camera photo/video in its library',()=>{
 const hook=load(path.join(root,'packages/ui/src/use-camera-roll.ts')),original=hook.useCameraRoll;
 hook.useCameraRoll=()=>({loading:false,error:'',items:[
 {id:'camera-one',kind:'image',url:'blob:camera-one',createdAt:'2026-10-02T05:00:00Z',mimeType:'image/jpeg'},
 {id:'camera-two',kind:'image',url:'blob:camera-two',createdAt:'2026-10-02T05:01:00Z',mimeType:'image/jpeg'},
 {id:'camera-three',kind:'video',url:'blob:camera-three',createdAt:'2026-10-02T05:02:00Z',mimeType:'video/webm'}
 ]});
 try{const html=render(CMSRenderer,{document:createDefaultPage('adventure'),persistProgress:true});assert.match(html,/blob:camera-one/);assert.match(html,/blob:camera-two/);assert.match(html,/blob:camera-three/);assert.match(html,/2 Photos, 1 Videos/);assert.match(html,/Captured with Clicksara/)}finally{hook.useCameraRoll=original}
});

test('KissShop renders eight boutique gifts and three free treats with editable products',()=>{
 let document=createDefaultPage('kiss-shop');const gift=document.nodes.find(n=>n.component==='kiss-gift');document=edit(document,gift.id,{props:{title:'Personal cozy gift',body:'Our custom promise',price:'8 kisses',src:'https://example.com/gift.jpg'}});
 const html=render(CMSRenderer,{document,onSelect:()=>{},selectedId:gift.id});assert.match(html,/Personal cozy gift/);assert.match(html,/Our custom promise/);assert.match(html,/8 kisses/);assert.match(html,/gift.jpg/);assert.match(html,/Select Personal cozy gift/);assert.match(html,/Just because you/);assert.match(html,/Our little plans/);
});

test('Memories Archive edits flow to both public and editor rendering, with responsive collection and independent memories',()=>{const {createMemoriesArchive,duplicateNode,resolveResponsive}=load(path.join(root,'packages/content/src/index.ts'));let i=0;let doc=createMemoriesArchive(()=> 'archive-'+(++i));const card=doc.nodes.find(n=>n.props.archivePart==='memory');doc=updateNode(doc,card.id,{props:{paddingLeft:7,paddingRight:31,radius:14}});const photo=doc.nodes.find(n=>n.parentId===card.id&&n.component==='image');doc=updateNode(doc,photo.id,{props:{src:'/puzzles/level-one.jpg',alt:'An edited memory'}});const text=doc.nodes.find(n=>n.parentId===card.id&&n.component==='text');doc=updateNode(doc,text.id,{props:{text:'Our edited event'}});const html=render(CMSRenderer,{document:doc});assert.match(html,/Memories Archive/);assert.match(html,/Our edited event/);assert.match(html,/padding-left:7px/);assert.match(html,/padding-right:31px/);assert.match(html,/An edited memory/);const grid=doc.nodes.find(n=>n.props.archivePart==='collection');assert.equal(resolveResponsive(grid,'mobile').props.columns,1);const editor=render(CMSRenderer,{document:doc,onSelect:()=>{}});assert.match(editor,/Select Memory 1 · photo/);doc=updateNode(doc,card.id,{visible:false});assert.doesNotMatch(render(CMSRenderer,{document:doc}),/Our edited event/)});
