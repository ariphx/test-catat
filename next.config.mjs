import withPWAInit from "@ducanh2912/next-pwa";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // TERJEMAHKAN LIBRARY: Paksa library modern diterjemahkan ke JavaScript standar
  transpilePackages: [
    "framer-motion",
    "@supabase/supabase-js",
    "@ducanh2912/next-pwa"
  ],

  // PAKSA WEBPACK
  webpack: (config) => {
    return config;
  },
};

// Konfigurasi Plugin PWA
const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
  },
});

// Bungkus dan Export
export default withPWA(nextConfig);
