import type { MetadataRoute } from "next";
import { SITE } from "@/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const asOf = new Date(SITE.pricingAsOf);
  return [
    { url: `${SITE.url}/`, lastModified: asOf, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE.url}/pricing`, lastModified: asOf, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE.url}/legal/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE.url}/legal/terms`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
