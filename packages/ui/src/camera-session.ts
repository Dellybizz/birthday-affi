// Keep the previous feed alive where the browser supports opening a second camera.
// Mobile browsers that lock the sensor release it only when the first attempt fails.
export async function acquireCamera(devices:Pick<MediaDevices,'getUserMedia'>,previous:MediaStream|null,front:boolean,switching=false):Promise<MediaStream>{
 const constraints:MediaStreamConstraints={audio:false,video:{facingMode:switching?{exact:front?'user':'environment'}:{ideal:front?'user':'environment'},width:{ideal:1920},height:{ideal:1440}}};
 try{return await devices.getUserMedia(constraints)}catch(error){
  if(!previous||!(error instanceof DOMException)||!['NotReadableError','AbortError'].includes(error.name))throw error;
  previous.getTracks().forEach(track=>track.stop());
  return devices.getUserMedia(constraints);
 }
}
export function waitForCameraFrame(video:HTMLVideoElement,next:MediaStream):Promise<void>{
 return new Promise((resolve,reject)=>{
  const finish=(error?:unknown)=>{clearTimeout(timeout);video.removeEventListener('loadeddata',loaded);error?reject(error):resolve()};
  const loaded=()=>finish(),timeout=setTimeout(()=>finish(new Error('The camera did not start. Please try again.')),10000);
  video.addEventListener('loadeddata',loaded,{once:true});video.srcObject=next;
  video.play().then(()=>{if(video.readyState>=2&&video.videoWidth)finish()}).catch(finish);
 });
}
