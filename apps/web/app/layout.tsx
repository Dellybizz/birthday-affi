import "@wiffeyyyy/ui/styles";
import "./os.css";
import { OSProvider } from "../components/os-provider";

export const metadata = {
  title: "Wiffeyyyy OS",
  description: "A little birthday world made just for her.",
};

import {SiteNavigationProvider} from '@wiffeyyyy/ui/navigation';
import {getPublicNavigation,getPublishedSiteConfiguration} from "../lib/cms";
export const dynamic="force-dynamic";
export default async function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
  const [settings,navigation]=await Promise.all([getPublishedSiteConfiguration(),getPublicNavigation()]);
  return <html lang="en"><body><SiteNavigationProvider value={navigation}><OSProvider settings={settings}>{children}</OSProvider></SiteNavigationProvider></body></html>;
}