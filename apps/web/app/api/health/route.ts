import {NextResponse} from 'next/server';
export async function GET(){return NextResponse.json({ok:true,service:'wiffeyyyy-web',time:new Date().toISOString()})}
