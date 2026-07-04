import type { Metadata, Viewport } from "next";
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
  metadataBase: new URL('https://www.myvoiceboard.com'),
  alternates: {
    canonical: '/',
  },
  title: "My Voice Board | Custom AAC & Communication Boards for All Ages",
  description: "Create personalized communication boards for non-verbal children and adults. An intuitive AAC app ideal for autism, PECS alternatives, stroke recovery, and aphasia. Add familiar photos and voices.",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  icons: {
    icon: [
      { url: '/logo.svg', sizes: 'any' },
      { url: '/logo.svg', type: 'image/svg+xml' },
    ],
    apple: '/icons/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Voice Board',
  },
  openGraph: {
    title: "My Voice Board | Custom AAC & Communication Boards for All Ages",
    description: "Create personalized communication boards for non-verbal children and adults. Ideal for autism, stroke recovery, and aphasia.",
    images: ['/logo.svg'],
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: "My Voice Board | Custom AAC & Communication Boards for All Ages",
    description: "Create personalized communication boards with custom photos and audio for non-verbal children and adults.",
    images: ['/logo.svg'],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
    { media: '(prefers-color-scheme: dark)', color: '#020617' },
  ],
};

import { Toaster } from 'sonner'
import { SettingsProvider } from '@/contexts/SettingsContext'
import { LockModeProvider } from '@/contexts/LockModeContext'
import GlobalHeader from '@/components/GlobalHeader'
import BottomNav from '@/components/BottomNav'
import MainFrame from '@/components/MainFrame'
import { SpeedInsights } from '@vercel/speed-insights/next'
import ClerkThemeProvider from '@/components/ClerkThemeProvider'
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration'
import DocumentCacheWarmer from '@/components/DocumentCacheWarmer'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkThemeProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <SettingsProvider>
            <LockModeProvider>
              <GlobalHeader />
              <MainFrame>
                {children}
              </MainFrame>
              <BottomNav />
              <Toaster position="top-center" richColors />
              <ServiceWorkerRegistration />
              <DocumentCacheWarmer />
              <SpeedInsights />
            </LockModeProvider>
          </SettingsProvider>
        </body>
      </html>
    </ClerkThemeProvider>
  );
}
