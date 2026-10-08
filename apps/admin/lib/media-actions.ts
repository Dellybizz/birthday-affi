'use server';
import { adminDb } from './supabase';
import { requireAdmin } from './auth';
import { validateMedia, matchesSignature, mediaBucket, type MediaKind, type MediaAsset } from './media-policy';
import {normalizeMediaTags,validateOrganizationFilters,collectionName,type MediaListOptions,type MediaOrganizationFilters,type MediaCollection} from './media-organization';
import {fingerprintMediaObject} from './media-fingerprint';
import {verifyMediaObject} from './media-verification';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
async function siteDb(siteId:string){if(!uuid.test(siteId))throw new Error('Invalid site');const db=await adminDb();const {data,error}=await db.from('sites').select('id').eq('id',siteId).eq('slug',process.env.NEXT_PUBLIC_SITE_SLUG??'wiffeyyyy-os').single();if(error||!data)throw new Error('Site not found');return db}
export async function listMediaAssets(siteId:string,archived=false,readyOnly=false,options:MediaListOptions={}):Promise<MediaAsset[]>{
 await requireAdmin();const search=options.search?.trim()??'',offset=options.offset??0;if(search.length>200||!Number.isSafeInteger(offset)||offset<0||offset>100000||options.kind&&!['image','video','audio'].includes(options.kind))throw new Error('Invalid media filter');
 const sort=options.sort??'newest';if(!['newest','oldest','name','largest','smallest'].includes(sort))throw new Error('Invalid media sort');
 const db=await siteDb(siteId);let query=db.from('media_library_assets').select('id,site_id,kind,filename,mime_type,byte_size,width,height,duration_ms,alt_text,caption,transcript,captions,metadata,status,poster_ready,created_at,tags,favourite,collection_ids,is_unused,content_sha256,duplicate_count').eq('site_id',siteId).order(sort==='name'?'filename':['largest','smallest'].includes(sort)?'byte_size':'created_at',{ascending:['oldest','name','smallest'].includes(sort)}).order('id',{ascending:false}).range(offset,offset+49);
 query=filterMediaQuery(query,archived,readyOnly,options);const {data,error}=await query;if(error)throw new Error('Unable to load media');return(data??[]).map(m=>({...m,previewUrl:'/media/'+m.id}));
}

function filterMediaQuery(query:any,archived:boolean,readyOnly:boolean,options:MediaOrganizationFilters&{search?:string;kind?:MediaKind|''}){
 validateOrganizationFilters(options);const search=options.search?.trim()??'';if(search.length>200||options.kind&&!['image','video','audio'].includes(options.kind))throw new Error('Invalid media filter');
 if(options.state&&options.state!=='all')query=query.eq('status',options.state);if(options.favourites)query=query.eq('favourite',true);if(options.unused)query=query.eq('is_unused',true);if(options.duplicates)query=query.gt('duplicate_count',1);if(options.tag)query=query.contains('tags',[options.tag]);if(options.collection)query=options.collection==='unfiled'?query.eq('collection_ids','{}'):query.contains('collection_ids',[options.collection]);
 if(readyOnly)query=query.eq('status','ready');if(options.kind)query=query.eq('kind',options.kind);
 if(search){const pattern='%'+search.replace(/[\\%_]/g,char=>'\\'+char)+'%';query=query.or(['filename','alt_text','caption','transcript'].map(field=>field+'.ilike.'+JSON.stringify(pattern)).join(','))}
 return archived?query.not('archived_at','is',null):query.is('archived_at',null);
}
export async function countMediaAssets(siteId:string,archived=false,readyOnly=false,options:MediaOrganizationFilters&{search?:string;kind?:MediaKind|''}={}){
 await requireAdmin();const db=await siteDb(siteId);const {count,error}=await filterMediaQuery(db.from('media_library_assets').select('id',{count:'exact',head:true}).eq('site_id',siteId),archived,readyOnly,options);if(error||typeof count!=='number')throw new Error('Unable to count media');return count as number;
}
export async function renameMedia(id:string,filename:string){
 await requireAdmin('media:write');if(!uuid.test(id)||typeof filename!=='string'||!filename.trim()||filename.trim().length>255||/[\\/\x00-\x1f\x7f]/.test(filename))throw new Error('Invalid filename');
 const db=await adminDb();const {data:m,error:lookupError}=await db.from('media_assets').select('site_id').eq('id',id).single();if(lookupError||!m)throw new Error('Media not found');await siteDb(m.site_id);
 const {error}=await db.from('media_assets').update({filename:filename.trim()}).eq('id',id).eq('site_id',m.site_id);if(error)throw new Error('Unable to rename media');return{ok:true};
}
export async function bulkArchiveMedia(siteId:string,ids:string[],archive:boolean){
 await requireAdmin('media:write');if(!Array.isArray(ids)||!ids.length||ids.length>100||ids.some(id=>typeof id!=='string'||!uuid.test(id))||typeof archive!=='boolean')throw new Error('Select between 1 and 100 files');
 const unique=[...new Set(ids)],db=await siteDb(siteId);const {data,error}=await db.from('media_assets').select('id').eq('site_id',siteId).in('id',unique);if(error||data?.length!==unique.length)throw new Error('Some files are unavailable in this site');
 const succeeded:string[]=[],failed:string[]=[];for(const id of unique){try{const {error}=await db.rpc('archive_media',{asset_id:id,archive});(error?failed:succeeded).push(id)}catch{failed.push(id)}}return{succeeded,failed};
}

