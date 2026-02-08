import type { NextConfig } from "next";
import type { RemotePattern } from "next/dist/shared/lib/image-config";

const imageHostValues = (process.env.NEXT_PUBLIC_IMAGE_HOSTS ?? "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

const apiUrl = (process.env.NEXT_PUBLIC_API_URL ?? "").trim();
if (apiUrl) imageHostValues.push(apiUrl);

const imageHosts = Array.from(new Set(imageHostValues));

const remotePatterns: RemotePattern[] = imageHosts.map((value) => {
  const withProtocol = value.includes("://") ? value : `https://${value}`;
  const url = new URL(withProtocol);
  return {
    protocol: url.protocol === "http:" ? "http" : "https",
    hostname: url.hostname,
    ...(url.port ? { port: url.port } : {}),
  };
});

if (process.env.NODE_ENV !== "production") {
  remotePatterns.push(
    { protocol: "http", hostname: "localhost", port: "4000" },
    { protocol: "http", hostname: "127.0.0.1", port: "4000" }
  );
}

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: remotePatterns.length ? remotePatterns : undefined,
  },
};

export default nextConfig;
