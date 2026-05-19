import type { NextConfig } from "next";

const withPWA = require("next-pwa")({
  dest: "public",
  disable: false, // Enabled in dev so you can test on mobile
  register: true,
  skipWaiting: true,
});

const nextConfig: NextConfig = {
  turbopack: {},
};

export default withPWA(nextConfig);
