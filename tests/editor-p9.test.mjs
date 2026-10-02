import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=path=>fs.readFileSync(path,'utf8');
const pages=read('apps/admin/lib/editor-pages.ts');
const renderer=read('packages/ui/src/cms-renderer.tsx');
const preview=read('apps/admin/app/preview/[pageId]/preview-client.tsx');
const frame=read('apps/admin/components/editor-live-frame.tsx');
const adminCss=read('apps/admin/app/admin-preview-isolation.css');
const rootPage=read('apps/web/app/page.tsx');
const customPage=read('apps/web/app/pages/[slug]/page.tsx');
const homePage=read('apps/web/app/home/page.tsx');
const appPage=read('apps/web/app/app/[slug]/page.tsx');
const journey=read('apps/web/components/archive-journey.tsx');
const motion=read('apps/web/components/phone-app-transition.tsx');
const editor=read('apps/admin/app/editor/[slug]/editor-client.tsx');
const editorLayout=read('apps/admin/app/editor/layout.tsx');
const inspector=read('apps/admin/components/editor-inspector-fields.tsx');
const autosave=read('packages/content/src/autosave.ts');

const ACTIVE=[
 ['memories-archive','Memories Archive','/'],
 ['in-my-heart','In My Heart','/pages/in-my-heart'],
 ['home','iPhone Home','/home'],
 ['reasons','Adore','/app/reasons'],
 ['hotline','Hotdial','/app/hotline'],
 ['adventure','Pardanasheen','/app/adventure'],
 ['movie','Saragram','/app/movie'],
 ['kiss-shop','Kiss Shop','/app/kiss-shop']
];

test('P9 active-page matrix keeps all eight live/editor experiences addressable',()=>{
 for(const [slug,title,path] of ACTIVE){
  const escaped=slug.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const key=new RegExp(`(?:'${escaped}'|${escaped.replace(/-/g,'\\-')}):\\{title:'${title.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}',livePath:'${path.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}'`);
  assert.match(pages,key,slug);
 }
 assert.match(pages,/editorHref:'\/editor\/'\+page\.slug/);
 assert.match(rootPage,/getPublishedDocument\('memories-archive'\)/);
 assert.match(rootPage,/className="os-archive-page"/);
 assert.match(customPage,/slug==='in-my-heart'\?'os-heart-page'/);
 assert.match(homePage,/getPublishedDocument\('home'\)/);
 assert.match(homePage,/className="os-phone-home"/);
 for(const slug of ['reasons','hotline','adventure','movie','kiss-shop'])assert.ok(appPage.includes("slug==='"+slug+"'")||appPage.includes("slug!=='"+slug+"'"),slug);
});

test('P9 editor preview uses the live renderer families and live route shells',()=>{
 assert.match(renderer,/LiveEditorPreviewProvider/);
 assert.match(renderer,/exactLivePreview/);
 assert.match(renderer,/<HeartPage document=\{valid\}/);
 assert.match(renderer,/<KissShop document=\{valid\}/);
 assert.match(renderer,/<Saragram document=\{valid\}/);
 assert.match(renderer,/<AdoreJournal document=\{valid\}/);
 assert.match(renderer,/<PhotoLibrary document=\{valid\}/);
 assert.match(renderer,/<PhoneHome document=\{valid\}/);
 assert.match(renderer,/archiveRoot\?'os-archive-page'/);
 assert.match(renderer,/phone\?'os-home os-hotline-page'/);
 assert.match(renderer,/liveShell\(page,'os-phone-home',true\)/);
 assert.match(preview,/PublicPageShell/);
 assert.match(preview,/ArchiveNavigationProvider/);
 assert.match(preview,/pageSlug==='memories-archive'\|\|pageSlug==='in-my-heart'/);
 assert.match(preview,/pageSlug==='in-my-heart'\?'os-heart-page':'os-archive-page'/);
 assert.match(preview,/data-public-shell-parity=\{shellPage\?'true':undefined\}/);
});

