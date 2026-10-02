import {createNode,type ComponentName} from './registry';
import {parsePageDocument} from './validate';
import type {CMSNode,PageDocument,CMSField} from './cms';
export function createMemoriesArchive(newId:()=>string):PageDocument{
 const d:PageDocument={schemaVersion:2,nodes:[],rootIds:[],theme:{background:'#160c20',surface:'#281532',text:'#fff0f7',muted:'#d4b9ce',primary:'#ff78b4',radius:20}};
 const add=(kind:ComponentName,label:string,parent:CMSNode|null,props:Record<string,CMSField>)=>{const n:CMSNode=createNode(kind,newId(),parent?.id??null);n.label=label;n.props={...n.props,...props};d.nodes.push(n);if(parent)parent.children.push(n.id);else d.rootIds.push(n.id);return n};
 const root=add('section','Archive page · layout',null,{archivePart:'page',visualEffects:true,decorNote:'for you, always',padding:28,gap:64,maxWidth:1200,background:'#160c20',radius:0});
 const cover=add('section','Archive introduction',root,{archivePart:'hero',padding:24,align:'center',background:'transparent',radius:0,gap:12});
 add('text','Small introduction',cover,{text:'A LITTLE UNIVERSE, MADE FOR YOU',size:11,color:'#ff78b4',letterSpacing:3,align:'center'});
 add('heading','Page title',cover,{text:'Memories\nArchive',size:72,weight:400,fontFamily:'Georgia',align:'center',color:'#fff0f7'});
 add('text','Romantic introduction',cover,{text:'Some moments pass. Some stay with us forever. This is a little place for the ones I never want to forget.',size:17,align:'center',color:'#d4b9ce',lineHeight:1.9});
 add('action','Enter Wiffeyyyy OS · hero button',cover,{title:'Enter Wiffeyyyy OS →',href:'/home',background:'#ff78b4',color:'#160c20',padding:18,radius:32});
 const music=add('section','Archive soundtrack',root,{archivePart:'soundtrack',padding:24,background:'#30182d',radius:20,gap:10});
 add('heading','Soundtrack heading',music,{text:'A soundtrack for our memories',size:22,weight:400,fontFamily:'Georgia'});
 add('text','Soundtrack note',music,{text:'Press play and stay a little while.',size:13,color:'#d4b9ce'});
 add('audio','Background music · upload your song',music,{src:'',alt:'Our memories soundtrack',loop:true,initialVolume:0.5});
 const grid=add('section','Memory collection · columns and spacing',root,{archivePart:'collection',padding:0,radius:0,columns:1,gap:64,'mobile:columns':1});
 for(let i=1;i<=3;i++){
 const card=add('section','Memory '+i+' · frame',grid,{archivePart:'memory',columns:2,'mobile:columns':1,padding:24,paddingBottom:24,background:'#281532',radius:28,borderColor:'#794463',borderWidth:1,shadow:'deep',gap:24});
 add('image','Memory '+i+' · photo',card,{src:['/puzzles/level-one.jpg','/puzzles/level-two.jpg','/puzzles/our-moment.jpg'][i-1],alt:'A favourite photograph',objectFit:'cover',displayHeight:420,radius:20,emptyLabel:'A memory belongs here'});
 add('text','Memory '+i+' · event and date',card,{text:'MEMORY 0'+i+' · CLOSE TO MY HEART',size:11,color:'#ff78b4',letterSpacing:2});
 add('heading','Memory '+i+' · title',card,{text:['A moment worth keeping','My favourite kind of ordinary','A little closer to forever'][i-1],size:27,weight:400,fontFamily:'Georgia',color:'#fff0f7'});
 add('text','Memory '+i+' · romantic story',card,{text:['Some photographs hold more than a moment. They hold the way my heart feels about you.','With you, even the little things become memories I want to keep forever.','If I could keep one feeling close, it would be the peace of being near you.'][i-1],size:16,lineHeight:1.9,color:'#d4b9ce'});
 }
 const end=add('section','Closing note',root,{padding:26,align:'center',gap:12});
 add('text','Closing message',end,{text:'And there are still so many memories waiting for us. ♡',fontFamily:'Georgia',size:22,align:'center',color:'#ff78b4'});
 add('action','Enter the phone interface',end,{title:'Enter Wiffeyyyy OS →',href:'/home',padding:14,radius:20,color:'#fff0f7'});
 return parsePageDocument(d);
}
