import "@wiffeyyyy/ui/styles";
import "./os.css";
import "./navigation-performance.css";
import "./app-transitions.css";
import {ArchiveJourney} from "../components/archive-journey";
import { OSProvider } from "../components/os-provider";

export const metadata = {
  title: "Wiffeyyyy OS",
  description: "A little birthday world made just for her.",
};
export const revalidate=10;

import {SiteNavigationProvider} from '@wiffeyyyy/ui/navigation';
import {getPublicNavigation,getPublishedSiteConfiguration,getPublishedDocument} from "../lib/cms";
export default async function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
  const [settings,navigation,home,archive]=await Promise.all([getPublishedSiteConfiguration(),getPublicNavigation(),getPublishedDocument("home"),getPublishedDocument("memories-archive")]);
  const publicNavigation=Array.isArray(navigation)?navigation.filter((item:{href?:string|null})=>item.href!=='/app/radio'):null;
  const prefetchHrefs=publicNavigation?.map((item:{href?:string|null})=>item.href).filter((href:string|null|undefined):href is string=>typeof href==='string'&&href.startsWith('/'))??[];
  return <html lang="en"><body><SiteNavigationProvider value={publicNavigation}><ArchiveJourney siteSettings={settings} settings={archive?.nodes.find(n=>n.props.archivePart==='page')?.props??{}} prefetchHrefs={prefetchHrefs}><OSProvider settings={settings} homeDocument={home}>{children}</OSProvider></ArchiveJourney></SiteNavigationProvider></body></html>;
}
