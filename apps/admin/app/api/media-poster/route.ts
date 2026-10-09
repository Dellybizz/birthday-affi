import {generateServerMediaPoster} from '../../../lib/media-poster-server';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=60;
export async function POST(request:Request){
 const headers={'Cache-Control':'private, no-store'};
 if(request.headers.get('origin')!==new URL(request.url).origin)return Response.json({error:'Request not allowed.'},{status:403,headers});
 try{const text=await request.text();if(text.length>200)return Response.json({error:'Invalid request.'},{status:400,headers});const input=JSON.parse(text);const result=await generateServerMediaPoster(input.id);return Response.json(result,{headers})}
 catch{return Response.json({error:'Unable to generate this thumbnail. Refresh your session and retry.'},{status:400,headers})}
}
