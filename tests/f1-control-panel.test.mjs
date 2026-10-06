import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const cache=new Map();
function load(file){file=path.resolve(file);if(cache.has(file))return cache.get(file).exports;const module={exports:{}};cache.set(file,module);const code=ts.transpile(fs.readFileSync(file,'utf8'),{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022});new Function('require','module','exports',code)(()=>{throw new Error('F1 control-panel helper must remain dependency-free')},module,module.exports);return module.exports}
const control=load('apps/admin/lib/control-panel.ts');
const read=file=>fs.readFileSync(file,'utf8');

test('F1 publication state distinguishes live, changed, draft and broken pointers',()=>{
 assert.equal(control.publicationState({draft:{a:1},publishedId:'v1',publishedDocument:{a:1}}),'published');
 assert.equal(control.publicationState({draft:{a:2},publishedId:'v1',publishedDocument:{a:1}}),'changed');
 assert.equal(control.publicationState({draft:{a:1},publishedId:null,publishedDocument:undefined}),'draft');
 assert.equal(control.publicationState({draft:{a:1},publishedId:'missing',publishedDocument:undefined}),'broken');
 assert.equal(control.publicationState({recordPresent:false,draft:null,publishedId:null,publishedDocument:undefined}),'missing');
});

test('F1 dashboard summary counts unpublished work without treating healthy draft changes as backend faults',()=>{
 const summary=control.summarizeControlPanel({
  activeExperiences:[{slug:'home',title:'iPhone Home',livePath:'/home'},{slug:'reasons',title:'Adore',livePath:'/app/reasons'}],
  pages:[
   {id:'1',slug:'home',title:'Home',settings:{},draft_document:{x:1},published_version_id:'v1',draft_revision:4},
   {id:'2',slug:'reasons',title:'Adore',settings:{},draft_document:{x:2},published_version_id:null,draft_revision:2},
   {id:'3',slug:'custom',title:'Custom',settings:{},draft_document:{},published_version_id:null,draft_revision:1}
  ],
  publishedDocuments:{v1:{x:1}},
  configuration:{draft:{accent:'new'},publishedId:'c1',publishedDocument:{accent:'old'},revision:3},
  navigation:{draft:{items:[]},publishedId:'n1',publishedDocument:{items:[]},revision:2},
  mediaCount:7,
  releaseCount:2,
  lastRelease:{release_number:2,created_at:'2026-10-03T00:00:00Z'}
 });
 assert.equal(summary.publishedPages,1);
 assert.equal(summary.draftPages,1);
 assert.equal(summary.configurationState,'changed');
 assert.equal(summary.navigationState,'published');
 assert.equal(summary.unpublishedChanges,2);
 assert.equal(summary.customPages,1);
 assert.equal(summary.mediaCount,7);
 assert.equal(summary.releaseCount,2);
 assert.equal(summary.healthy,true);
});

test('F1 missing canonical records and invalid published pointers surface as health issues',()=>{
 const summary=control.summarizeControlPanel({
  activeExperiences:[{slug:'home',title:'Home',livePath:'/home'},{slug:'movie',title:'Saragram',livePath:'/app/movie'}],
  pages:[{id:'1',slug:'home',title:'Home',settings:{},draft_document:{},published_version_id:'gone'}],
  publishedDocuments:{},configuration:null,navigation:{draft:{},publishedId:null,publishedDocument:undefined},mediaCount:0,releaseCount:0,lastRelease:null
 });
 assert.equal(summary.brokenPages,1);
 assert.equal(summary.missingPages,1);
 assert.equal(summary.configurationState,'missing');
 assert.equal(summary.healthy,false);
 assert.ok(summary.issues>=3);
});

test('F1 persistent shell keeps control-panel navigation but excludes login, editor and preview canvases',()=>{
 const shell=read('apps/admin/components/admin-shell.tsx');
 const layout=read('apps/admin/app/layout.tsx');
 for(const route of ["'/login'","'/editor'","'/preview'"])assert.ok(shell.includes(route),route);
 for(const label of ['Dashboard','Pages','Navigation','Media','Site settings','Hotline'])assert.ok(shell.includes(`label:'${label}'`),label);
 assert.match(shell,/aliases:\['\/theme'\]/);assert.match(shell,/label:'Audio',href:'\/audio'/);
 assert.match(shell,/Open editor/);
 assert.match(shell,/View site/);
 assert.match(shell,/form action=\{signOut\}/);
 assert.match(layout,/<AdminShell publicSiteUrl=\{publicSiteUrl\}>\{children\}<\/AdminShell>/);
});

test('F1 dashboard reads only canonical F0 stores for status and release history',()=>{
 const dashboard=read('apps/admin/app/page.tsx');
 for(const table of ['pages','page_versions','site_configurations','site_configuration_versions','site_navigation','navigation_versions','media_assets','site_releases'])assert.ok(dashboard.includes(`from('${table}')`),table);
 assert.doesNotMatch(dashboard,/from\('site_settings'\)/);
 assert.doesNotMatch(dashboard,/from\('app_content_items'\)/);
 assert.match(dashboard,/activeDocumentExperiences/);
 assert.match(dashboard,/unpublishedChanges/);
 assert.match(dashboard,/Canonical model healthy/);
});

test('F1 workspaces inherit shared chrome and Pages preserves page creation',()=>{
 const pages=read('apps/admin/app/pages/page.tsx');
 const navigation=read('apps/admin/app/navigation/page.tsx');
 const media=read('apps/admin/app/media/page.tsx');
 const settings=read('apps/admin/app/settings/page.tsx');
 const hotline=read('apps/admin/app/hotline/page.tsx');
 for(const source of [pages,navigation,media,settings,hotline]){
  assert.match(source,/AdminPageHeader/);
  assert.doesNotMatch(source,/← Dashboard|← Back to pages|← Pages|← Settings/);
 }
 assert.match(pages,/PageCreate/);
 assert.match(pages,/PageManager/);
 assert.match(settings,/ConfigurationEditor/);
});
