import {createNode,type ComponentName} from './registry';
import {parsePageDocument} from './validate';
import type {CMSNode,PageDocument,CMSField} from './cms';
export function createMemoriesArchive(newId:()=>string):PageDocument{
 const d:PageDocument={schemaVersion:2,nodes:[],rootIds:[],theme:{background:'#f8f1e7',surface:'#fffaf3',text:'#493b35',muted:'#88746a',primary:'#a45d70',radius:20}};
 const add=(kind:ComponentName,label:string,parent:CMSNode|null,props:Record<string,CMSField>)=>{const n:CMSNode=createNode(kind,newId(),parent?.id??null);n.label=label;n.props={...n.props,...props};d.nodes.push(n);if(parent)parent.children.push(n.id);else d.rootIds.push(n.id);return n};
 const root=add('section','Archive page · layout',null,{archivePart:'page',padding:32,gap:32,maxWidth:1100,background:'#f8f1e7',radius:0});
 const cover=add('section','Archive introduction',root,{padding:24,align:'center',background:'transparent',radius:0,gap:12});
 add('text','Small introduction',cover,{text:'THE MOMENTS I KEEP CLOSE',size:11,color:'#a45d70',letterSpacing:3,align:'center'});
 add('heading','Page title',cover,{text:'Memories Archive',size:52,weight:400,fontFamily:'Georgia',align:'center',color:'#493b35'});
 add('text','Romantic introduction',cover,{text:'Some moments pass. Some stay with us forever. This is a little place for the ones I never want to forget.',size:17,align:'center',color:'#88746a',lineHeight:1.9});
 const music=add('section','Archive soundtrack',root,{padding:20,background:'#eee1d5',radius:20,gap:10});
 add('heading','Soundtrack heading',music,{text:'A soundtrack for our memories',size:22,weight:400,fontFamily:'Georgia'});
 add('text','Soundtrack note',music,{text:'Press play and stay a little while.',size:13,color:'#88746a'});
 add('audio','Background music · upload your song',music,{src:'',alt:'Our memories soundtrack',loop:true,initialVolume:0.5});
 const grid=add('section','Memory collection · columns and spacing',root,{archivePart:'collection',padding:0,radius:0,columns:2,gap:26,'mobile:columns':1});
 for(let i=1;i<=3;i++){
 const card=add('section','Memory '+i+' · frame',grid,{archivePart:'memory',padding:18,paddingBottom:26,background:'#fffaf3',radius:8,borderColor:'#e2d2c2',borderWidth:1,shadow:'soft',gap:12});
 add('image','Memory '+i+' · photo',card,{src:'',alt:'',objectFit:'cover',displayHeight:360,radius:4,emptyLabel:'A memory belongs here'});
 add('text','Memory '+i+' · event and date',card,{text:'YOUR EVENT · YOUR DATE',size:11,color:'#a45d70',letterSpacing:2});
 add('heading','Memory '+i+' · title',card,{text:'Give this moment a name',size:27,weight:400,fontFamily:'Georgia',color:'#493b35'});
 add('text','Memory '+i+' · romantic story',card,{text:'Write what happened, what you felt, and why this photograph is precious to you.',size:16,lineHeight:1.9,color:'#88746a'});
 }
 const end=add('section','Closing note',root,{padding:26,align:'center',gap:12});
 add('text','Closing message',end,{text:'And there are still so many memories waiting for us. ♡',fontFamily:'Georgia',size:22,align:'center',color:'#a45d70'});
 add('action','Return to Wiffeyyyy OS',end,{title:'Back to our little world',href:'/home',padding:14,radius:20,color:'#493b35'});
 return parsePageDocument(d);
}