test('P9 browser zoom cannot redefine preview breakpoints or collapse Shopify sidebars',()=>{
 for(const [name,width,height] of [['mobile',390,830],['large-phone',430,932],['tablet',768,1024],['desktop',1440,900]]){
  assert.ok(frame.includes(`${name==='large-phone'?"'large-phone'":name}:{width:${width},height:${height}}`),name);
 }
 assert.match(frame,/transform:`scale\(\$\{scale\}\)`/);
 assert.match(frame,/transformOrigin:'top left'/);
 assert.match(frame,/visualViewport\?\.addEventListener\('resize',schedule\)/);
 assert.match(frame,/deviceForWidth\(viewport\.width\)/);
 assert.match(adminCss,/grid-template-columns:292px minmax\(540px,1fr\) 312px!important/);
 assert.match(adminCss,/min-width:1160px/);
 assert.match(adminCss,/overflow-x:auto/);
});

test('P9 navigation responds immediately and app morphs are bounded/fail-open',()=>{
 assert.match(journey,/setPhase\('closing'\);\s*router\.push\(target\)/);
 assert.doesNotMatch(journey,/setTimeout\(\(\)=>\{router\.push\(target\)/);
 assert.match(motion,/OPEN_MS=410,CLOSE_MS=360,REVEAL_MS=165/);
 assert.match(motion,/MAX_COVER_MS=1050,HARD_RESET_MS=1750/);
 assert.match(motion,/normalizePath/);
 assert.match(motion,/if\(reducedMotion\|\|active\.current\)return/);
 assert.match(motion,/sessionStorage\.setItem\(STORAGE,JSON\.stringify\(origin\)\)/);
 assert.match(motion,/getBoundingClientRect\(\)/);
 assert.match(motion,/setRevealing\(true\)/);
 assert.match(motion,/visibilitychange/);
 assert.match(motion,/pageshow/);
});

test('P9 editor keeps switching/autosave/preview updates off the hot path',()=>{
 const stage=autosave.slice(autosave.indexOf('stage(document'),autosave.indexOf('flush():'));
 assert.doesNotMatch(stage,/JSON\.stringify/);
 assert.match(autosave,/latestVersion/);
 assert.match(editor,/router\.push\(href,\{scroll:false\}\)/);
 assert.match(editor,/nodeById=useMemo\(\(\)=>new Map/);
 assert.match(editor,/searchResults=useMemo/);
 assert.match(editor,/allCapabilities=\{currentCapabilities\}/);
 assert.match(editorLayout,/EditorWorkspace/);
 assert.match(frame,/pendingDocument/);
 assert.match(frame,/requestAnimationFrame/);
 assert.match(preview,/startTransition/);
 assert.match(preview,/message\.type==='state'/);
 assert.doesNotMatch(preview,/parsePageDocument/);
});

test('P9 Shopify inspector contract remains semantic and responsive',()=>{
 for(const heading of ['Typography','Colours','Layout','Padding','Margin','Border & shadow','Image','Position','Playback','Navigation','Animation'])assert.ok(inspector.includes("'"+heading+"'"),heading);
 assert.match(inspector,/role="switch"/);
 assert.match(inspector,/Segmented/);
 assert.match(inspector,/Default/);
 assert.match(inspector,/Mobile/);
 assert.match(inspector,/Tablet/);
 assert.match(inspector,/Desktop/);
 for(const position of ['Top left','Top','Top right','Left','Centre','Right','Bottom left','Bottom','Bottom right'])assert.ok(inspector.includes("'"+position+"'"),position);
 assert.match(inspector,/All sides/);
 assert.match(inspector,/Add'\} \{capability\.media\?\.label\.toLowerCase\(\)/);
 assert.match(inspector,/Replace/);
 assert.match(inspector,/Remove/);
});

test('P9 public content routes remain cacheable and avoid forced dynamic rendering',()=>{
 for(const source of [rootPage,customPage,homePage,appPage]){
  assert.match(source,/revalidate=10/);
  assert.doesNotMatch(source,/force-dynamic/);
 }
});
