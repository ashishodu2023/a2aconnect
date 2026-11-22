import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://a2aconnect.dev/sitemap.xml",
    host: "https://a2aconnect.dev",
  };
}
