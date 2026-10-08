export type Device='mobile'|'tablet'|'desktop';
export type PreviewMode=Device|'large-phone'|'responsive';
export type Viewport={width:number;height:number};
export const VIEWPORTS:Record<Exclude<PreviewMode,'responsive'>,Viewport>={mobile:{width:390,height:830},'large-phone':{width:430,height:932},tablet:{width:768,height:1024},desktop:{width:1440,height:900}};
export const MODES:Array<{id:PreviewMode;label:string;short:string}>=[{id:'mobile',label:'Mobile · 390 × 830',short:'Mobile'},{id:'large-phone',label:'Large phone · 430 × 932',short:'Large phone'},{id:'tablet',label:'Tablet · 768 × 1024',short:'Tablet'},{id:'desktop',label:'Desktop · 1440 × 900',short:'Desktop'},{id:'responsive',label:'Responsive · custom viewport',short:'Responsive'}];
export const clampViewport=(value:number,min:number,max:number)=>Number.isFinite(value)?Math.min(max,Math.max(min,Math.round(value))):min;
export const deviceForWidth=(width:number):Device=>width<600?'mobile':width<960?'tablet':'desktop';
export type PreviewZoom='fit'|'width'|number;
export function defaultPreviewMode(page:string):PreviewMode{return ['home','movie','adventure','camera','reasons','hotline','vault','kiss-shop','pieces','radio'].includes(page)?'mobile':'desktop'}
export function previewScale(viewport:Viewport,area:Viewport,zoom:PreviewZoom):number{
 if(typeof zoom==='number')return Math.min(2,Math.max(.25,zoom));
 const width=Math.max(1,area.width-24)/viewport.width,height=Math.max(1,area.height-24)/viewport.height;
 return Math.max(.01,Math.min(2,zoom==='width'?width:Math.min(width,height)));
}
