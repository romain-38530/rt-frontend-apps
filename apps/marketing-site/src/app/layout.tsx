import type { Metadata } from 'next';
import './globals.css';
import { Navbar, Footer } from '../../../../src/components';
import { Providers } from './providers';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://symphonia-controltower.com'),
  title: {
    default: "SYMPHONI.A - L'IA qui orchestre vos flux transport",
    template: '%s | SYMPHONI.A'
  },
  description: 'Digitalisez votre logistique avec SYMPHONI.A. Plateforme TMS complète avec IA intégrée : e-CMR, AFFRET.IA, planification intelligente. 6 portails métier pour industriels, transporteurs, logisticiens.',
  keywords: [
    'TMS',
    'Transport Management System',
    'logistique',
    'gestion transport',
    'plateforme logistique',
    'industriel',
    'transporteur',
    'logisticien',
    'fournisseur',
    'transitaire',
    'destinataire',
    'digitalisation logistique',
    'supply chain',
    'chaîne logistique',
    'signature électronique',
    'onboarding automatisé',
    'e-CMR',
    'lettre de voiture électronique',
    'AFFRET.IA',
    'IA logistique',
    'intelligence artificielle transport',
    'optimisation route',
    'planification chargement',
    'bourse fret maritime',
    'chatbot support',
    'API transport'
  ],
  authors: [{ name: 'SYMPHONI.A' }],
  creator: 'SYMPHONI.A',
  publisher: 'SYMPHONI.A',
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
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://symphonia-controltower.com',
    title: "SYMPHONI.A - L'IA qui orchestre vos flux transport",
    description: 'Digitalisez votre logistique avec SYMPHONI.A. Plateforme TMS complète avec IA intégrée pour industriels, transporteurs et logisticiens.',
    siteName: 'SYMPHONI.A',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SYMPHONI.A - Plateforme TMS avec IA',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "SYMPHONI.A - L'IA qui orchestre vos flux transport",
    description: 'Digitalisez votre logistique avec SYMPHONI.A. Plateforme TMS complète avec IA intégrée.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: 'https://symphonia-controltower.com',
    languages: {
      'fr-FR': 'https://symphonia-controltower.com',
    },
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="antialiased">
        <Providers>
          <Navbar />
          <main>{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
