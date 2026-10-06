import "@wiffeyyyy/ui/styles";
import "../../web/app/os.css";
import "../../web/app/navigation-performance.css";
import "../../web/app/app-transitions.css";
import "./admin-preview-isolation.css";
import "./admin-controls.css";
import {AdminShell} from "../components/admin-shell";

export const metadata = { title: "Wiffeyyyy OS · Admin", robots: { index: false, follow: false } };

export default function RootLayout({children}:{children:React.ReactNode}) {
  const publicSiteUrl=(process.env.NEXT_PUBLIC_WEB_URL??'').trim().replace(/\/+$/,'');
  return <html lang="en"><body><AdminShell publicSiteUrl={publicSiteUrl}>{children}</AdminShell></body></html>;
}