export async function reserveMedia(input:{siteId:string;kind:MediaKind;filename:string;mimeType:string;size:number}):Promise<{ok:true;id:string;path:string;bucket:string}|{ok:false;error:string}>{
 await requireAdmin('media:write');const check=validateMedia(input.kind,input.size,input.mimeType);if(!check.ok)return{ok:false,error:check.error??'Invalid file'};if(typeof input.filename!=='string'||input.filename.length<1||input.filename.length>255)return{ok:false,error:'Invalid filename'};const db=await siteDb(input.siteId);
 // Fail before reserving metadata if the provider has not provisioned Storage.
 const {error:storageError}=await db.storage.from(mediaBucket(input.kind)).list('',{limit:1});if(storageError)return{ok:false,error:'Uploads are unavailable. Supabase Storage must be activated for this site before files can be uploaded.'};
 const id=crypto.randomUUID(),path=input.siteId+'/'+id+'/original';const {error}=await db.from('media_assets').insert({id,site_id:input.siteId,kind:input.kind,filename:input.filename,mime_type:input.mimeType,byte_size:input.size,storage_path:path});if(error)return{ok:false,error:'Unable to start the upload. Refresh this page and retry.'};return{ok:true,id,path,bucket:mediaBucket(input.kind)};
}
export async function finalizeMedia(id:string,input:{width?:number;height?:number;durationMs?:number;variants?:number[]}):Promise<{ok:true}|{ok:false;error:string}>{
 await requireAdmin('media:write');if(!uuid.test(id))return{ok:false,error:'Invalid media'};const db=await adminDb();const {data:m,error}=await db.from('media_assets').select('*').eq('id',id).single();if(error||!m)return{ok:false,error:'Upload not found'};await siteDb(m.site_id);
 if(m.status==='ready')return{ok:true};
 const variants=input.variants??[];if(!Array.isArray(variants)||variants.some(v=>![480,960,1600].includes(v))||new Set(variants).size!==variants.length||variants.length>3||(m.kind!=='image'&&variants.length))return{ok:false,error:'Invalid variants'};
 for(const [k,v] of Object.entries(input)){if(k==='variants')continue;if(['width','height','durationMs'].includes(k)&&v===undefined)continue;if(!['width','height','durationMs'].includes(k)||typeof v!=='number'||!Number.isInteger(v)||v<1||v>(k==='durationMs'?86400000:20000))return{ok:false,error:'Invalid dimensions or duration'}}
 const {data:{session}}=await db.auth.getSession();if(!session)return{ok:false,error:'Session expired'};
 const paths=[{path:m.storage_path,mime:m.mime_type,size:m.byte_size},...variants.map(v=>({path:m.site_id+'/'+m.id+'/'+v+'.webp',mime:'image/webp',size:0}))];
 try{await Promise.all(paths.map(object=>verifyMediaObject(process.env.NEXT_PUBLIC_SUPABASE_URL+'/storage/v1/object/authenticated/'+mediaBucket(m.kind)+'/'+object.path,{Authorization:'Bearer '+session.access_token,apikey:process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY??process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY??''},object)))}catch(e){return{ok:false,error:e instanceof Error?e.message:'Unable to verify upload. Retry verification.'}};
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
 await requireAdmin();const db=await siteDb(siteId);const checks=await Promise.all((['image','video','audio'] as const).map(async kind=>{try{const {error}=await db.storage.from(mediaBucket(kind)).list('',{limit:1});return error?kind:null}catch{return kind}}));const unavailable=checks.filter(Boolean);return unavailable.length?{available:false,message:'Uploads unavailable for '+unavailable.join(', ')+'. Check media Storage and retry.'}:{available:true,message:''};
}

