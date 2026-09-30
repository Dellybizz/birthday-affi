import "@wiffeyyyy/ui/styles";
export const metadata = { title: "Wiffeyyyy OS · Admin" };
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en"><body>{children}</body></html>;
}