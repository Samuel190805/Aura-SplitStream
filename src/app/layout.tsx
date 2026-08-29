import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "SplitStream — Professional AI Audio & Media Suite",
  description:
    "AI source separation, link media downloader, speech-to-speech translation, and local-first audio & video playback.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${inter.variable}`} suppressHydrationWarning>
      <body className={`${inter.className} antialiased min-h-screen bg-black text-white selection:bg-apple-blue selection:text-white`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
