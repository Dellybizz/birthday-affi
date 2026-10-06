import {requireAdmin} from '../../lib/auth';
import {getEditorSiteContext} from '../../lib/editor-bootstrap';
import {AdminPageHeader} from '../../components/admin-page-header';
import VaultEditor from './vault-editor';
import {parseVaultConfiguration,type VaultConfiguration} from '@wiffeyyyy/content';
export const dynamic='force-dynamic';
export default async function Page(){
 await requireAdmin('site:settings');const {db,siteId}=await getEditorSiteContext();
 const {data,error}=await db.rpc('read_vault_configuration',{p_site_id:siteId});if(error)throw new Error('Unable to load private Vault settings');
 const empty:VaultConfiguration={answers:[],story:{title:'Our story',subtitle:'A memory kept close',dedication:'For you, always.',chapters:[{id:'chapter-one',title:'Our beginning',period:'',motif:'notebook',keepsake:'',quote:'',body:'',noteTitle:'A little note',note:''}]}};
 return <div><AdminPageHeader eyebrow="Apps" title="Private Vault story" description="Edit accepted answers and chapters. Save a private draft, then publish when it is ready."/><VaultEditor initial={data?parseVaultConfiguration(data.document):empty} initialRevision={Number(data?.revision??0)}/></div>;
}
