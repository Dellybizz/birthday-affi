import "@wiffeyyyy/ui/styles";
import "./os.css";
import { OSProvider } from "../components/os-provider";

export const metadata = {
  title: "Wiffeyyyy OS",
  description: "A little birthday world made just for her.",
};

export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
  return <html lang="en"><body><OSProvider>{children}</OSProvider></body></html>;
}