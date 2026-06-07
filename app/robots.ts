import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/", "/checkout", "/account", "/dashboard", "/auth/"],
    },
    sitemap: "https://finalpingapp.com/sitemap.xml",
  };
}
