import type {ReactNode} from 'react';
import {DocumentSettingsProvider} from '@wiffeyyyy/ui/page-layout';
import {AudioDefaultsProvider} from '@wiffeyyyy/ui/media-player';
import {LiveEditorPreviewProvider} from '@wiffeyyyy/ui/cms-renderer';
import {SiteNavigationProvider} from '@wiffeyyyy/ui/navigation';
import {loadEditorBootstrap} from '../../lib/editor-bootstrap';
import {EditorWorkspace} from './editor-workspace';

export const dynamic='force-dynamic';

export default async function EditorLayout({children}:{children:ReactNode}){
 const bootstrap=await loadEditorBootstrap();
 const settings=bootstrap.settings;
 return <DocumentSettingsProvider value={settings}>
  <AudioDefaultsProvider value={{volume:settings.defaultVolume,muted:settings.defaultMuted}}>
   <SiteNavigationProvider value={bootstrap.previewNavigation}>
    <LiveEditorPreviewProvider>
     <EditorWorkspace bootstrap={{siteId:bootstrap.siteId,siteSlug:bootstrap.siteSlug,pages:bootstrap.catalog,publicSiteUrl:bootstrap.publicSiteUrl,canWrite:bootstrap.canWrite,canPublish:bootstrap.canPublish}}>{children}</EditorWorkspace>
    </LiveEditorPreviewProvider>
   </SiteNavigationProvider>
  </AudioDefaultsProvider>
 </DocumentSettingsProvider>;
}
