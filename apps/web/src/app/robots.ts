import type { MetadataRoute } from "next";

import { validateServerEnvironment } from "@/config/environment";

export default function robots(): MetadataRoute.Robots {
  const { indexable } = validateServerEnvironment();
  const origin = (process.env.PAYLOAD_PUBLIC_SERVER_URL || "https://chinainfact.com").replace(/\/$/, "");
  return {
    rules: indexable
      ? { allow: "/", userAgent: "*" }
      : { disallow: "/", userAgent: "*" },
    sitemap: indexable ? `${origin}/sitemap.xml` : undefined,
  };
}
