'use server';
import { adminDb } from './supabase';
import { requireAdmin } from './auth';
import { validateMedia, matchesSignature, mediaBucket, type MediaKind, type MediaAsset } from './media-policy';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
async function siteDb(siteId:string){if(!uuid.test(siteId))throw new Error('Invalid site');const db=await adminDb();const {data,error}=await db.from('sites').select('id').eq('id',siteId).eq('slug',process.env.NEXT_PUBLIC_SITE_SLUG??'wiffeyyyy-os').single();if(error||!data)throw new Error('Site not found');return db}
export async function listMediaAssets(siteId:string,archived=false,readyOnly=false,options:{search?:string;kind?:MediaKind|'';offset?:number}={}):Promise<MediaAsset[]>{
 await requireAdmin();const search=options.search?.trim()??'',offset=options.offset??0;if(search.length>200||!Number.isSafeInteger(offset)||offset<0||offset>100000||options.kind&&!['image','video','audio'].includes(options.kind))throw new Error('Invalid media filter');
 const db=await siteDb(siteId);let query=db.from('media_assets').select('id,site_id,kind,filename,mime_type,byte_size,width,height,duration_ms,alt_text,caption,transcript,captions,metadata,status').eq('site_id',siteId).order('created_at',{ascending:false}).order('id',{ascending:false}).range(offset,offset+49);
 if(readyOnly)query=query.eq('status','ready');if(options.kind)query=query.eq('kind',options.kind);
 if(search){const pattern='%'+search.replace(/[\\%_]/g,char=>'\\'+char)+'%';query=query.or(['filename','alt_text','caption','transcript'].map(field=>field+'.ilike.'+JSON.stringify(pattern)).join(','))}
 query=archived?query.not('archived_at','is',null):query.is('archived_at',null);const {data,error}=await query;if(error)throw new Error('Unable to load media');return(data??[]).map(m=>({...m,previewUrl:'/media/'+m.id}));
}

