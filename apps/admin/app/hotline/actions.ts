'use server';
import {randomBytes,createHash} from 'node:crypto';
import {requireAdmin} from '../../lib/auth';
import {adminDb} from '../../lib/supabase';
export async function createHotlineLinks(){
 const admin=await requireAdmin();if(admin.role!=='owner')throw new Error('Owner required');
 const db=await adminDb();const {data:site,error}=await db.from('sites').select('id').eq('slug',process.env.NEXT_PUBLIC_SITE_SLUG??'wiffeyyyy-os').single();if(error)throw new Error('Site unavailable');
 const caller=randomBytes(32).toString('hex'),receiver=randomBytes(32).toString('hex');
 const hash=(s:string)=>createHash('sha256').update(s).digest('hex');
 const {error:rotateError}=await db.rpc('rotate_hotline_links',{p_site:site.id,p_caller_hash:hash(caller),p_receiver_hash:hash(receiver)});if(rotateError)throw new Error('Unable to create private links');
 return {caller,receiver};
}
