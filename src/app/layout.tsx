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
  title: "Pic Speak - PECS Communication Board Builder",
  description: "Create personalized PECS boards with custom photos and audio. Help non-verbal children communicate with confidence using familiar pictures and voices.",
  icons: {
    icon: [
      { url: '/logo.png', sizes: 'any' },
      { url: '/logo.png', type: 'image/png' },
    ],
    apple: '/logo.png',
  },
  openGraph: {
    title: "Pic Speak - PECS Communication Board Builder",
    description: "Create personalized PECS boards with custom photos and audio. Help non-verbal children communicate with confidence.",
    images: ['/logo.png'],
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: "Pic Speak - PECS Communication Board Builder",
    description: "Create personalized PECS boards with custom photos and audio.",
    images: ['/logo.png'],
  },
};

import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from 'sonner'
import { SettingsProvider } from '@/contexts/SettingsContext'
import GlobalHeader from '@/components/GlobalHeader'

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
            <div className="pt-14 sm:pt-16">
              {children}
            </div>
            <Toaster position="top-center" richColors />
          </SettingsProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
