export type Device='mobile'|'tablet'|'desktop';
export type PreviewMode=Device|'large-phone'|'responsive';
export type Viewport={width:number;height:number};
export const VIEWPORTS:Record<Exclude<PreviewMode,'responsive'>,Viewport>={mobile:{width:390,height:830},'large-phone':{width:430,height:932},tablet:{width:768,height:1024},desktop:{width:1440,height:900}};
export const MODES:Array<{id:PreviewMode;label:string;short:string}>=[{id:'mobile',label:'Mobile · 390 × 830',short:'Mobile'},{id:'large-phone',label:'Large phone · 430 × 932',short:'Large phone'},{id:'tablet',label:'Tablet · 768 × 1024',short:'Tablet'},{id:'desktop',label:'Desktop · 1440 × 900',short:'Desktop'},{id:'responsive',label:'Responsive · custom viewport',short:'Responsive'}];
export const clampViewport=(value:number,min:number,max:number)=>Number.isFinite(value)?Math.min(max,Math.max(min,Math.round(value))):min;
export const deviceForWidth=(width:number):Device=>width<600?'mobile':width<960?'tablet':'desktop';
