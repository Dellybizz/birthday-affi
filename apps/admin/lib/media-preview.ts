import type {MediaAsset} from './media-policy';
export function mediaPreviewUrl(asset:MediaAsset,thumbnail=false,retry=0){
 const params=new URLSearchParams();if(thumbnail&&asset.kind==='video'&&asset.poster_ready)params.set('poster','1');else if(thumbnail&&asset.kind==='image'&&asset.metadata.variants?.includes(480))params.set('variant','480');if(retry)params.set('retry',String(retry));return asset.previewUrl+(params.size?'?'+params.toString():'');
}
export function adjacentMediaId(assets:MediaAsset[],id:string,direction:-1|1){const index=assets.findIndex(asset=>asset.id===id);return index<0?null:assets[index+direction]?.id??null}
