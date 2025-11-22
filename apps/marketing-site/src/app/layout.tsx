import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://rttechnologie.com'),
  title: {
    default: 'RT Technologie - Plateforme TMS Intelligente pour la Logistique',
    template: '%s | RT Technologie'
  },
  description: 'Digitalisez votre logistique avec RT Technologie. Plateforme TMS complète pour industriels, transporteurs, logisticiens, fournisseurs et transitaires. Inscription en 5 minutes.',
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
  authors: [{ name: 'RT Technologie' }],
  creator: 'RT Technologie',
  publisher: 'RT Technologie',
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
    title: 'RT Technologie - Plateforme TMS Intelligente',
    description: 'Digitalisez votre logistique avec RT Technologie. Solution complète pour tous les acteurs de la supply chain.',
    siteName: 'RT Technologie',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RT Technologie - Plateforme TMS Intelligente',
    description: 'Digitalisez votre logistique avec RT Technologie. Solution complète pour tous les acteurs de la supply chain.',
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
