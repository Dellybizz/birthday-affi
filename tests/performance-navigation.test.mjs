import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=path=>fs.readFileSync(path,'utf8');

test('public CMS uses shared short-lived server cache and avoids force-dynamic public routes',()=>{
 const cms=read('apps/web/lib/cms.ts');
 assert.match(cms,/unstable_cache/);
 assert.match(cms,/PUBLIC_REVALIDATE_SECONDS=10/);
 assert.match(cms,/sharedPublicDb/);
 for(const path of ['apps/web/app/layout.tsx','apps/web/app/page.tsx','apps/web/app/home/page.tsx','apps/web/app/app/[slug]/page.tsx','apps/web/app/pages/[slug]/page.tsx']){
  const source=read(path);assert.doesNotMatch(source,/force-dynamic/,path);assert.match(source,/revalidate=10/,path);
 }
});

test('public same-origin navigation uses Next router instead of document reloads',()=>{
 const journey=read('apps/web/components/archive-journey.tsx');
 assert.match(journey,/router\.push\(item\.href\)/);
 assert.match(journey,/router\.prefetch\(item\.href\)/);
 assert.doesNotMatch(journey,/location\.(assign|href)/);
});

test('P4 starts route navigation immediately and uses animation as a cover instead of a delay',()=>{
 const journey=read('apps/web/components/archive-journey.tsx');
 const css=read('apps/web/app/navigation-performance.css');
 const appLoading=read('apps/web/app/app/[slug]/loading.tsx');
 const homeLoading=read('apps/web/app/home/loading.tsx');
 assert.match(journey,/setPhase\('closing'\);\s*router\.push\(target\)/);
 assert.doesNotMatch(journey,/setTimeout\(\(\)=>\{router\.push\(target\)/);
 assert.match(journey,/onPointerDownCapture=\{event=>press\(event\.target\)\}/);
 assert.match(journey,/onPointerOverCapture=\{event=>warm\(event\.target\)\}/);
 for(const route of ['/app/hotline','/app/reasons','/app/adventure','/app/movie','/app/kiss-shop','/app/camera','/app/vault','/app/pieces'])assert.ok(journey.includes("'"+route+"'"),route);
 assert.match(css,/data-nav-press="true"/);
 assert.match(css,/phone-app-link:active/);
 assert.match(appLoading,/Opening…/);
 assert.match(homeLoading,/Opening home…/);
});

test('P5 morphs apps from their real icon origin and reverses toward the remembered origin',()=>{
 const motion=read('apps/web/components/phone-app-transition.tsx');
 const provider=read('apps/web/components/os-provider.tsx');
 const css=read('apps/web/app/app-transitions.css');
 assert.match(provider,/PhoneAppTransition pathname=\{pathname\} reducedMotion=\{state\.reducedMotion\}/);
 assert.match(motion,/querySelector<HTMLElement>\('\.phone-icon'\)/);
 assert.match(motion,/getBoundingClientRect\(\)/);
 assert.match(motion,/rootRect\.width\/Math\.max\(1,root\.offsetWidth\)/);
 assert.match(motion,/sessionStorage\.setItem\(STORAGE,JSON\.stringify\(origin\)\)/);
 assert.match(motion,/pathname==='\/home'&&item\.path\.startsWith\('\/app\/'\)/);
 assert.match(motion,/pathname\.startsWith\('\/app\/'\)&&item\.path==='\/home'/);
 assert.match(motion,/IOS_EASE='cubic-bezier\(\.32,\.72,0,1\)'/);
 assert.match(motion,/OPEN_MS=360,CLOSE_MS=320,REVEAL_MS=120/);
 assert.match(motion,/artwork:icon\.innerHTML/);
 assert.match(motion,/scale\(\.965\)/);
 assert.match(motion,/borderRadius:'0px'/);
 assert.match(motion,/if\(reducedMotion\|\|active\.current\)return/);
 assert.match(css,/phone-app-transition-artwork/);
 assert.match(css,/will-change:transform,border-radius,opacity,background-color/);
 assert.match(css,/transform-origin:0 0/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
});

test('editor page selector prefetches and switches with client routing',()=>{
 const selector=read('apps/admin/components/editor-page-selector.tsx');
 const editor=read('apps/admin/app/editor/[slug]/editor-client.tsx');
 assert.match(selector,/router\.prefetch\(page\.editorHref\)/);
 assert.match(editor,/router\.push\(href,\{scroll:false\}\)/);
 assert.doesNotMatch(editor,/window\.location\.assign/);
});

test('editor avoids full-document and pointer geometry work on every pointer movement',()=>{
 const editor=read('apps/admin/app/editor/[slug]/editor-client.tsx');
 const preview=read('apps/admin/app/preview/[pageId]/preview-client.tsx');
 assert.match(editor,/serializedDoc=useMemo\(\(\)=>JSON\.stringify\(doc\),\[doc\]\)/);
 assert.doesNotMatch(editor,/onMouseMoveCapture=\{hoverPreview\}/);
 assert.match(preview,/if\(target===hovered\.current\)return/);
});

test('P1 fixed logical viewports scale to fit without changing preview breakpoints',()=>{
 const frame=read('apps/admin/components/editor-live-frame.tsx');
 assert.match(frame,/mobile:\{width:390,height:830\}/);
 assert.match(frame,/tablet:\{width:768,height:1024\}/);
 assert.match(frame,/desktop:\{width:1440,height:900\}/);
 assert.match(frame,/transform:`scale\(\$\{scale\}\)`/);
 assert.match(frame,/ResizeObserver/);
 assert.match(frame,/visualViewport/);
});

test('P3 offers real device presets and a manually resizable logical viewport',()=>{
 const frame=read('apps/admin/components/editor-live-frame.tsx');
 assert.match(frame,/'large-phone':\{width:430,height:932\}/);
 assert.match(frame,/type PreviewMode=Device\|'large-phone'\|'responsive'/);
 assert.match(frame,/Responsive · custom viewport/);
 assert.match(frame,/data-logical-width=\{viewport\.width\}/);
 assert.match(frame,/data-logical-height=\{viewport\.height\}/);
 assert.match(frame,/Resize responsive preview/);
 assert.match(frame,/current\.width\+\(event\.clientX-current\.x\)\/Math\.max\(scale,\.01\)/);
 assert.match(frame,/deviceForWidth\(viewport\.width\)/);
 assert.match(frame,/width:clamp\([^\n]+,320,1600\)/);
 assert.match(frame,/height:clamp\([^\n]+,568,1200\)/);
});

test('admin Supabase client is reused within a server request',()=>{
 const source=read('apps/admin/lib/supabase.ts');
 assert.match(source,/import \{ cache \} from 'react'/);
 assert.match(source,/adminDb=cache/);
});

test('P0 keeps Shopify editor sidebars beside the live canvas across browser zoom',()=>{
 const css=read('apps/admin/app/admin-preview-isolation.css');
 assert.match(css,/min-width:1160px/);
 assert.match(css,/grid-template-columns:292px minmax\(540px,1fr\) 312px!important/);
 assert.match(css,/nav\[aria-label="Editor panels"\]\{display:none!important\}/);
 assert.match(css,/section\[aria-label="Live canvas"\]\{display:block!important\}/);
 assert.match(css,/overflow-x:auto/);
});
