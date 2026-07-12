import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Nunito } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Rounded, friendly display face for headings — warmer than Geist for
// an app used by families, teachers and carers
const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
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
    { media: '(prefers-color-scheme: light)', color: '#faf9fd' },
    { media: '(prefers-color-scheme: dark)', color: '#0f1020' },
  ],
  // Lets fixed bars extend under the iPhone notch/home indicator,
  // padded back out with env(safe-area-inset-*)
  viewportFit: 'cover',
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
import OfflineIndicator from '@/components/OfflineIndicator'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkThemeProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} ${nunito.variable} antialiased`}
        >
          <SettingsProvider>
            <LockModeProvider>
              <GlobalHeader />
              <MainFrame>
                {children}
              </MainFrame>
              <BottomNav />
              <Toaster position="top-center" richColors />
              <OfflineIndicator />
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
