export type InspectorField = { key:string;label:string;type:'text'|'textarea'|'number'|'select'|'color';min?:number;max?:number;step?:number;options?:string[] };
export const designFields:InspectorField[]=[
 {key:'background',label:'Background',type:'color'}, {key:'color',label:'Text color',type:'color'},
 {key:'padding',label:'Padding',type:'number',min:0,max:96}, {key:'margin',label:'Margin',type:'number',min:0,max:96},
 {key:'radius',label:'Corner radius',type:'number',min:0,max:64}, {key:'opacity',label:'Opacity',type:'number',min:0,max:1,step:0.05},
];
export const componentFields:Record<string,InspectorField[]>={
 section:[],
 heading:[{key:'text',label:'Heading',type:'textarea'},{key:'size',label:'Text size',type:'number',min:10,max:72},{key:'weight',label:'Font weight',type:'number',min:100,max:900,step:100},{key:'align',label:'Alignment',type:'select',options:['left','center','right']}],
 text:[{key:'text',label:'Paragraph',type:'textarea'},{key:'size',label:'Text size',type:'number',min:10,max:72},{key:'align',label:'Alignment',type:'select',options:['left','center','right']}],
 image:[{key:'objectFit',label:'Image fit',type:'select',options:['cover','contain']},{key:'focalX',label:'Focal point horizontal (%)',type:'number',min:0,max:100},{key:'focalY',label:'Focal point vertical (%)',type:'number',min:0,max:100},{key:'displayHeight',label:'Display height (px; 0 = natural)',type:'number',min:0,max:1200},{key:'src',label:'Image URL (HTTPS or site path)',type:'text'},{key:'alt',label:'Image description',type:'text'}],
 video:[{key:'src',label:'Video URL',type:'text'},{key:'alt',label:'Video description',type:'text'}],
 audio:[{key:'src',label:'Audio URL',type:'text'},{key:'alt',label:'Audio description',type:'text'}],
 'app-grid':[{key:'columns',label:'Columns',type:'number',min:1,max:4,step:1},{key:'gap',label:'Gap',type:'number',min:0,max:96}],
};
