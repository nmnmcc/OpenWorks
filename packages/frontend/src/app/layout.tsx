import type { ReactNode } from "react";
import { Providers } from "@/components/Providers";
import { Header } from "@/components/Header";
import "./globals.css";

export const metadata = {
  title: "OpenWorks",
  description: "OpenWorks — collaborative workspace",
};

export default function RootLayout({ children }: { readonly children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Header />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
