import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateServerEnvironment } from "./src/config/environment";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const serverEnvironment = validateServerEnvironment();

const securityHeaders = [
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
];

if (!serverEnvironment.indexable) {
  securityHeaders.push({ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" });
}

if (serverEnvironment.environment !== "local") {
  securityHeaders.push({ key: "Strict-Transport-Security", value: "max-age=31536000" });
}

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  images: {
    localPatterns: [
      { pathname: "/images/**" },
      { pathname: "/api/media/file/**" },
    ],
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      ".cjs": [".cts", ".cjs"],
      ".js": [".ts", ".tsx", ".js", ".jsx"],
      ".mjs": [".mts", ".mjs"],
    };
    return webpackConfig;
  },
  turbopack: {
    root: dirname,
  },
};

export default withPayload(nextConfig, { devBundleServerPackages: false });
