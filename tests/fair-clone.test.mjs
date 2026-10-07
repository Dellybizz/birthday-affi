import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const html=readFileSync('apps/web/public/fair.html','utf8');
const scripts=[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
test('Fair clone is isolated from the previous backend and returns to this site',()=>{
 assert.doesNotMatch(html,/supabase\.co|site_state|birthday-site-admin|src="\.\//);
 assert.match(html,/href="\/home"/);
 assert.equal((html.match(/class="stall shop/g)||[]).length,8);
 for(const source of scripts)new vm.Script(source);
});
test('All eight original stalls open with photos and return to the fair',()=>{
 const elements=new Map();
 const element=id=>{if(!elements.has(id)){const classes=new Set();elements.set(id,{id,style:{},src:'',textContent:'',className:'',classList:{add:v=>classes.add(v),remove:v=>classes.delete(v),contains:v=>classes.has(v),toggle:(v,on)=>on?classes.add(v):classes.delete(v)},setAttribute(){},addEventListener(){}})}return elements.get(id)};
 const context=vm.createContext({window:{SITE_CONFIG:{},addEventListener(){}},document:{getElementById:element,querySelectorAll:()=>[],addEventListener(){}},innerWidth:390,innerHeight:844,Promise,setTimeout:fn=>fn(),encodeURIComponent});
 for(const source of scripts)vm.runInContext(source,context);
 for(const id of ['smile','presence','care','yapping','excitement','comfort','laugh','you']){
 vm.runInContext(`openStallFromMap('${id}')`,context);
 assert.equal(element('overlay').classList.contains('show'),true);assert.ok(element('stallTitle').textContent);assert.match(element('heroPhoto').src,/^data:image\/svg\+xml/);
 vm.runInContext('openPhotoLightbox(1)',context);assert.equal(element('photoLightbox').classList.contains('show'),true);
 vm.runInContext('closeStall()',context);assert.equal(element('overlay').classList.contains('show'),false);assert.equal(element('photoLightbox').classList.contains('show'),false);
 }
});
