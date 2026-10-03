import {componentRegistry, type ComponentName} from './registry';
import {componentFields, designFields} from './inspector-fields';

// C0 catalog: current definitions stay canonical; planned slots are not editor controls.
export function getComponentContract(component:ComponentName){
 const definition=componentRegistry[component];
 return {component,label:definition.label,type:definition.type,defaults:{...definition.defaults},
  allowedParents:definition.type==='section'?['page','section']:['section'],
  fields:[...designFields,...componentFields[component]],
  renderer:definition.type==='section'?'CMSRenderer.section':['reason','hotline-message','adventure-choice','movie-scene','kiss-gift','radio-track'].includes(component)?'AppExperience':'CMSRenderer.Block'};
}

export const appSlotContracts={
 reasons:{component:'reason',existing:['title','body','category','src','alt'],planned:['intro','previousLabel','nextLabel','favoriteLabel','finalCard','swipeBehavior']},
 hotline:{component:'hotline-message',existing:['title','body','src','captions'],planned:['callerName','callerPhoto','incomingTitle','answerLabel','endLabel','mainRecording','keypadLabels']},
 adventure:{component:'adventure-choice',existing:['title','body','invitation'],planned:['choiceGroups','outcomeMapping','invitationDate','invitationTime','invitationPlace','backLabel','directInvitationLabel']},
 movie:{component:'movie-scene',existing:['title','body','src','alt','captions'],planned:['openingCredits','chapterStart','poster','ending','compositionMode','replayLabel']},
 'kiss-shop':{component:'kiss-gift',existing:['title','body','price','src','alt'],planned:['productDetails','addToBagLabel','bag','checkoutLabel','receiptTemplate','downloadReceiptLabel','freeRedemptionNote']},
 radio:{component:'radio-track',existing:['title','body','src','captions'],planned:['station','stationArtwork','recordedIntro','trackOrder','loop','nextLabel','previousLabel','crossRoutePlayback']},
} as const;

export const globalSlotContracts={
 personalization:['name','nickname','birthdate','timezone','greeting'],
 welcome:['startingText','heading','message','enterLabel','duration'],
 home:['heading','message','dateWidget','appOrder','appIcons','startHereBadge'],
 shell:['statusBar','brand','backLabel','homeLabel','phoneFrame','safeAreas'],
 navigation:['menus','submenus','labels','routes','visibility'],
 notifications:['message','destination','frequency','mediaSuppression'],
 audio:['defaultVolume','defaultMute','interruptionPolicy','resumePolicy'],
} as const;
