import type { Metadata } from "next";
import { DM_Sans, IBM_Plex_Mono, Syne } from "next/font/google";
import { SiteFooter } from "@/components/SiteFooter";
import { ScrollToHash } from "@/components/ScrollToHash";
import { SiteNav } from "@/components/SiteNav";
import "./globals.css";

const display = Syne({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["600", "700", "800"],
});

const body = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: {
    default: "A2AConnect — SDK-agnostic agent interop",
    template: "%s · A2AConnect",
  },
  description:
    "A2AConnect — SDK-agnostic agent interop for mixed-runtime fleets. LF A2A–compatible. Complements MCP. Python core + Node.js site at a2aconnect.dev.",
  metadataBase: new URL("https://a2aconnect.dev"),
  alternates: { canonical: "/" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable} ${mono.variable} antialiased`}>
        <ScrollToHash />
        <SiteNav />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
