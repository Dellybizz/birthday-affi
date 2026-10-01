export type MediaKind='image'|'video'|'audio';
export const mediaPolicy={
 image:{maxBytes:8*1024*1024,types:['image/jpeg','image/png','image/webp','image/gif']},
 video:{maxBytes:50*1024*1024,types:['video/mp4','video/webm']},
 audio:{maxBytes:25*1024*1024,types:['audio/mpeg','audio/mp4','audio/wav','audio/ogg']}
} as const;
export function mediaKind(mime:string):MediaKind|null{return mime.startsWith('image/')?'image':mime.startsWith('video/')?'video':mime.startsWith('audio/')?'audio':null}
export function validateMedia(kind:MediaKind,size:number,mime:string){const p=mediaPolicy[kind];if(!p||!p.types.includes(mime as never))return{ok:false,error:'Unsupported media type'};if(!Number.isSafeInteger(size)||size<=0)return{ok:false,error:'Choose a non-empty file'};if(size>p.maxBytes)return{ok:false,error:'File exceeds the configured size limit'};return{ok:true}}
// Content sniffing prevents an HTML/SVG payload from being registered as a raster image.
export function matchesSignature(mime:string,b:Uint8Array){
 const s=(start:number,end:number)=>String.fromCharCode(...b.slice(start,end));
 switch(mime){
 case 'image/jpeg':return b[0]===255&&b[1]===216&&b[2]===255;
 case 'image/png':return b.length>=8&&[137,80,78,71,13,10,26,10].every((v,i)=>b[i]===v);
 case 'image/gif':return ['GIF87a','GIF89a'].includes(s(0,6));
 case 'image/webp':return s(0,4)==='RIFF'&&s(8,12)==='WEBP';
 case 'audio/wav':return s(0,4)==='RIFF'&&s(8,12)==='WAVE';
 case 'audio/ogg':return s(0,4)==='OggS';
 case 'audio/mpeg':return s(0,3)==='ID3'||(b[0]===255&&(b[1]&224)===224);
 case 'audio/mp4':case 'video/mp4':return s(4,8)==='ftyp';
 case 'video/webm':return [26,69,223,163].every((v,i)=>b[i]===v);
 default:return false;
 }
}
export const mediaBucket=(kind:MediaKind)=>'wiffeyyyy-'+kind;
export type MediaAsset={id:string;site_id:string;kind:MediaKind;filename:string;mime_type:string;byte_size:number;width:number|null;height:number|null;duration_ms:number|null;alt_text:string|null;metadata:{variants?:number[]};status:string;previewUrl:string};
