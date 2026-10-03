import {revalidateTag} from 'next/cache';
import {NextResponse} from 'next/server';

export const dynamic='force-dynamic';

function safeEqual(left:string,right:string){
 if(left.length!==right.length)return false;
 let mismatch=0;
 for(let index=0;index<left.length;index++)mismatch|=left.charCodeAt(index)^right.charCodeAt(index);
 return mismatch===0;
}

export async function POST(request:Request){
 const expected=process.env.CMS_REVALIDATE_SECRET??'';
 const supplied=request.headers.get('authorization')?.replace(/^Bearer\s+/i,'')??'';
 if(!expected||!supplied||!safeEqual(expected,supplied))return NextResponse.json({ok:false},{status:401,headers:{'Cache-Control':'no-store'}});
 revalidateTag('public-cms');
 return NextResponse.json({ok:true},{headers:{'Cache-Control':'no-store'}});
}
