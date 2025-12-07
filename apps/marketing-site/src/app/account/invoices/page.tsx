/**
 * Page Espace Factures - Portail client pour consulter et télécharger les factures
 *
 * URL: /account/invoices?email=xxx ou /account/invoices?requestId=xxx
 */

'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useToast } from '@rt/ui-components';

// Configuration
const API_URL = process.env.NEXT_PUBLIC_SUBSCRIPTIONS_API_URL || 'https://d39uizi9hzozo8.cloudfront.net';

interface Invoice {
  _id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  planName: string;
  periodLabel: string;
  amounts: {
    baseAmount: number;
    discount: number;
    discountPercent: number;
    amountHT: number;
    tva: number;
    amountTTC: number;
  };
  status: string;
  paidAt: string;
  emailSent: boolean;
}

interface SubscriptionStatus {
  requestId: string;
  email: string;
  companyName: string;
  subscriptionType: string;
  duration: string;
  stripeSubscriptionId: string | null;
  subscriptionStatus: string;
  currentPeriodEnd: string | null;
  cancelAt: string | null;
}

function InvoicesContent() {
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);

  const email = searchParams?.get('email');
  const requestId = searchParams?.get('requestId');

  useEffect(() => {
    if (!email && !requestId) {
      setError('Lien invalide. Veuillez utiliser le lien reçu par email.');
      setLoading(false);
      return;
    }

    fetchData();
  }, [email, requestId]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch subscription status
      const statusParams = new URLSearchParams();
      if (email) statusParams.append('email', email);
      if (requestId) statusParams.append('requestId', requestId);

      const statusResponse = await fetch(`${API_URL}/api/stripe/subscription-status?${statusParams}`);
      const statusData = await statusResponse.json();

      if (statusData.success) {
        setSubscription(statusData.data);

        // Fetch invoices using email from subscription
        const invoiceEmail = statusData.data.email || email;
        if (invoiceEmail) {
          const invoicesResponse = await fetch(`${API_URL}/api/stripe/invoices?email=${encodeURIComponent(invoiceEmail)}`);
          const invoicesData = await invoicesResponse.json();

          if (invoicesData.success) {
            setInvoices(invoicesData.data || []);
          }
        }
      } else {
        setError(statusData.error?.message || 'Erreur lors de la récupération des données');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async (invoiceNumber: string) => {
    setDownloadingId(invoiceNumber);
    try {
      const response = await fetch(`${API_URL}/api/stripe/invoices/${invoiceNumber}/pdf`);

      if (!response.ok) {
        throw new Error('Erreur lors du téléchargement');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download error:', err);
      toast.error('Erreur lors du téléchargement de la facture');
    } finally {
      setDownloadingId(null);
    }
  };

  const resendInvoice = async (invoiceNumber: string) => {
    setResendingId(invoiceNumber);
    try {
      const response = await fetch(`${API_URL}/api/stripe/invoices/${invoiceNumber}/resend`, {
        method: 'POST'
      });
      const data = await response.json();

      if (data.success) {
        toast.success('Facture renvoyée par email avec succès !');
      } else {
        toast.error(data.error || 'Erreur lors de l\'envoi');
      }
    } catch (err) {
      console.error('Resend error:', err);
      toast.error('Erreur lors de l\'envoi de la facture');
    } finally {
      setResendingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      paid: { label: 'Payée', className: 'bg-green-100 text-green-800' },
      pending: { label: 'En attente', className: 'bg-yellow-100 text-yellow-800' },
      active: { label: 'Actif', className: 'bg-green-100 text-green-800' },
      canceled: { label: 'Annulé', className: 'bg-red-100 text-red-800' },
      past_due: { label: 'En retard', className: 'bg-red-100 text-red-800' }
    };

    const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.className}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="invoices-page">
        <div className="container">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Chargement de vos factures...</p>
          </div>
        </div>
        <style jsx>{styles}</style>
      </div>
    );
  }

  return (
    <div className="invoices-page">
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

        {/* Header */}
        <header className="header">
          <h1>Espace Facturation</h1>
          <p>Consultez et téléchargez vos factures</p>
        </header>

        {/* Error */}
        {error && (
          <div className="error-card">
            <span className="error-icon">!</span>
            <div>
              <h3>Erreur</h3>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Subscription Info */}
        {subscription && (
          <div className="subscription-card">
            <div className="subscription-header">
              <div>
                <h2>{subscription.companyName || 'Mon compte'}</h2>
                <p className="email">{subscription.email}</p>
              </div>
              {getStatusBadge(subscription.subscriptionStatus)}
            </div>

            <div className="subscription-details">
              <div className="detail-item">
                <span className="label">Abonnement</span>
                <span className="value">{subscription.subscriptionType?.replace('_', ' ').toUpperCase() || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <span className="label">Durée</span>
                <span className="value">{subscription.duration} mois</span>
              </div>
              {subscription.currentPeriodEnd && (
                <div className="detail-item">
                  <span className="label">Prochaine facture</span>
                  <span className="value">{formatDate(subscription.currentPeriodEnd)}</span>
                </div>
              )}
              {subscription.cancelAt && (
                <div className="detail-item">
                  <span className="label">Fin de contrat</span>
                  <span className="value">{formatDate(subscription.cancelAt)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Invoices List */}
        <div className="invoices-section">
          <h3>Mes factures</h3>

          {invoices.length === 0 ? (
            <div className="no-invoices">
              <span className="icon">-</span>
              <p>Aucune facture disponible pour le moment.</p>
              <p className="hint">Vos factures apparaîtront ici après votre premier prélèvement.</p>
            </div>
          ) : (
            <div className="invoices-table">
              <div className="table-header">
                <div className="col-number">N° Facture</div>
                <div className="col-date">Date</div>
                <div className="col-period">Période</div>
                <div className="col-amount">Montant TTC</div>
                <div className="col-status">Statut</div>
                <div className="col-actions">Actions</div>
              </div>

              {invoices.map((invoice) => (
                <div key={invoice._id} className="table-row">
                  <div className="col-number">
                    <span className="invoice-number">{invoice.invoiceNumber}</span>
                  </div>
                  <div className="col-date">{formatDate(invoice.invoiceDate)}</div>
                  <div className="col-period">{invoice.periodLabel || '-'}</div>
                  <div className="col-amount">
                    <span className="amount">{formatAmount(invoice.amounts.amountTTC)}</span>
                  </div>
                  <div className="col-status">{getStatusBadge(invoice.status)}</div>
                  <div className="col-actions">
                    <button
                      onClick={() => downloadPDF(invoice.invoiceNumber)}
                      disabled={downloadingId === invoice.invoiceNumber}
                      className="btn-download"
                      title="Télécharger PDF"
                    >
                      {downloadingId === invoice.invoiceNumber ? (
                        <span className="btn-spinner"></span>
                      ) : (
                        'PDF'
                      )}
                    </button>
                    <button
                      onClick={() => resendInvoice(invoice.invoiceNumber)}
                      disabled={resendingId === invoice.invoiceNumber}
                      className="btn-resend"
                      title="Renvoyer par email"
                    >
                      {resendingId === invoice.invoiceNumber ? (
                        <span className="btn-spinner"></span>
                      ) : (
                        'Email'
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Help */}
        <div className="help-section">
          <p>
            Une question sur votre facturation ?{' '}
            <a href="mailto:facturation@symphonia-controltower.com">
              facturation@symphonia-controltower.com
            </a>
          </p>
        </div>

        {/* Back link */}
        <div className="back-link">
          <Link href="/">Retour à l'accueil</Link>
        </div>
      </div>

      <style jsx>{styles}</style>
    </div>
  );
}

const styles = `
  .invoices-page {
    min-height: 100vh;
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    padding: 40px 20px;
  }

  .container {
    max-width: 1000px;
    margin: 0 auto;
  }

  .logo-container {
    text-align: center;
    margin-bottom: 32px;
  }

  .header {
    text-align: center;
    margin-bottom: 40px;
  }

  .header h1 {
    font-size: 32px;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 8px 0;
  }

  .header p {
    font-size: 16px;
    color: #64748b;
    margin: 0;
  }

  .loading-state {
    text-align: center;
    padding: 60px;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #e2e8f0;
    border-top-color: #f97316;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin: 0 auto 16px;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .error-card {
    background: #fef2f2;
    border: 2px solid #fecaca;
    border-radius: 12px;
    padding: 24px;
    display: flex;
    gap: 16px;
    align-items: flex-start;
    margin-bottom: 32px;
  }

  .error-icon {
    width: 32px;
    height: 32px;
    background: #dc2626;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    flex-shrink: 0;
  }

  .error-card h3 {
    margin: 0 0 8px 0;
    color: #dc2626;
    font-size: 18px;
  }

  .error-card p {
    margin: 0;
    color: #374151;
  }

  .subscription-card {
    background: white;
    border-radius: 16px;
    padding: 28px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    margin-bottom: 32px;
    border: 2px solid #f97316;
  }

  .subscription-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 20px;
    padding-bottom: 20px;
    border-bottom: 1px solid #e2e8f0;
  }

  .subscription-header h2 {
    margin: 0 0 4px 0;
    font-size: 22px;
    color: #1e293b;
  }

  .subscription-header .email {
    margin: 0;
    font-size: 14px;
    color: #64748b;
  }

  .subscription-details {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 20px;
  }

  .detail-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .detail-item .label {
    font-size: 12px;
    color: #64748b;
    text-transform: uppercase;
    font-weight: 600;
  }

  .detail-item .value {
    font-size: 16px;
    color: #1e293b;
    font-weight: 600;
  }

  .invoices-section {
    background: white;
    border-radius: 16px;
    padding: 28px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    margin-bottom: 24px;
  }

  .invoices-section h3 {
    margin: 0 0 20px 0;
    font-size: 18px;
    color: #1e293b;
  }

  .no-invoices {
    text-align: center;
    padding: 40px;
    color: #64748b;
  }

  .no-invoices .icon {
    display: block;
    font-size: 48px;
    margin-bottom: 16px;
    opacity: 0.5;
  }

  .no-invoices p {
    margin: 0 0 8px 0;
  }

  .no-invoices .hint {
    font-size: 13px;
    color: #94a3b8;
  }

  .invoices-table {
    overflow-x: auto;
  }

  .table-header {
    display: grid;
    grid-template-columns: 1.5fr 1fr 1.5fr 1fr 0.8fr 1fr;
    gap: 16px;
    padding: 12px 16px;
    background: #f8fafc;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    margin-bottom: 8px;
  }

  .table-row {
    display: grid;
    grid-template-columns: 1.5fr 1fr 1.5fr 1fr 0.8fr 1fr;
    gap: 16px;
    padding: 16px;
    border-bottom: 1px solid #e2e8f0;
    align-items: center;
  }

  .table-row:last-child {
    border-bottom: none;
  }

  .table-row:hover {
    background: #f8fafc;
  }

  .invoice-number {
    font-family: monospace;
    font-weight: 600;
    color: #3b82f6;
  }

  .amount {
    font-weight: 700;
    color: #1e293b;
  }

  .col-actions {
    display: flex;
    gap: 8px;
  }

  .btn-download, .btn-resend {
    padding: 6px 12px;
    font-size: 12px;
    font-weight: 600;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 50px;
  }

  .btn-download {
    background: #3b82f6;
    color: white;
    border: none;
  }

  .btn-download:hover:not(:disabled) {
    background: #2563eb;
  }

  .btn-resend {
    background: white;
    color: #64748b;
    border: 1px solid #e2e8f0;
  }

  .btn-resend:hover:not(:disabled) {
    background: #f8fafc;
    border-color: #cbd5e1;
  }

  .btn-download:disabled, .btn-resend:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-spinner {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  .btn-resend .btn-spinner {
    border-color: rgba(100, 116, 139, 0.3);
    border-top-color: #64748b;
  }

  .help-section {
    text-align: center;
    padding: 20px;
    color: #64748b;
    font-size: 14px;
  }

  .help-section a {
    color: #f97316;
    text-decoration: none;
    font-weight: 500;
  }

  .back-link {
    text-align: center;
    margin-top: 20px;
  }

  .back-link a {
    color: #3b82f6;
    text-decoration: none;
    font-size: 14px;
  }

  .back-link a:hover {
    text-decoration: underline;
  }

  @media (max-width: 768px) {
    .header h1 {
      font-size: 26px;
    }

    .table-header {
      display: none;
    }

    .table-row {
      grid-template-columns: 1fr;
      gap: 8px;
      padding: 20px 16px;
    }

    .table-row > div {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .table-row > div::before {
      content: attr(data-label);
      font-size: 12px;
      color: #64748b;
      font-weight: 600;
    }

    .col-actions {
      justify-content: flex-end;
      margin-top: 8px;
    }
  }
`;

export default function InvoicesPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid #e2e8f0',
            borderTopColor: '#f97316',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ color: '#64748b' }}>Chargement...</p>
        </div>
      </div>
    }>
      <InvoicesContent />
    </Suspense>
  );
}
