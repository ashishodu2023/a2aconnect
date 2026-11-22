import type { Metadata } from "next";
import { IBM_Plex_Mono, Instrument_Sans, Source_Sans_3 } from "next/font/google";
import { SiteFooter } from "@/components/SiteFooter";
import { ScrollToHash } from "@/components/ScrollToHash";
import { SiteNav } from "@/components/SiteNav";
import "./globals.css";

const display = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
});

const body = Source_Sans_3({
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
    "Hand off work across any agent runtime without sharing an SDK. LF A2A–compatible interop layer. Complements MCP. Live at a2aconnect.dev.",
  metadataBase: new URL("https://a2aconnect.dev"),
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://a2aconnect.dev",
    siteName: "A2AConnect",
    title: "A2AConnect — SDK-agnostic agent interop",
    description:
      "Interop layer for mixed-runtime agent fleets. Adapters, AgentPeer, policy & audit — complementary to LF A2A and MCP.",
  },
  twitter: {
    card: "summary_large_image",
    title: "A2AConnect — SDK-agnostic agent interop",
    description:
      "Hand off work across agent runtimes without sharing an SDK. https://a2aconnect.dev",
  },
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
