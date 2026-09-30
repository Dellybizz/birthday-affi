export const mediaPolicy={
 image:{maxBytes:8*1024*1024,types:["image/jpeg","image/png","image/webp","image/gif"]},
 video:{maxBytes:80*1024*1024,types:["video/mp4","video/webm"]},
 audio:{maxBytes:25*1024*1024,types:["audio/mpeg","audio/mp4","audio/wav","audio/ogg"]}
} as const;
export function validateMedia(kind:keyof typeof mediaPolicy,size:number,mime:string){const p=mediaPolicy[kind];if(!p.types.includes(mime as never))return{ok:false,error:"Unsupported media type"};if(size>p.maxBytes)return{ok:false,error:"File exceeds the configured size limit"};return{ok:true}}
