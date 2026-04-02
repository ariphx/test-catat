import type { NextConfig } from "next";

// 1. Konfigurasi Plugin PWA
const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
  },
});

// 2. Konfigurasi Utama Next.js
const nextConfig: NextConfig = {
  // MATIKAN MINIFY: Mencegah error kompresi kode di browser lama
  swcMinify: false,

  // TERJEMAHKAN LIBRARY: Paksa library modern diterjemahkan ke JavaScript standar
  transpilePackages: [
    "framer-motion",
    "@supabase/supabase-js",
    "@ducanh2912/next-pwa"
  ],

  // PAKSA WEBPACK: Mencegah Next.js 16 memaksa Turbopack yang bikin build PWA gagal
  webpack: (config: any) => {
    return config;
  },
};

// 3. Bungkus dan Export
export default withPWA(nextConfig);
