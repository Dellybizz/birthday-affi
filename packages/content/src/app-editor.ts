import type {CMSField,CMSNode,PageDocument} from './cms';
import {createNode,type ComponentName} from './registry';
import type {SectionKind} from './layout-contract';
import {parsePageDocument} from './validate';
import {deleteNode,duplicateNode,moveNode,updateNode} from './editor-operations';
import {mediaSelectionPatch,type MediaKind} from './inspector-capabilities';

export type AppEditorSlug='reasons'|'hotline'|'adventure'|'movie'|'kiss-shop'|'radio';
export type AppEditorActionKey='reason'|'keypad-message'|'photo'|'video'|'post'|'reel'|'gift'|'station'|'track';
export type AppEditorSection={key:string;label:string;sectionKind:SectionKind;description?:string};
export type AppEditorAction={
 key:AppEditorActionKey;
 label:string;
 singular:string;
 component:ComponentName;
 sectionKind:SectionKind;
 mediaKind?:MediaKind;
 defaults:Record<string,CMSField>;
 matches?:(node:CMSNode)=>boolean;
 maxItems?:number;
};
export type AppEditorDefinition={
 slug:AppEditorSlug;
 title:string;
 description:string;
 emptyMessage:string;
 sections:AppEditorSection[];
 actions:AppEditorAction[];
};

const section=(key:string,label:string,sectionKind:SectionKind,description=''):AppEditorSection=>({key,label,sectionKind,description});
const action=(value:AppEditorAction):AppEditorAction=>value;

export const appEditorDefinitions:readonly AppEditorDefinition[]=[
 {
  slug:'reasons',title:'Adore',description:'Manage every reason, photo and heartfelt part of Adore.',emptyMessage:'No reasons yet. Add the first little reason.',
  sections:[section('deck','Reason cards','reason-deck','Swipeable reason cards.'),section('final','Heartfelt ending','heartfelt-card','The final letter and closing message.')],
  actions:[action({key:'reason',label:'Add reason',singular:'Reason',component:'reason',sectionKind:'reason-deck',mediaKind:'image',defaults:{title:'A little reason',body:'',category:'Little things',src:'',alt:'',voiceSrc:'',transcript:''}})]
 },
 {
  slug:'hotline',title:'Hotdial',description:'Manage the caller screen, main recording and affection keypad.',emptyMessage:'No keypad messages yet.',
  sections:[section('caller','Caller screen','incoming-call','Caller identity and incoming-call labels.'),section('birthday','Main birthday message','birthday-message','Primary birthday recording and transcript.'),section('keypad','Affection keypad','affection-keypad','Extra messages opened from keypad digits.')],
  actions:[action({key:'keypad-message',label:'Add keypad message',singular:'Keypad message',component:'hotline-message',sectionKind:'affection-keypad',mediaKind:'audio',defaults:{digit:'',title:'A little message',body:'',src:'',captions:''}})]
 },
 {
  slug:'adventure',title:'Pardanasheen',description:'Manage fit-check photos, videos and their captions in one library.',emptyMessage:'No fit checks yet. Add a photo or video.',
  sections:[section('library','Photo library','photo-library','iPhone Photos-style fit-check library.')],
  actions:[
   action({key:'photo',label:'Add photo',singular:'Photo',component:'image',sectionKind:'photo-library',mediaKind:'image',defaults:{src:'',alt:'',title:'Fit check',album:'Fit checks',date:'',body:''}}),
   action({key:'video',label:'Add video',singular:'Video',component:'video',sectionKind:'photo-library',mediaKind:'video',defaults:{src:'',alt:'',title:'In motion',album:'Fit checks',date:'',body:''}})
  ]
 },
 {
  slug:'movie',title:'Saragram',description:'Manage profile details, photo posts, reels, captions and birthday ending.',emptyMessage:'No posts or reels yet.',
  sections:[section('profile','Profile','movie-credits','Username, profile photo and bio.'),section('feed','Posts & reels','movie-player','Saragram feed content.'),section('ending','Birthday ending','birthday-ending','Closing birthday message.')],
  actions:[
   action({key:'post',label:'Add post',singular:'Post',component:'movie-scene',sectionKind:'movie-player',mediaKind:'image',defaults:{title:'A little moment',body:'',src:'',alt:'',mediaKind:'image',poster:'',username:'',location:'',date:'',audioLabel:''},matches:node=>node.props.mediaKind==='image'}),
   action({key:'reel',label:'Add reel',singular:'Reel',component:'movie-scene',sectionKind:'movie-player',mediaKind:'video',defaults:{title:'A little reel',body:'',src:'',alt:'',mediaKind:'video',poster:'',captions:'',username:'',location:'',date:'',audioLabel:''},matches:node=>node.props.mediaKind!=='image'})
  ]
 },
 {
  slug:'kiss-shop',title:'Kiss Shop',description:'Manage gifts, playful prices and availability.',emptyMessage:'No gifts yet. Add the first gift.',
  sections:[section('products','Gifts','product-collection','All redeemable gifts and promises.'),section('bag','Gift bag','gift-bag'),section('checkout','Checkout','gift-checkout'),section('receipt','Receipt','gift-receipt')],
  actions:[action({key:'gift',label:'Add gift',singular:'Gift',component:'kiss-gift',sectionKind:'product-collection',mediaKind:'image',defaults:{title:'A gift for you',body:'',price:'1 kiss',category:'Little moments',src:'',alt:'',available:true}})]
 },
 {
  slug:'radio',title:'Birthday Radio',description:'Manage stations, tracks, dedications and audio.',emptyMessage:'No radio content yet.',
  sections:[section('stations','Stations','station-selector'),section('player','Now playing','radio-player'),section('tracks','Tracks','track-list')],
  actions:[
   action({key:'station',label:'Add station',singular:'Station',component:'station',sectionKind:'station-selector',mediaKind:'image',defaults:{title:'New station',body:'',src:'',alt:''}}),
   action({key:'track',label:'Add track',singular:'Track',component:'radio-track',sectionKind:'track-list',mediaKind:'audio',defaults:{title:'New track',body:'',src:'',introSrc:'',alt:'',stationId:'',captions:''}})
  ]
 }
];

