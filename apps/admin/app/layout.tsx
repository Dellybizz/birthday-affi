import "@wiffeyyyy/ui/styles";
import "../../web/app/os.css";
import "../../web/app/navigation-performance.css";
import "../../web/app/app-transitions.css";
import "./admin-preview-isolation.css";
export const metadata = { title: "Wiffeyyyy OS · Admin", robots: { index: false, follow: false } };
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en"><body>{children}</body></html>;
}