export async function reserveMedia(input:{siteId:string;kind:MediaKind;filename:string;mimeType:string;size:number}):Promise<{ok:true;id:string;path:string;bucket:string}|{ok:false;error:string}>{
 await requireAdmin('media:write');const check=validateMedia(input.kind,input.size,input.mimeType);if(!check.ok)return{ok:false,error:check.error??'Invalid file'};if(typeof input.filename!=='string'||input.filename.length<1||input.filename.length>255)return{ok:false,error:'Invalid filename'};const db=await siteDb(input.siteId);
 // Fail before reserving metadata if the provider has not provisioned Storage.
 const {error:storageError}=await db.storage.from(mediaBucket(input.kind)).list('',{limit:1});if(storageError)return{ok:false,error:'Uploads are unavailable. Supabase Storage must be activated for this site before files can be uploaded.'};
 const id=crypto.randomUUID(),path=input.siteId+'/'+id+'/original';const {error}=await db.from('media_assets').insert({id,site_id:input.siteId,kind:input.kind,filename:input.filename,mime_type:input.mimeType,byte_size:input.size,storage_path:path});if(error)return{ok:false,error:'Unable to start the upload. Refresh this page and retry.'};return{ok:true,id,path,bucket:mediaBucket(input.kind)};
}
export async function finalizeMedia(id:string,input:{width?:number;height?:number;durationMs?:number;variants?:number[]}):Promise<{ok:true}|{ok:false;error:string}>{
 await requireAdmin('media:write');if(!uuid.test(id))return{ok:false,error:'Invalid media'};const db=await adminDb();const {data:m,error}=await db.from('media_assets').select('*').eq('id',id).single();if(error||!m)return{ok:false,error:'Upload not found'};await siteDb(m.site_id);
 const variants=input.variants??[];if(!Array.isArray(variants)||variants.some(v=>![480,960,1600].includes(v))||new Set(variants).size!==variants.length||variants.length>3||(m.kind!=='image'&&variants.length))return{ok:false,error:'Invalid variants'};
 for(const [k,v] of Object.entries(input)){if(k==='variants')continue;if(!['width','height','durationMs'].includes(k)||typeof v!=='number'||!Number.isInteger(v)||v<1||v>(k==='durationMs'?86400000:20000))return{ok:false,error:'Invalid dimensions or duration'}}
 const {data:{session}}=await db.auth.getSession();if(!session)return{ok:false,error:'Session expired'};
 const paths=[{path:m.storage_path,mime:m.mime_type,size:m.byte_size},...variants.map(v=>({path:m.site_id+'/'+m.id+'/'+v+'.webp',mime:'image/webp',size:0}))];
 for(const object of paths){
  const response=await fetch(process.env.NEXT_PUBLIC_SUPABASE_URL+'/storage/v1/object/authenticated/'+mediaBucket(m.kind)+'/'+object.path,{headers:{Authorization:'Bearer '+session.access_token,apikey:process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY??'',Range:'bytes=0-63'},cache:'no-store'});
  if(!response.ok)return{ok:false,error:'Uploaded file could not be verified'};
  const length=Number(response.headers.get('content-range')?.split('/')[1]??response.headers.get('content-length'));
  const reader=response.body?.getReader();if(!reader)return{ok:false,error:'Missing upload body'};let header=new Uint8Array(0);try{while(header.length<64){const {value,done}=await reader.read();if(done)break;const next=new Uint8Array(header.length+value.length);next.set(header);next.set(value,header.length);header=next.slice(0,64)}}finally{await reader.cancel()}
  if((object.size&&length!==object.size)||!matchesSignature(object.mime,header))return{ok:false,error:'File content or size does not match its declared type'};
 }
 const {error:finishError}=await db.from('media_assets').update({status:'ready',width:input.width??null,height:input.height??null,duration_ms:input.durationMs??null,metadata:{variants}}).eq('id',id);if(finishError)return{ok:false,error:'Unable to finish upload'};return{ok:true};
}
export async function updateMediaMetadata(id:string,altText:string){await requireAdmin('media:write');if(!uuid.test(id)||typeof altText!=='string'||altText.length>2000)throw new Error('Invalid alt text');const db=await adminDb();const {data:m}=await db.from('media_assets').select('site_id').eq('id',id).single();if(!m)throw new Error('Media not found');await siteDb(m.site_id);const {error}=await db.from('media_assets').update({alt_text:altText}).eq('id',id);if(error)throw new Error('Unable to save alt text');return{ok:true}}
export async function archiveMedia(id:string,archive=true){await requireAdmin('media:write');if(!uuid.test(id))throw new Error('Invalid media');const db=await adminDb();const {data:m}=await db.from('media_assets').select('site_id').eq('id',id).single();if(!m)throw new Error('Media not found');await siteDb(m.site_id);const {error}=await db.rpc('archive_media',{asset_id:id,archive});if(error)throw new Error('Unable to archive media');return{ok:true}}

export async function saveMediaEditorial(id:string,input:{caption:string;transcript:string;captions:string}){
 await requireAdmin('media:write');if(!uuid.test(id)||!input||Object.keys(input).sort().join(',')!=='caption,captions,transcript'||Object.entries(input).some(([key,value])=>typeof value!=='string'||value.length>(key==='caption'?500:20000)))throw new Error('Invalid media metadata');
 const {parseCaptions}=await import('../../../packages/audio/src/controller');parseCaptions(input.captions);
 const db=await adminDb();const {data:m}=await db.from('media_assets').select('site_id').eq('id',id).single();if(!m)throw new Error('Media not found');await siteDb(m.site_id);
 const {error}=await db.from('media_assets').update(input).eq('id',id);if(error)throw new Error('Unable to save media metadata');return{ok:true};
}
export async function mediaUsage(id:string){
 await requireAdmin();if(!uuid.test(id))throw new Error('Invalid media');const db=await adminDb();const {data:m}=await db.from('media_assets').select('site_id').eq('id',id).single();if(!m)throw new Error('Media not found');await siteDb(m.site_id);
 const {data,error}=await db.rpc('get_media_usage',{asset_id:id});if(error)throw new Error('Unable to load usage');return data as {drafts:number;versions:number;releases:number;audioDraft:boolean;audioPublished:boolean};
}

export async function checkMediaStorage(siteId:string):Promise<{available:boolean;message:string}>{
 await requireAdmin();const db=await siteDb(siteId);const {error}=await db.storage.from(mediaBucket('image')).list('',{limit:1});return error?{available:false,message:'Uploads are unavailable. Supabase Storage must be activated for this site before files can be uploaded.'}:{available:true,message:''};
}
