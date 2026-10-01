import "@wiffeyyyy/ui/styles";
import "./os.css";
import { OSProvider } from "../components/os-provider";

export const metadata = {
  title: "Wiffeyyyy OS",
  description: "A little birthday world made just for her.",
};

import {getPublishedSiteConfiguration} from "../lib/cms";
export const dynamic="force-dynamic";
export default async function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
  const settings=await getPublishedSiteConfiguration();
  return <html lang="en"><body><OSProvider settings={settings}>{children}</OSProvider></body></html>;
}