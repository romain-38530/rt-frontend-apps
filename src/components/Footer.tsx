/**
 * Footer - Pied de page
 *
 * Affiche le logo Symphoni.a, les liens utiles et les informations légales
 */

'use client';

import React from 'react';
import { LogoFooter } from './Logo';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Section principale */}
        <div className="footer-main">
          {/* Colonne Logo + Description */}
          <div className="footer-brand">
            <LogoFooter href="/" />
            <p className="footer-description">
              L'IA qui orchestre vos flux transport. Digitalisez votre logistique
              avec SYMPHONI.A, la plateforme TMS complète pour tous les acteurs
              de la supply chain.
            </p>
          </div>

          {/* Colonne Produit */}
          <div className="footer-column">
            <h3 className="footer-title">Produit</h3>
            <ul className="footer-links">
              <li><a href="/portals">Solutions</a></li>
              <li><a href="/select-account-type">Types de Comptes</a></li>
              <li><a href="/subscription">Tarifs</a></li>
              <li><a href="/onboarding">Inscription</a></li>
            </ul>
          </div>

          {/* Colonne Entreprise */}
          <div className="footer-column">
            <h3 className="footer-title">Entreprise</h3>
            <ul className="footer-links">
              <li><a href="/about">À propos</a></li>
              <li><a href="/contact">Contact</a></li>
              <li><a href="/careers">Carrières</a></li>
              <li><a href="/blog">Blog</a></li>
            </ul>
          </div>

          {/* Colonne Légal */}
          <div className="footer-column">
            <h3 className="footer-title">Légal</h3>
            <ul className="footer-links">
              <li><a href="/privacy">Confidentialité</a></li>
              <li><a href="/terms">CGU</a></li>
              <li><a href="/mentions-legales">Mentions légales</a></li>
              <li><a href="/cookies">Cookies</a></li>
            </ul>
          </div>
        </div>

        {/* Barre de copyright */}
        <div className="footer-bottom">
          <p className="footer-copyright">
            © {currentYear} SYMPHONI.A. Tous droits réservés.
          </p>
          <div className="footer-social">
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
              <svg className="social-icon" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
              </svg>
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
              <svg className="social-icon" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>

      <style jsx>{`
        .footer {
          background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%);
          color: white;
          padding: 60px 24px 24px;
          margin-top: 80px;
        }

        .footer-container {
          max-width: 1400px;
          margin: 0 auto;
        }

        .footer-main {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 40px;
          margin-bottom: 40px;
        }

        @media (max-width: 1024px) {
          .footer-main {
            grid-template-columns: 1fr 1fr;
            gap: 32px;
          }
        }

        @media (max-width: 640px) {
          .footer-main {
            grid-template-columns: 1fr;
            gap: 32px;
          }
        }

        .footer-brand {
          max-width: 400px;
        }

        .footer-description {
          margin-top: 16px;
          color: #cbd5e1;
          font-size: 14px;
          line-height: 1.6;
        }

        .footer-column {
        }

        .footer-title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 16px;
          color: white;
        }

        .footer-links {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .footer-links li {
          margin-bottom: 12px;
        }

        .footer-links a {
          color: #cbd5e1;
          text-decoration: none;
          font-size: 14px;
          transition: color 0.2s;
        }

        .footer-links a:hover {
          color: #f97316;
        }

        .footer-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 24px;
          border-top: 1px solid rgba(203, 213, 225, 0.2);
        }

        @media (max-width: 640px) {
          .footer-bottom {
            flex-direction: column;
            gap: 16px;
            text-align: center;
          }
        }

        .footer-copyright {
          color: #94a3b8;
          font-size: 14px;
          margin: 0;
        }

        .footer-social {
          display: flex;
          gap: 16px;
        }

        .footer-social a {
          color: #cbd5e1;
          transition: color 0.2s;
        }

        .footer-social a:hover {
          color: #f97316;
        }

        .social-icon {
          width: 20px;
          height: 20px;
        }
      `}</style>
    </footer>
  );
}
