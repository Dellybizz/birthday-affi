export type PublicationState='published'|'changed'|'draft'|'missing'|'broken';

export type CanonicalExperience={slug:string;title:string;livePath:string|null};
export type ControlPanelPage={
 id:string;
 slug:string;
 title:string;
 settings?:{archived?:boolean}|null;
 draft_document:unknown;
 published_version_id:string|null;
 draft_revision?:number|null;
 updated_at?:string|null;
};
export type VersionedWorkspace={draft:unknown;publishedId:string|null;publishedDocument:unknown|undefined;revision?:number|null}|null;

export function documentsEqual(left:unknown,right:unknown){
 const canonical=(value:unknown):unknown=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([key,item])=>[key,canonical(item)])):value;
 return JSON.stringify(canonical(left??null))===JSON.stringify(canonical(right??null));
}

export function publicationState(input:{recordPresent?:boolean;draft:unknown;publishedId:string|null;publishedDocument:unknown|undefined}):PublicationState{
 if(input.recordPresent===false)return 'missing';
 if(!input.publishedId)return 'draft';
 if(input.publishedDocument===undefined)return 'broken';
 return documentsEqual(input.draft,input.publishedDocument)?'published':'changed';
}

export function workspacePublicationState(workspace:VersionedWorkspace):PublicationState{
 if(!workspace)return 'missing';
 return publicationState({draft:workspace.draft,publishedId:workspace.publishedId,publishedDocument:workspace.publishedDocument});
}

export function summarizeControlPanel(input:{
 activeExperiences:readonly CanonicalExperience[];
 pages:readonly ControlPanelPage[];
 publishedDocuments:Record<string,unknown>;
 configuration:VersionedWorkspace;
 navigation:VersionedWorkspace;
 mediaCount:number;
 releaseCount:number;
 lastRelease:{release_number:number;created_at:string}|null;
}){
 const visiblePages=input.pages.filter(page=>page.settings?.archived!==true);
 const pagesBySlug=new Map(visiblePages.map(page=>[page.slug,page]));
 const pages=input.activeExperiences.map(experience=>{
  const page=pagesBySlug.get(experience.slug);
  const publishedDocument=page?.published_version_id?input.publishedDocuments[page.published_version_id]:undefined;
  const state=page?publicationState({draft:page.draft_document,publishedId:page.published_version_id,publishedDocument}):'missing' as PublicationState;
  return {...experience,pageId:page?.id??null,draftRevision:Number(page?.draft_revision??0),updatedAt:page?.updated_at??null,state};
 });
 const count=(state:PublicationState)=>pages.filter(page=>page.state===state).length;
 const publishedPages=pages.filter(page=>page.state==='published'||page.state==='changed').length;
 const changedPages=count('changed');
 const draftPages=count('draft');
 const missingPages=count('missing');
 const brokenPages=count('broken');
 const configurationState=workspacePublicationState(input.configuration);
 const navigationState=workspacePublicationState(input.navigation);
 const workspaceUnpublished=[configurationState,navigationState].filter(state=>state==='changed'||state==='draft').length;
 const workspaceIssues=[configurationState,navigationState].filter(state=>state==='missing'||state==='broken').length;
 const unpublishedChanges=changedPages+draftPages+workspaceUnpublished;
 const issues=missingPages+brokenPages+workspaceIssues;
 const activeSlugs=new Set(input.activeExperiences.map(experience=>experience.slug));
 const customPages=visiblePages.filter(page=>!activeSlugs.has(page.slug)).length;
 return {
  pages,
  activePages:pages.length,
  publishedPages,
  changedPages,
  draftPages,
  missingPages,
  brokenPages,
  customPages,
  configurationState,
  navigationState,
  unpublishedChanges,
  issues,
  healthy:issues===0,
  mediaCount:Math.max(0,input.mediaCount||0),
  releaseCount:Math.max(0,input.releaseCount||0),
  lastRelease:input.lastRelease
 };
}