const definitions=new Map(appEditorDefinitions.map(value=>[value.slug,value]));
export function getAppEditorDefinition(slug:string|null|undefined){return slug?definitions.get(slug as AppEditorSlug):undefined}

function parentSection(document:PageDocument,node:CMSNode){return node.parentId?document.nodes.find(candidate=>candidate.id===node.parentId):undefined}
function belongsToAction(document:PageDocument,node:CMSNode,action:AppEditorAction){
 if(node.component!==action.component)return false;
 const parent=parentSection(document,node);
 if(String(parent?.props.sectionKind??'')!==action.sectionKind)return false;
 return action.matches?action.matches(node):true;
}

export type AppEditorItem={id:string;label:string;visible:boolean;actionKey:AppEditorActionKey;kind:string;mediaKind?:MediaKind;src:string;parentId:string|null};
export function getAppEditorItems(document:PageDocument,slug:string):AppEditorItem[]{
 const definition=getAppEditorDefinition(slug);if(!definition)return [];
 const items:AppEditorItem[]=[];
 for(const node of document.nodes){
  const matching=definition.actions.find(action=>belongsToAction(document,node,action));if(!matching)continue;
  const title=typeof node.props.title==='string'&&node.props.title.trim()?node.props.title:String(node.label??matching.singular);
  const src=typeof node.props.src==='string'?node.props.src:'';
  items.push({id:node.id,label:title,visible:node.visible,actionKey:matching.key,kind:matching.singular,mediaKind:matching.mediaKind,src,parentId:node.parentId});
 }
 return items;
}

export function getAppEditorSections(document:PageDocument,slug:string){
 const definition=getAppEditorDefinition(slug);if(!definition)return [];
 return definition.sections.map(entry=>({entry,node:document.nodes.find(node=>node.parentId===null&&String(node.props.sectionKind??'')===entry.sectionKind)}));
}

export function canAddAppEditorItem(document:PageDocument,slug:string,actionKey:AppEditorActionKey){
 const definition=getAppEditorDefinition(slug),action=definition?.actions.find(candidate=>candidate.key===actionKey);if(!definition||!action)return false;
 const parent=document.nodes.find(node=>node.parentId===null&&String(node.props.sectionKind??'')===action.sectionKind);if(!parent)return false;
 if(action.maxItems===undefined)return true;
 return parent.children.filter(id=>{const node=document.nodes.find(candidate=>candidate.id===id);return !!node&&belongsToAction(document,node,action)}).length<action.maxItems;
}

export function addAppEditorItem(document:PageDocument,slug:string,actionKey:AppEditorActionKey,id:string):{document:PageDocument;selectedId:string}{
 const definition=getAppEditorDefinition(slug);if(!definition)throw new Error('This page does not have app-content authoring.');
 const action=definition.actions.find(candidate=>candidate.key===actionKey);if(!action)throw new Error('Unknown app-content action.');
 const next=structuredClone(document);
 const parent=next.nodes.find(node=>node.parentId===null&&String(node.props.sectionKind??'')===action.sectionKind);if(!parent)throw new Error(`Missing ${action.sectionKind} section.`);
 if(!canAddAppEditorItem(next,slug,actionKey))throw new Error(`No more ${action.singular.toLowerCase()} items can be added.`);
 const node:CMSNode=createNode(action.component,id,parent.id);node.label=action.singular;node.props={...node.props,...action.defaults};
 if(actionKey==='track'&&!node.props.stationId){const station=next.nodes.find(candidate=>candidate.component==='station');if(station)node.props.stationId=station.id}
 parent.children.push(node.id);next.nodes.push(node);
 return {document:parsePageDocument(next),selectedId:node.id};
}

function appItem(document:PageDocument,slug:string,id:string){
 const item=getAppEditorItems(document,slug).find(candidate=>candidate.id===id);if(!item)throw new Error('App content item not found.');return item;
}
export function moveAppEditorItem(document:PageDocument,slug:string,id:string,direction:-1|1){appItem(document,slug,id);return moveNode(document,id,direction)}
export function toggleAppEditorItem(document:PageDocument,slug:string,id:string){const item=appItem(document,slug,id);return updateNode(document,id,{visible:!item.visible})}
export function removeAppEditorItem(document:PageDocument,slug:string,id:string){appItem(document,slug,id);return deleteNode(document,id)}
export function duplicateAppEditorItem(document:PageDocument,slug:string,id:string,newId:()=>string){appItem(document,slug,id);return duplicateNode(document,id,newId)}

export type AppEditorMedia={id:string;kind:MediaKind;alt_text?:string|null;width?:number|null;height?:number|null;metadata?:{variants?:Array<string|number>}|null};
export function setAppEditorItemMedia(document:PageDocument,slug:string,id:string,media:AppEditorMedia){
 const item=appItem(document,slug,id);if(!item.mediaKind)throw new Error('This content item does not accept primary media.');if(media.kind!==item.mediaKind)throw new Error(`Choose ${item.mediaKind} media for this item.`);
 return updateNode(document,id,{props:mediaSelectionPatch({key:'src',label:'Primary media',kind:item.mediaKind},media)});
}
