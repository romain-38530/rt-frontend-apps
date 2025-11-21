import type { Metadata, Viewport } from 'next';
import './globals.css';

// Metadata SEO optimisée
export const metadata: Metadata = {
  title: {
    default: 'RT Technologie - Solution TMS Cloud pour le Transport et la Logistique',
    template: '%s | RT Technologie'
  },
  description: 'RT Technologie propose une solution TMS cloud innovante pour optimiser la gestion du transport et de la logistique. Inscription en ligne simple et rapide. Essai gratuit disponible.',
  keywords: ['TMS', 'Transport Management System', 'Logistique', 'Transport', 'Cloud', 'Gestion transport', 'RT Technologie', 'Solution SaaS'],
  authors: [{ name: 'RT Technologie' }],
  creator: 'RT Technologie',
  publisher: 'RT Technologie',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://rt-technologie.fr'),
  alternates: {
    canonical: '/',
    languages: {
      'fr-FR': '/fr',
    },
  },
  openGraph: {
    title: 'RT Technologie - Solution TMS Cloud',
    description: 'Solution TMS cloud pour optimiser votre gestion du transport et de la logistique',
    url: 'https://rt-technologie.fr',
    siteName: 'RT Technologie',
    locale: 'fr_FR',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'RT Technologie - Solution TMS Cloud',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RT Technologie - Solution TMS Cloud',
    description: 'Solution TMS cloud pour optimiser votre gestion du transport',
    images: ['/twitter-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/manifest.json',
  verification: {
    google: 'votre-code-verification-google',
    // Ajoutez d'autres vérifications si nécessaire
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#6366f1' },
    { media: '(prefers-color-scheme: dark)', color: '#4338ca' },
  ],
};

// Structured Data (JSON-LD)
const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'RT Technologie',
  url: 'https://rt-technologie.fr',
  logo: 'https://rt-technologie.fr/logo.png',
  description: 'Solution TMS cloud pour la gestion du transport et de la logistique',
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'FR',
  },
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'Customer Service',
    availableLanguage: ['French'],
  },
  sameAs: [
    // Ajoutez vos réseaux sociaux
    // 'https://www.linkedin.com/company/rt-technologie',
    // 'https://twitter.com/rt_technologie',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className="antialiased">
        {/* Skip to main content pour accessibilité */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-indigo-600 focus:text-white"
        >
          Aller au contenu principal
        </a>
        <main id="main-content" className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
