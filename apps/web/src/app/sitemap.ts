import type { MetadataRoute } from "next";

const origin = "https://a2aconnect.dev";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["", "/architecture", "/examples", "/docs"];
  const now = new Date();
  return paths.map((path) => ({
    url: `${origin}${path || "/"}`,
    lastModified: now,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.8,
  }));
}
