import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/sessions", "/stats", "/bankroll", "/tournaments", "/settings", "/hand-notes", "/locations"],
      },
    ],
    sitemap: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://poker-tracker.app"}/sitemap.xml`,
  };
}
