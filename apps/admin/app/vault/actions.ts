'use server';
import {parseVaultConfiguration} from '@wiffeyyyy/content';
import {requireAdmin} from '../../lib/auth';
import {getEditorSiteContext} from '../../lib/editor-bootstrap';
export async function saveVault(document:unknown,revision:number,publish:boolean){
 await requireAdmin('site:settings');
 const config=parseVaultConfiguration(document),{db,siteId}=await getEditorSiteContext();
 const {data,error}=await db.rpc('change_vault_configuration',{p_site_id:siteId,p_document:config,p_expected_revision:revision,p_publish:publish});
 if(error)throw new Error(error.code==='40001'?'This draft changed in another session. Reload before saving.':'Unable to save private Vault settings');
 return data as {revision:number;published:boolean};
}
