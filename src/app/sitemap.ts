import type { MetadataRoute } from "next";
import { PACKS } from "@/data/packs";

const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: site, changeFrequency: "daily", priority: 1 },
    { url: `${site}/privacy`, priority: 0.2 },
    { url: `${site}/accessibility`, priority: 0.2 },
    ...PACKS.map((p) => ({ url: `${site}/play/${p.id}`, changeFrequency: "daily" as const, priority: 0.8 })),
  ];
}
