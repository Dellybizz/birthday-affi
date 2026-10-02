import {createNode,type ComponentName} from './registry';
import {parsePageDocument} from './validate';
import type {CMSNode,PageDocument,CMSField} from './cms';

const memoryTitles=['A moment worth keeping','My favourite kind of ordinary','A little closer to forever'];
const memoryStories=['Some photographs hold more than a moment. They hold the way my heart feels about you.','With you, even the little things become memories I want to keep forever.','If I could keep one feeling close, it would be the peace of being near you.'];

function appendMemory(d:PageDocument,parent:CMSNode,index:number,newId:()=>string){
 const card=createNode('section',newId(),parent.id);card.label='Memory '+index+' · frame';card.props={...card.props,archivePart:'memory',columns:2,'mobile:columns':1,padding:24,paddingBottom:24,background:'#281532',radius:28,borderColor:'#794463',borderWidth:1,shadow:'deep',gap:24,imageSide:'auto',mobileImageHeight:330};parent.children.push(card.id);d.nodes.push(card);
 const add=(kind:ComponentName,label:string,props:Record<string,CMSField>)=>{const node=createNode(kind,newId(),card.id);node.label=label;node.props={...node.props,...props};card.children.push(node.id);d.nodes.push(node);return node};
 add('image','Memory '+index+' · photo',{src:'',alt:'A favourite photograph',objectFit:'cover',displayHeight:420,radius:20,emptyLabel:'A memory belongs here'});
 add('text','Memory '+index+' · event and date',{text:'MEMORY '+String(index).padStart(2,'0')+' · CLOSE TO MY HEART',size:11,color:'#ff78b4',letterSpacing:2});
 add('heading','Memory '+index+' · title',{text:memoryTitles[index-1]??'A memory waiting for us',size:27,weight:400,fontFamily:'Georgia',color:'#fff0f7'});
 add('text','Memory '+index+' · romantic story',{text:memoryStories[index-1]??'Add your favourite moment and the words you want to keep with it.',size:16,lineHeight:1.9,color:'#d4b9ce'});
 return card;
}

export function addArchiveMemory(document:PageDocument,collectionId:string,newId:()=>string):{document:PageDocument;selectedId:string}{
 const d=structuredClone(parsePageDocument(document));const collection=d.nodes.find(node=>node.id===collectionId);
 if(!collection||collection.type!=='section'||collection.props.archivePart!=='collection')throw new Error('Choose the Memory collection before adding a memory.');
 const count=collection.children.map(id=>d.nodes.find(node=>node.id===id)).filter(node=>node?.props.archivePart==='memory').length;
 const card=appendMemory(d,collection,count+1,newId);return {document:parsePageDocument(d),selectedId:card.id};
}

export function createMemoriesArchive(newId:()=>string):PageDocument{
 const d:PageDocument={schemaVersion:2,nodes:[],rootIds:[],theme:{background:'#160c20',surface:'#281532',text:'#fff0f7',muted:'#d4b9ce',primary:'#ff78b4',radius:20}};
 const add=(kind:ComponentName,label:string,parent:CMSNode|null,props:Record<string,CMSField>)=>{const n:CMSNode=createNode(kind,newId(),parent?.id??null);n.label=label;n.props={...n.props,...props};d.nodes.push(n);if(parent)parent.children.push(n.id);else d.rootIds.push(n.id);return n};
 const root=add('section','Archive page · layout',null,{archivePart:'page',transitionEnabled:true,transitionDuration:800,transitionColor:'#ff78b4',transitionText:'A little world, just for you',archiveBackLabel:'‹ In My Heart',visualEffects:true,decorNote:'for you, always',glowOneColor:'#9d285e',glowTwoColor:'#6244a2',decorativeHeartColor:'#ff78b4',decorationOpacity:.5,decorativeHeartSize:360,padding:28,gap:64,maxWidth:1200,background:'#160c20',radius:0});
 const cover=add('section','Archive introduction',root,{archivePart:'hero',padding:24,align:'center',background:'transparent',radius:0,gap:12,heroMinHeight:620,heroSideSpace:35,heroGap:24,titleItalic:true,titleTracking:-4,mobileHeroMinHeight:740,mobileHeroTopPadding:280});
 add('text','Small introduction',cover,{text:'A LITTLE UNIVERSE, MADE FOR YOU',size:11,color:'#ff78b4',letterSpacing:3,align:'center'});
 add('heading','Page title',cover,{text:'Memories\nArchive',size:72,weight:400,fontFamily:'Georgia',align:'center',color:'#fff0f7'});
 add('text','Romantic introduction',cover,{text:'Some moments pass. Some stay with us forever. This is a little place for the ones I never want to forget.',size:17,align:'center',color:'#d4b9ce',lineHeight:1.9});
 add('action','Enter Wiffeyyyy OS · hero button',cover,{title:'Step into my heart →',href:'/pages/in-my-heart',openInNewTab:false,background:'#ff78b4',color:'#160c20',padding:18,radius:32});
 const music=add('section','Archive soundtrack',root,{archivePart:'soundtrack',padding:24,background:'#30182d',radius:20,gap:10,gradientStart:'#3b1b34',gradientEnd:'#241530',gradientAngle:110});
 add('heading','Soundtrack heading',music,{text:'A soundtrack for our memories',size:22,weight:400,fontFamily:'Georgia'});
 add('text','Soundtrack note',music,{text:'Press play and stay a little while.',size:13,color:'#d4b9ce'});
 add('audio','Background music · upload your song',music,{src:'',alt:'Our memories soundtrack',loop:true,initialVolume:0.5});
 const grid=add('section','Memory collection · columns and spacing',root,{archivePart:'collection',padding:0,radius:0,columns:1,gap:64,'mobile:columns':1,alternateLayout:true,revealAnimation:true,hoverLift:true});
 for(let i=1;i<=5;i++)appendMemory(d,grid,i,newId);
 const end=add('section','Closing note',root,{archivePart:'closing',padding:26,align:'center',gap:12});
 add('text','Closing message',end,{text:'And there are still so many memories waiting for us. ♡',fontFamily:'Georgia',size:22,align:'center',color:'#ff78b4'});
 add('action','Enter the phone interface',end,{title:'Step into my heart →',href:'/pages/in-my-heart',openInNewTab:false,padding:14,radius:20,color:'#fff0f7'});
 return parsePageDocument(d);
}
