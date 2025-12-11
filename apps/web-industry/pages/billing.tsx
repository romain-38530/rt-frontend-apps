/**
 * Page Prefacturation Transport - Portail Industriel
 * Integration avec api-orders v2.11.0 - Module Prefacturation consolide
 *
 * Fonctionnalites:
 * - Dashboard prefacturations mensuelles consolidees
 * - Validation des prefactures par l'industriel
 * - Suivi des paiements avec decompte J-30
 * - KPIs transporteurs par periode
 * - Export pour paiement
 */

import { useEffect, useState } from 'react';
import { useSafeRouter } from '../lib/useSafeRouter';
import Head from 'next/head';
import { isAuthenticated } from '../lib/auth';
import { preinvoicesApi, PreInvoice, PreInvoiceStats, PreInvoiceLine } from '../lib/api';

export default function BillingPage() {
  const router = useSafeRouter();
  const [mounted, setMounted] = useState(false);

  // State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'preinvoices' | 'validation' | 'payments' | 'export'>('dashboard');
  const [preinvoices, setPreinvoices] = useState<PreInvoice[]>([]);
  const [stats, setStats] = useState<PreInvoiceStats | null>(null);
  const [selectedPreinvoice, setSelectedPreinvoice] = useState<PreInvoice | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<{ month: number; year: number }>({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Validation form state
  const [validationComments, setValidationComments] = useState('');

  // Payment form state
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);

  // Get industrialId from localStorage
  const getIndustrialId = () => {
    if (typeof window !== 'undefined') {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user.industrialId || user.id || '';
    }
    return '';
  };

  const getUserName = () => {
    if (typeof window !== 'undefined') {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user.name || user.companyName || 'Industriel';
    }
    return 'Industriel';
  };

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!isAuthenticated()) { router.push('/login'); return; }
    // Load data
  }, [mounted]);

  useEffect(() => {
    loadPreinvoices();
  }, [statusFilter, periodFilter]);

  // Load data
  const loadStats = async () => {
    try {
      const result = await preinvoicesApi.getStats(getIndustrialId());
      if (result.success) {
        setStats(result.data);
      }
    } catch (err: any) {
      console.error('Erreur chargement stats:', err.message);
    }
  };

  const loadPreinvoices = async () => {
    try {
      setIsLoading(true);
      const filters: any = {
        industrialId: getIndustrialId(),
        month: periodFilter.month,
        year: periodFilter.year
      };
      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }
      const result = await preinvoicesApi.list(filters);
      if (result.success) {
        setPreinvoices(result.data || []);
      }
    } catch (err: any) {
      console.error('Erreur chargement preinvoices:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Validate preinvoice
  const validatePreinvoice = async (preInvoiceId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await preinvoicesApi.validate(preInvoiceId, {
        validatedBy: getUserName(),
        comments: validationComments || undefined
      });
      if (result.success) {
        setSuccess('Prefacture validee avec succes!');
        loadPreinvoices();
        loadStats();
        setValidationComments('');
        setSelectedPreinvoice(null);
      } else {
        setError(result.error || 'Erreur validation');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Mark as paid
  const markAsPaid = async (preInvoiceId: string) => {
    if (!paymentRef || !paymentAmount) {
      setError('Veuillez renseigner la reference et le montant du paiement');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await preinvoicesApi.markAsPaid(preInvoiceId, {
        paymentReference: paymentRef,
        paidAmount: paymentAmount
      });
      if (result.success) {
        setSuccess('Paiement enregistre avec succes!');
        loadPreinvoices();
        loadStats();
        setPaymentRef('');
        setPaymentAmount(0);
        setSelectedPreinvoice(null);
      } else {
        setError(result.error || 'Erreur enregistrement paiement');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Export payments
  const exportPayments = async () => {
    setIsLoading(true);
    try {
      const result = await preinvoicesApi.exportPayments();
      if (result.success && result.data) {
        // Download CSV
        const blob = new Blob([result.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `export-paiements-${periodFilter.year}-${String(periodFilter.month).padStart(2, '0')}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        setSuccess('Export telecharge avec succes!');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Styles
  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    color: 'white',
    fontFamily: 'system-ui, sans-serif'
  };

  const cardStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.08)',
    backdropFilter: 'blur(20px)',
    borderRadius: '16px',
    padding: '24px',
    border: '1px solid rgba(255,255,255,0.1)'
  };

  const buttonStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    color: 'white',
    padding: '12px 24px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
    transition: 'all 0.2s ease'
  };

  const buttonSecondaryStyle: React.CSSProperties = {
    ...buttonStyle,
    background: 'rgba(255,255,255,0.2)'
  };

  const buttonSuccessStyle: React.CSSProperties = {
    ...buttonStyle,
    background: 'linear-gradient(135deg, #00b894 0%, #00cec9 100%)'
  };

  const buttonDangerStyle: React.CSSProperties = {
    ...buttonStyle,
    background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)'
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.2)',
    background: 'rgba(255,255,255,0.1)',
    color: 'white',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box'
  };

  const tabStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    background: isActive ? 'rgba(102, 126, 234, 0.6)' : 'rgba(255,255,255,0.1)',
    color: 'white',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
    transition: 'all 0.2s ease'
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pending': '#95a5a6',
      'sent_to_industrial': '#3498db',
      'validated_industrial': '#00b894',
      'invoice_uploaded': '#9b59b6',
      'invoice_accepted': '#00cec9',
      'invoice_rejected': '#e74c3c',
      'payment_pending': '#FFA500',
      'paid': '#00D084',
      'disputed': '#e74c3c'
    };
    return colors[status] || '#fff';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'pending': 'En preparation',
      'sent_to_industrial': 'En attente validation',
      'validated_industrial': 'Validee',
      'invoice_uploaded': 'Facture recue',
      'invoice_accepted': 'Facture acceptee',
      'invoice_rejected': 'Facture rejetee',
      'payment_pending': 'En attente paiement',
      'paid': 'Payee',
      'disputed': 'Contestee'
    };
    return labels[status] || status;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR');
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const getMonthName = (month: number) => {
    const months = ['Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre'];
    return months[month - 1] || '';
  };

  // Calculate pending payments
  const pendingPayments = preinvoices.filter(p => ['validated_industrial', 'invoice_accepted', 'payment_pending'].includes(p.status));
  const totalPending = pendingPayments.reduce((sum, p) => sum + p.totals.totalTTC, 0);

  return (
    <>
      <Head>
        <title>Prefacturation Transport - Industriel | SYMPHONI.A</title>
      </Head>

      <div style={containerStyle}>
        {/* Header */}
        <div style={{
          padding: '16px 24px',
          backgroundColor: 'rgba(255,255,255,0.05)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => router.push('/')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'white', fontWeight: '600' }}
            >
              Retour
            </button>
            <h1 style={{ fontSize: '20px', fontWeight: '800', margin: 0 }}>
              Prefacturation Transport
            </h1>
            <span style={{
              padding: '4px 12px',
              background: 'rgba(102, 126, 234, 0.4)',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '600'
            }}>
              v2.11
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button style={tabStyle(activeTab === 'dashboard')} onClick={() => setActiveTab('dashboard')}>
              Dashboard
            </button>
            <button style={tabStyle(activeTab === 'preinvoices')} onClick={() => setActiveTab('preinvoices')}>
              Prefactures ({preinvoices.length})
            </button>
            <button style={tabStyle(activeTab === 'validation')} onClick={() => setActiveTab('validation')}>
              Validation
            </button>
            <button style={tabStyle(activeTab === 'payments')} onClick={() => setActiveTab('payments')}>
              Paiements
            </button>
            <button style={tabStyle(activeTab === 'export')} onClick={() => setActiveTab('export')}>
              Export
            </button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div style={{ margin: '16px 24px', padding: '12px 16px', background: 'rgba(231, 76, 60, 0.3)', borderRadius: '8px', border: '1px solid rgba(231, 76, 60, 0.5)' }}>
            {error}
            <button onClick={() => setError(null)} style={{ float: 'right', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>x</button>
          </div>
        )}
        {success && (
          <div style={{ margin: '16px 24px', padding: '12px 16px', background: 'rgba(0, 208, 132, 0.3)', borderRadius: '8px', border: '1px solid rgba(0, 208, 132, 0.5)' }}>
            {success}
            <button onClick={() => setSuccess(null)} style={{ float: 'right', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>x</button>
          </div>
        )}

        {/* Period Filter */}
        <div style={{ padding: '16px 24px', display: 'flex', gap: '16px', alignItems: 'center' }}>
          <span style={{ fontWeight: '600' }}>Periode:</span>
          <select
            style={{ ...inputStyle, width: '150px' }}
            value={periodFilter.month}
            onChange={(e) => setPeriodFilter({ ...periodFilter, month: parseInt(e.target.value) })}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
              <option key={m} value={m}>{getMonthName(m)}</option>
            ))}
          </select>
          <select
            style={{ ...inputStyle, width: '100px' }}
            value={periodFilter.year}
            onChange={(e) => setPeriodFilter({ ...periodFilter, year: parseInt(e.target.value) })}
          >
            {[2024, 2025, 2026].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button style={buttonSecondaryStyle} onClick={loadPreinvoices}>
            Actualiser
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '0 24px 24px', maxWidth: '1600px', margin: '0 auto' }}>

          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div>
              {/* KPI Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                <div style={cardStyle}>
                  <div style={{ fontSize: '14px', opacity: 0.7, marginBottom: '8px' }}>Prefactures du mois</div>
                  <div style={{ fontSize: '32px', fontWeight: '800' }}>{preinvoices.length}</div>
                  <div style={{ fontSize: '12px', opacity: 0.6 }}>{getMonthName(periodFilter.month)} {periodFilter.year}</div>
                </div>
                <div style={cardStyle}>
                  <div style={{ fontSize: '14px', opacity: 0.7, marginBottom: '8px' }}>Montant Total TTC</div>
                  <div style={{ fontSize: '28px', fontWeight: '800', color: '#00D084' }}>
                    {formatCurrency(preinvoices.reduce((sum, p) => sum + p.totals.totalTTC, 0))} EUR
                  </div>
                </div>
                <div style={cardStyle}>
                  <div style={{ fontSize: '14px', opacity: 0.7, marginBottom: '8px' }}>En Attente Validation</div>
                  <div style={{ fontSize: '32px', fontWeight: '800', color: '#FFA500' }}>
                    {preinvoices.filter(p => p.status === 'sent_to_industrial').length}
                  </div>
                </div>
                <div style={cardStyle}>
                  <div style={{ fontSize: '14px', opacity: 0.7, marginBottom: '8px' }}>En Attente Paiement</div>
                  <div style={{ fontSize: '32px', fontWeight: '800', color: '#3498db' }}>
                    {pendingPayments.length}
                  </div>
                  <div style={{ fontSize: '12px', color: '#FFA500' }}>
                    {formatCurrency(totalPending)} EUR
                  </div>
                </div>
                <div style={cardStyle}>
                  <div style={{ fontSize: '14px', opacity: 0.7, marginBottom: '8px' }}>Payees</div>
                  <div style={{ fontSize: '32px', fontWeight: '800', color: '#00D084' }}>
                    {preinvoices.filter(p => p.status === 'paid').length}
                  </div>
                </div>
              </div>

              {/* Status Distribution + Quick Actions */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div style={cardStyle}>
                  <h3 style={{ marginBottom: '16px' }}>Repartition par Statut</h3>
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {stats?.byStatus && Object.entries(stats.byStatus).map(([status, count]) => (
                      <div key={status} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            width: '12px', height: '12px', borderRadius: '50%',
                            background: getStatusColor(status)
                          }} />
                          <span>{getStatusLabel(status)}</span>
                        </div>
                        <span style={{ fontWeight: '700' }}>{count as number}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={cardStyle}>
                  <h3 style={{ marginBottom: '16px' }}>Actions Rapides</h3>
                  <div style={{ display: 'grid', gap: '12px' }}>
                    <button
                      style={buttonStyle}
                      onClick={() => { setStatusFilter('sent_to_industrial'); setActiveTab('validation'); }}
                    >
                      Valider les prefactures ({preinvoices.filter(p => p.status === 'sent_to_industrial').length})
                    </button>
                    <button
                      style={buttonSuccessStyle}
                      onClick={() => setActiveTab('payments')}
                    >
                      Gerer les paiements ({pendingPayments.length})
                    </button>
                    <button
                      style={buttonSecondaryStyle}
                      onClick={() => setActiveTab('export')}
                    >
                      Exporter pour comptabilite
                    </button>
                  </div>
                </div>
              </div>

              {/* Recent Preinvoices */}
              <div style={{ ...cardStyle, marginTop: '24px' }}>
                <h3 style={{ marginBottom: '16px' }}>Dernieres Prefactures</h3>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {preinvoices.slice(0, 5).map(pi => (
                    <div key={pi.preInvoiceId} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px',
                      background: 'rgba(255,255,255,0.05)',
                      borderRadius: '8px'
                    }}>
                      <div>
                        <div style={{ fontWeight: '700' }}>{pi.preInvoiceNumber}</div>
                        <div style={{ fontSize: '13px', opacity: 0.7 }}>{pi.carrierName}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: '700' }}>{formatCurrency(pi.totals.totalTTC)} EUR</div>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '8px',
                          fontSize: '11px',
                          background: `${getStatusColor(pi.status)}30`,
                          color: getStatusColor(pi.status)
                        }}>
                          {getStatusLabel(pi.status)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Preinvoices Tab */}
          {activeTab === 'preinvoices' && (
            <div>
              {/* Filters */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2>Prefactures - {getMonthName(periodFilter.month)} {periodFilter.year}</h2>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <select
                    style={{ ...inputStyle, width: '200px' }}
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="sent_to_industrial">En attente validation</option>
                    <option value="validated_industrial">Validees</option>
                    <option value="payment_pending">En attente paiement</option>
                    <option value="paid">Payees</option>
                  </select>
                </div>
              </div>

              {/* List */}
              <div style={{ display: 'grid', gap: '16px' }}>
                {preinvoices.map(pi => (
                  <div
                    key={pi.preInvoiceId}
                    style={{
                      ...cardStyle,
                      cursor: 'pointer',
                      border: selectedPreinvoice?.preInvoiceId === pi.preInvoiceId
                        ? '2px solid #667eea'
                        : '1px solid rgba(255,255,255,0.1)'
                    }}
                    onClick={() => setSelectedPreinvoice(selectedPreinvoice?.preInvoiceId === pi.preInvoiceId ? null : pi)}
                  >
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 150px 150px auto', gap: '16px', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '12px', opacity: 0.7 }}>Prefacture</div>
                        <div style={{ fontWeight: '700' }}>{pi.preInvoiceNumber}</div>
                        <div style={{ fontSize: '12px', opacity: 0.6 }}>{pi.kpis.totalOrders} commandes</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', opacity: 0.7 }}>Transporteur</div>
                        <div style={{ fontWeight: '600' }}>{pi.carrierName}</div>
                        <div style={{ fontSize: '11px', opacity: 0.5 }}>{pi.carrierSiret}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', opacity: 0.7 }}>Periode</div>
                        <div>{getMonthName(pi.period.month)} {pi.period.year}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', opacity: 0.7 }}>Montant TTC</div>
                        <div style={{ fontSize: '18px', fontWeight: '700', color: '#00D084' }}>
                          {formatCurrency(pi.totals.totalTTC)} EUR
                        </div>
                      </div>
                      <div>
                        <span style={{
                          padding: '6px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          background: `${getStatusColor(pi.status)}30`,
                          color: getStatusColor(pi.status)
                        }}>
                          {getStatusLabel(pi.status)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {pi.status === 'sent_to_industrial' && (
                          <button
                            style={{ ...buttonSuccessStyle, padding: '8px 12px', fontSize: '12px' }}
                            onClick={(e) => { e.stopPropagation(); setSelectedPreinvoice(pi); setActiveTab('validation'); }}
                          >
                            Valider
                          </button>
                        )}
                        {pi.payment?.daysRemaining !== undefined && pi.payment.daysRemaining <= 5 && pi.status !== 'paid' && (
                          <span style={{ padding: '6px 10px', background: 'rgba(255,165,0,0.3)', borderRadius: '8px', fontSize: '11px', fontWeight: '600' }}>
                            J-{pi.payment.daysRemaining}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {selectedPreinvoice?.preInvoiceId === pi.preInvoiceId && (
                      <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
                          {/* Totals */}
                          <div>
                            <h4 style={{ marginBottom: '12px' }}>Detail Montants</h4>
                            <div style={{ display: 'grid', gap: '8px', fontSize: '14px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Base transport</span>
                                <span>{formatCurrency(pi.totals.baseAmount)} EUR</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Temps attente</span>
                                <span>{formatCurrency(pi.totals.waitingAmount)} EUR</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Penalites retard</span>
                                <span style={{ color: '#e74c3c' }}>-{formatCurrency(pi.totals.delayPenalty)} EUR</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Supplement carburant</span>
                                <span>{formatCurrency(pi.totals.fuelSurcharge)} EUR</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Peages</span>
                                <span>{formatCurrency(pi.totals.tolls)} EUR</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '8px' }}>
                                <span>Sous-total HT</span>
                                <span>{formatCurrency(pi.totals.subtotalHT)} EUR</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>TVA ({pi.totals.tvaRate}%)</span>
                                <span>{formatCurrency(pi.totals.tvaAmount)} EUR</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', color: '#00D084', fontSize: '16px' }}>
                                <span>Total TTC</span>
                                <span>{formatCurrency(pi.totals.totalTTC)} EUR</span>
                              </div>
                            </div>
                          </div>

                          {/* KPIs */}
                          <div>
                            <h4 style={{ marginBottom: '12px' }}>KPIs Performance</h4>
                            <div style={{ display: 'grid', gap: '12px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>Ponctualite enlevement</span>
                                <span style={{ fontWeight: '700', color: pi.kpis.onTimePickupRate >= 90 ? '#00D084' : '#FFA500' }}>
                                  {pi.kpis.onTimePickupRate.toFixed(1)}%
                                </span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>Ponctualite livraison</span>
                                <span style={{ fontWeight: '700', color: pi.kpis.onTimeDeliveryRate >= 90 ? '#00D084' : '#FFA500' }}>
                                  {pi.kpis.onTimeDeliveryRate.toFixed(1)}%
                                </span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>Documents complets</span>
                                <span style={{ fontWeight: '700', color: pi.kpis.documentsCompleteRate >= 95 ? '#00D084' : '#FFA500' }}>
                                  {pi.kpis.documentsCompleteRate.toFixed(1)}%
                                </span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>Sans incident</span>
                                <span style={{ fontWeight: '700', color: pi.kpis.incidentFreeRate >= 95 ? '#00D084' : '#FFA500' }}>
                                  {pi.kpis.incidentFreeRate.toFixed(1)}%
                                </span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '8px' }}>
                                <span>Temps attente moyen</span>
                                <span style={{ fontWeight: '700' }}>{pi.kpis.averageWaitingHours.toFixed(1)}h</span>
                              </div>
                            </div>
                          </div>

                          {/* Payment Info */}
                          <div>
                            <h4 style={{ marginBottom: '12px' }}>Paiement</h4>
                            {pi.payment ? (
                              <div style={{ display: 'grid', gap: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <span>Echeance</span>
                                  <span>{formatDate(pi.payment.dueDate)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <span>Delai paiement</span>
                                  <span>{pi.payment.paymentTermDays} jours</span>
                                </div>
                                {pi.payment.daysRemaining !== undefined && (
                                  <div style={{
                                    padding: '12px',
                                    background: pi.payment.daysRemaining <= 0 ? 'rgba(231,76,60,0.2)' : pi.payment.daysRemaining <= 5 ? 'rgba(255,165,0,0.2)' : 'rgba(0,208,132,0.2)',
                                    borderRadius: '8px',
                                    textAlign: 'center'
                                  }}>
                                    <div style={{ fontSize: '24px', fontWeight: '800' }}>
                                      {pi.payment.daysRemaining <= 0 ? 'ECHU' : `J-${pi.payment.daysRemaining}`}
                                    </div>
                                    <div style={{ fontSize: '12px', opacity: 0.8 }}>
                                      {pi.payment.daysRemaining <= 0 ? 'Paiement en retard' : 'Jours restants'}
                                    </div>
                                  </div>
                                )}
                                {pi.payment.bankDetails && (
                                  <div style={{ marginTop: '8px', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                                    <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '4px' }}>Coordonnees bancaires</div>
                                    <div style={{ fontSize: '12px' }}>
                                      <div>{pi.payment.bankDetails.bankName}</div>
                                      <div style={{ fontFamily: 'monospace' }}>{pi.payment.bankDetails.iban}</div>
                                      <div style={{ fontFamily: 'monospace' }}>{pi.payment.bankDetails.bic}</div>
                                    </div>
                                  </div>
                                )}
                                {pi.payment.paidAt && (
                                  <div style={{ padding: '12px', background: 'rgba(0,208,132,0.2)', borderRadius: '8px' }}>
                                    <div style={{ fontWeight: '600', color: '#00D084' }}>Paye le {formatDate(pi.payment.paidAt)}</div>
                                    <div style={{ fontSize: '13px' }}>Ref: {pi.payment.paymentReference}</div>
                                    <div style={{ fontSize: '13px' }}>Montant: {formatCurrency(pi.payment.paidAmount || 0)} EUR</div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <p style={{ opacity: 0.6 }}>Information de paiement non disponible</p>
                            )}
                          </div>
                        </div>

                        {/* Order Lines */}
                        <div style={{ marginTop: '24px' }}>
                          <h4 style={{ marginBottom: '12px' }}>Commandes ({pi.lines.length})</h4>
                          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                              <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                                  <th style={{ textAlign: 'left', padding: '8px', opacity: 0.7 }}>Commande</th>
                                  <th style={{ textAlign: 'left', padding: '8px', opacity: 0.7 }}>Trajet</th>
                                  <th style={{ textAlign: 'left', padding: '8px', opacity: 0.7 }}>Date livraison</th>
                                  <th style={{ textAlign: 'right', padding: '8px', opacity: 0.7 }}>Base</th>
                                  <th style={{ textAlign: 'right', padding: '8px', opacity: 0.7 }}>Attente</th>
                                  <th style={{ textAlign: 'right', padding: '8px', opacity: 0.7 }}>Penalite</th>
                                  <th style={{ textAlign: 'right', padding: '8px', opacity: 0.7 }}>Total</th>
                                  <th style={{ textAlign: 'center', padding: '8px', opacity: 0.7 }}>CMR</th>
                                </tr>
                              </thead>
                              <tbody>
                                {pi.lines.map((line, idx) => (
                                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                    <td style={{ padding: '8px' }}>{line.orderReference}</td>
                                    <td style={{ padding: '8px' }}>{line.pickupCity} - {line.deliveryCity}</td>
                                    <td style={{ padding: '8px' }}>{formatDate(line.deliveryDate)}</td>
                                    <td style={{ padding: '8px', textAlign: 'right' }}>{formatCurrency(line.baseAmount)}</td>
                                    <td style={{ padding: '8px', textAlign: 'right' }}>{formatCurrency(line.waitingAmount)}</td>
                                    <td style={{ padding: '8px', textAlign: 'right', color: '#e74c3c' }}>-{formatCurrency(line.delayPenalty)}</td>
                                    <td style={{ padding: '8px', textAlign: 'right', fontWeight: '600' }}>{formatCurrency(line.totalAmount)}</td>
                                    <td style={{ padding: '8px', textAlign: 'center' }}>
                                      <span style={{
                                        display: 'inline-block',
                                        width: '16px',
                                        height: '16px',
                                        borderRadius: '50%',
                                        background: line.cmrValidated ? '#00D084' : '#e74c3c'
                                      }} />
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {preinvoices.length === 0 && (
                  <div style={cardStyle}>
                    <p style={{ opacity: 0.6, textAlign: 'center' }}>
                      Aucune prefacture pour {getMonthName(periodFilter.month)} {periodFilter.year}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Validation Tab */}
          {activeTab === 'validation' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '24px' }}>
              {/* Pending Validation List */}
              <div>
                <h3 style={{ marginBottom: '16px' }}>Prefactures en Attente de Validation</h3>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {preinvoices.filter(p => p.status === 'sent_to_industrial').map(pi => (
                    <div
                      key={pi.preInvoiceId}
                      style={{
                        ...cardStyle,
                        cursor: 'pointer',
                        border: selectedPreinvoice?.preInvoiceId === pi.preInvoiceId ? '2px solid #667eea' : '1px solid rgba(255,255,255,0.1)'
                      }}
                      onClick={() => setSelectedPreinvoice(pi)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: '700' }}>{pi.preInvoiceNumber}</div>
                          <div style={{ fontSize: '13px', opacity: 0.7 }}>{pi.carrierName}</div>
                          <div style={{ fontSize: '12px', opacity: 0.5 }}>{pi.kpis.totalOrders} commandes</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '20px', fontWeight: '700', color: '#00D084' }}>{formatCurrency(pi.totals.totalTTC)} EUR</div>
                          <div style={{ fontSize: '12px', opacity: 0.6 }}>
                            Recu le {formatDate(pi.createdAt)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {preinvoices.filter(p => p.status === 'sent_to_industrial').length === 0 && (
                    <div style={cardStyle}>
                      <p style={{ opacity: 0.6, textAlign: 'center' }}>Aucune prefacture en attente de validation.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Validation Form */}
              <div style={cardStyle}>
                <h3 style={{ marginBottom: '16px' }}>Valider la Prefacture</h3>
                {selectedPreinvoice && selectedPreinvoice.status === 'sent_to_industrial' ? (
                  <div style={{ display: 'grid', gap: '16px' }}>
                    <div style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                      <div style={{ fontWeight: '700' }}>{selectedPreinvoice.preInvoiceNumber}</div>
                      <div style={{ fontSize: '13px', opacity: 0.7 }}>{selectedPreinvoice.carrierName}</div>
                      <div style={{ fontSize: '20px', fontWeight: '700', color: '#00D084', marginTop: '8px' }}>
                        {formatCurrency(selectedPreinvoice.totals.totalTTC)} EUR TTC
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', opacity: 0.8 }}>Commentaires (optionnel)</label>
                      <textarea
                        style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }}
                        placeholder="Ajoutez un commentaire..."
                        value={validationComments}
                        onChange={(e) => setValidationComments(e.target.value)}
                      />
                    </div>

                    <button
                      style={buttonSuccessStyle}
                      onClick={() => validatePreinvoice(selectedPreinvoice.preInvoiceId)}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Validation...' : 'Valider la prefacture'}
                    </button>

                    <button
                      style={buttonDangerStyle}
                      onClick={() => {
                        // TODO: Implement dispute
                        setError('Fonctionnalite de contestation a venir');
                      }}
                    >
                      Contester
                    </button>
                  </div>
                ) : (
                  <p style={{ opacity: 0.6 }}>Selectionnez une prefacture a valider</p>
                )}
              </div>
            </div>
          )}

          {/* Payments Tab */}
          {activeTab === 'payments' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '24px' }}>
              {/* Pending Payments */}
              <div>
                <h3 style={{ marginBottom: '16px' }}>Paiements en Attente ({pendingPayments.length})</h3>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {pendingPayments.map(pi => (
                    <div
                      key={pi.preInvoiceId}
                      style={{
                        ...cardStyle,
                        cursor: 'pointer',
                        border: selectedPreinvoice?.preInvoiceId === pi.preInvoiceId ? '2px solid #667eea' : '1px solid rgba(255,255,255,0.1)'
                      }}
                      onClick={() => {
                        setSelectedPreinvoice(pi);
                        setPaymentAmount(pi.totals.totalTTC);
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: '700' }}>{pi.preInvoiceNumber}</div>
                          <div style={{ fontSize: '13px', opacity: 0.7 }}>{pi.carrierName}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '20px', fontWeight: '700', color: '#00D084' }}>{formatCurrency(pi.totals.totalTTC)} EUR</div>
                          {pi.payment?.daysRemaining !== undefined && (
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: '600',
                              background: pi.payment.daysRemaining <= 0 ? 'rgba(231,76,60,0.3)' : pi.payment.daysRemaining <= 5 ? 'rgba(255,165,0,0.3)' : 'rgba(0,208,132,0.3)'
                            }}>
                              {pi.payment.daysRemaining <= 0 ? 'ECHU' : `J-${pi.payment.daysRemaining}`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {pendingPayments.length === 0 && (
                    <div style={cardStyle}>
                      <p style={{ opacity: 0.6, textAlign: 'center' }}>Aucun paiement en attente.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Form */}
              <div style={cardStyle}>
                <h3 style={{ marginBottom: '16px' }}>Enregistrer un Paiement</h3>
                {selectedPreinvoice && ['validated_industrial', 'invoice_accepted', 'payment_pending'].includes(selectedPreinvoice.status) ? (
                  <div style={{ display: 'grid', gap: '16px' }}>
                    <div style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                      <div style={{ fontWeight: '700' }}>{selectedPreinvoice.preInvoiceNumber}</div>
                      <div style={{ fontSize: '13px', opacity: 0.7 }}>{selectedPreinvoice.carrierName}</div>
                      <div style={{ fontSize: '20px', fontWeight: '700', color: '#00D084', marginTop: '8px' }}>
                        {formatCurrency(selectedPreinvoice.totals.totalTTC)} EUR TTC
                      </div>
                    </div>

                    {selectedPreinvoice.payment?.bankDetails && (
                      <div style={{ padding: '12px', background: 'rgba(102, 126, 234, 0.2)', borderRadius: '8px' }}>
                        <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '4px' }}>Coordonnees bancaires</div>
                        <div style={{ fontSize: '13px' }}>
                          <div style={{ fontWeight: '600' }}>{selectedPreinvoice.payment.bankDetails.accountHolder}</div>
                          <div>{selectedPreinvoice.payment.bankDetails.bankName}</div>
                          <div style={{ fontFamily: 'monospace', marginTop: '4px' }}>IBAN: {selectedPreinvoice.payment.bankDetails.iban}</div>
                          <div style={{ fontFamily: 'monospace' }}>BIC: {selectedPreinvoice.payment.bankDetails.bic}</div>
                        </div>
                      </div>
                    )}

                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', opacity: 0.8 }}>Reference du paiement</label>
                      <input
                        style={inputStyle}
                        placeholder="VIR-XXXXXX"
                        value={paymentRef}
                        onChange={(e) => setPaymentRef(e.target.value)}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', opacity: 0.8 }}>Montant paye (EUR)</label>
                      <input
                        style={inputStyle}
                        type="number"
                        step="0.01"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                      />
                    </div>

                    <button
                      style={buttonSuccessStyle}
                      onClick={() => markAsPaid(selectedPreinvoice.preInvoiceId)}
                      disabled={isLoading || !paymentRef || !paymentAmount}
                    >
                      {isLoading ? 'Enregistrement...' : 'Confirmer le paiement'}
                    </button>
                  </div>
                ) : (
                  <p style={{ opacity: 0.6 }}>Selectionnez une prefacture a payer</p>
                )}
              </div>
            </div>
          )}

          {/* Export Tab */}
          {activeTab === 'export' && (
            <div>
              <h2 style={{ marginBottom: '24px' }}>Export Comptabilite</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div style={cardStyle}>
                  <h3 style={{ marginBottom: '16px' }}>Export CSV Paiements</h3>
                  <p style={{ opacity: 0.7, marginBottom: '16px' }}>
                    Exportez la liste des paiements a effectuer pour import dans votre logiciel comptable.
                  </p>
                  <div style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', marginBottom: '16px' }}>
                    <div style={{ fontSize: '14px', opacity: 0.7 }}>Paiements en attente</div>
                    <div style={{ fontSize: '24px', fontWeight: '700' }}>{pendingPayments.length}</div>
                    <div style={{ fontSize: '14px', color: '#FFA500' }}>
                      Total: {formatCurrency(totalPending)} EUR
                    </div>
                  </div>
                  <button
                    style={buttonStyle}
                    onClick={exportPayments}
                    disabled={isLoading || pendingPayments.length === 0}
                  >
                    {isLoading ? 'Export...' : 'Telecharger CSV'}
                  </button>
                </div>

                <div style={cardStyle}>
                  <h3 style={{ marginBottom: '16px' }}>Resume Mensuel</h3>
                  <div style={{ display: 'grid', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Total prefactures</span>
                      <span style={{ fontWeight: '700' }}>{preinvoices.length}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Montant total HT</span>
                      <span style={{ fontWeight: '700' }}>{formatCurrency(preinvoices.reduce((s, p) => s + p.totals.subtotalHT, 0))} EUR</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>TVA collectee</span>
                      <span style={{ fontWeight: '700' }}>{formatCurrency(preinvoices.reduce((s, p) => s + p.totals.tvaAmount, 0))} EUR</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '12px' }}>
                      <span>Total TTC</span>
                      <span style={{ fontWeight: '700', color: '#00D084' }}>{formatCurrency(preinvoices.reduce((s, p) => s + p.totals.totalTTC, 0))} EUR</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
