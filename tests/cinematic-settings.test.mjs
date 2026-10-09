import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import {PGlite} from '@electric-sql/pglite';
const cache=new Map();
function load(file){file=path.resolve(file);if(cache.has(file))return cache.get(file).exports;const module={exports:{}};cache.set(file,module);new Function('require','module','exports',ts.transpile(fs.readFileSync(file,'utf8'),{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}))(name=>load(path.resolve(path.dirname(file),name+'.ts')),module,module.exports);return module.exports;}
const {defaultCinematicSettings,parseCinematicSettings}=load('packages/content/src/cinematic-settings.ts');
const {defaultSiteDocument,parseSiteDocument}=load('packages/content/src/site-document.ts');
const {renderCountdownHtml,renderFinalReelHtml}=load('packages/content/src/cinematic-html.ts');
const mutation=(fn)=>{const d=structuredClone(defaultCinematicSettings);fn(d);return d};
test('cinematic settings survive site validation and reject invalid scene orders',()=>{
 const cinematic=mutation(d=>{d.countdown.phases[0].seconds=200;d.countdown.before.titleLine='My changed countdown';d.reel.birthdaySeconds=71});
 assert.deepEqual(parseSiteDocument({...defaultSiteDocument,cinematic}).cinematic,cinematic);
 for(const broken of [mutation(d=>d.countdown.phases[2].seconds=180),mutation(d=>d.reel.sceneSeconds[3]=1),mutation(d=>d.reel.birthdaySeconds=60),mutation(d=>d.reel.copy[0].key='bad'),mutation(d=>d.countdown.access.password='123')])assert.throws(()=>parseCinematicSettings(broken));
});
test('both published and preview HTML apply saved copy, timestamps and safe JSON',()=>{
 const cinematic=mutation(d=>{d.countdown.before.titleLine='</script><script>bad()</script>';d.countdown.phases[0].seconds=200;d.reel.copy[20].text='Happy day, {nickname}!';d.reel.sceneSeconds[2]=5});
 const site={...defaultSiteDocument,nickname:'Sara',birthdate:'2005-11-12',cinematic};
 const live=renderCountdownHtml(site),preview=renderCountdownHtml(site,{seconds:135,view:'before'}),reel=renderFinalReelHtml(site);
 assert.match(live,/"birthdayPassword":"12112005"/);assert.match(live,/"seconds":200/);assert.doesNotMatch(live,/<script>bad\(\)/);assert.match(preview,/"editorPreview":true/);assert.match(preview,/"previewSeconds":135/);assert.match(reel,/"sceneSeconds":\[0,0,5,/);assert.match(reel,/Happy day, \{nickname\}!/);
 for(const html of [live,preview,reel,renderFinalReelHtml(site,undefined,13)])for(const match of html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g))assert.doesNotThrow(()=>new Function(match[1]));
});
test('database validator permits legacy settings and enforces the same cinematic timeline',async()=>{
 const db=new PGlite();try{
 await db.exec(`create schema private;create role anon;create role authenticated;create function private.assert_base_site_document(doc jsonb) returns void language plpgsql as $$begin if doc ? 'cinematic' then raise exception 'Unexpected field';end if;end$$;`);
 await db.exec(fs.readFileSync('supabase/migrations/20261009090759_cinematic_editor_controls.sql','utf8'));
 await db.query('select private.assert_base_site_document($1)',[{}]);await db.query('select private.assert_base_site_document($1)',[{cinematic:defaultCinematicSettings}]);
 for(const broken of [mutation(d=>d.countdown.phases[2].seconds=180),mutation(d=>d.reel.sceneSeconds[3]=1),mutation(d=>d.reel.birthdaySeconds=60),mutation(d=>d.reel.copy[0].key='bad'),mutation(d=>d.countdown.access.password='123')])await assert.rejects(db.query('select private.assert_base_site_document($1)',[{cinematic:broken}]));
 }finally{await db.close()}
});

test('the actual reel engine uses edited copy, selected preview scene and saved scene timing',async()=>{
 const vm=await import('node:vm');
 const cinematic=mutation(d=>{d.reel.sceneSeconds[2]=5;d.reel.copy.find(p=>p.scene===13&&p.text.includes('{nickname}')).text='For {nickname}, with love.'});
 const html=renderFinalReelHtml({...defaultSiteDocument,nickname:'Sara',cinematic},undefined,13);
 const elements=new Map(),make=()=>{const classes=new Set();return {textContent:'',hidden:false,classList:{add:(n)=>classes.add(n),remove:(n)=>classes.delete(n),toggle:(n,on)=>on?classes.add(n):classes.delete(n),contains:n=>classes.has(n)},addEventListener(){},pause(){}}};
 const element=id=>{if(!elements.has(id))elements.set(id,make());return elements.get(id)},scenes=Array.from({length:14},make),message=Array.from({length:7},make),timings=[];
 const context=vm.createContext({window:{},parent:{postMessage(){}},document:{querySelectorAll:selector=>selector==='.scene'?scenes:message,querySelector:selector=>element(selector),getElementById:element,body:{insertAdjacentHTML(){},classList:make().classList},addEventListener(){}},setTimeout:(_fn,ms)=>{timings.push(ms);return timings.length},clearTimeout(){},console});
 const scripts=[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
 vm.runInContext(scripts.find(s=>s.includes('window.SITE_CONFIG=')),context);
 const engine=scripts.find(s=>s.includes('const CONFIG='));vm.runInContext(engine.slice(0,engine.indexOf('function buildDust')),context);
 assert.equal(scenes[13].classList.contains('active'),true);
 assert.equal(element('[data-reel-field="copy20"]').textContent,'For Sara, with love.');
 vm.runInContext('runFinale()',context);
 assert.ok(timings.includes(5000));assert.ok(!timings.includes(4300));assert.ok(timings.includes(70400));
});
