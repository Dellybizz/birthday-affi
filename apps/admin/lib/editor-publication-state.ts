import {documentsEqual} from './control-panel';
export type EditorPublicationState='published'|'changed'|'draft'|'error'|'publishing';
export function editorPublicationState({draft,liveDocument,draftMetadata,liveMetadata,hasPublication,publishing,error}:{draft:unknown;liveDocument:unknown;draftMetadata?:unknown;liveMetadata?:unknown;hasPublication:boolean;publishing?:boolean;error?:boolean}):EditorPublicationState{
 if(error)return 'error';
 if(publishing)return 'publishing';
 if(!hasPublication)return 'draft';
 if(liveDocument===undefined)return 'error';
 return documentsEqual(draft,liveDocument)&&(draftMetadata===undefined||documentsEqual(draftMetadata,liveMetadata))?'published':'changed';
}
