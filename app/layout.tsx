import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Catatan Uang | Kelola Keuangan Pribadi",
  manifest: "/manifest.json",
  themeColor: "#0ea5e9",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  description: "Catat pengeluaran harian dengan mudah dan elegan",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* SCRIPT PENCEGAT BROWSER JADUL */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                // Sengaja mengetes fitur JavaScript modern (Optional Chaining) yang rilis tahun 2020
                new Function("let a; return a?.b;");
              } catch (e) {
                // Kalau browsernya error baca kode di atas, langsung timpa layarnya!
                document.write("<div style='padding: 40px 20px; text-align: center; font-family: sans-serif; background: #f8fafc; height: 100vh;'>");
                document.write("<h1 style='font-size: 50px; margin-bottom: 10px;'>🦖</h1>");
                document.write("<h2 style='color: #0f172a;'>Browser Terlalu Jadul</h2>");
                document.write("<p style='color: #475569; line-height: 1.5;'>Maaf, aplikasi Catatan Uang membutuhkan fitur browser modern untuk berjalan.</p>");
                document.write("<p style='color: #475569; line-height: 1.5;'>Silakan update aplikasi <b>Google Chrome</b> kamu di Play Store ke versi terbaru.</p>");
                document.write("</div>");
                window.stop(); // Hentikan paksa proses loading Next.js biar nggak nge-blank
              }
            `,
          }}
        />
      </head>
      <body className={`${inter.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}
