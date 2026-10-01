export type InspectorField = { key:string;label:string;type:'text'|'textarea'|'number'|'select'|'color';min?:number;max?:number;step?:number;options?:string[] };
export const designFields:InspectorField[]=[
 {key:'background',label:'Background',type:'color'}, {key:'color',label:'Text color',type:'color'},
 {key:'padding',label:'Padding',type:'number',min:0,max:96}, {key:'margin',label:'Margin',type:'number',min:0,max:96},
 {key:'radius',label:'Corner radius',type:'number',min:0,max:64}, {key:'opacity',label:'Opacity',type:'number',min:0,max:1,step:0.05},
];
export const componentFields:Record<string,InspectorField[]>={
 section:[],
 reason:[{key:'title',label:'Reason title',type:'text'},{key:'body',label:'Reason',type:'textarea'},{key:'category',label:'Category',type:'text'},{key:'src',label:'Photo URL',type:'text'},{key:'alt',label:'Photo description',type:'text'}],
 'hotline-message':[{key:'title',label:'Keypad message title',type:'text'},{key:'body',label:'Text / transcript',type:'textarea'},{key:'src',label:'Recording URL',type:'text'}],
 'adventure-choice':[{key:'title',label:'Choice title',type:'text'},{key:'body',label:'Description',type:'textarea'},{key:'invitation',label:'Revealed invitation',type:'textarea'}],
 'movie-scene':[{key:'title',label:'Scene title',type:'text'},{key:'body',label:'Scene caption / transcript',type:'textarea'},{key:'src',label:'Video URL',type:'text'},{key:'alt',label:'Video description',type:'text'}],
 'kiss-gift':[{key:'title',label:'Gift name',type:'text'},{key:'body',label:'Description',type:'textarea'},{key:'price',label:'Playful kiss price',type:'text'},{key:'src',label:'Gift photo URL',type:'text'},{key:'alt',label:'Photo description',type:'text'}],
 'radio-track':[{key:'title',label:'Track title',type:'text'},{key:'body',label:'Dedication / transcript',type:'textarea'},{key:'src',label:'Audio URL',type:'text'}],
 heading:[{key:'text',label:'Heading',type:'textarea'},{key:'size',label:'Text size',type:'number',min:10,max:72},{key:'weight',label:'Font weight',type:'number',min:100,max:900,step:100},{key:'align',label:'Alignment',type:'select',options:['left','center','right']}],
 text:[{key:'text',label:'Paragraph',type:'textarea'},{key:'size',label:'Text size',type:'number',min:10,max:72},{key:'align',label:'Alignment',type:'select',options:['left','center','right']}],
 image:[{key:'objectFit',label:'Image fit',type:'select',options:['cover','contain']},{key:'focalX',label:'Focal point horizontal (%)',type:'number',min:0,max:100},{key:'focalY',label:'Focal point vertical (%)',type:'number',min:0,max:100},{key:'displayHeight',label:'Display height (px; 0 = natural)',type:'number',min:0,max:1200},{key:'src',label:'Image URL (HTTPS or site path)',type:'text'},{key:'alt',label:'Image description',type:'text'}],
 video:[{key:'src',label:'Video URL',type:'text'},{key:'alt',label:'Video description',type:'text'}],
 audio:[{key:'src',label:'Audio URL',type:'text'},{key:'alt',label:'Audio description',type:'text'}],
 'app-grid':[{key:'columns',label:'Columns',type:'number',min:1,max:4,step:1},{key:'gap',label:'Gap',type:'number',min:0,max:96}],
};

const captionField:InspectorField={key:'captions',label:'Timed captions (start seconds | end seconds | text; one cue per line)',type:'textarea'};
for(const kind of ['audio','video','hotline-message','movie-scene','radio-track']) componentFields[kind].push(captionField);

componentFields.action=[{key:'title',label:'Button label',type:'text'}];
componentFields.invitation=['title','body','date','time','place'].map(key=>({key,label:key,type:key==='body'?'textarea':'text'}));
componentFields.chapter=[{key:'title',label:'Chapter title',type:'text'},{key:'sceneId',label:'Scene ID',type:'text'}];
componentFields.station=[{key:'title',label:'Station name',type:'text'},{key:'body',label:'Station description',type:'textarea'},{key:'src',label:'Artwork URL',type:'text'},{key:'alt',label:'Artwork description',type:'text'}];
componentFields['hotline-message'].push({key:'digit',label:'Keypad digit (keypad messages only)',type:'text'});
componentFields['radio-track'].push({key:'stationId',label:'Station ID',type:'text'},{key:'introSrc',label:'Recorded introduction URL',type:'text'});
componentFields['movie-scene'].push({key:'mediaKind',label:'Scene media type',type:'select',options:['video','image']});
componentFields['kiss-gift'].push({key:'available',label:'Available',type:'select',options:['true','false']});
export const sectionContentFields:Record<string,InspectorField[]>={};
for(const [kind,keys] of Object.entries({
 'incoming-call':['callerName','callerPhoto','incomingTitle','answerLabel','endLabel'],
 'reason-deck':['previousLabel','nextLabel','favoriteLabel'],
 'invitation-reveal':['directLabel','backLabel'],
 'product-collection':['addLabel','detailsLabel'],
 'gift-bag':['title','emptyMessage','removeLabel'],
 'gift-checkout':['title','checkoutLabel'],
 'gift-receipt':['title','note','downloadLabel'],
 'radio-player':['title','previousLabel','nextLabel']
}))sectionContentFields[kind]=keys.map(key=>({key,label:key.replace(/([A-Z])/g,' $1'),type:'text'}));
sectionContentFields['date-widget']=[{key:'dateMode',label:'Date display',type:'select',options:['current','birthday']}];
