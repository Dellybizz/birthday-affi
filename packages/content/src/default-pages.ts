import {createNode, type ComponentName} from './registry';
import {parsePageDocument} from './validate';
import type {CMSField,CMSNode,PageDocument} from './cms';
export const builtinPages=['welcome','home','reasons','hotline','adventure','movie','kiss-shop','radio'] as const;
export type BuiltinPage=typeof builtinPages[number];
import {type SectionKind} from './layout-contract';
export {sectionKinds} from './layout-contract';
export const isBuiltinPage=(slug:string):slug is BuiltinPage=>builtinPages.includes(slug as BuiltinPage);
export function createDefaultPage(slug:BuiltinPage):PageDocument{
 const document:PageDocument={schemaVersion:2,nodes:[],rootIds:[],layout:{version:1,page:slug}};
 let count=0;
 const section=(kind:SectionKind,label:string,props:Record<string,CMSField>={})=>{const node:CMSNode=createNode('section',`${slug}-${kind}-${++count}`);node.label=label;node.props={...node.props,padding:0,sectionKind:kind,...props};document.nodes.push(node);document.rootIds.push(node.id);return node;};
 const block=(parent:CMSNode,component:ComponentName,label:string,props:Record<string,CMSField>)=>{const node:CMSNode=createNode(component,`${slug}-block-${++count}`,parent.id);node.label=label;node.props={...node.props,...props};parent.children.push(node.id);document.nodes.push(node);return node;};
 const text=(parent:CMSNode,label:string,value:string)=>block(parent,'text',label,{text:value});
 const heading=(parent:CMSNode,value:string)=>block(parent,'heading','Heading',{text:value});
 const intro=(title:string,body:string)=>{const s=section('intro','Introduction');heading(s,title);text(s,'Intro message',body);};
 if(slug==='welcome'){
  text(section('startup-greeting','Startup greeting'),'Startup text','Starting Wiffeyyyy OS…');
  const hero=section('welcome-hero','Welcome hero');heading(hero,'Happy birthday to my favourite person');text(hero,'Welcome message','A few little things to make you smile. A whole lot of love, tucked inside.');
  block(section('enter-action','Enter your birthday world'),'action','Enter button',{title:'Open your birthday world',href:'/home'});
  text(section('keepsake-note','Keepsake note'),'Note','Made just for you. No rush — explore whenever you like.');
 }else if(slug==='home'){
  const s=section('birthday-heading','Birthday heading');heading(s,'Happy birthday');block(s,'text','Nickname',{text:'wiffeyyyy',binding:'nickname'});text(s,'Birthday message','Six little places, one birthday world. Start anywhere you like.');
  text(section('date-widget','Date widget',{dateMode:'current'}),'Widget caption','Your birthday edition');
  block(section('app-launcher','Six birthday apps'),'app-grid','App icons',{columns:2,gap:12});
  text(section('recent-app','Recently opened app'),'Resume label','Continue exploring');
  text(section('keepsake-note','Keepsake note'),'Note','A little world, just for you.');
 }else if(slug==='reasons'){
  intro('Adore','A few little things. A whole lot of love.');
  const deck=section('reason-deck','Reason cards',{previousLabel:'Previous',nextLabel:'Next',favoriteLabel:'Save favourite'});
  const reasons=[['Your smile','The smile you try to hide is one of my favourite things.'],['Your little expressions','The tiny expressions that say so much without a word.'],['Your kindness','The care you bring to the people around you.'],['Your laugh','A laugh that can turn an ordinary moment into a good memory.'],['The way you listen','You make the little stories feel worth telling.'],['Our ordinary moments','Even a quiet day feels special with you in it.'],['Your excitement','The way your eyes light up about something you love.'],['Your thoughtful gestures','The small things that say “I remembered.”'],['Being yourself','You do not have to perform to be my favourite person.'],['The days ahead','There are still so many lovely moments for us to make.']];
  for(const [title,body] of reasons)block(deck,'reason',title,{title,body,category:'Little things',src:'',alt:''});
  const final=section('heartfelt-card','Most heartfelt reason');heading(final,'And my favourite reason…');text(final,'Heartfelt message','It is you. Not just one little thing — the whole person you are.');
 }else if(slug==='hotline'){
  section('incoming-call','Incoming birthday call',{callerName:'A message from me',incomingTitle:'Incoming birthday call',answerLabel:'Answer',endLabel:'End call'});
  block(section('birthday-message','Main birthday message'),'hotline-message','Birthday greeting',{title:'Happy birthday, favourite person',body:'Happy birthday. I hope today reminds you how loved you are. This little world is my way of celebrating you.',src:''});
  const keypad=section('affection-keypad','Affection keypad');
  for(const [digit,title,body] of [['1','A compliment','You make ordinary moments feel worth remembering.'],['2','Emergency affection','A little reminder: you are loved on the quiet days too.'],['3','One more birthday wish','Here is to a year full of gentle days and happy surprises.']])block(keypad,'hotline-message',title,{digit,title,body,src:''});
  text(section('text-versions','Text versions'),'Text version label','Every message is here to read, even without sound.');
 }else if(slug==='adventure'){
  const library=section('photo-library','Fit-check library',{title:'Pardanasheen',subtitle:'Every look, beautifully you.'});
  block(library,'image','First fit check',{src:'',alt:'',title:'Fit check',album:'Fit checks',date:'',body:''});
  block(library,'video','First fit-check video',{src:'',alt:'',title:'In motion',album:'Fit checks',date:'',body:''});
 }else if(slug==='movie'){
  const credits=section('movie-credits','Saragram profile',{username:'sara',profileName:'Sara',avatar:'',bio:'My little world, through your eyes. ♡'});heading(credits,'Saragram');text(credits,'Bio','My little world, through your eyes. ♡');
  const player=section('movie-player','Posts and reels');for(const [title,body] of [['The beginning','A place for the first little moments you want to remember.'],['Our favourite memories','Add your favourite clips or photos and tell their story here.'],['Your birthday ending','Here is to all the memories still to come. Happy birthday.']])block(player,'movie-scene',title,{title,body,src:'',alt:title});
  const chapters=section('movie-chapters','Chapters');for(const scene of document.nodes.filter(n=>n.parentId===player.id))block(chapters,'chapter',scene.label??'Chapter',{title:scene.props.title,sceneId:scene.id});
  const ending=section('birthday-ending','Birthday ending');heading(ending,'To all our next chapters');text(ending,'Ending message','Happy birthday, wiffeyyyy. You deserve a whole world of lovely things.');
 }else if(slug==='kiss-shop'){
  intro('The Kiss Shop','Little gifts and promises. Prices are affectionate jokes — redeem your gifts freely.');
  const products=section('product-collection','Gifts and promises',{addLabel:'Add to bag',detailsLabel:'Gift details'});for(const [title,body,price] of [['Movie night','You choose the film. I will bring the snacks.','1 kiss'],['A long hug','Whenever you need one, for as long as you like.','2 kisses'],['Breakfast together','A slow morning and something delicious.','1 sleepy kiss'],['A handwritten letter','An old-school promise, written just for you.','3 kisses']])block(products,'kiss-gift',title,{title,body,price,src:'',alt:'',available:true});
  section('gift-bag','Your gift bag',{title:'Your bag',emptyMessage:'Your bag is waiting for a little promise.',removeLabel:'Remove'});
  section('gift-checkout','Gift checkout',{title:'Ready for a little promise?',checkoutLabel:'Create my gift receipt'});
  section('gift-receipt','Your gift receipt',{title:'A little promise, just for you',note:'No expiry date. Show me this receipt whenever you are ready.',downloadLabel:'Save receipt'});
  text(section('redemption-note','Free redemption note'),'Note','These prices are just a joke. You can redeem any gift freely. Your receipt can be saved and sent to me.');
 }else{
  const stations=section('station-selector','Choose a station');for(const title of ['Birthday dedication','Songs that remind me of you'])block(stations,'station',title,{title,body:'A few songs, a few feelings, a little birthday soundtrack.',src:'',alt:title});
  section('radio-player','Now playing',{title:'Your birthday radio',previousLabel:'Previous track',nextLabel:'Next track'});
  text(section('dedication','Why I chose this song'),'Dedication heading','A little note for this song');
  const tracks=section('track-list','Station tracks');for(const station of document.nodes.filter(n=>n.component==='station'))for(const [title,body] of [['A birthday dedication','Today gets its own soundtrack.'],['An ordinary-day favourite','The kind of song that makes a quiet moment feel lovely.'],['For the days ahead','For all the memories we still get to make.']])block(tracks,'radio-track',title,{title,body,stationId:station.id,src:'',introSrc:'',alt:title});
 }
 return parsePageDocument(document);
}
// Add the decided layout without overwriting any existing content, IDs, order or theme.
export function installDefaultLayout(slug:BuiltinPage,existing:PageDocument):PageDocument{
 const parsed=parsePageDocument(existing);if(parsed.layout?.version===1)return parsed;
 const defaults=createDefaultPage(slug),used=new Set(parsed.nodes.map(n=>n.id));
 const remap=new Map(defaults.nodes.map(n=>{let id=n.id;while(used.has(id))id+='-default';used.add(id);return [n.id,id]}));
 const nodes=defaults.nodes.map(n=>({...n,id:remap.get(n.id)!,parentId:n.parentId?remap.get(n.parentId)!:null,children:n.children.map(id=>remap.get(id)!),props:{...n.props,...(n.props.sceneId?{sceneId:remap.get(String(n.props.sceneId))!}:{}),...(n.props.stationId?{stationId:remap.get(String(n.props.stationId))!}:{})}}));
 return parsePageDocument({...parsed,layout:defaults.layout,rootIds:[...defaults.rootIds.map(id=>remap.get(id)!),...parsed.rootIds],nodes:[...nodes,...parsed.nodes]});
}
