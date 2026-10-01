import type {CMSNode,PageDocument,CMSField} from './cms';
import {createNode} from './registry';
import {parsePageDocument} from './validate';
import type {InspectorField} from './inspector-fields';

export const phoneParts=['home','wallpaper','status','notifications','notification','widget','launcher','app-icon','navigation'] as const;
export const phoneFields:Record<string,InspectorField[]>={
 home:[],
 wallpaper:[{key:'dim',label:'Wallpaper dimming',type:'number',min:0,max:0.8,step:0.05}],
 status:[{key:'networkLabel',label:'Network label',type:'text'},{key:'battery',label:'Decorative battery (%)',type:'number',min:0,max:100}],
 notifications:[{key:'title',label:'Panel title',type:'text'},{key:'emptyMessage',label:'Empty inbox message',type:'text'}],
 notification:[{key:'title',label:'Notification title',type:'text'},{key:'body',label:'Notification message',type:'textarea'},{key:'icon',label:'Notification icon',type:'text'},{key:'pageSlug',label:'Open page (slug)',type:'text'}],
 widget:[{key:'clockFormat',label:'Clock format',type:'select',options:['12','24']}],
 launcher:[],
 'app-icon':[{key:'text',label:'App label',type:'text'},{key:'icon',label:'Emoji icon',type:'text'},{key:'pageSlug',label:'Page to open (slug)',type:'text'},{key:'iconBackground',label:'Icon background',type:'color'},{key:'src',label:'Custom icon image URL',type:'text'}],
 navigation:[]
};
export function isPhoneHome(document:PageDocument){return document.nodes.some(n=>n.parentId===null&&n.props.phonePart==='home');}
// Upgrade on read in both the public renderer and editor. Existing messages, media and IDs survive.
// All phone parts use existing section/text/image components and the existing draft/publish schema.
export function installPhoneHome(input:PageDocument):PageDocument{
 const doc=parsePageDocument(input);if(isPhoneHome(doc))return doc;
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
 for(const [slug,label,icon,color] of [['reasons','Reasons','💗','#f3a8c8'],['hotline','Hotline','☎️','#b8e1b3'],['adventure','Adventure','🧭','#a7d7e8'],['movie','Movie','🎬','#c4b5ef'],['kiss-shop','Kiss Shop','💋','#ffc4ac'],['radio','Radio','📻','#f5d592']])add('image','app-icon',label,launcher,{text:label,pageSlug:slug,icon,iconBackground:color,src:''});
 add('section','navigation','Android navigation bar',home);
 doc.rootIds=[home.id];return parsePageDocument(doc);
}

export function addPhoneItem(document:PageDocument,parentId:string,id:string):PageDocument{
 const next=structuredClone(document),parent=next.nodes.find(n=>n.id===parentId);
 if(!parent||!['launcher','notifications'].includes(String(parent.props.phonePart)))throw new Error('Choose Apps or Notification shade');
 const app=parent.props.phonePart==='launcher',node:CMSNode=createNode(app?'image':'text',id,parentId);
 node.label=app?'New app':'New notification';
 node.props=app?{phonePart:'app-icon',text:'New app',pageSlug:'home',icon:'♡',iconBackground:'#e8b4d0',src:''}:{phonePart:'notification',title:'A little reminder',body:'Your message here',icon:'♡',pageSlug:'home'};
 parent.children.push(id);next.nodes.push(node);return parsePageDocument(next);
}
