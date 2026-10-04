export const VISITOR_KEY='wiffeyyyy:visitor:v1';
export const APP_SLUGS=['reasons','hotline','adventure','movie','kiss-shop','radio'] as const;
export const NOTIFICATION_IDS=['welcome','hotline','explore'] as const;
export type VisitorState={version:1;entered:boolean;visited:string[];readNotifications:string[];reducedMotion:boolean};
export const initialVisitorState=():VisitorState=>({version:1,entered:false,visited:[],readNotifications:[],reducedMotion:false});
export function parseVisitorState(raw:string|null):VisitorState{
 try{const value=JSON.parse(raw??'null');if(!value||value.version!==1)return initialVisitorState();return{version:1,entered:value.entered===true,reducedMotion:value.reducedMotion===true,visited:Array.isArray(value.visited)?[...new Set<string>(value.visited.filter((x:unknown)=>typeof x==='string'&&APP_SLUGS.includes(x as never)))].slice(-6):[],readNotifications:Array.isArray(value.readNotifications)?[...new Set<string>(value.readNotifications.filter((x:unknown)=>typeof x==='string'&&NOTIFICATION_IDS.includes(x as never)))]:[]}}catch{return initialVisitorState()}
}
export type VisitorAction={type:'enter'}|{type:'visit';slug:string}|{type:'read';ids:string[]}|{type:'motion';value:boolean}|{type:'reset'};
export function reduceVisitorState(state:VisitorState,action:VisitorAction):VisitorState{
 switch(action.type){case 'enter':return{...state,entered:true};case 'visit':return APP_SLUGS.includes(action.slug as never)?{...state,entered:true,visited:[...state.visited.filter(x=>x!==action.slug),action.slug].slice(-6)}:state;case 'read':return{...state,readNotifications:[...new Set([...state.readNotifications,...action.ids.filter(x=>NOTIFICATION_IDS.includes(x as never))])]};case 'motion':return{...state,reducedMotion:action.value};case 'reset':return initialVisitorState()}
}
