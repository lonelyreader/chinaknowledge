import type { MetadataRoute } from "next";

import { validateServerEnvironment } from "@/config/environment";

export default function robots(): MetadataRoute.Robots {
  const { indexable } = validateServerEnvironment();
  return {
    rules: indexable
      ? { allow: "/", userAgent: "*" }
      : { disallow: "/", userAgent: "*" },
  };
}