export async function prepareMediaRecovery(id:string){
 await requireAdmin('media:write');if(!uuid.test(id))throw new Error('Invalid media');const db=await adminDb();const {data:m,error}=await db.from('media_assets').select('site_id,storage_path,kind,mime_type,filename,status').eq('id',id).single();if(error||!m)throw new Error('Upload not found');await siteDb(m.site_id);
 const bucket=db.storage.from(mediaBucket(m.kind));const [signed,listing]=await Promise.all([bucket.createSignedUrl(m.storage_path,120),bucket.list(m.site_id+'/'+id,{limit:10})]);if(signed.error||!signed.data||listing.error)throw new Error('Unable to read the saved upload. Refresh and retry.');
 return{url:signed.data.signedUrl,filename:m.filename,mimeType:m.mime_type,variants:(listing.data??[]).map(o=>Number(o.name.replace('.webp',''))).filter(v=>[480,960,1600].includes(v))};
}

/** A poster is an immutable sidecar; it cannot repoint an original or its variants. */
export async function saveMediaPoster(id:string,input:FormData){
 await requireAdmin('media:write');if(!uuid.test(id))throw new Error('Invalid media');
 const file=input.get('poster');if(!(file instanceof Blob)||file.type!=='image/webp'||file.size<12||file.size>524288||!matchesSignature('image/webp',new Uint8Array(await file.slice(0,64).arrayBuffer())))throw new Error('Choose a WebP thumbnail up to 512 KB');
 const db=await adminDb();const {data:m,error}=await db.from('media_assets').select('site_id,kind,status,storage_path,poster_ready').eq('id',id).single();if(error||!m||m.kind!=='video'||m.status!=='ready')throw new Error('A verified video is required');await siteDb(m.site_id);if(m.poster_ready)return{ok:true};
 const path=m.storage_path.replace(/original$/,'poster.webp');const {error:uploadError}=await db.storage.from(mediaBucket('video')).upload(path,file,{contentType:'image/webp',upsert:false});
 if(uploadError&&!['409','400'].includes(String(uploadError.statusCode)))throw new Error('Unable to save thumbnail. Retry.');
 const {data:{session}}=await db.auth.getSession();if(!session)throw new Error('Session expired');
 await verifyMediaObject(process.env.NEXT_PUBLIC_SUPABASE_URL+'/storage/v1/object/authenticated/'+mediaBucket('video')+'/'+path,{Authorization:'Bearer '+session.access_token,apikey:process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY??''},{mime:'image/webp',size:0,maxSize:524288});
 const {error:saveError}=await db.from('media_assets').update({poster_ready:true}).eq('id',id).eq('site_id',m.site_id);if(saveError)throw new Error('Thumbnail is saved; retry to finish verification');return{ok:true};
}

