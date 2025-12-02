/**
 * Navbar - Barre de navigation principale
 *
 * Affiche le logo Symphoni.a et les liens de navigation principaux
 */

'use client';

import React, { useState } from 'react';
import { LogoNav } from './Logo';

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <div className="navbar-logo">
          <LogoNav href="/" />
        </div>

        {/* Menu desktop */}
        <div className="navbar-menu-desktop">
          <a href="/portals" className="navbar-link">Solutions</a>
          <a href="/subscription" className="navbar-link">Tarifs</a>
          <a href="/onboarding" className="navbar-link">Inscription</a>
        </div>

        {/* CTA Buttons */}
        <div className="navbar-cta">
          <a href="/connexion" className="btn-secondary">
            Connexion
          </a>
          <a href="/onboarding" className="btn-primary">
            Commencer →
          </a>
        </div>

        {/* Mobile menu button */}
        <button
          className="navbar-mobile-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Menu"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {mobileMenuOpen ? (
              <path d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Menu mobile */}
      {mobileMenuOpen && (
        <div className="navbar-menu-mobile">
          <a href="/portals" className="navbar-link-mobile">Solutions</a>
          <a href="/subscription" className="navbar-link-mobile">Tarifs</a>
          <a href="/onboarding" className="navbar-link-mobile">Inscription</a>
          <div className="navbar-mobile-cta">
            <a href="/connexion" className="btn-secondary">
              Connexion
            </a>
            <a href="/onboarding" className="btn-primary">
              Commencer →
            </a>
          </div>
        </div>
      )}

      <style jsx>{`
        .navbar {
          background: white;
          border-bottom: 1px solid #e5e7eb;
          position: sticky;
          top: 0;
          z-index: 50;
        }

        .navbar-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 16px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .navbar-logo {
          flex-shrink: 0;
        }

        .navbar-menu-desktop {
          display: none;
          gap: 32px;
          align-items: center;
        }

        @media (min-width: 768px) {
          .navbar-menu-desktop {
            display: flex;
          }
        }

        .navbar-link {
          color: #1e3a5f;
          text-decoration: none;
          font-weight: 500;
          font-size: 15px;
          transition: color 0.2s;
        }

        .navbar-link:hover {
          color: #f97316;
        }

        .navbar-cta {
          display: none;
          gap: 12px;
          align-items: center;
        }

        @media (min-width: 768px) {
          .navbar-cta {
            display: flex;
          }
        }

        .btn-secondary {
          color: #1e3a5f;
          padding: 10px 20px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          font-size: 15px;
          transition: all 0.3s;
          display: inline-block;
          border: 2px solid #e5e7eb;
          background: white;
        }

        .btn-secondary:hover {
          border-color: #f97316;
          color: #f97316;
        }

        .btn-primary {
          background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
          color: white;
          padding: 10px 24px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          font-size: 15px;
          transition: all 0.3s;
          display: inline-block;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(249, 115, 22, 0.4);
        }

        .navbar-mobile-btn {
          display: block;
          background: none;
          border: none;
          color: #1e3a5f;
          cursor: pointer;
          padding: 8px;
        }

        @media (min-width: 768px) {
          .navbar-mobile-btn {
            display: none;
          }
        }

        .navbar-mobile-btn svg {
          width: 24px;
          height: 24px;
        }

        .navbar-menu-mobile {
          display: flex;
          flex-direction: column;
          padding: 16px 24px;
          border-top: 1px solid #e5e7eb;
          background: white;
        }

        @media (min-width: 768px) {
          .navbar-menu-mobile {
            display: none;
          }
        }

        .navbar-link-mobile {
          color: #1e3a5f;
          text-decoration: none;
          font-weight: 500;
          font-size: 16px;
          padding: 12px 0;
          border-bottom: 1px solid #f3f4f6;
        }

        .navbar-link-mobile:last-child {
          border-bottom: none;
        }

        .navbar-mobile-cta {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #e5e7eb;
        }

        .navbar-mobile-cta .btn-secondary,
        .navbar-mobile-cta .btn-primary {
          text-align: center;
        }
      `}</style>
    </nav>
  );
}
