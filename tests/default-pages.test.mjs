import {test} from 'node:test';
import assert from 'node:assert/strict';
import {content,progress} from '../scripts/export-default-pages.mjs';
const {builtinPages,createDefaultPage,installDefaultLayout}=content;
test('all eight canonical layouts are nonempty, deterministic and contain their decided sections',()=>{
 const required={welcome:['startup-greeting','welcome-hero','enter-action'],home:['birthday-heading','date-widget','app-launcher'],reasons:['reason-deck','heartfelt-card'],hotline:['incoming-call','birthday-message','affection-keypad'],adventure:['photo-library'],movie:['movie-credits','movie-player','movie-chapters','birthday-ending'],'kiss-shop':['product-collection','gift-bag','gift-checkout','gift-receipt'],radio:['station-selector','radio-player','dedication','track-list']};
 for(const slug of builtinPages){const document=createDefaultPage(slug);assert.ok(document.nodes.length>=3);assert.equal(document.layout.page,slug);assert.deepEqual(document,createDefaultPage(slug));for(const kind of required[slug])assert.ok(document.nodes.some(n=>n.props.sectionKind===kind),slug+': '+kind);assert.ok(!document.nodes.some(n=>n.props.src));}
 assert.equal(createDefaultPage('reasons').nodes.filter(n=>n.component==='reason').length,10);
 assert.equal(createDefaultPage('radio').nodes.filter(n=>n.component==='radio-track').length,6);
 assert.equal(createDefaultPage('kiss-shop').nodes.filter(n=>n.component==='kiss-gift').length,11);
});
test('installation is idempotent and preserves existing content, IDs, theme and order including colliding IDs',()=>{
 const defaults=createDefaultPage('adventure');const original={schemaVersion:2,theme:{background:'#123456'},rootIds:[defaults.rootIds[0]],nodes:[{id:defaults.rootIds[0],type:'section',component:'section',parentId:null,props:{padding:8},children:['my-text'],visible:false},{id:'my-text',type:'block',component:'text',parentId:defaults.rootIds[0],props:{text:'My edited content'},children:[],visible:true}]};
 const next=installDefaultLayout('adventure',original);assert.deepEqual(next.nodes.slice(-original.nodes.length),original.nodes);assert.deepEqual(next.rootIds.slice(-original.rootIds.length),original.rootIds);assert.deepEqual(next.theme,original.theme);assert.deepEqual(installDefaultLayout('adventure',next),next);assert.equal(new Set(next.nodes.map(n=>n.id)).size,next.nodes.length);assert.equal(original.layout,undefined);
});
test('scene and station references remain valid after default-ID collisions',()=>{
 for(const slug of ['movie','radio']){const defaults=createDefaultPage(slug),id=defaults.nodes.find(n=>n.component===(slug==='movie'?'movie-scene':'station')).id;const old={schemaVersion:2,nodes:[{id,type:'section',component:'section',parentId:null,props:{},visible:true,children:[]}],rootIds:[id]};const upgraded=installDefaultLayout(slug,old);for(const node of upgraded.nodes)for(const key of ['stationId','sceneId'])if(node.props[key])assert.ok(upgraded.nodes.some(n=>n.id===node.props[key]&&n.component===(key==='stationId'?'station':'movie-scene')));}
});

test('browser progress rejects corrupt data and filters removed, hidden and unavailable gifts',async()=>{const {parseLayoutProgress}=progress;const document=createDefaultPage('kiss-shop'),gift=document.nodes.find(n=>n.component==='kiss-gift');const raw=JSON.stringify({version:1,selections:{track:'unknown'},bag:[gift.id,'unknown'],receipt:[gift.id],favorites:['unknown']});assert.deepEqual(parseLayoutProgress(raw,document).bag,[gift.id]);gift.visible=false;assert.deepEqual(parseLayoutProgress(raw,document).bag,[]);assert.deepEqual(parseLayoutProgress('{',document).receipt,[]);});
