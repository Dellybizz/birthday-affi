import "@wiffeyyyy/ui/styles";
export const metadata = { title: "Wiffeyyyy OS · Admin", robots: { index: false, follow: false } };
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en"><body>{children}</body></html>;
}