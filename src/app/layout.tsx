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
  metadataBase: new URL('https://myvoiceboard.com'),
  title: "My Voice Board - Custom Autism Communication Boards",
  description: "Create personalized communication boards for non-verbal children. My Voice Board helps parents and teachers build custom communication board style boards with familiar photos and voices.",
  icons: {
    icon: [
      { url: '/logo.svg', sizes: 'any' },
      { url: '/logo.svg', type: 'image/svg+xml' },
    ],
    apple: '/logo.svg',
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
    <ClerkProvider
      appearance={{
        layout: {
          logoImageUrl: '/logo.svg',
          socialButtonsVariant: 'iconButton',
        },
        variables: {
          colorPrimary: '#7c3aed',       // violet-600
          colorTextOnPrimaryBackground: '#ffffff',
          colorBackground: '#ffffff',
          colorInputBackground: '#f8fafc', // slate-50
          colorInputText: '#1e293b',       // slate-800
          borderRadius: '0.75rem',
          fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
        },
        elements: {
          card: 'shadow-xl border border-slate-200',
          headerTitle: 'text-slate-900 font-bold',
          headerSubtitle: 'text-slate-500',
          formButtonPrimary: 'bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl shadow-md',
          footerActionLink: 'text-violet-600 hover:text-violet-700 font-medium',
          socialButtonsBlockButton: 'border-slate-200 hover:border-violet-300 hover:bg-violet-50 rounded-xl',
          formFieldInput: 'rounded-xl border-slate-200 focus:border-violet-500 focus:ring-violet-500',
          dividerLine: 'bg-slate-200',
          dividerText: 'text-slate-400',
        },
      }}
    >
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
