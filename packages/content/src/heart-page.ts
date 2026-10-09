import {createNode,type ComponentName} from './registry';
import {parsePageDocument} from './validate';
import type {CMSNode,CMSField,PageDocument} from './cms';
export const HEART_ROUTE='/pages/in-my-heart';
export function createHeartPage(newId:()=>string):PageDocument{
 const doc:PageDocument={schemaVersion:2,rootIds:[],nodes:[],theme:{background:'#160811',surface:'#24101d',text:'#fff6fb',muted:'#ffc9df',primary:'#ff8cbc',radius:18}};
 const add=(kind:ComponentName,label:string,parent:CMSNode|null,props:Record<string,CMSField>)=>{const n:CMSNode=createNode(kind,newId(),parent?.id??null);n.label=label;n.props={...props};doc.nodes.push(n);if(parent)parent.children.push(n.id);else doc.rootIds.push(n.id);return n};
 const root=add('section','In My Heart · page',null,{heartPart:'page',customCss:''});
 const intro=add('section','Opening screen',root,{heartPart:'intro',showIntro:true});
 add('text','Opening chapter label',intro,{heartPart:'heartBootKicker',text:'chapter two · heart memory field'});
 add('heading','Opening title',intro,{heartPart:'heartBootTitle',text:'these memories live'});
 add('heading','Opening emphasis',intro,{heartPart:'heartBootEmphasis',text:'in my heart.'});
 add('text','Opening message',intro,{heartPart:'heartBootCopy',text:'Not in a universe. Not in space. Just here — in my heart. You can look at it from my heart, or step in my heart and be surrounded by the little moments that stay with me.'});
 add('text','Enter button',intro,{heartPart:'bootBtn',text:'enter my heart'});
 const tools=add('section','Perspective and toolbar',root,{heartPart:'tools'});
 for(const [part,text] of Object.entries({brandTitle:'IN.MY.HEART',brandChapter:'02 / 03 · PERSONAL MEMORY FIELD',orbitBtn:'drifting',pausedLabel:'paused',expandBtn:'open heart',collapseBtn:'hold close',heartbeatBtn:'heartbeat',heartbeatOffLabel:'heartbeat off',overviewPov:'from my heart',corePov:'in my heart',zoomHint:'drag to look · scroll / pinch to zoom · click any memory',cameraLabel:'camera:'}))add('text',text,tools,{heartPart:part,text});
 add('section','3D geometry and motion',root,{heartPart:'scene',defaultPov:'overview',drifting:true,driftSpeed:.00062,heartScale:21,mobileHeartScale:15.5,heartDepth:54,mobileHeartDepth:38,shells:4,initialZoom:1,openSpread:1.4,closeSpread:.72,zoomSpeed:3,perspective:620,heartbeat:true,heartbeatDuration:1.35,showMesh:true,showOutline:true,showCenter:true,showParticles:true,showFloatingHearts:true,showGrain:true,showVignette:true});
 add('section','Colors and glass appearance',root,{heartPart:'appearance',bg:'#160811',bg2:'#24101d',bg3:'#341425',text:'#fff6fb',muted:'#fff0f8',mutedAlpha:.64,softAlpha:.38,pink:'#ff8cbc',rose:'#ff679f',blush:'#ffc9df',violet:'#d4a6ff',line:'#ff91be',lineAlpha:.22,glass:'#230c1a',glassAlpha:.58,border:'#ffd6e8',borderAlpha:.18,nodeWidth:114,mobileNodeWidth:86,nodeRadius:18,mobileNodeRadius:13,popupWidth:372,mobilePopupWidth:330,popupRadius:28,popupPadding:11,controlRadius:999,controlPadding:12,controlHeight:35,controlTextSize:9,povTop:14,mobilePovTop:56,hudInset:12,grainOpacity:.045,vignetteStrength:.55,outlineOpacity:.36,centerOpacity:.6,fontFamily:'Arial'});
 const memories=add('section','Heart memories · add, reorder or hide',root,{heartPart:'memories'});
 const notes=['one of my favourites.','saved immediately.','tiny video memory.','this one stays.','quiet favourite.','the funny one.','I still remember this.','very random, very us.','peak nonsense.','you probably forgot this.','small but important.','one of those clips.','top tier.','never deleting this.','yes, this one.','case closed.','another favourite.','one more clip.','bonus memory.','you thought I was done?'];
 for(let i=0;i<20;i++){add('image','Heart memory '+String(i+1).padStart(2,'0'),memories,{heartPart:'memory',title:'memory '+String(i+1).padStart(2,'0'),body:notes[i],src:['/puzzles/level-one.jpg','/puzzles/level-two.jpg','/puzzles/our-moment.jpg'][i%3],alt:'A favourite memory',objectFit:'cover',focalX:50,focalY:50,offsetX:0,offsetY:0,offsetZ:0,cardScale:1});}
 const popup=add('section','Memory popup',root,{heartPart:'popup'});
 add('text','Previous memory button',popup,{heartPart:'popupPrev',text:'previous'});add('text','Next memory button',popup,{heartPart:'popupNext',text:'next'});add('text','Close memory label',popup,{heartPart:'popupCloseLabel',text:'Close memory'});
 const navigation=add('section','Back and forward navigation',root,{heartPart:'navigation'});
 add('action','Back to Memories Archive',navigation,{heartPart:'back',title:'← Memories Archive',href:'/'});add('action','Continue to iPhone',navigation,{heartPart:'next',title:'Enter Wiffeyyyy OS →',href:'/home'});
 const audio=add('section','Heart soundtrack',root,{heartPart:'soundtrack'});add('audio','Heartbeat audio',audio,{heartPart:'heartbeatAudio',src:'',alt:'Heartbeat',loop:true,initialVolume:.5});add('audio','Heart background music',audio,{heartPart:'musicAudio',src:'',alt:'Heart soundtrack',loop:true,initialVolume:.5});
 return parsePageDocument(doc);
}
