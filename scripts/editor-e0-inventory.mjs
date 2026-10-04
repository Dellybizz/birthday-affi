// Read-only source inventory. Binding candidates are evidence, not live certification.
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
const root=process.cwd(),cache=new Map();
function load(file){
 file=path.resolve(root,file);if(cache.has(file))return cache.get(file).exports;
 const module={exports:{}};cache.set(file,module);
 const js=ts.transpile(fs.readFileSync(file,'utf8'),{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022});
 new Function('require','module','exports',js)(specifier=>{if(!specifier.startsWith('.'))throw new Error('Unexpected dependency '+specifier);return load(path.resolve(path.dirname(file),specifier)+'.ts')},module,module.exports);
 return module.exports;
}
const base='packages/content/src/';
const fields=load(base+'inspector-fields.ts'),defaults=load(base+'default-pages.ts'),phone=load(base+'phone-home.ts');
let id=0;const next=()=> 'inventory-'+ ++id;
const pages=[
 {slug:'memories-archive',route:'/',renderer:'CMSRenderer',source:['packages/ui/src/cms-renderer.tsx','packages/ui/src/archive-frame.tsx','apps/web/components/archive-journey.tsx'],document:load(base+'memories-archive.ts').createMemoriesArchive(next)},
 {slug:'in-my-heart',route:'/pages/in-my-heart',renderer:'HeartPage',source:['packages/ui/src/heart-bridge.ts','packages/ui/src/heart-source.ts'],document:load(base+'heart-page.ts').createHeartPage(next)},
 ...defaults.builtinPages.filter(s=>!['welcome','radio'].includes(s)).map(slug=>({slug,route:slug==='home'?'/home':'/app/'+slug,renderer:{home:'PhoneHome',reasons:'AdoreJournal',hotline:'LayoutSection/LiveHotline',adventure:'PhotoLibrary',movie:'Saragram','kiss-shop':'KissShop'}[slug],source:{home:['packages/ui/src/phone-home.tsx'],reasons:['packages/ui/src/adore-journal.tsx'],hotline:['packages/ui/src/page-layout.tsx','packages/ui/src/live-hotline.tsx'],adventure:['packages/ui/src/photo-library.tsx'],movie:['packages/ui/src/saragram.tsx'],'kiss-shop':['packages/ui/src/kiss-shop.tsx','packages/content/src/app-content.ts']}[slug],document:slug==='home'?phone.installPhoneHome(defaults.createDefaultPage(slug)):defaults.createDefaultPage(slug)})),
 ...['camera','vault','pieces'].map(slug=>({slug,route:'/app/'+slug,renderer:{camera:'CameraApp',vault:'VaultClient',pieces:'PuzzleApp'}[slug],source:['apps/web/app/app/'+slug+'/page.tsx'],document:null}))
];
const rows=[];
for(const page of pages){
 if(!page.document){rows.push({page:page.slug,route:page.route,node:'runtime-app',section:'application',component:page.renderer,key:'page-document-adapter',control:'missing',storage:'runtime-specific',status:'missing-editor-adapter',phase:'E5',evidence:page.source.join(';')});continue;}
 const source=page.source.map(f=>fs.readFileSync(f,'utf8')).join('\n');
 for(const node of page.document.nodes){
  const byKey=new Map([...fields.componentFields[node.component]??[],...fields.sectionContentFields[node.props.sectionKind]??[],...fields.heartFields[node.props.heartPart]??[],...phone.phoneFields[node.props.phonePart]??[]].map(f=>[f.key,{...f,scope:'content'}]));
  for(const field of fields.designFields)byKey.set('design:'+field.key,{...field,scope:'design'});
  for(const field of byKey.values()){
   const custom=['AdoreJournal','PhotoLibrary','Saragram','KissShop'].includes(page.renderer);
   const unrelated=['visualEffects','decorNote','transitionEnabled','transitionDuration','transitionColor','transitionText','archiveBackLabel'].includes(field.key)&&node.props.archivePart!=='page';
   let status='needs-runtime-verification',phase='E5';
   if(unrelated)status='irrelevant-control';
   else if(custom&&field.scope==='design')status='missing-renderer-binding';
   else if(source.includes(field.key))status='source-reference-candidate';
   if(page.slug==='movie')phase='E4';
   rows.push({page:page.slug,route:page.route,node:node.id,section:node.props.sectionKind??node.props.heartPart??node.props.phonePart??node.props.archivePart??'generic',component:node.component,key:field.key,control:field.type,scope:field.scope,storage:'pages.draft_document.nodes[id].props.'+field.key,status,phase,evidence:page.source.join(';')});
  }
 }
}
const report={schemaVersion:1,baselineCommit:'ad17ecf4e187e3d246941bfeb813de7e323d348e',method:'Default-layout source inventory. Source-reference-candidate is NOT a verified binding. Inspect renderer capability notes and perform live acceptance. Private saved documents are separately fingerprinted.',pages:pages.map(({document,...p})=>({...p,nodeCount:document?.nodes.length??0})),rows};
const dir=process.argv[2]??'/tmp/wiffey-editor-e0';fs.mkdirSync(dir,{recursive:true});
fs.writeFileSync(dir+'/control-inventory.json',JSON.stringify(report,null,2)+'\n');
const columns=['page','route','node','section','component','key','control','scope','storage','status','phase','evidence'];
const csv=v=>'"'+String(v??'').replaceAll('"','""')+'"';
fs.writeFileSync(dir+'/control-inventory.csv',columns.join(',')+'\n'+rows.map(row=>columns.map(k=>csv(row[k])).join(',')).join('\n')+'\n');
console.log(JSON.stringify({pages:report.pages.length,controls:rows.length,statusCounts:rows.reduce((counts,r)=>(counts[r.status]=(counts[r.status]??0)+1,counts),{})}));
