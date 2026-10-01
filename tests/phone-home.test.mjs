import {test} from 'node:test';
import assert from 'node:assert/strict';
import {content,phone} from '../scripts/export-default-pages.mjs';
test('phone upgrade keeps personal content, IDs, theme and visibility and is idempotent',()=>{
 const old=content.createDefaultPage('home');old.theme={background:'#123456'};const message=old.nodes.find(n=>n.label==='Birthday message');message.props.text='Our personal birthday message';message.visible=false;
 const next=phone.installPhoneHome(old);assert.deepEqual(next.theme,old.theme);assert.equal(next.nodes.find(n=>n.id===message.id).props.text,message.props.text);assert.equal(next.nodes.find(n=>n.id===message.id).visible,false);assert.deepEqual(phone.installPhoneHome(next),next);assert.equal(old.nodes.some(n=>n.props.phonePart),false);
 assert.equal(next.rootIds.length,1);const launcher=next.nodes.find(n=>n.props.phonePart==='launcher');assert.equal(next.nodes.filter(n=>n.parentId===launcher.id&&n.props.phonePart==='app-icon').length,6);
});
test('phone upgrade supports empty/custom home documents and collision-safe IDs',()=>{
 const next=phone.installPhoneHome({schemaVersion:2,rootIds:['phone-home-1'],nodes:[{id:'phone-home-1',type:'section',component:'section',parentId:null,props:{},children:[],visible:true}]});assert.equal(new Set(next.nodes.map(n=>n.id)).size,next.nodes.length);assert.ok(next.nodes.find(n=>n.id==='phone-home-1').parentId);
 assert.ok(phone.isPhoneHome(phone.installPhoneHome({schemaVersion:2,rootIds:[],nodes:[]})));
});
