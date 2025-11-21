import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RT Technologie - Inscription Client',
  description: 'Créez votre compte RT Technologie en quelques minutes',
  icons: {
    icon: '/favicon.ico',
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
        {children}
      </body>
    </html>
  );
}
