import "@wiffeyyyy/ui/styles";
import "../../web/app/os.css";
export const metadata = { title: "Wiffeyyyy OS · Admin", robots: { index: false, follow: false } };
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en"><body>{children}</body></html>;
}
