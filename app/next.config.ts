import type { NextConfig } from "next";

const config: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  experimental: {
    serverActions: { bodySizeLimit: "10mb" },
  },
};

export default config;
