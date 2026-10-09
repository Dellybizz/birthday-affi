import {createClient} from '@supabase/supabase-js';
export const dynamic='force-dynamic';
export const preferredRegion='bom1';
const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const sharedDb=url&&key?createClient(url,key,{auth:{persistSession:false}}):null;
export async function POST(request:Request){
 try{
  const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)return Response.json({error:'Invalid origin'},{status:403});
  if(Number(request.headers.get('content-length')??0)>100000)return Response.json({error:'Request too large'},{status:413});
  const raw=await request.text();if(raw.length>100000)return Response.json({error:'Request too large'},{status:413});
  let {token,action,payload={}}=JSON.parse(raw);
  if(!sharedDb)return Response.json({error:'Call service is not configured'},{status:503});
  const db=sharedDb;
  if(action==='prepare'){const prepared=await db.rpc('prepare_public_hotline',{p_site_slug:process.env.NEXT_PUBLIC_SITE_SLUG??'wiffeyyyy-os'});if(prepared.error)return Response.json({error:prepared.error.message},{status:503,headers:{'Cache-Control':'no-store'}});token=prepared.data;action='status';}
  const {data,error}=await db.rpc('hotline_exchange',{p_site_slug:process.env.NEXT_PUBLIC_SITE_SLUG??'wiffeyyyy-os',p_token:token,p_action:action,p_payload:payload});
  if(error)return Response.json({error:error.code==='42501'?'This private link is invalid or revoked.':error.message},{status:error.code==='42501'?403:409,headers:{'Cache-Control':'no-store'}});
  const iceServers:RTCIceServer[]=[{urls:'stun:stun.l.google.com:19302'}];
  const turn=process.env.HOTLINE_TURN_URL,user=process.env.HOTLINE_TURN_USERNAME,credential=process.env.HOTLINE_TURN_CREDENTIAL;
  if(turn&&user&&credential)iceServers.push({urls:turn,username:user,credential});
  return Response.json({...data,...(JSON.parse(raw).action==='prepare'?{token}:{}),iceServers,relayReady:iceServers.length>1},{headers:{'Cache-Control':'no-store'}});
 }catch{return Response.json({error:'Call service unavailable. Try again.'},{status:400,headers:{'Cache-Control':'no-store'}})}
}
