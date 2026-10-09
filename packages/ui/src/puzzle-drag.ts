export type PuzzleBounds={left:number;top:number;right:number;bottom:number;width:number;height:number};
export function puzzleDropSlot(x:number,y:number,b:PuzzleBounds,cols:number,rows:number){
 if(b.width<=0||b.height<=0||x<b.left||x>=b.right||y<b.top||y>=b.bottom)return null;
 return Math.floor((y-b.top)/b.height*rows)*cols+Math.floor((x-b.left)/b.width*cols);
}
export function puzzleScrollSpeed(y:number,top:number,bottom:number){
 const edge=Math.min(60,(bottom-top)/4);
 if(y<top+edge)return -Math.min(12,Math.max(0,(top+edge-y)/edge*12));
 if(y>bottom-edge)return Math.min(12,Math.max(0,(y-bottom+edge)/edge*12));
 return 0;
}
