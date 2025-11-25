/**
 * Logo Symphoni.a - Control Tower
 *
 * Composant réutilisable pour afficher le logo de l'entreprise
 * avec son icône de routes convergentes et le tagline "CONTROL TOWER"
 */

import React from 'react';

interface LogoProps {
  /** Largeur du logo en pixels (default: 400) */
  width?: number;
  /** Hauteur du logo en pixels (default: 120) */
  height?: number;
  /** Afficher le tagline "CONTROL TOWER" (default: true) */
  showTagline?: boolean;
  /** Classe CSS additionnelle */
  className?: string;
  /** URL de redirection au clic (default: '/') */
  href?: string;
}

export function Logo({
  width = 400,
  height = 120,
  showTagline = true,
  className = '',
  href = '/'
}: LogoProps) {
  const scaleFactor = width / 400; // Ratio pour le scaling

  const logoSvg = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 400 120"
      width={width}
      height={height}
      className={className}
      style={{ display: 'block' }}
    >
      <defs>
        {/* Gradient orange */}
        <linearGradient id="orangeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#f97316' }} />
          <stop offset="100%" style={{ stopColor: '#ea580c' }} />
        </linearGradient>

        {/* Bleu marine */}
        <linearGradient id="navyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#1e3a5f' }} />
          <stop offset="100%" style={{ stopColor: '#0f172a' }} />
        </linearGradient>
      </defs>

      {/* Icône : Routes/flux convergents vers un point central */}
      <g transform="translate(20, 15)">
        {/* Hexagone de fond subtil */}
        <polygon points="45,5 80,25 80,65 45,85 10,65 10,25" fill="none" stroke="#cbd5e1" strokeWidth="1"/>

        {/* Routes convergentes */}
        <g stroke="url(#orangeGradient)" strokeWidth="3" strokeLinecap="round" fill="none">
          {/* Route Nord */}
          <path d="M45 8 L45 35"/>

          {/* Route Nord-Est */}
          <path d="M75 22 L52 40"/>

          {/* Route Sud-Est */}
          <path d="M75 68 L52 50"/>

          {/* Route Sud */}
          <path d="M45 82 L45 55"/>

          {/* Route Sud-Ouest */}
          <path d="M15 68 L38 50"/>

          {/* Route Nord-Ouest */}
          <path d="M15 22 L38 40"/>
        </g>

        {/* Points aux extrémités */}
        <g fill="url(#orangeGradient)">
          <circle cx="45" cy="5" r="4"/>
          <circle cx="78" cy="20" r="4"/>
          <circle cx="78" cy="70" r="4"/>
          <circle cx="45" cy="85" r="4"/>
          <circle cx="12" cy="70" r="4"/>
          <circle cx="12" cy="20" r="4"/>
        </g>

        {/* Point central - Control Tower */}
        <circle cx="45" cy="45" r="14" fill="#1e3a5f"/>
        <circle cx="45" cy="45" r="10" fill="url(#orangeGradient)"/>
        <circle cx="45" cy="45" r="4" fill="#ffffff"/>
      </g>

      {/* Texte principal - symphon en bleu marine, i.a en orange */}
      <text
        x="115"
        y="55"
        fontFamily="'SF Pro Display', 'Helvetica Neue', Arial, sans-serif"
        fontSize="40"
        fontWeight="500"
        fill="#1e3a5f"
        letterSpacing="-1"
      >
        symphon
        <tspan fontWeight="700" fill="url(#orangeGradient)">i.a</tspan>
      </text>

      {/* Tagline élégante */}
      {showTagline && (
        <g>
          {/* Ligne avant */}
          <line x1="115" y1="75" x2="145" y2="75" stroke="url(#orangeGradient)" strokeWidth="2" strokeLinecap="round"/>

          <text
            x="155"
            y="79"
            fontFamily="'SF Pro Display', 'Helvetica Neue', Arial, sans-serif"
            fontSize="11"
            fontWeight="500"
            fill="#64748b"
            letterSpacing="2"
          >
            CONTROL TOWER
          </text>

          {/* Ligne après */}
          <line x1="295" y1="75" x2="320" y2="75" stroke="url(#orangeGradient)" strokeWidth="2" strokeLinecap="round"/>
        </g>
      )}
    </svg>
  );

  // Si pas de href, retourner juste le SVG
  if (!href) {
    return logoSvg;
  }

  // Sinon, wrapper dans un lien
  return (
    <a href={href} style={{ textDecoration: 'none', display: 'inline-block' }}>
      {logoSvg}
    </a>
  );
}

/**
 * Variante compacte du logo (sans tagline, plus petit)
 */
export function LogoCompact(props: Omit<LogoProps, 'showTagline'>) {
  return <Logo {...props} showTagline={false} height={60} width={200} />;
}

/**
 * Logo pour navbar (taille optimisée)
 */
export function LogoNav(props: Omit<LogoProps, 'width' | 'height'>) {
  return <Logo {...props} width={250} height={75} />;
}

/**
 * Logo pour footer (taille optimisée)
 */
export function LogoFooter(props: Omit<LogoProps, 'width' | 'height'>) {
  return <Logo {...props} width={300} height={90} />;
}
