export type CameraCapture = {id:string;blob:Blob;kind:'image'|'video';createdAt:string;mimeType:string};
const DB_NAME='wiffeyyyy-camera-roll-v1',STORE='captures';
export const CAMERA_ROLL_EVENT='wiffeyyyy:camera-roll-changed';
function openDatabase():Promise<IDBDatabase>{
 return new Promise((resolve,reject)=>{
  if(typeof indexedDB==='undefined'){reject(new Error('Photo storage is unavailable in this browser.'));return}
  const request=indexedDB.open(DB_NAME,1);
  request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains(STORE))request.result.createObjectStore(STORE,{keyPath:'id'})};
  request.onsuccess=()=>resolve(request.result);
  request.onerror=()=>reject(request.error??new Error('Could not open the camera roll.'));
  request.onblocked=()=>reject(new Error('Close other app tabs and try again to open the camera roll.'));
 });
}
export async function listCameraCaptures():Promise<CameraCapture[]>{
 const db=await openDatabase();
 return new Promise((resolve,reject)=>{const transaction=db.transaction(STORE,'readonly'),request=transaction.objectStore(STORE).getAll();transaction.oncomplete=()=>{db.close();resolve((request.result as CameraCapture[]).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)||b.id.localeCompare(a.id)))};transaction.onabort=transaction.onerror=()=>{db.close();reject(transaction.error??new Error('Could not read the camera roll.'))}});
}
export async function saveCameraCapture(blob:Blob,kind:CameraCapture['kind'],identity?:{id:string;createdAt:string}):Promise<CameraCapture>{
 if(!blob.size)throw new Error('The capture was empty. Please try again.');
 const record:CameraCapture={id:identity?.id??'camera-'+crypto.randomUUID(),blob,kind,createdAt:identity?.createdAt??new Date().toISOString(),mimeType:blob.type|| (kind==='image'?'image/jpeg':'video/webm')};
 const db=await openDatabase();
 await new Promise<void>((resolve,reject)=>{const transaction=db.transaction(STORE,'readwrite');transaction.objectStore(STORE).add(record);transaction.oncomplete=()=>{db.close();resolve()};transaction.onabort=transaction.onerror=()=>{db.close();reject(transaction.error??new Error('Could not save this capture. Check available device storage.'))}});
 notifyCameraRollChange();
 return record;
}
export const captureFilename=(capture:Pick<CameraCapture,'id'|'kind'|'mimeType'>)=>'clicksara-'+capture.id.replace('camera-','')+(capture.kind==='image'?'.jpg':capture.mimeType.includes('mp4')?'.mp4':'.webm');

function notifyCameraRollChange(){
 if(typeof window!=='undefined'){
  window.dispatchEvent(new Event(CAMERA_ROLL_EVENT));
  try{const channel=new BroadcastChannel(CAMERA_ROLL_EVENT);channel.postMessage('changed');channel.close()}catch{}
 }
}
export async function deleteCameraCapture(id:string):Promise<void>{
 const db=await openDatabase();
 await new Promise<void>((resolve,reject)=>{const transaction=db.transaction(STORE,'readwrite');transaction.objectStore(STORE).delete(id);transaction.oncomplete=()=>{db.close();resolve()};transaction.onabort=transaction.onerror=()=>{db.close();reject(transaction.error??new Error('Could not delete this capture. Please try again.'))}});
 notifyCameraRollChange();
}
