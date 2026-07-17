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
  const imageUrl = `${protocol}://${host}/og.png`;

  return {
    title: "Project Ganymede",
    description: "An autonomous mission platform for planning humanity's next frontier.",
    openGraph: {
      title: "Project Ganymede",
      description: "An autonomous mission platform for planning humanity's next frontier.",
      images: [{ url: imageUrl, width: 1200, height: 630, alt: "Project Ganymede ASCII moon" }],
    },
    twitter: { card: "summary_large_image", title: "Project Ganymede", description: "An autonomous mission platform for humanity's next frontier.", images: [imageUrl] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body>
    </html>
  );
}
