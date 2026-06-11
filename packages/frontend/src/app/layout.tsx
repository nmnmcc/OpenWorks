import { Providers } from "@/components/Providers";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata = {
  title: "OpenWorks",
  description: "OpenWorks — community platform",
};

export default function RootLayout({ children }: { readonly children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
