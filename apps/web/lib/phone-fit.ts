export const PHONE_FRAME_WIDTH=390;
export const PHONE_FRAME_HEIGHT=844;
export const PHONE_SCREEN_WIDTH=376;
export const PHONE_SCREEN_HEIGHT=830;

export function computePhoneFit(width:number,height:number){
 const safeWidth=Math.max(1,width-32),safeHeight=Math.max(1,height-32);
 return Math.min(1,safeWidth/PHONE_FRAME_WIDTH,safeHeight/PHONE_FRAME_HEIGHT);
}
