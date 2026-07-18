import type { Metadata } from "next";
import { headers } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "neptune-onboarding-seoul.duddlfqotl.chatgpt.site";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";
  const imageUrl = `${protocol}://${host}/og-v2.png`;

  return {
    title: "Ganymede Index — Digital Asset ETF Strategies",
    description: "Research, compare and track rules-based digital asset ETF strategies on GIWA Testnet.",
    openGraph: {
      title: "Ganymede Index — Digital Asset ETF Strategies",
      description: "Research, compare and track rules-based digital asset ETF strategies on GIWA Testnet.",
      images: [{ url: imageUrl, width: 1200, height: 630, alt: "Ganymede Index digital asset ETF platform" }],
    },
    twitter: { card: "summary_large_image", title: "Ganymede Index — Digital Asset ETF Strategies", description: "Research, compare and track rules-based digital asset ETF strategies on GIWA Testnet.", images: [imageUrl] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body>
    </html>
  );
}
