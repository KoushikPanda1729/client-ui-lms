import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/courses", "/courses/", "/partners", "/ai-conversation"],
        disallow: ["/dashboard", "/settings", "/sessions", "/onboarding", "/payment"],
      },
    ],
    sitemap: "https://learn.koushikpanda.online/sitemap.xml",
  };
}
