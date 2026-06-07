import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://finalpingapp.com";
  return [
    { url: base,                    lastModified: new Date(), changeFrequency: "weekly",  priority: 1.0 },
    { url: `${base}/pricing`,       lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/download`,      lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/docs`,          lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/changelog`,     lastModified: new Date(), changeFrequency: "weekly",  priority: 0.7 },
    { url: `${base}/groundstationkit`,   lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/groundstationsetup`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/contact`,            lastModified: new Date(), changeFrequency: "yearly",  priority: 0.5 },
    { url: `${base}/privacy`,            lastModified: new Date(), changeFrequency: "yearly",  priority: 0.3 },
    { url: `${base}/terms`,              lastModified: new Date(), changeFrequency: "yearly",  priority: 0.3 },
    { url: `${base}/refund-policy`,      lastModified: new Date(), changeFrequency: "yearly",  priority: 0.3 },
  ];
}
