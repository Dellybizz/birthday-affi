import type {EditorPublicationState} from '../lib/editor-publication-state';
const labels:Record<EditorPublicationState,string>={published:'Published',changed:'Unpublished changes',draft:'Draft',error:'Error',publishing:'Publishing…'};
export function AdminStatus({state}:{state:EditorPublicationState}){
 return <span role="status" className={'admin-status admin-status-'+state}>{labels[state]}</span>;
}
