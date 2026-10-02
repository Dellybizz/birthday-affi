'use client';
import {useEffect,useRef,useState} from 'react';
import {useCameraRoll,type CameraRollItem} from './use-camera-roll';
import {saveCameraCapture,captureFilename} from './camera-roll-store';
import {acquireCamera,waitForCameraFrame} from './camera-session';
export function PhoneAppIcon(){return <svg viewBox="0 0 60 60" width="60" height="60" aria-hidden="true"><rect width="60" height="60" rx="14" fill="#34c759"/><path d="M18 12c-3 0-7 5-6 10 3 13 13 23 26 26 5 1 10-3 10-6l-1-5-10-5-5 5c-6-3-10-7-13-13l5-5-5-7z" fill="white"/></svg>}
export function CameraAppIcon(){return <svg viewBox="0 0 60 60" width="60" height="60" aria-hidden="true"><defs><linearGradient id="camera-gray" x2="0" y2="1"><stop stopColor="#f2f2f2"/><stop offset="1" stopColor="#b7b7bc"/></linearGradient></defs><rect width="60" height="60" rx="14" fill="url(#camera-gray)"/><path d="M10 22h10l4-6h12l4 6h10v26H10z" fill="#29292b"/><circle cx="30" cy="34" r="10" fill="#b7b7bc"/><circle cx="30" cy="34" r="7" fill="#29292b"/><circle cx="44" cy="27" r="2" fill="#f5f5f5"/></svg>}
export function CameraApp(){
 const video=useRef<HTMLVideoElement>(null),freeze=useRef<HTMLCanvasElement>(null),dialog=useRef<HTMLDialogElement>(null);
 const stream=useRef<MediaStream|null>(null),recorder=useRef<MediaRecorder|null>(null),session=useRef(0),alive=useRef(true),busyRef=useRef(false),encoding=useRef(false);
 const transientUrls=useRef(new Map<string,string>());
 const roll=useCameraRoll();
 const [ready,setReady]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[front,setFront]=useState(false),[mode,setMode]=useState<'PHOTO'|'VIDEO'>('PHOTO');
 const [recording,setRecording]=useState(false),[seconds,setSeconds]=useState(0),[flash,setFlash]=useState(false),[grid,setGrid]=useState(true),[preview,setPreview]=useState(false),[opened,setOpened]=useState<string|null>(null);
 const [pending,setPending]=useState<(CameraRollItem&{status:'saving'|'saved'|'failed'})[]>([]);
 const captures=[...roll.items,...pending.filter(c=>!roll.items.some(saved=>saved.id===c.id))].sort((a,b)=>b.createdAt.localeCompare(a.createdAt)||b.id.localeCompare(a.id));
 const latest=captures[0],current=captures.find(c=>c.id===opened),index=captures.findIndex(c=>c.id===opened),saving=pending.filter(c=>c.status==='saving').length;
 const stop=()=>{stream.current?.getTracks().forEach(t=>t.stop());stream.current=null;};
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;session.current++;if(recorder.current?.state==='recording')recorder.current.stop();stop();for(const url of transientUrls.current.values())URL.revokeObjectURL(url);transientUrls.current.clear()}},[]);
 useEffect(()=>{const ids=new Set(roll.items.map(c=>c.id));setPending(old=>old.filter(c=>!ids.has(c.id)));for(const [id,url] of transientUrls.current)if(ids.has(id)){URL.revokeObjectURL(url);transientUrls.current.delete(id)}},[roll.items]);
 useEffect(()=>{if(!recording)return;setSeconds(0);const timer=setInterval(()=>setSeconds(s=>s+1),1000);return()=>clearInterval(timer)},[recording]);
 useEffect(()=>{if(!flash)return;const timer=setTimeout(()=>setFlash(false),140);return()=>clearTimeout(timer)},[flash]);
 useEffect(()=>{if(preview)dialog.current?.showModal();else dialog.current?.close()},[preview]);
 const rememberFrame=()=>{const v=video.current,c=freeze.current;if(!v?.videoWidth||!c)return;c.width=v.videoWidth;c.height=v.videoHeight;c.getContext('2d')?.drawImage(v,0,0)};
 const start=async(facing=front)=>{
  if(busyRef.current||recording)return;busyRef.current=true;const request=++session.current,previous=stream.current,previousFront=front,switching=ready;
  if(switching)rememberFrame();setBusy(true);setError('');let next:MediaStream|null=null;
  try{
   if(!navigator.mediaDevices?.getUserMedia)throw new Error('Camera access requires a supported browser and a secure connection.');
   next=await acquireCamera(navigator.mediaDevices,previous,facing,switching);
   if(!alive.current||request!==session.current){next.getTracks().forEach(t=>t.stop());return}
   const actual=next.getVideoTracks()[0]?.getSettings().facingMode;
   if(switching&&actual&&actual!==(facing?'user':'environment'))throw new Error('The other camera is unavailable on this device.');
   if(video.current)await waitForCameraFrame(video.current,next);
   if(!alive.current||request!==session.current){next.getTracks().forEach(t=>t.stop());return}
   stream.current=next;previous?.getTracks().forEach(t=>t.stop());setReady(true);setFront(actual?actual==='user':facing);
  }catch(e){
   next?.getTracks().forEach(t=>t.stop());
   if(!alive.current||request!==session.current)return;
   let restored=false;
   if(previous){try{
    const restoredStream=previous.getVideoTracks().some(t=>t.readyState==='live')?previous:await acquireCamera(navigator.mediaDevices,null,previousFront);
    if(!alive.current||request!==session.current){restoredStream.getTracks().forEach(t=>t.stop());return}
    if(video.current)await waitForCameraFrame(video.current,restoredStream);if(!alive.current||request!==session.current){restoredStream.getTracks().forEach(t=>t.stop());return}stream.current=restoredStream;restored=true;
   }catch{stop()}}
   setReady(restored);
   setError(e instanceof DOMException&&e.name==='NotAllowedError'?'Camera permission was denied. Allow access in your browser settings, then try again.':e instanceof DOMException&&e.name==='NotFoundError'?'No camera was found on this device.':e instanceof DOMException&&e.name==='OverconstrainedError'?'The other camera is unavailable on this device.':e instanceof Error?e.message:'Could not open the camera.');
  }finally{busyRef.current=false;if(alive.current&&request===session.current)setBusy(false)}
 };
 const persistCapture=async(capture:CameraRollItem)=>{
  try{await saveCameraCapture(capture.blob,capture.kind,capture);if(alive.current)setPending(old=>old.map(c=>c.id===capture.id?{...c,status:'saved'}:c))}
  catch{if(alive.current){setPending(old=>old.map(c=>c.id===capture.id?{...c,status:'failed'}:c));setError('This capture could not be saved. Free some device storage, then retry from the gallery. You can also download it.')}}
 };
 const saveCapture=(blob:Blob,isVideo:boolean)=>{
  const capture:CameraRollItem={id:'camera-'+crypto.randomUUID(),createdAt:new Date().toISOString(),kind:isVideo?'video':'image',mimeType:blob.type,blob,url:''};
  if(alive.current){capture.url=URL.createObjectURL(blob);transientUrls.current.set(capture.id,capture.url);setPending(old=>[{...capture,status:'saving'},...old])}
  void persistCapture(capture);
 };
 const shutter=()=>{
  if(!ready||busyRef.current||!stream.current||encoding.current)return;
  if(mode==='VIDEO'){
   if(recording){if(recorder.current?.state==='recording')recorder.current.stop();return}
   if(typeof MediaRecorder==='undefined'){setError('Video recording is unavailable in this browser.');return}
   try{
    const rec=new MediaRecorder(stream.current),chunks:Blob[]=[];recorder.current=rec;
    rec.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
    rec.onstop=()=>{if(alive.current)setRecording(false);if(chunks.length)saveCapture(new Blob(chunks,{type:rec.mimeType}),true)};
    rec.onerror=()=>{if(alive.current){setRecording(false);setError('Recording failed. Please try again.')}};
    rec.start();setRecording(true);setError('');
   }catch{setError('Video recording is unavailable in this browser.')}return;
  }
  const v=video.current;if(!v?.videoWidth)return;
  const canvas=document.createElement('canvas');canvas.width=v.videoWidth;canvas.height=v.videoHeight;
  const context=canvas.getContext('2d');if(!context)return;
  // Save selfies in the same orientation as the mirrored viewfinder.
  if(front){context.translate(canvas.width,0);context.scale(-1,1)}context.drawImage(v,0,0);encoding.current=true;setFlash(true);setError('');
  canvas.toBlob(blob=>{encoding.current=false;if(blob)saveCapture(blob,false);else if(alive.current)setError('Could not capture this photo. Please try again.')},'image/jpeg',.95);
 };
 const move=(offset:number)=>{const next=captures[index+offset];if(next)setOpened(next.id)};
 const thumbnail=(capture:CameraRollItem)=>capture.kind==='video'?<video src={capture.url} muted playsInline preload="metadata"/>:<img src={capture.url} alt="Camera photo" loading="lazy"/>;
 return <main className="camera-app">
  <header className="camera-top"><a href="/home" aria-label="Return to home screen">‹</a><span>{recording?<span className="camera-timer">● {Math.floor(seconds/60).toString().padStart(2,'0')}:{(seconds%60).toString().padStart(2,'0')}</span>:'Clicksara'}</span><button className="camera-grid-toggle" aria-label="Toggle viewfinder grid" aria-pressed={grid} onClick={()=>setGrid(old=>!old)}>▦</button></header>
  <div className={'camera-view'+(busy&&ready?' is-switching':'')}>
   <video ref={video} autoPlay muted playsInline style={{transform:front?'scaleX(-1)':undefined}}/>
   <canvas ref={freeze} className="camera-frozen" style={{transform:front?'scaleX(-1)':undefined}} aria-hidden="true"/>
   {grid&&<div className="camera-grid" aria-hidden="true"/>}{flash&&<div className="camera-flash" aria-hidden="true"/>}
   {!ready&&<div className="camera-permission"><CameraAppIcon/><h1>A little moment, captured.</h1><p>{error||'Photos and videos save automatically to the Camera album in Pardanasheen on this device.'}</p><button disabled={busy} onClick={()=>start()}>{busy?'Opening camera…':error?'Try again':'Enable camera'}</button></div>}
   {ready&&busy&&<span className="camera-switch-status" role="status">Switching camera…</span>}
   {ready&&error&&<p className="camera-error" role="alert">{error}</p>}
   <span className="camera-zoom">1×</span>
  </div>
  <div className="camera-controls"><div className="camera-modes">{(['VIDEO','PHOTO'] as const).map(m=><button key={m} disabled={recording} aria-pressed={mode===m} onClick={()=>setMode(m)}>{m}</button>)}</div>
   <div className="camera-actions"><button className="camera-thumb" disabled={recording} aria-label={`Open camera gallery, ${captures.length} captures`} onClick={()=>{setOpened(null);setPreview(true)}}>{latest?thumbnail(latest):<span>▧</span>}{captures.length>0&&<b>{captures.length}</b>}</button>
    <button className={'camera-shutter '+(mode==='VIDEO'?'is-video ':'')+(recording?'is-recording':'')} disabled={!ready||busy} aria-label={recording?'Stop recording':mode==='VIDEO'?'Record video':'Take photo'} onClick={shutter}><span/></button>
    <button className={'camera-flip'+(busy?' is-turning':'')} disabled={busy||recording||!ready} aria-label="Switch camera" onClick={()=>start(!front)}><svg viewBox="0 0 24 24" width="28" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 9a8 8 0 0 1 14-3l2 3M20 15a8 8 0 0 1-14 3l-2-3M20 3v6h-6M4 21v-6h6"/></svg></button>
   </div>
   <p className="camera-local" role="status">{recording?'Recording video without audio':saving?`Saving ${saving} capture${saving===1?'':'s'}…`:pending.some(c=>c.status==='failed')?'Capture needs saving · open gallery':'Automatically saved to Pardanasheen · Camera'}</p>
   <a className="camera-home" href="/home" aria-label="Return to home screen"><span/></a>
  </div>
  <dialog ref={dialog} className="camera-gallery" aria-label="Camera gallery" onCancel={()=>setPreview(false)} onClose={()=>{setPreview(false);setOpened(null)}} onKeyDown={e=>{if(e.key==='ArrowLeft')move(-1);if(e.key==='ArrowRight')move(1)}}>
   <header><div><strong>{current?'Camera capture':'Camera roll'}</strong><small>{current?new Date(current.createdAt).toLocaleString():`${captures.length} moments · saved on this device`}</small></div><button autoFocus onClick={()=>{setPreview(false);setOpened(null)}}>Done</button></header>
   {roll.error&&<p role="alert">{roll.error}</p>}
   {current?<><div className="camera-gallery-media">{current.kind==='video'?<video key={current.id} src={current.url} controls playsInline/>:<img src={current.url} alt="Captured photo"/>}</div><div className="camera-gallery-actions"><button onClick={()=>setOpened(null)}>All captures</button><a href={current.url} download={captureFilename(current)}>Save to device</a></div><div className="camera-gallery-pagination"><button disabled={index<=0} onClick={()=>move(-1)}>Previous</button><span>{index+1} / {captures.length}</span><button disabled={index>=captures.length-1} onClick={()=>move(1)}>Next</button></div>{pending.find(c=>c.id===current.id)?.status==='failed'&&<button className="camera-retry" onClick={()=>{setPending(old=>old.map(c=>c.id===current.id?{...c,status:'saving'}:c));void persistCapture(current)}}>Retry saving</button>}</>:<div className="camera-roll-grid">{captures.map(c=><button key={c.id} aria-label={`Open ${c.kind==='image'?'photo':'video'} from ${new Date(c.createdAt).toLocaleString()}`} onClick={()=>setOpened(c.id)}>{thumbnail(c)}{c.kind==='video'&&<span>VIDEO</span>}{pending.find(p=>p.id===c.id)?.status==='failed'&&<span className="camera-unsaved">Not saved</span>}</button>)}</div>}
   {!captures.length&&!roll.loading&&<div className="camera-gallery-empty"><CameraAppIcon/><h2>Your moments start here.</h2><p>Take a photo and it will appear here and in Pardanasheen’s Camera album.</p></div>}
   {roll.loading&&<p role="status">Loading camera roll…</p>}
   <a className="camera-pard-link" href="/app/adventure?album=Camera">Open in Pardanasheen ↗</a>
  </dialog>
 </main>;
}
