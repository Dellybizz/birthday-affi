import "@wiffeyyyy/ui/styles";

export const metadata = {
  title: "Wiffeyyyy OS",
  description: "A little birthday world made just for her.",
};

export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
  return <html lang="en"><body>{children}</body></html>;
}