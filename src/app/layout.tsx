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
  title: "My Voice Board - Custom Autism Communication Boards",
  description: "Create personalized communication boards for non-verbal children. My Voice Board helps parents and teachers build custom communication board style boards with familiar photos and voices.",
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
    title: "My Voice Board - Custom Autism Communication Boards",
    description: "Empower non-verbal children with My Voice Board. The easy way for parents and teachers to create personalized communication boards.",
    images: ['/logo.svg'],
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: "My Voice Board - Custom Autism Communication Boards",
    description: "Create personalized communication boards with custom photos and audio for non-verbal children.",
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
import GlobalHeader from '@/components/GlobalHeader'
import BottomNav from '@/components/BottomNav'
import { SpeedInsights } from '@vercel/speed-insights/next'
import ClerkThemeProvider from '@/components/ClerkThemeProvider'
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration'

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
            <GlobalHeader />
            <div className="pt-14 pb-16 sm:pt-16 sm:pb-0">
              {children}
            </div>
            <BottomNav />
            <Toaster position="top-center" richColors />
            <ServiceWorkerRegistration />
            <SpeedInsights />
          </SettingsProvider>
        </body>
      </html>
    </ClerkThemeProvider>
  );
}