export async function getMediaOrganization(siteId:string){
 await requireAdmin();const db=await siteDb(siteId);const {data,error}=await db.rpc('get_media_organization',{p_site:siteId});if(error)throw new Error('Unable to load collections and tags');return data as {collections:MediaCollection[];tags:string[]};
}
export async function createMediaCollection(siteId:string,name:string){
 await requireAdmin('media:write');name=collectionName(name);const db=await siteDb(siteId);const {data,error}=await db.from('media_collections').insert({site_id:siteId,name}).select('id,name').single();if(error||!data)throw new Error(error?.code==='23505'?'A collection with this name already exists':'Unable to create collection');return data as MediaCollection;
}
export async function changeMediaCollection(siteId:string,id:string,name:string|null){
 await requireAdmin('media:write');if(!uuid.test(id))throw new Error('Invalid collection');if(name!==null)name=collectionName(name);const db=await siteDb(siteId);const query=name===null?db.from('media_collections').delete():db.from('media_collections').update({name});const {data,error}=await query.eq('site_id',siteId).eq('id',id).select('id');if(error||!data?.length)throw new Error(error?.code==='23505'?'A collection with this name already exists':'Unable to change collection');return{ok:true};
}
export async function saveMediaOrganization(id:string,input:{tags:string[];favourite:boolean;collections:string[]}){
 await requireAdmin('media:write');if(!uuid.test(id)||typeof input?.favourite!=='boolean'||!Array.isArray(input.collections)||input.collections.length>100||input.collections.some(value=>typeof value!=='string'||!uuid.test(value)))throw new Error('Invalid organization');const tags=normalizeMediaTags(input.tags),collections=[...new Set(input.collections)];
 const db=await adminDb();const {data:m,error}=await db.from('media_assets').select('site_id').eq('id',id).single();if(error||!m)throw new Error('Media not found');await siteDb(m.site_id);
 const {error:saveError}=await db.rpc('save_media_organization',{p_asset:id,p_tags:tags,p_favourite:input.favourite,p_collections:collections});if(saveError)throw new Error('Unable to save organization. Refresh collections and retry.');return{ok:true};
}
export async function setMediaFavourite(id:string,favourite:boolean){
 await requireAdmin('media:write');if(!uuid.test(id)||typeof favourite!=='boolean')throw new Error('Invalid favourite');const db=await adminDb();const {data:m,error}=await db.from('media_assets').select('site_id').eq('id',id).single();if(error||!m)throw new Error('Media not found');await siteDb(m.site_id);const {error:saveError}=await db.from('media_assets').update({favourite}).eq('id',id).eq('site_id',m.site_id);if(saveError)throw new Error('Unable to save favourite');return{ok:true};
}
export async function addMediaToCollection(siteId:string,collection:string,ids:string[]){
 await requireAdmin('media:write');if(!uuid.test(collection)||!Array.isArray(ids)||!ids.length||ids.length>100||ids.some(id=>typeof id!=='string'||!uuid.test(id)))throw new Error('Select a collection and up to 100 files');const db=await siteDb(siteId);const {error}=await db.rpc('add_media_to_collection',{p_site:siteId,p_collection:collection,p_assets:[...new Set(ids)]});if(error)throw new Error('Unable to add files. Check that the collection and files belong to this site.');return{ok:true};
}
export async function fingerprintMedia(id:string){
 await requireAdmin('media:write');if(!uuid.test(id))throw new Error('Invalid media');const db=await adminDb();const {data:m,error}=await db.from('media_assets').select('site_id,status,storage_path,kind,mime_type,byte_size,content_sha256').eq('id',id).single();if(error||!m||m.status!=='ready')throw new Error('A verified file is required');await siteDb(m.site_id);if(m.content_sha256)return{ok:true};
 const {data:{session}}=await db.auth.getSession();if(!session)throw new Error('Session expired');
 const hash=await fingerprintMediaObject(process.env.NEXT_PUBLIC_SUPABASE_URL+'/storage/v1/object/authenticated/'+mediaBucket(m.kind)+'/'+m.storage_path,{Authorization:'Bearer '+session.access_token,apikey:process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY??''},{mime:m.mime_type,size:m.byte_size});
 const {error:saveError}=await db.from('media_assets').update({content_sha256:hash}).eq('id',id).eq('site_id',m.site_id).is('content_sha256',null);if(saveError)throw new Error('Unable to save the duplicate scan result');return{ok:true};
}
