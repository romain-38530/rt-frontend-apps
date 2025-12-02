/**
 * Page Success - Carte bancaire enregistrée avec succès
 */

'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

function SuccessContent() {
  const searchParams = useSearchParams();
  const requestId = searchParams?.get('requestId');

  return (
    <div className="success-page">
      <div className="container">
        {/* Logo */}
        <div className="logo-container">
          <Image
            src="/symphonia-logo.png"
            alt="SYMPHONI.A"
            width={250}
            height={60}
            priority
          />
        </div>

        {/* Success Card */}
        <div className="success-card">
          <div className="success-icon">✓</div>

          <h1>Carte enregistrée avec succès !</h1>

          <p className="success-message">
            Merci ! Vos coordonnées bancaires ont été enregistrées de manière sécurisée.
          </p>

          <div className="next-steps">
            <h2>Prochaines étapes</h2>
            <ul>
              <li>
                <span className="step-number">1</span>
                <div>
                  <strong>Validation de votre dossier</strong>
                  <p>Notre équipe va valider votre demande d'inscription</p>
                </div>
              </li>
              <li>
                <span className="step-number">2</span>
                <div>
                  <strong>Création de votre compte</strong>
                  <p>Vous recevrez vos identifiants de connexion par email</p>
                </div>
              </li>
              <li>
                <span className="step-number">3</span>
                <div>
                  <strong>Accès à la plateforme</strong>
                  <p>Connectez-vous et commencez à utiliser SYMPHONI.A</p>
                </div>
              </li>
            </ul>
          </div>

          {requestId && (
            <div className="reference">
              <p className="label">Référence</p>
              <p className="value">{requestId}</p>
            </div>
          )}

          <div className="timeline">
            <span className="clock">⏱️</span>
            <span>Délai estimé : 24 à 48 heures ouvrées</span>
          </div>

          <Link href="/" className="btn-home">
            Retour à l'accueil
          </Link>
        </div>

        {/* Contact */}
        <div className="contact-info">
          <p>
            Des questions ? Contactez-nous à{' '}
            <a href="mailto:support@symphonia-controltower.com">
              support@symphonia-controltower.com
            </a>
          </p>
        </div>
      </div>

      <style jsx>{`
        .success-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
          padding: 40px 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .container {
          max-width: 600px;
          width: 100%;
        }

        .logo-container {
          text-align: center;
          margin-bottom: 32px;
        }

        .success-card {
          background: white;
          border-radius: 20px;
          padding: 48px 40px;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
          text-align: center;
        }

        .success-icon {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
          font-size: 40px;
          color: white;
          font-weight: bold;
        }

        h1 {
          font-size: 28px;
          font-weight: 700;
          color: #065f46;
          margin: 0 0 16px 0;
        }

        .success-message {
          font-size: 16px;
          color: #374151;
          margin: 0 0 32px 0;
          line-height: 1.6;
        }

        .next-steps {
          background: #f0fdf4;
          border: 2px solid #86efac;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
          text-align: left;
        }

        .next-steps h2 {
          margin: 0 0 20px 0;
          font-size: 18px;
          color: #166534;
        }

        .next-steps ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .next-steps li {
          display: flex;
          gap: 16px;
          margin-bottom: 16px;
          align-items: flex-start;
        }

        .next-steps li:last-child {
          margin-bottom: 0;
        }

        .step-number {
          width: 28px;
          height: 28px;
          background: #10b981;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 14px;
          flex-shrink: 0;
        }

        .next-steps li strong {
          display: block;
          color: #166534;
          margin-bottom: 4px;
        }

        .next-steps li p {
          margin: 0;
          font-size: 14px;
          color: #4b5563;
        }

        .reference {
          background: #f3f4f6;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 20px;
        }

        .reference .label {
          margin: 0 0 4px 0;
          font-size: 12px;
          color: #6b7280;
          text-transform: uppercase;
        }

        .reference .value {
          margin: 0;
          font-family: monospace;
          font-size: 14px;
          color: #374151;
          font-weight: 600;
        }

        .timeline {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: #6b7280;
          font-size: 14px;
          margin-bottom: 24px;
        }

        .clock {
          font-size: 18px;
        }

        .btn-home {
          display: inline-block;
          padding: 14px 32px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          text-decoration: none;
          border-radius: 10px;
          font-weight: 600;
          font-size: 16px;
          transition: all 0.3s;
        }

        .btn-home:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
        }

        .contact-info {
          text-align: center;
          margin-top: 24px;
        }

        .contact-info p {
          font-size: 14px;
          color: #4b5563;
          margin: 0;
        }

        .contact-info a {
          color: #059669;
          text-decoration: none;
          font-weight: 500;
        }

        @media (max-width: 600px) {
          .success-card {
            padding: 32px 24px;
          }

          h1 {
            font-size: 24px;
          }
        }
      `}</style>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#ecfdf5'
      }}>
        Chargement...
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
