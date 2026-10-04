export const dynamic = 'force-dynamic';
import VaultClient from './vault-client';
import {getPublishedRuntimeAppConfiguration} from '../../../lib/cms';
import './vault.css';
export const metadata={title:'Vault',robots:{index:false,follow:false}};
export default async function VaultPage(){const config=await getPublishedRuntimeAppConfiguration('vault');return <VaultClient config={config.slug==='vault'?config:undefined}/>}
