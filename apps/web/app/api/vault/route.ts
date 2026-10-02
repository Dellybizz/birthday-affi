import {matchesVaultAnswer} from '../../../lib/vault-answer';
import {getVaultStory} from '../../../lib/vault-story';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};
export async function POST(request:Request){
 try{
  const origin=request.headers.get('origin');if(origin!==new URL(request.url).origin)return Response.json({error:'Please unlock Vault from the app.'},{status:403,headers});
  if(!request.headers.get('content-type')?.includes('application/json'))return Response.json({error:'Invalid request.'},{status:415,headers});
  if(Number(request.headers.get('content-length')??0)>1024)return Response.json({error:'Keep your answer short.'},{status:413,headers});
  // Bound the streamed body too, including requests without Content-Length.
  const reader=request.body?.getReader();if(!reader)return Response.json({error:'Write your memory first.'},{status:400,headers});
  const decoder=new TextDecoder();let body='',size=0;
  for(;;){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>1024){await reader.cancel();return Response.json({error:'Keep your answer short.'},{status:413,headers})}body+=decoder.decode(value,{stream:true})}body+=decoder.decode();
  const data=JSON.parse(body);if(!matchesVaultAnswer(data?.answer))return Response.json({error:'That’s not quite the memory. Think of a little moment we shared, and try again.'},{status:401,headers});
  try{return Response.json({story:await getVaultStory(data.answer)},{headers})}
  catch{return Response.json({error:'Our story is taking a moment. Please try again.'},{status:503,headers})}
 }catch{return Response.json({error:'Vault couldn’t open. Please try again.'},{status:400,headers})}
}
