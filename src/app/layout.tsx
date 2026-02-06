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
  metadataBase: new URL('https://pic-speak.vercel.app'),
  title: "Pic Speak - PECS Communication Board Builder",
  description: "Create personalized PECS boards with custom photos and audio. Help non-verbal children communicate with confidence using familiar pictures and voices.",
  icons: {
    icon: [
      { url: '/logo.svg', sizes: 'any' },
      { url: '/logo.svg', type: 'image/svg+xml' },
    ],
    apple: '/logo.svg',
  },
  openGraph: {
    title: "Pic Speak - PECS Communication Board Builder",
    description: "Create personalized PECS boards with custom photos and audio. Help non-verbal children communicate with confidence.",
    images: ['/logo.svg'],
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: "Pic Speak - PECS Communication Board Builder",
    description: "Create personalized PECS boards with custom photos and audio.",
    images: ['/logo.svg'],
  },
};

import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from 'sonner'
import { SettingsProvider } from '@/contexts/SettingsContext'
import GlobalHeader from '@/components/GlobalHeader'
import BottomNav from '@/components/BottomNav'
import { SpeedInsights } from '@vercel/speed-insights/next'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <SettingsProvider>
            <GlobalHeader />
            <div className="pt-14 pb-16 sm:pt-16 sm:pb-0">
              {children}
            </div>
            <BottomNav />
            <Toaster position="top-center" richColors />
            <SpeedInsights />
          </SettingsProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
