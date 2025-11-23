import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://rttechnologie.com'),
  title: {
    default: "SYMPHONI.A - L'IA qui orchestre vos flux transport",
    template: '%s | SYMPHONI.A'
  },
  description: 'Digitalisez votre logistique avec SYMPHONI.A. Plateforme TMS complète pour industriels, transporteurs, logisticiens, fournisseurs et transitaires. Inscription en 5 minutes.',
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
    'onboarding automatisé'
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
    url: '/',
    title: "SYMPHONI.A - L'IA qui orchestre vos flux transport",
    description: 'Digitalisez votre logistique avec SYMPHONI.A. Solution complète pour tous les acteurs de la supply chain.',
    siteName: 'SYMPHONI.A',
  },
  twitter: {
    card: 'summary_large_image',
    title: "SYMPHONI.A - L'IA qui orchestre vos flux transport",
    description: 'Digitalisez votre logistique avec SYMPHONI.A. Solution complète pour tous les acteurs de la supply chain.',
  },
  icons: {
    icon: '/favicon.ico',
  },
  verification: {
    google: 'google-site-verification-code',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <link rel="canonical" href="https://rttechnologie.com" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
