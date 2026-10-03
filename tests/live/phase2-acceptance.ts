import {createClient} from "npm:@supabase/supabase-js@2.57.4";
const url=Deno.env.get("SUPABASE_URL")!;
const service=createClient(url,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,{auth:{persistSession:false,autoRefreshToken:false}});
const check=(r:any)=>{if(r.error)throw new Error(r.error.message);return r.data};
Deno.serve(async req=>{
 const h=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(req.headers.get("x-qa-token")||"")))).map(b=>b.toString(16).padStart(2,"0")).join("");
 if(req.method!=="POST"||h!==Deno.env.get("PHASE2_ACCEPTANCE_TOKEN_HASH"))return new Response("",{status:403});
 const key=(await req.json()).key;const ids:string[]=[];const evidence:string[]=[];let site:any,page:any,version:any;
 const assert=(ok:any,label:string)=>{if(!ok)throw new Error(label);evidence.push(label)};
 const options={auth:{persistSession:false,autoRefreshToken:false}};
 const cookie=(session:any)=>"sb-brdkbxlqendywbkdiuvr-auth-token=base64-"+btoa(JSON.stringify(session)).replaceAll("+","-").replaceAll("/","_").replace(/=+$/,"");
 const expired=(token:string)=>{const [a,b,c]=token.split(".");const p=JSON.parse(atob(b.replaceAll("-","+").replaceAll("_","/")));p.exp=Math.floor(Date.now()/1000)-120;return a+"."+btoa(JSON.stringify(p)).replaceAll("+","-").replaceAll("/","_").replace(/=+$/,"")+"."+c};
 try{
  const suffix=crypto.randomUUID();const password=crypto.randomUUID()+"!";
  const clients:any={};const sessions:any={};
  for(const role of ["viewer","editor","stranger"]){
   const email="phase2-"+role+"-"+suffix+"@qa.wiffeyyyy.invalid";
   const user=check(await service.auth.admin.createUser({email,password,email_confirm:true})).user;ids.push(user.id);
   if(role!=="stranger")check(await service.from("admin_users").insert({id:user.id,role}));
   const db=createClient(url,key,options);sessions[role]=check(await db.auth.signInWithPassword({email,password})).session;clients[role]=db;
  }
  site=check(await service.from("sites").insert({name:"Phase 2 acceptance fixture",slug:"qa-"+suffix}).select().single());
  page=check(await service.from("pages").insert({site_id:site.id,slug:"home",title:"QA",draft_document:{secret:"unpublished-fixture"}}).select().single());
  version=check(await service.from("page_versions").insert({page_id:page.id,version_number:1,status:"published",document:{safe:"published-fixture"}}).select().single());
  check(await service.from("pages").update({published_version_id:version.id}).eq("id",page.id));
  const v=clients.viewer,e=clients.editor,s=clients.stranger,a=createClient(url,key,options);
  assert(check(await v.from("pages").select("id").eq("id",page.id)).length===1,"viewer can read drafts");
  assert(check(await v.from("pages").update({title:"attack"}).eq("id",page.id).select("id")).length===0,"viewer draft mutation denied");
  assert(Boolean((await v.from("pages").insert({site_id:site.id,slug:"attack",title:"Attack"})).error),"viewer insertion denied");
  assert(check(await e.from("pages").update({draft_document:{edited:true}}).eq("id",page.id).select("id")).length===1,"editor draft mutation allowed");
  assert(Boolean((await e.from("pages").update({published_version_id:null}).eq("id",page.id)).error),"editor publication change denied");
  assert(Boolean((await e.from("page_versions").insert({page_id:page.id,version_number:2,status:"published",document:{}})).error),"editor version publication denied");
  assert(check(await e.from("sites").update({public_delivery_enabled:true}).eq("id",site.id).select("id")).length===0,"editor site settings mutation denied");
  assert(Boolean((await v.from("admin_users").update({role:"owner"}).eq("id",ids[0])).error),"viewer self escalation denied");
  assert(check(await s.from("pages").select("id").eq("id",page.id)).length===0,"signed-in non-admin sees no draft");
  assert(Boolean((await a.from("pages").select("id")).error),"anonymous raw table access denied");
  assert(check(await a.rpc("get_published_document",{site_slug:site.slug,page_slug:"home"}))===null,"private fixture public delivery denied");
  check(await service.from("sites").update({public_delivery_enabled:true}).eq("id",site.id));
  assert(check(await a.rpc("get_published_document",{site_slug:site.slug,page_slug:"home"})).safe==="published-fixture","anonymous delivery returns only published version");
  const logs=check(await service.from("audit_logs").select("actor_id,site_id,metadata").eq("actor_id",ids[1]).eq("site_id",site.id));
  assert(logs.length>0&&logs.every((l:any)=>JSON.stringify(l.metadata)==="{}"),"audit captures authenticated actor without content");
  assert(Boolean((await e.from("audit_logs").insert({actor_id:ids[0],action:"forged",entity_type:"pages"})).error),"audit forgery denied");
  const deployed=await fetch("https://wiffeyyyy-panel.vercel.app/editor/home",{headers:{Cookie:cookie(sessions.viewer)},redirect:"manual"});
  assert(deployed.status===200,"deployed viewer session can open editor for reading");
  const exp={...sessions.editor,access_token:expired(sessions.editor.access_token),expires_at:Math.floor(Date.now()/1000)-120};
  const refreshed=await fetch("https://wiffeyyyy-panel.vercel.app/editor/home",{headers:{Cookie:cookie(exp)},redirect:"manual"});
  assert(refreshed.status===200&&Boolean(refreshed.headers.get("set-cookie")),"deployed expired-cache simulation refreshes session");
  const bad={...exp,refresh_token:"revoked-invalid-refresh-token"};
  const rejected=await fetch("https://wiffeyyyy-panel.vercel.app/editor/home",{headers:{Cookie:cookie(bad)},redirect:"manual"});
  assert(rejected.status===307&&rejected.headers.get("location")?.endsWith("/login"),"deployed expired-cache with unusable refresh redirects to login");
  check(await service.from("admin_users").delete().eq("id",ids[0]));
  assert(check(await v.from("pages").select("id").eq("id",page.id)).length===0,"role revocation removes access with existing token");
  assert(check(await v.from("pages").update({title:"revoked"}).eq("id",page.id).select("id")).length===0,"revoked token mutation denied");
  const denied=await fetch("https://wiffeyyyy-panel.vercel.app/editor/home",{headers:{Cookie:cookie(sessions.viewer)},redirect:"manual"});
  assert(denied.status===307&&denied.headers.get("location")?.endsWith("/unauthorized"),"deployed existing session rejected after role revocation");
  const oldRefresh=sessions.stranger.refresh_token;check(await s.auth.signOut({scope:"global"}));
  assert(Boolean((await s.auth.refreshSession({refresh_token:oldRefresh})).error),"signed-out refresh token rejected");
  const stale=sessions.editor.access_token;
  check(await e.auth.signOut({scope:"global"}));
  const replay=createClient(url,key,{...options,global:{headers:{Authorization:"Bearer "+stale}}});
  assert(check(await replay.from("pages").select("id").eq("id",page.id)).length===0,"signed-out access token loses draft access immediately");
  assert(check(await replay.from("pages").update({title:"replayed"}).eq("id",page.id).select("id")).length===0,"signed-out access token mutation denied immediately");
  return Response.json({passed:evidence.length,evidence,expiry_method:"expired cached JWT simulation plus real refresh; no hour-long wall-clock expiry wait"});
 }catch(error){return Response.json({error:String(error),passed:evidence.length,evidence},{status:500})}
 finally{
  if(site)check(await service.from("sites").delete().eq("id",site.id));
  if(ids.length){check(await service.from("admin_users").delete().in("id",ids));check(await service.from("audit_logs").delete().in("actor_id",ids));}
  const entities=[site?.id,page?.id,version?.id].filter(Boolean);if(entities.length)check(await service.from("audit_logs").delete().in("entity_id",entities));
  for(const id of ids)check(await service.auth.admin.deleteUser(id));
 }
});
