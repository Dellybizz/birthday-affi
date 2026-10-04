import type {CMSNode,PageDocument,CMSField} from './cms';
import {createNode} from './registry';
import {parsePageDocument} from './validate';
import type {InspectorField} from './inspector-fields';

export const phoneParts=['home','wallpaper','status','notifications','notification','widget','launcher','app-icon','navigation'] as const;
export const phoneFields:Record<string,InspectorField[]>={
 home:[{key:'showWidget',label:'Birthday widget',type:'select',options:['true','false']}],
 wallpaper:[{key:'dim',label:'Wallpaper dimming',type:'number',min:0,max:0.8,step:0.05}],
 status:[{key:'battery',label:'Decorative battery (%)',type:'number',min:0,max:100}],
 notifications:[{key:'title',label:'Panel title',type:'text'},{key:'emptyMessage',label:'Empty inbox message',type:'text'}],
 notification:[{key:'title',label:'Notification title',type:'text'},{key:'body',label:'Notification message',type:'textarea'},{key:'icon',label:'Notification icon',type:'text'},{key:'pageSlug',label:'Open page (slug)',type:'text'}],
 widget:[{key:'clockFormat',label:'Clock format',type:'select',options:['12','24']}],
 launcher:[],
 'app-icon':[{key:'placement',label:'Icon placement',type:'select',options:['grid','dock']},{key:'text',label:'App label',type:'text'},{key:'icon',label:'Emoji icon',type:'text'},{key:'pageSlug',label:'Page to open (slug)',type:'text'},{key:'iconBackground',label:'Icon background',type:'color'},{key:'src',label:'Custom icon image URL',type:'text'}],
 navigation:[]
};
export function isPhoneHome(document:PageDocument){return document.nodes.some(n=>n.parentId===null&&n.props.phonePart==='home');}
// Upgrade on read in both the public renderer and editor. Existing messages, media and IDs survive.
// All phone parts use existing section/text/image components and the existing draft/publish schema.
export function installPhoneHome(input:PageDocument):PageDocument{
 const doc=parsePageDocument(input);if(isPhoneHome(doc))return refinePhoneHome(doc);
 const used=new Set(doc.nodes.map(n=>n.id));let counter=0;
 const add=(component:'section'|'text'|'image'|'app-grid',part:string,label:string,parent:CMSNode|null,props:Record<string,CMSField>={})=>{
  let id='phone-'+part+'-'+ ++counter;while(used.has(id))id+='-new';used.add(id);
  const n:CMSNode=createNode(component,id,parent?.id??null);n.label=label;n.props={...n.props,phonePart:part,padding:0,...props};doc.nodes.push(n);if(parent)parent.children.push(id);return n;
 };
 const oldRoots=[...doc.rootIds],home=add('section','home','Android home screen',null);
 const wallpaper=add('image','wallpaper','Wallpaper',home,{src:'',alt:'',objectFit:'cover',focalX:50,focalY:50,dim:0.15});wallpaper.props.background='#593f65';
 add('section','status','Status bar',home,{networkLabel:'Wiffeyyyy OS',battery:100});
 const notifications=add('section','notifications','Notification shade',home,{title:'Notifications',emptyMessage:'All caught up. ♡'});
 add('text','notification','Birthday message',notifications,{title:'Happy birthday, favourite person',body:'Your little birthday world is ready to explore.',icon:'♡',pageSlug:'home'});
 add('text','notification','Birthday Hotline',notifications,{title:'A message is waiting for you',body:'Tap to answer your birthday call.',icon:'☎️',pageSlug:'hotline'});
 const roles:Record<string,string>={'birthday-heading':'widget','date-widget':'widget','app-launcher':'launcher'};
 let launcher:CMSNode|undefined;
 for(const id of oldRoots){const n=doc.nodes.find(n=>n.id===id)!;n.parentId=home.id;home.children.push(id);const role=roles[String(n.props.sectionKind)];if(role){delete n.props.sectionKind;n.props.phonePart=role;if(role==='launcher')launcher=n;}}
 if(!launcher)launcher=add('section','launcher','Apps',home);
 let grid=doc.nodes.find(n=>n.parentId===launcher!.id&&n.component==='app-grid');
 if(!grid){let id='phone-grid-'+ ++counter;while(used.has(id))id+='-new';used.add(id);grid=createNode('app-grid',id,launcher.id);doc.nodes.push(grid);launcher.children.push(grid.id);}
 grid.props.columns=3;grid.props.gap=18;
 for(const [slug,label,icon,color] of [['reasons','Adore','♡','#75263e'],['hotline','Hotdial','☎️','#34c759'],['adventure','Pardanasheen','🌸','#a7d7e8'],['movie','Saragram','📷','#e1306c'],['kiss-shop','Kiss Shop','💋','#ffc4ac'],['camera','Clicksara','📷','#d6d6d6'],['vault','Vault','🔐','#132c22']])add('image','app-icon',label,launcher,{text:label,pageSlug:slug,icon,iconBackground:color,src:''});
 add('section','navigation','Android navigation bar',home);
 doc.rootIds=[home.id];return refinePhoneHome(doc);
}

export function addPhoneItem(document:PageDocument,parentId:string,id:string):PageDocument{
 const next=structuredClone(document),parent=next.nodes.find(n=>n.id===parentId);
 if(!parent||!['launcher','notifications'].includes(String(parent.props.phonePart)))throw new Error('Choose Apps or Notification shade');
 const app=parent.props.phonePart==='launcher',node:CMSNode=createNode(app?'image':'text',id,parentId);
 node.label=app?'New app':'New notification';
 node.props=app?{phonePart:'app-icon',text:'New app',pageSlug:'home',icon:'♡',iconBackground:'#e8b4d0',src:''}:{phonePart:'notification',title:'A little reminder',body:'Your message here',icon:'♡',pageSlug:'home'};
 parent.children.push(id);next.nodes.push(node);return parsePageDocument(next);
}

// A one-time presentation upgrade retains every editable layer and its media.
export function refinePhoneHome(document:PageDocument):PageDocument{
 const doc=structuredClone(document),home=doc.nodes.find(n=>n.props.phonePart==='home');
 if(!home||home.props.phonePresentation===2)return doc;
 home.props.phonePresentation=2;home.props.showWidget='true';
 if(home.label==='Android home screen')home.label='iPhone home screen';
 for(const node of doc.nodes){
  if(node.props.phonePart==='navigation')node.label='Home indicator';
  if(node.props.phonePart==='widget'&&!node.children.some(id=>doc.nodes.find(n=>n.id===id)?.props.binding==='nickname'))node.visible=false;
  if(node.props.sectionKind==='recent-app'||node.props.sectionKind==='keepsake-note')node.visible=false;
  if(node.props.phonePart==='app-icon'&&node.props.placement===undefined)node.props.placement=['hotline','camera'].includes(String(node.props.pageSlug))?'dock':'grid';
  if(node.component==='app-grid'){node.props.columns=4;node.props.gap=12;}
 }
 return parsePageDocument(doc);
}
export function phoneSwipeCloses(dx:number,dy:number,elapsedMs:number){
 const distance=-dy;return distance>Math.abs(dx)*1.2&&(distance>=55||(distance>=22&&distance/Math.max(1,elapsedMs)>0.45));
}
