import {test} from 'node:test';
import assert from 'node:assert/strict';
import {content,phone} from '../scripts/export-default-pages.mjs';
test('phone upgrade keeps personal content, IDs, theme and visibility and is idempotent',()=>{
 const old=content.createDefaultPage('home');old.theme={background:'#123456'};const message=old.nodes.find(n=>n.label==='Birthday message');message.props.text='Our personal birthday message';message.visible=false;
 const next=phone.installPhoneHome(old);assert.deepEqual(next.theme,old.theme);assert.equal(next.nodes.find(n=>n.id===message.id).props.text,message.props.text);assert.equal(next.nodes.find(n=>n.id===message.id).visible,false);assert.deepEqual(phone.installPhoneHome(next),next);assert.equal(old.nodes.some(n=>n.props.phonePart),false);
 assert.equal(next.rootIds.length,1);const launcher=next.nodes.find(n=>n.props.phonePart==='launcher');assert.equal(next.nodes.filter(n=>n.parentId===launcher.id&&n.props.phonePart==='app-icon').length,7);
});
test('phone upgrade supports empty/custom home documents and collision-safe IDs',()=>{
 const next=phone.installPhoneHome({schemaVersion:2,rootIds:['phone-home-1'],nodes:[{id:'phone-home-1',type:'section',component:'section',parentId:null,props:{},children:[],visible:true}]});assert.equal(new Set(next.nodes.map(n=>n.id)).size,next.nodes.length);assert.ok(next.nodes.find(n=>n.id==='phone-home-1').parentId);
 assert.ok(phone.isPhoneHome(phone.installPhoneHome({schemaVersion:2,rootIds:[],nodes:[]})));
});
test('iPhone refinement retains content and wallpaper while establishing grid, dock and hidden optional copy',()=>{
 const old=content.createDefaultPage('home'),next=phone.installPhoneHome(old),root=next.nodes.find(n=>n.props.phonePart==='home');assert.equal(root.label,'iPhone home screen');assert.equal(next.nodes.find(n=>n.component==='app-grid').props.columns,4);assert.equal(next.nodes.filter(n=>n.props.phonePart==='app-icon'&&n.props.placement==='dock').length,2);assert.ok(next.nodes.filter(n=>['recent-app','keepsake-note'].includes(n.props.sectionKind)).every(n=>!n.visible));
 const wallpaper=next.nodes.find(n=>n.props.phonePart==='wallpaper');wallpaper.props.src='https://example.com/photo.jpg';assert.deepEqual(phone.installPhoneHome(next),next);
});
test('swipe up accepts deliberate drags and short flicks, rejects taps, horizontal drags and downward swipes',()=>{
 assert.equal(phone.phoneSwipeCloses(4,-60,400),true);assert.equal(phone.phoneSwipeCloses(2,-25,40),true);assert.equal(phone.phoneSwipeCloses(2,-25,300),false);assert.equal(phone.phoneSwipeCloses(90,-60,100),false);assert.equal(phone.phoneSwipeCloses(0,100,100),false);assert.equal(phone.phoneSwipeCloses(0,-5,10),false);
});
