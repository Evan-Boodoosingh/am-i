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
        url: '/images/logo.png',
        width: 800,
        height: 800,
        alt: 'Am I? Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Am I?",
    description: "A two-player, real-time pop-culture deduction game.",
    images: ['/images/logo.png'],
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