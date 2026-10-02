import "@wiffeyyyy/ui/styles";
import "./os.css";
import {ArchiveJourney} from "../components/archive-journey";
import { OSProvider } from "../components/os-provider";

export const metadata = {
  title: "Wiffeyyyy OS",
  description: "A little birthday world made just for her.",
};

import {SiteNavigationProvider} from '@wiffeyyyy/ui/navigation';
import {getPublicNavigation,getPublishedSiteConfiguration,getPublishedDocument} from "../lib/cms";
export const dynamic="force-dynamic";
export default async function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
  const [settings,navigation,home,archive]=await Promise.all([getPublishedSiteConfiguration(),getPublicNavigation(),getPublishedDocument("home"),getPublishedDocument("memories-archive")]);
  return <html lang="en"><body><SiteNavigationProvider value={Array.isArray(navigation)?navigation.filter((item:{href?:string|null})=>item.href!=='/app/radio'):null}><ArchiveJourney settings={archive?.nodes.find(n=>n.props.archivePart==='page')?.props??{}}><OSProvider settings={settings} homeDocument={home}>{children}</OSProvider></ArchiveJourney></SiteNavigationProvider></body></html>;
}