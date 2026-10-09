'use client';
import {useEffect,useRef,useState} from 'react';
import type {MediaAsset,MediaKind} from '../lib/media-policy';
import {MediaThumbnail} from './media-thumbnail';
import {MediaUploadQueue} from './media-upload-queue';
import {recoverMedia} from '../lib/media-upload';
import {boundedMedia} from '../lib/media-deadline';
const button='rounded-md border border-[#c9cccf] bg-white px-3 py-2 text-sm disabled:opacity-40';
export default function EditorMediaPicker({siteId,kind,canWrite,onPick,uploadInitiallyOpen=false,multiple=false,onPickMany}:{siteId:string;kind:MediaKind;canWrite:boolean;onPick:(media:MediaAsset)=>void;uploadInitiallyOpen?:boolean;multiple?:boolean;onPickMany?:(media:MediaAsset[])=>void}){
 const [assets,setAssets]=useState<MediaAsset[]>([]),[search,setSearch]=useState(''),[query,setQuery]=useState(''),[selected,setSelected]=useState<string|null>(null),[loading,setLoading]=useState(true),[more,setMore]=useState(false),[error,setError]=useState(''),[retry,setRetry]=useState(0),[verifying,setVerifying]=useState(false);
 const [selectedAssets,setSelectedAssets]=useState<MediaAsset[]>([]);
 const isSelected=(asset:MediaAsset)=>multiple?selectedAssets.some(item=>item.id===asset.id):selected===asset.id;
 const choose=(asset:MediaAsset)=>{setSelected(asset.id);if(multiple&&asset.status==='ready')setSelectedAssets(rows=>rows.some(item=>item.id===asset.id)?rows.filter(item=>item.id!==asset.id):[...rows,asset])};
 const request=useRef(0),controller=useRef<AbortController|null>(null),alive=useRef(true);
 const current=assets.find(asset=>asset.id===selected);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;controller.current?.abort()}},[]);
 useEffect(()=>{const timer=setTimeout(()=>setQuery(search.trim()),250);return()=>clearTimeout(timer)},[search]);
 async function fetchPage(offset=0,id='',signal?:AbortSignal){
  const params=new URLSearchParams({siteId,kind,search:query,offset:String(offset),...(id?{id}:{})});
  const response=await fetch('/api/media-picker?'+params,{cache:'no-store',signal});
  if(response.redirected||!response.headers.get('content-type')?.includes('application/json'))throw new Error('Your session expired. Sign in again to choose media.');
  const result=await response.json();if(!response.ok)throw new Error(result.error??'Unable to load media');return result as {assets:MediaAsset[];hasMore:boolean};
 }
 useEffect(()=>{
  const token=++request.current,abort=new AbortController();controller.current?.abort();controller.current=abort;setLoading(true);setError('');setSelected(null);setAssets([]);
  const timer=setTimeout(()=>abort.abort(),15000);
  fetchPage(0,'',abort.signal).then(result=>{if(alive.current&&token===request.current){setAssets(result.assets);setMore(result.hasMore)}}).catch(error=>{if(alive.current&&token===request.current)setError(abort.signal.aborted?'Media loading timed out. Press Retry.':error instanceof Error?error.message:'Unable to load media')}).finally(()=>{clearTimeout(timer);if(alive.current&&token===request.current)setLoading(false)});
  return()=>{clearTimeout(timer);++request.current;abort.abort()};
 },[siteId,kind,query,retry]);
 async function uploaded(id:string){
  try{const result=await boundedMedia(fetchPage(0,id),'Unable to load the uploaded file. Press Retry.',15000),asset=result.assets[0];if(!alive.current)return;if(!asset)throw new Error('File saved. Refresh the picker to select it.');setAssets(rows=>[asset,...rows.filter(row=>row.id!==id)]);setSelected(id);if(multiple&&asset.status==='ready')setSelectedAssets(rows=>[...rows.filter(row=>row.id!==id),asset]);setError('')}
  catch(error){if(alive.current)setError(error instanceof Error?error.message:'Unable to load uploaded file')}
 }
 async function loadMore(){const token=request.current;setLoading(true);try{const result=await boundedMedia(fetchPage(assets.length),'Loading timed out. Press Retry.',15000);if(alive.current&&token===request.current){setAssets(rows=>[...rows,...result.assets.filter(asset=>!rows.some(row=>row.id===asset.id))]);setMore(result.hasMore)}}catch(error){if(alive.current&&token===request.current)setError(error instanceof Error?error.message:'Unable to load more media')}finally{if(alive.current&&token===request.current)setLoading(false)}}
 async function verify(){if(!current||verifying)return;setVerifying(true);setError('');try{await boundedMedia(recoverMedia(current.id),'Verification timed out. Retry or open the media library.',45000);await uploaded(current.id)}catch(error){if(alive.current)setError(error instanceof Error?error.message:'Unable to verify file')}finally{if(alive.current)setVerifying(false)}}
 return <section aria-label="Choose media" className="space-y-3">
  <div className="flex flex-wrap items-end gap-2"><label className="min-w-0 flex-1 text-sm">Search {kind==='image'?'images':kind==='video'?'videos':'audio'}<input className="mt-1 w-full rounded-md border p-2" maxLength={200} placeholder="Search filenames" value={search} onChange={event=>setSearch(event.target.value)}/></label><button type="button" className={button} onClick={()=>setRetry(value=>value+1)}>Retry / Refresh</button></div>
  {canWrite&&<details open={uploadInitiallyOpen||undefined}><summary className="cursor-pointer py-2 text-sm font-medium">Upload new {kind==='image'?'images':kind==='video'?'videos':'audio'}</summary><MediaUploadQueue siteId={siteId} kind={kind} onComplete={id=>void uploaded(id)}/></details>}
  {error&&<p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</p>}
  <p role="status" className="text-xs text-[#6d7175]">{loading?'Loading media…':assets.length+' files loaded'} · {multiple?'Select multiple files, then add your selection.':<>Select a file, then choose Use this {kind}.</>}</p>
  <div className="grid max-h-[48vh] grid-cols-2 gap-3 overflow-auto p-1 sm:grid-cols-3 lg:grid-cols-4">{assets.map(asset=><button key={asset.id} type="button" aria-label={'Select '+asset.filename} aria-pressed={isSelected(asset)} className={'relative overflow-hidden rounded-lg border text-left '+(isSelected(asset)?'ring-2 ring-[#9b4361]':'hover:border-[#9b4361]')} onClick={()=>choose(asset)}>{multiple&&<span aria-hidden className={'absolute right-2 top-2 z-10 grid h-6 w-6 place-items-center rounded border bg-white '+(isSelected(asset)?'border-[#9b4361] text-[#9b4361]':'border-gray-400')}>{isSelected(asset)?'✓':''}</span>}<MediaThumbnail asset={asset} allowVideoFrame/><span className="block truncate p-2 text-xs" title={asset.filename}>{asset.filename}</span>{asset.status!=='ready'&&<span className="block px-2 pb-2 text-xs text-amber-800">Needs verification</span>}</button>)}</div>
  {!loading&&!error&&!assets.length&&<p className="p-4 text-center text-sm">{query?'No matching files. Try another filename.':'No '+kind+' files yet. Upload a file above.'}</p>}
  {more&&<button type="button" className={button} disabled={loading} onClick={()=>void loadMore()}>Load more</button>}
  <footer className="sticky bottom-0 flex flex-wrap items-center justify-between gap-2 border-t bg-white py-3"><span className="min-w-0 flex-1 truncate text-sm">{multiple?selectedAssets.length+' selected':current?.filename??'No file selected'}</span>{current&&current.status!=='ready'&&canWrite&&<button type="button" className={button} disabled={verifying} onClick={()=>void verify()}>{verifying?'Verifying…':'Finish verification'}</button>}{multiple&&<button type="button" className={button} disabled={!selectedAssets.length} onClick={()=>setSelectedAssets([])}>Clear selection</button>}<button type="button" className={button.replace('bg-white','bg-[#9b4361]')+' text-white'} disabled={verifying||(multiple?!selectedAssets.length||!onPickMany:!current||current.status!=='ready')} onClick={()=>{if(multiple){onPickMany?.(selectedAssets.filter(asset=>asset.status==='ready'&&asset.kind===kind))}else if(current?.status==='ready'&&current.kind===kind)onPick(current)}}>{multiple?'Add '+selectedAssets.length+' selected':<>Use this {kind}</>}</button></footer>
 </section>;
}
