import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://am-i.pro'),
  title: "Am I?",
  description: "A two-player, real-time pop-culture deduction game.",
  openGraph: {
    title: "Am I?",
    description: "A two-player, real-time pop-culture deduction game.",
    url: 'https://am-i.pro',
    siteName: "Am I?",
    images: [
      {
        url: '/opengraph-image', // Points directly to your Next.js generated logo card
        width: 1200,
        height: 630,
        alt: 'Am I? Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary', // Change from 'summary_large_image' to 'summary' to force a compact square thumbnail style instead of a huge block
    title: "Am I?",
    description: "A two-player, real-time pop-culture deduction game.",
    images: ['https://am-i.pro/opengraph-image'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}