/**
 * Page Facturation & Prefacturation - Portail Transporteur
 * Integration avec api-orders v2.11.0 - Module Prefacturation consolide
 *
 * Fonctionnalites:
 * - Prefactures mensuelles consolidees par industriel
 * - Upload facture transporteur avec analyse OCR
 * - Suivi paiements avec decompte
 * - Documents vigilance
 */

import { useState, useEffect } from 'react';
import Head from 'next/head';
import { preinvoicesApi, PreInvoice, PreInvoiceStats } from '../lib/api';
import {
  FileText,
  Upload,
  AlertTriangle,
  CheckCircle,
  Clock,
  Euro,
  TrendingUp,
  FileCheck,
  AlertCircle,
  Send,
  Download,
  RefreshCw,
  X,
  ChevronDown,
  ChevronUp,
  Paperclip,
  Building,
  CreditCard,
  Scale,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  History,
  Filter,
  Tag
} from 'lucide-react';

export default function BillingPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'preinvoices' | 'upload' | 'payments' | 'validations'>('dashboard');
  const [preinvoices, setPreinvoices] = useState<PreInvoice[]>([]);
  const [stats, setStats] = useState<PreInvoiceStats | null>(null);
  const [selectedPreinvoice, setSelectedPreinvoice] = useState<PreInvoice | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<{ month: number; year: number }>({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Upload state
  const [uploadingInvoice, setUploadingInvoice] = useState<string | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceAmount, setInvoiceAmount] = useState<number>(0);

  // Dispute modal - Enhanced
  const [disputeModal, setDisputeModal] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeCategory, setDisputeCategory] = useState<string>('price');
  const [disputeAmount, setDisputeAmount] = useState<number>(0);
  const [disputeDetails, setDisputeDetails] = useState('');

  // Validation modal
  const [validateModal, setValidateModal] = useState<string | null>(null);
  const [validateComment, setValidateComment] = useState('');

  // Validation tab state
  const [validationFilter, setValidationFilter] = useState<'pending' | 'disputed' | 'validated' | 'all'>('pending');

  useEffect(() => {
    loadData();
  }, [periodFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [preinvoicesRes, statsRes] = await Promise.all([
        preinvoicesApi.list({
          month: periodFilter.month,
          year: periodFilter.year,
          status: statusFilter !== 'all' ? statusFilter : undefined
        }),
        preinvoicesApi.getStats()
      ]);

      if (preinvoicesRes.success) {
        setPreinvoices(preinvoicesRes.data || []);
      }
      if (statsRes.success) {
        setStats(statsRes.data);
      }
    } catch (err: any) {
      console.error('Erreur chargement:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Upload carrier invoice
  const uploadCarrierInvoice = async (preInvoiceId: string, file: File) => {
    if (!invoiceNumber || !invoiceAmount) {
      setError('Veuillez renseigner le numero et le montant de votre facture');
      return;
    }

    setUploadingInvoice(preInvoiceId);
    setError(null);

    try {
      // Get pre-signed URL
      const urlRes = await preinvoicesApi.getInvoiceUploadUrl(preInvoiceId, {
        fileName: file.name,
        contentType: file.type
      });

      if (!urlRes.success) {
        throw new Error(urlRes.error || 'Erreur obtention URL upload');
      }

      // Upload to S3
      const uploadOk = await preinvoicesApi.uploadToS3(urlRes.data.uploadUrl, file);
      if (!uploadOk) {
        throw new Error('Erreur upload vers S3');
      }

      // Confirm upload
      const confirmRes = await preinvoicesApi.confirmInvoiceUpload(preInvoiceId, {
        fileName: file.name,
        s3Key: urlRes.data.s3Key,
        invoiceNumber,
        invoiceAmount
      });

      if (confirmRes.success) {
        setSuccess('Facture uploadee avec succes! Analyse OCR en cours...');
        setInvoiceNumber('');
        setInvoiceAmount(0);
        loadData();
      } else {
        throw new Error(confirmRes.error || 'Erreur confirmation upload');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploadingInvoice(null);
    }
  };

  // Dispute preinvoice - Enhanced
  const submitDispute = async () => {
    if (!disputeModal || !disputeReason.trim()) return;

    try {
      const res = await preinvoicesApi.dispute(disputeModal, {
        reason: disputeReason,
        category: disputeCategory as any,
        amountDisputed: disputeAmount || undefined,
        details: disputeDetails || undefined
      });

      if (res.success) {
        setSuccess('Contestation soumise avec succes. L\'industriel sera notifie.');
        setDisputeModal(null);
        setDisputeReason('');
        setDisputeCategory('price');
        setDisputeAmount(0);
        setDisputeDetails('');
        loadData();
      } else {
        setError(res.error || 'Erreur contestation');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Validate preinvoice
  const submitValidation = async () => {
    if (!validateModal) return;

    try {
      const res = await preinvoicesApi.validate(validateModal, {
        comment: validateComment || undefined
      });

      if (res.success) {
        setSuccess('Prefacture validee avec succes!');
        setValidateModal(null);
        setValidateComment('');
        loadData();
      } else {
        setError(res.error || 'Erreur validation');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Get dispute category label
  const getDisputeCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'price': 'Ecart de prix',
      'quantity': 'Quantite incorrecte',
      'service': 'Service non conforme',
      'damage': 'Dommage marchandise',
      'delay': 'Retard / Penalite injustifiee',
      'other': 'Autre motif'
    };
    return labels[category] || category;
  };

  const getDisputeCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'price': '#f59e0b',
      'quantity': '#8b5cf6',
      'service': '#3b82f6',
      'damage': '#ef4444',
      'delay': '#ec4899',
      'other': '#6b7280'
    };
    return colors[category] || '#6b7280';
  };

  // Export CSV
  const exportCsv = async () => {
    try {
      const csvData = await preinvoicesApi.exportCsv(periodFilter);
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prefactures-${periodFilter.year}-${String(periodFilter.month).padStart(2, '0')}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR');
  };

  const getMonthName = (month: number) => {
    const months = ['Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre'];
    return months[month - 1] || '';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pending': '#9ca3af',
      'sent_to_industrial': '#3b82f6',
      'validated_industrial': '#10b981',
      'invoice_uploaded': '#8b5cf6',
      'invoice_accepted': '#06b6d4',
      'invoice_rejected': '#ef4444',
      'payment_pending': '#f59e0b',
      'paid': '#22c55e',
      'disputed': '#ef4444'
    };
    return colors[status] || '#9ca3af';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'pending': 'En preparation',
      'sent_to_industrial': 'Envoyee industriel',
      'validated_industrial': 'Validee industriel',
      'invoice_uploaded': 'Facture envoyee',
      'invoice_accepted': 'Facture acceptee',
      'invoice_rejected': 'Facture rejetee',
      'payment_pending': 'Paiement en cours',
      'paid': 'Payee',
      'disputed': 'Contestee'
    };
    return labels[status] || status;
  };

  // Calculate totals
  const pendingInvoices = preinvoices.filter(p => p.status === 'validated_industrial' && !p.carrierInvoice);
  const awaitingPayment = preinvoices.filter(p => ['invoice_accepted', 'payment_pending'].includes(p.status));
  const totalAwaitingPayment = awaitingPayment.reduce((sum, p) => sum + p.totals.totalTTC, 0);

  return (
    <>
      <Head>
        <title>Facturation | SYMPHONI.A Transporteur</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Euro className="w-7 h-7 text-emerald-600" />
                  Facturation & Prefacturation
                </h1>
                <p className="text-gray-600 mt-1">
                  Prefactures mensuelles consolidees - Uploadez vos factures et suivez vos paiements
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={exportCsv}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
                <button
                  onClick={loadData}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  <RefreshCw className="w-4 h-4" />
                  Actualiser
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mt-6 border-b overflow-x-auto">
              {[
                { id: 'dashboard', label: 'Tableau de bord', icon: TrendingUp },
                { id: 'preinvoices', label: 'Mes prefactures', icon: FileText, badge: preinvoices.length },
                { id: 'validations', label: 'Validations', icon: Scale, badge: preinvoices.filter(p => p.status === 'sent_to_industrial' || p.status === 'disputed').length },
                { id: 'upload', label: 'Uploader facture', icon: Upload, badge: pendingInvoices.length },
                { id: 'payments', label: 'Paiements', icon: CreditCard, badge: awaitingPayment.length }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-emerald-600 text-emerald-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className={`ml-1 px-2 py-0.5 text-xs rounded-full ${
                      activeTab === tab.id ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-700'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div className="max-w-7xl mx-auto px-4 pt-4">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="w-5 h-5" />
                {error}
              </div>
              <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-5 h-5" />
                {success}
              </div>
              <button onClick={() => setSuccess(null)} className="text-green-500 hover:text-green-700">
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Period Filter */}
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <span className="text-gray-600 font-medium">Periode:</span>
            <select
              className="border rounded-lg px-3 py-2"
              value={periodFilter.month}
              onChange={(e) => setPeriodFilter({ ...periodFilter, month: parseInt(e.target.value) })}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                <option key={m} value={m}>{getMonthName(m)}</option>
              ))}
            </select>
            <select
              className="border rounded-lg px-3 py-2"
              value={periodFilter.year}
              onChange={(e) => setPeriodFilter({ ...periodFilter, year: parseInt(e.target.value) })}
            >
              {[2024, 2025, 2026].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 pb-8">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
          ) : (
            <>
              {/* Dashboard Tab */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  {/* KPI Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Prefactures du mois</p>
                          <p className="text-3xl font-bold text-gray-900">{preinvoices.length}</p>
                        </div>
                        <FileText className="w-12 h-12 text-emerald-600 opacity-80" />
                      </div>
                      <p className="text-sm text-gray-500 mt-2">{getMonthName(periodFilter.month)} {periodFilter.year}</p>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Montant total TTC</p>
                          <p className="text-2xl font-bold text-emerald-600">
                            {formatCurrency(preinvoices.reduce((s, p) => s + p.totals.totalTTC, 0))} EUR
                          </p>
                        </div>
                        <Euro className="w-12 h-12 text-blue-600 opacity-80" />
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Factures a envoyer</p>
                          <p className="text-3xl font-bold text-amber-600">{pendingInvoices.length}</p>
                        </div>
                        <Upload className="w-12 h-12 text-amber-600 opacity-80" />
                      </div>
                      <button
                        onClick={() => setActiveTab('upload')}
                        className="text-sm text-amber-600 font-medium mt-2 hover:underline"
                      >
                        Uploader mes factures
                      </button>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">En attente paiement</p>
                          <p className="text-2xl font-bold text-blue-600">
                            {formatCurrency(totalAwaitingPayment)} EUR
                          </p>
                        </div>
                        <CreditCard className="w-12 h-12 text-blue-600 opacity-80" />
                      </div>
                      <p className="text-sm text-gray-500 mt-2">{awaitingPayment.length} prefacture(s)</p>
                    </div>
                  </div>

                  {/* Alerts */}
                  {pendingInvoices.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                      <div>
                        <h3 className="font-medium text-amber-800">
                          {pendingInvoices.length} facture(s) a envoyer
                        </h3>
                        <p className="text-sm text-amber-700 mt-1">
                          Des prefactures sont validees par l'industriel. Uploadez vos factures pour declencher le paiement.
                        </p>
                        <button
                          onClick={() => setActiveTab('upload')}
                          className="text-sm text-amber-800 font-medium mt-2 hover:underline"
                        >
                          Uploader maintenant
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Recent Preinvoices by Industrial */}
                  <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b">
                      <h2 className="text-lg font-semibold">Prefactures par Industriel</h2>
                    </div>
                    <div className="divide-y">
                      {preinvoices.slice(0, 5).map(pi => (
                        <div key={pi.preInvoiceId} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                              <Building className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                              <p className="font-medium">{pi.industrialName}</p>
                              <p className="text-sm text-gray-600">
                                {pi.preInvoiceNumber} - {pi.kpis.totalOrders} commandes
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">{formatCurrency(pi.totals.totalTTC)} EUR</p>
                            <span
                              className="inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium"
                              style={{
                                backgroundColor: `${getStatusColor(pi.status)}20`,
                                color: getStatusColor(pi.status)
                              }}
                            >
                              {getStatusLabel(pi.status)}
                            </span>
                          </div>
                        </div>
                      ))}
                      {preinvoices.length === 0 && (
                        <div className="px-6 py-12 text-center text-gray-500">
                          Aucune prefacture pour cette periode
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Preinvoices Tab */}
              {activeTab === 'preinvoices' && (
                <div className="space-y-4">
                  {/* Filters */}
                  <div className="bg-white rounded-lg shadow p-4">
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-600">Statut:</span>
                      <select
                        className="border rounded-lg px-3 py-2 text-sm"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                      >
                        <option value="all">Tous</option>
                        <option value="sent_to_industrial">Envoyees</option>
                        <option value="validated_industrial">Validees</option>
                        <option value="invoice_uploaded">Facture envoyee</option>
                        <option value="payment_pending">Paiement en cours</option>
                        <option value="paid">Payees</option>
                      </select>
                    </div>
                  </div>

                  {/* List */}
                  <div className="space-y-3">
                    {preinvoices.map(pi => {
                      const isExpanded = selectedPreinvoice?.preInvoiceId === pi.preInvoiceId;

                      return (
                        <div key={pi.preInvoiceId} className="bg-white rounded-lg shadow overflow-hidden">
                          <div
                            className="px-6 py-4 cursor-pointer hover:bg-gray-50"
                            onClick={() => setSelectedPreinvoice(isExpanded ? null : pi)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                  pi.status === 'paid' ? 'bg-green-100' :
                                  pi.status === 'validated_industrial' && !pi.carrierInvoice ? 'bg-amber-100' :
                                  'bg-emerald-100'
                                }`}>
                                  {pi.status === 'paid' ? (
                                    <CheckCircle className="w-6 h-6 text-green-600" />
                                  ) : pi.status === 'validated_industrial' && !pi.carrierInvoice ? (
                                    <Upload className="w-6 h-6 text-amber-600" />
                                  ) : (
                                    <FileText className="w-6 h-6 text-emerald-600" />
                                  )}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-semibold">{pi.preInvoiceNumber}</p>
                                    <span
                                      className="px-2 py-0.5 rounded-full text-xs font-medium"
                                      style={{
                                        backgroundColor: `${getStatusColor(pi.status)}20`,
                                        color: getStatusColor(pi.status)
                                      }}
                                    >
                                      {getStatusLabel(pi.status)}
                                    </span>
                                  </div>
                                  <p className="text-gray-600">{pi.industrialName}</p>
                                  <p className="text-sm text-gray-500">
                                    {pi.kpis.totalOrders} commandes - {getMonthName(pi.period.month)} {pi.period.year}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-6">
                                <div className="text-right">
                                  <p className="text-2xl font-bold text-emerald-600">{formatCurrency(pi.totals.totalTTC)} EUR</p>
                                  <p className="text-sm text-gray-500">TTC</p>
                                </div>
                                {isExpanded ? (
                                  <ChevronUp className="w-5 h-5 text-gray-400" />
                                ) : (
                                  <ChevronDown className="w-5 h-5 text-gray-400" />
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Expanded Details */}
                          {isExpanded && (
                            <div className="border-t px-6 py-4 space-y-4 bg-gray-50">
                              {/* Totals Breakdown */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-white rounded-lg p-4">
                                  <h4 className="font-medium mb-3">Detail Montants</h4>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Transport base</span>
                                      <span>{formatCurrency(pi.totals.baseAmount)} EUR</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Temps attente</span>
                                      <span>{formatCurrency(pi.totals.waitingAmount)} EUR</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Carburant</span>
                                      <span>{formatCurrency(pi.totals.fuelSurcharge)} EUR</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Peages</span>
                                      <span>{formatCurrency(pi.totals.tolls)} EUR</span>
                                    </div>
                                    {pi.totals.delayPenalty > 0 && (
                                      <div className="flex justify-between text-red-600">
                                        <span>Penalites retard</span>
                                        <span>-{formatCurrency(pi.totals.delayPenalty)} EUR</span>
                                      </div>
                                    )}
                                    <div className="border-t pt-2 flex justify-between font-medium">
                                      <span>Sous-total HT</span>
                                      <span>{formatCurrency(pi.totals.subtotalHT)} EUR</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">TVA ({pi.totals.tvaRate}%)</span>
                                      <span>{formatCurrency(pi.totals.tvaAmount)} EUR</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-lg text-emerald-600">
                                      <span>Total TTC</span>
                                      <span>{formatCurrency(pi.totals.totalTTC)} EUR</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="bg-white rounded-lg p-4">
                                  <h4 className="font-medium mb-3">KPIs Performance</h4>
                                  <div className="space-y-3">
                                    <div>
                                      <div className="flex justify-between text-sm mb-1">
                                        <span>Ponctualite enlevement</span>
                                        <span className={pi.kpis.onTimePickupRate >= 90 ? 'text-green-600' : 'text-amber-600'}>
                                          {pi.kpis.onTimePickupRate.toFixed(1)}%
                                        </span>
                                      </div>
                                      <div className="h-2 bg-gray-200 rounded-full">
                                        <div
                                          className={`h-2 rounded-full ${pi.kpis.onTimePickupRate >= 90 ? 'bg-green-500' : 'bg-amber-500'}`}
                                          style={{ width: `${pi.kpis.onTimePickupRate}%` }}
                                        />
                                      </div>
                                    </div>
                                    <div>
                                      <div className="flex justify-between text-sm mb-1">
                                        <span>Ponctualite livraison</span>
                                        <span className={pi.kpis.onTimeDeliveryRate >= 90 ? 'text-green-600' : 'text-amber-600'}>
                                          {pi.kpis.onTimeDeliveryRate.toFixed(1)}%
                                        </span>
                                      </div>
                                      <div className="h-2 bg-gray-200 rounded-full">
                                        <div
                                          className={`h-2 rounded-full ${pi.kpis.onTimeDeliveryRate >= 90 ? 'bg-green-500' : 'bg-amber-500'}`}
                                          style={{ width: `${pi.kpis.onTimeDeliveryRate}%` }}
                                        />
                                      </div>
                                    </div>
                                    <div>
                                      <div className="flex justify-between text-sm mb-1">
                                        <span>Documents complets</span>
                                        <span className={pi.kpis.documentsCompleteRate >= 95 ? 'text-green-600' : 'text-amber-600'}>
                                          {pi.kpis.documentsCompleteRate.toFixed(1)}%
                                        </span>
                                      </div>
                                      <div className="h-2 bg-gray-200 rounded-full">
                                        <div
                                          className={`h-2 rounded-full ${pi.kpis.documentsCompleteRate >= 95 ? 'bg-green-500' : 'bg-amber-500'}`}
                                          style={{ width: `${pi.kpis.documentsCompleteRate}%` }}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="bg-white rounded-lg p-4">
                                  <h4 className="font-medium mb-3">Paiement</h4>
                                  {pi.payment ? (
                                    <div className="space-y-2 text-sm">
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Echeance</span>
                                        <span>{formatDate(pi.payment.dueDate)}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Delai</span>
                                        <span>{pi.payment.paymentTermDays} jours</span>
                                      </div>
                                      {pi.payment.daysRemaining !== undefined && (
                                        <div className={`p-3 rounded-lg text-center mt-3 ${
                                          pi.payment.daysRemaining <= 0 ? 'bg-red-100' :
                                          pi.payment.daysRemaining <= 5 ? 'bg-amber-100' : 'bg-green-100'
                                        }`}>
                                          <p className="text-2xl font-bold">
                                            {pi.payment.daysRemaining <= 0 ? 'ECHU' : `J-${pi.payment.daysRemaining}`}
                                          </p>
                                          <p className="text-xs">
                                            {pi.payment.daysRemaining <= 0 ? 'En retard' : 'Jours restants'}
                                          </p>
                                        </div>
                                      )}
                                      {pi.payment.paidAt && (
                                        <div className="p-3 bg-green-100 rounded-lg mt-3">
                                          <p className="font-medium text-green-700">Paye le {formatDate(pi.payment.paidAt)}</p>
                                          <p className="text-sm text-green-600">Ref: {pi.payment.paymentReference}</p>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <p className="text-gray-500 text-sm">Information non disponible</p>
                                  )}
                                </div>
                              </div>

                              {/* Carrier Invoice Status */}
                              {pi.carrierInvoice && (
                                <div className={`p-4 rounded-lg ${
                                  pi.carrierInvoice.status === 'accepted' ? 'bg-green-50 border border-green-200' :
                                  pi.carrierInvoice.status === 'rejected' ? 'bg-red-50 border border-red-200' :
                                  'bg-blue-50 border border-blue-200'
                                }`}>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <FileCheck className={`w-5 h-5 ${
                                        pi.carrierInvoice.status === 'accepted' ? 'text-green-600' :
                                        pi.carrierInvoice.status === 'rejected' ? 'text-red-600' : 'text-blue-600'
                                      }`} />
                                      <div>
                                        <p className="font-medium">Votre facture: {pi.carrierInvoice.invoiceNumber}</p>
                                        <p className="text-sm text-gray-600">
                                          {pi.carrierInvoice.fileName} - Uploadee le {formatDate(pi.carrierInvoice.uploadedAt)}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-bold">{formatCurrency(pi.carrierInvoice.invoiceAmount)} EUR</p>
                                      <p className="text-sm">Match: {pi.carrierInvoice.matchScore}%</p>
                                    </div>
                                  </div>
                                  {pi.carrierInvoice.status === 'rejected' && pi.carrierInvoice.rejectionReason && (
                                    <div className="mt-3 p-2 bg-red-100 rounded text-sm text-red-700">
                                      <strong>Motif rejet:</strong> {pi.carrierInvoice.rejectionReason}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Actions */}
                              <div className="flex justify-end gap-2 pt-2">
                                {pi.status === 'validated_industrial' && !pi.carrierInvoice && (
                                  <button
                                    onClick={() => setActiveTab('upload')}
                                    className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                                  >
                                    <Upload className="w-4 h-4" />
                                    Uploader ma facture
                                  </button>
                                )}
                                <button
                                  onClick={() => setDisputeModal(pi.preInvoiceId)}
                                  className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                                >
                                  <AlertTriangle className="w-4 h-4" />
                                  Contester
                                </button>
                              </div>

                              {/* Orders List */}
                              <div>
                                <h4 className="font-medium mb-2">Commandes ({pi.lines.length})</h4>
                                <div className="max-h-64 overflow-y-auto rounded-lg border">
                                  <table className="w-full text-sm">
                                    <thead className="bg-gray-100 sticky top-0">
                                      <tr>
                                        <th className="text-left px-3 py-2">Reference</th>
                                        <th className="text-left px-3 py-2">Trajet</th>
                                        <th className="text-left px-3 py-2">Date</th>
                                        <th className="text-right px-3 py-2">Montant</th>
                                        <th className="text-center px-3 py-2">CMR</th>
                                      </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y">
                                      {pi.lines.map((line, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50">
                                          <td className="px-3 py-2 font-medium">{line.orderReference}</td>
                                          <td className="px-3 py-2 text-gray-600">{line.pickupCity} → {line.deliveryCity}</td>
                                          <td className="px-3 py-2">{formatDate(line.deliveryDate)}</td>
                                          <td className="px-3 py-2 text-right font-medium">{formatCurrency(line.totalAmount)} EUR</td>
                                          <td className="px-3 py-2 text-center">
                                            {line.cmrValidated ? (
                                              <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                                            ) : (
                                              <Clock className="w-4 h-4 text-gray-400 mx-auto" />
                                            )}
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
                      );
                    })}

                    {preinvoices.length === 0 && (
                      <div className="bg-white rounded-lg shadow p-12 text-center">
                        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-600">Aucune prefacture pour cette periode</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Validations Tab */}
              {activeTab === 'validations' && (
                <div className="space-y-6">
                  {/* Header with filters */}
                  <div className="bg-white rounded-lg shadow p-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                          <Scale className="w-5 h-5 text-emerald-600" />
                          Validation des Prefactures
                        </h2>
                        <p className="text-sm text-gray-600">
                          Verifiez et validez vos prefactures ou contestez les ecarts
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-gray-400" />
                        <select
                          className="border rounded-lg px-3 py-2 text-sm"
                          value={validationFilter}
                          onChange={(e) => setValidationFilter(e.target.value as any)}
                        >
                          <option value="all">Toutes</option>
                          <option value="pending">A valider</option>
                          <option value="disputed">Contestees</option>
                          <option value="validated">Validees</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg shadow p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">A valider</p>
                          <p className="text-2xl font-bold text-amber-600">
                            {preinvoices.filter(p => p.status === 'sent_to_industrial').length}
                          </p>
                        </div>
                        <Clock className="w-8 h-8 text-amber-500 opacity-60" />
                      </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Contestees</p>
                          <p className="text-2xl font-bold text-red-600">
                            {preinvoices.filter(p => p.status === 'disputed').length}
                          </p>
                        </div>
                        <AlertTriangle className="w-8 h-8 text-red-500 opacity-60" />
                      </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Validees</p>
                          <p className="text-2xl font-bold text-green-600">
                            {preinvoices.filter(p => p.status === 'validated_industrial').length}
                          </p>
                        </div>
                        <CheckCircle className="w-8 h-8 text-green-500 opacity-60" />
                      </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Montant en cours</p>
                          <p className="text-xl font-bold text-emerald-600">
                            {formatCurrency(preinvoices.filter(p => p.status === 'sent_to_industrial').reduce((s, p) => s + p.totals.totalTTC, 0))} EUR
                          </p>
                        </div>
                        <Euro className="w-8 h-8 text-emerald-500 opacity-60" />
                      </div>
                    </div>
                  </div>

                  {/* Prefactures List for Validation */}
                  <div className="space-y-4">
                    {preinvoices
                      .filter(pi => {
                        if (validationFilter === 'pending') return pi.status === 'sent_to_industrial';
                        if (validationFilter === 'disputed') return pi.status === 'disputed';
                        if (validationFilter === 'validated') return pi.status === 'validated_industrial';
                        return true;
                      })
                      .map(pi => (
                        <div key={pi.preInvoiceId} className="bg-white rounded-lg shadow overflow-hidden">
                          <div className="p-6">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                  pi.status === 'disputed' ? 'bg-red-100' :
                                  pi.status === 'validated_industrial' ? 'bg-green-100' :
                                  'bg-amber-100'
                                }`}>
                                  {pi.status === 'disputed' ? (
                                    <AlertTriangle className="w-6 h-6 text-red-600" />
                                  ) : pi.status === 'validated_industrial' ? (
                                    <CheckCircle className="w-6 h-6 text-green-600" />
                                  ) : (
                                    <Clock className="w-6 h-6 text-amber-600" />
                                  )}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-semibold text-lg">{pi.preInvoiceNumber}</p>
                                    <span
                                      className="px-2 py-0.5 rounded-full text-xs font-medium"
                                      style={{
                                        backgroundColor: `${getStatusColor(pi.status)}20`,
                                        color: getStatusColor(pi.status)
                                      }}
                                    >
                                      {getStatusLabel(pi.status)}
                                    </span>
                                  </div>
                                  <p className="text-gray-600">{pi.industrialName}</p>
                                  <p className="text-sm text-gray-500">
                                    {pi.kpis.totalOrders} commandes - {getMonthName(pi.period.month)} {pi.period.year}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-3xl font-bold text-emerald-600">{formatCurrency(pi.totals.totalTTC)} EUR</p>
                                <p className="text-sm text-gray-500">TTC</p>
                              </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                              <div>
                                <p className="text-xs text-gray-500 uppercase mb-1">Transport Base</p>
                                <p className="font-medium">{formatCurrency(pi.totals.baseAmount)} EUR</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 uppercase mb-1">Surcharges</p>
                                <p className="font-medium">{formatCurrency(pi.totals.fuelSurcharge + pi.totals.tolls + pi.totals.waitingAmount)} EUR</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 uppercase mb-1">Penalites</p>
                                <p className={`font-medium ${pi.totals.delayPenalty > 0 ? 'text-red-600' : ''}`}>
                                  {pi.totals.delayPenalty > 0 ? `-${formatCurrency(pi.totals.delayPenalty)}` : '0,00'} EUR
                                </p>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            {pi.status === 'sent_to_industrial' && (
                              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                                <button
                                  onClick={() => {
                                    const piForDispute = preinvoices.find(p => p.preInvoiceId === pi.preInvoiceId);
                                    if (piForDispute) {
                                      setDisputeAmount(piForDispute.totals.totalTTC);
                                    }
                                    setDisputeModal(pi.preInvoiceId);
                                  }}
                                  className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                                >
                                  <ThumbsDown className="w-4 h-4" />
                                  Contester
                                </button>
                                <button
                                  onClick={() => setValidateModal(pi.preInvoiceId)}
                                  className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                                >
                                  <ThumbsUp className="w-4 h-4" />
                                  Valider
                                </button>
                              </div>
                            )}

                            {/* Disputed Status Info */}
                            {pi.status === 'disputed' && (
                              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                                <div className="flex items-start gap-3">
                                  <MessageSquare className="w-5 h-5 text-red-600 mt-0.5" />
                                  <div className="flex-1">
                                    <p className="font-medium text-red-800">Contestation en cours</p>
                                    <p className="text-sm text-red-700 mt-1">
                                      Votre contestation a ete soumise. L'industriel va examiner votre demande.
                                    </p>
                                    <div className="mt-3 flex items-center gap-2">
                                      <button className="text-sm text-red-700 font-medium hover:underline flex items-center gap-1">
                                        <History className="w-4 h-4" />
                                        Voir l'historique
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Validated Status Info */}
                            {pi.status === 'validated_industrial' && (
                              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex items-center gap-3">
                                  <CheckCircle className="w-5 h-5 text-green-600" />
                                  <div>
                                    <p className="font-medium text-green-800">Prefacture validee</p>
                                    <p className="text-sm text-green-700">
                                      Vous pouvez maintenant uploader votre facture pour declencher le paiement.
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => setActiveTab('upload')}
                                    className="ml-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                                  >
                                    Uploader facture
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}

                    {/* Empty State */}
                    {preinvoices.filter(pi => {
                      if (validationFilter === 'pending') return pi.status === 'sent_to_industrial';
                      if (validationFilter === 'disputed') return pi.status === 'disputed';
                      if (validationFilter === 'validated') return pi.status === 'validated_industrial';
                      return true;
                    }).length === 0 && (
                      <div className="bg-white rounded-lg shadow p-12 text-center">
                        <Scale className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-600">
                          {validationFilter === 'pending' ? 'Aucune prefacture a valider' :
                           validationFilter === 'disputed' ? 'Aucune contestation en cours' :
                           validationFilter === 'validated' ? 'Aucune prefacture validee' :
                           'Aucune prefacture pour cette periode'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Upload Tab */}
              {activeTab === 'upload' && (
                <div className="max-w-3xl mx-auto space-y-6">
                  <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-2">Uploader vos factures</h2>
                    <p className="text-gray-600 mb-6">
                      Uploadez vos factures pour les prefactures validees par l'industriel.
                      Le montant de votre facture sera compare automatiquement.
                    </p>

                    {pendingInvoices.length > 0 ? (
                      <div className="space-y-4">
                        {pendingInvoices.map(pi => (
                          <div key={pi.preInvoiceId} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <p className="font-semibold">{pi.preInvoiceNumber}</p>
                                <p className="text-gray-600">{pi.industrialName}</p>
                                <p className="text-sm text-gray-500">{pi.kpis.totalOrders} commandes</p>
                              </div>
                              <div className="text-right">
                                <p className="text-2xl font-bold text-emerald-600">{formatCurrency(pi.totals.totalTTC)} EUR</p>
                                <p className="text-sm text-gray-500">Montant attendu TTC</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Numero de votre facture
                                </label>
                                <input
                                  type="text"
                                  className="w-full border rounded-lg px-3 py-2"
                                  placeholder="FA-2024-XXXX"
                                  value={invoiceNumber}
                                  onChange={(e) => setInvoiceNumber(e.target.value)}
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Montant TTC (EUR)
                                </label>
                                <input
                                  type="number"
                                  step="0.01"
                                  className="w-full border rounded-lg px-3 py-2"
                                  placeholder={pi.totals.totalTTC.toString()}
                                  value={invoiceAmount || ''}
                                  onChange={(e) => setInvoiceAmount(parseFloat(e.target.value) || 0)}
                                />
                              </div>
                            </div>

                            <div className="border-2 border-dashed rounded-lg p-6 text-center">
                              <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) uploadCarrierInvoice(pi.preInvoiceId, file);
                                }}
                                className="hidden"
                                id={`invoice-${pi.preInvoiceId}`}
                                disabled={uploadingInvoice === pi.preInvoiceId}
                              />
                              <label
                                htmlFor={`invoice-${pi.preInvoiceId}`}
                                className={`inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg cursor-pointer hover:bg-emerald-700 ${
                                  uploadingInvoice === pi.preInvoiceId ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                              >
                                {uploadingInvoice === pi.preInvoiceId ? (
                                  <>
                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                    Upload en cours...
                                  </>
                                ) : (
                                  <>
                                    <Paperclip className="w-5 h-5" />
                                    Joindre ma facture
                                  </>
                                )}
                              </label>
                              <p className="text-xs text-gray-500 mt-3">
                                Formats acceptes: PDF, JPG, PNG (max 10 MB)
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <p className="text-xl font-medium text-gray-700">Toutes vos factures sont a jour!</p>
                        <p className="text-gray-500 mt-2">
                          Aucune prefacture en attente de votre facture pour cette periode.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Payments Tab */}
              {activeTab === 'payments' && (
                <div className="space-y-6">
                  {/* Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg shadow p-6">
                      <p className="text-sm text-gray-600">En attente de paiement</p>
                      <p className="text-3xl font-bold text-amber-600">{formatCurrency(totalAwaitingPayment)} EUR</p>
                      <p className="text-sm text-gray-500 mt-1">{awaitingPayment.length} prefacture(s)</p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                      <p className="text-sm text-gray-600">Paye ce mois</p>
                      <p className="text-3xl font-bold text-green-600">
                        {formatCurrency(preinvoices.filter(p => p.status === 'paid').reduce((s, p) => s + p.totals.totalTTC, 0))} EUR
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {preinvoices.filter(p => p.status === 'paid').length} prefacture(s)
                      </p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                      <p className="text-sm text-gray-600">Delai moyen paiement</p>
                      <p className="text-3xl font-bold text-blue-600">30 jours</p>
                      <p className="text-sm text-gray-500 mt-1">Apres validation facture</p>
                    </div>
                  </div>

                  {/* Payment Timeline */}
                  <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b">
                      <h2 className="text-lg font-semibold">Suivi des paiements</h2>
                    </div>
                    <div className="divide-y">
                      {awaitingPayment.map(pi => (
                        <div key={pi.preInvoiceId} className="px-6 py-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                pi.payment?.daysRemaining !== undefined && pi.payment.daysRemaining <= 5
                                  ? 'bg-amber-100'
                                  : 'bg-blue-100'
                              }`}>
                                <Clock className={`w-6 h-6 ${
                                  pi.payment?.daysRemaining !== undefined && pi.payment.daysRemaining <= 5
                                    ? 'text-amber-600'
                                    : 'text-blue-600'
                                }`} />
                              </div>
                              <div>
                                <p className="font-medium">{pi.preInvoiceNumber}</p>
                                <p className="text-gray-600">{pi.industrialName}</p>
                                <p className="text-sm text-gray-500">
                                  Facture: {pi.carrierInvoice?.invoiceNumber || 'N/A'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-6">
                              <div className="text-right">
                                <p className="text-xl font-bold">{formatCurrency(pi.totals.totalTTC)} EUR</p>
                                <p className="text-sm text-gray-500">
                                  Echeance: {pi.payment ? formatDate(pi.payment.dueDate) : 'N/A'}
                                </p>
                              </div>
                              {pi.payment?.daysRemaining !== undefined && (
                                <div className={`px-4 py-2 rounded-lg text-center min-w-[80px] ${
                                  pi.payment.daysRemaining <= 0 ? 'bg-red-100 text-red-700' :
                                  pi.payment.daysRemaining <= 5 ? 'bg-amber-100 text-amber-700' :
                                  'bg-green-100 text-green-700'
                                }`}>
                                  <p className="text-lg font-bold">
                                    {pi.payment.daysRemaining <= 0 ? 'ECHU' : `J-${pi.payment.daysRemaining}`}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      {awaitingPayment.length === 0 && (
                        <div className="px-6 py-12 text-center text-gray-500">
                          Aucun paiement en attente
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Recent Payments */}
                  <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b">
                      <h2 className="text-lg font-semibold">Paiements recus</h2>
                    </div>
                    <div className="divide-y">
                      {preinvoices.filter(p => p.status === 'paid').map(pi => (
                        <div key={pi.preInvoiceId} className="px-6 py-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                              </div>
                              <div>
                                <p className="font-medium">{pi.preInvoiceNumber}</p>
                                <p className="text-sm text-gray-600">{pi.industrialName}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-green-600">{formatCurrency(pi.payment?.paidAmount || pi.totals.totalTTC)} EUR</p>
                              <p className="text-sm text-gray-500">
                                {pi.payment?.paidAt ? formatDate(pi.payment.paidAt) : 'N/A'}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                      {preinvoices.filter(p => p.status === 'paid').length === 0 && (
                        <div className="px-6 py-12 text-center text-gray-500">
                          Aucun paiement recu ce mois
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Enhanced Dispute Modal */}
        {disputeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b flex items-center justify-between bg-red-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-red-800">Contester la prefacture</h2>
                    <p className="text-sm text-red-600">
                      {preinvoices.find(p => p.preInvoiceId === disputeModal)?.preInvoiceNumber}
                    </p>
                  </div>
                </div>
                <button onClick={() => {
                  setDisputeModal(null);
                  setDisputeReason('');
                  setDisputeCategory('price');
                  setDisputeAmount(0);
                  setDisputeDetails('');
                }}>
                  <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                </button>
              </div>

              <div className="px-6 py-4 space-y-4">
                {/* Category Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Tag className="w-4 h-4 inline mr-1" />
                    Categorie de contestation
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {[
                      { id: 'price', label: 'Ecart de prix', icon: Euro },
                      { id: 'quantity', label: 'Quantite', icon: FileText },
                      { id: 'service', label: 'Service', icon: AlertCircle },
                      { id: 'damage', label: 'Dommage', icon: AlertTriangle },
                      { id: 'delay', label: 'Retard/Penalite', icon: Clock },
                      { id: 'other', label: 'Autre', icon: MessageSquare }
                    ].map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setDisputeCategory(cat.id)}
                        className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                          disputeCategory === cat.id
                            ? 'border-red-500 bg-red-50 text-red-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <cat.icon className="w-4 h-4" />
                        <span className="text-sm">{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Disputed Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Montant conteste (EUR)
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="number"
                      step="0.01"
                      value={disputeAmount || ''}
                      onChange={(e) => setDisputeAmount(parseFloat(e.target.value) || 0)}
                      className="flex-1 border rounded-lg px-3 py-2"
                      placeholder="0.00"
                    />
                    <div className="text-sm text-gray-500">
                      sur {formatCurrency(preinvoices.find(p => p.preInvoiceId === disputeModal)?.totals.totalTTC || 0)} EUR
                    </div>
                  </div>
                </div>

                {/* Reason */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Motif de la contestation *
                  </label>
                  <textarea
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    placeholder="Expliquez brievement le motif de votre contestation..."
                    className="w-full border rounded-lg p-3 h-24 resize-none"
                    required
                  />
                </div>

                {/* Additional Details */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Details supplementaires (optionnel)
                  </label>
                  <textarea
                    value={disputeDetails}
                    onChange={(e) => setDisputeDetails(e.target.value)}
                    placeholder="Ajoutez des details, references, numeros de commande concernes..."
                    className="w-full border rounded-lg p-3 h-20 resize-none"
                  />
                </div>

                {/* Info Box */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium">Information</p>
                      <p className="mt-1">
                        L'industriel sera notifie de votre contestation et disposera de 5 jours ouvrables pour examiner
                        votre demande. Vous recevrez une notification par email lors de la resolution.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setDisputeModal(null);
                    setDisputeReason('');
                    setDisputeCategory('price');
                    setDisputeAmount(0);
                    setDisputeDetails('');
                  }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={submitDispute}
                  disabled={!disputeReason.trim()}
                  className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4" />
                  Soumettre la contestation
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Validation Modal */}
        {validateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
              <div className="px-6 py-4 border-b flex items-center justify-between bg-green-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <ThumbsUp className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-green-800">Valider la prefacture</h2>
                    <p className="text-sm text-green-600">
                      {preinvoices.find(p => p.preInvoiceId === validateModal)?.preInvoiceNumber}
                    </p>
                  </div>
                </div>
                <button onClick={() => { setValidateModal(null); setValidateComment(''); }}>
                  <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                </button>
              </div>

              <div className="px-6 py-4 space-y-4">
                {/* Amount Summary */}
                <div className="p-4 bg-emerald-50 rounded-lg text-center">
                  <p className="text-sm text-emerald-600 mb-1">Montant a valider</p>
                  <p className="text-3xl font-bold text-emerald-700">
                    {formatCurrency(preinvoices.find(p => p.preInvoiceId === validateModal)?.totals.totalTTC || 0)} EUR
                  </p>
                  <p className="text-xs text-emerald-600 mt-1">TTC</p>
                </div>

                {/* Validation Checklist */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">En validant, je confirme que:</p>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Les montants sont conformes aux prestations realisees</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Les commandes listees correspondent aux livraisons effectuees</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Les eventuelles penalites sont justifiees</span>
                    </div>
                  </div>
                </div>

                {/* Optional Comment */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Commentaire (optionnel)
                  </label>
                  <textarea
                    value={validateComment}
                    onChange={(e) => setValidateComment(e.target.value)}
                    placeholder="Ajoutez un commentaire si necessaire..."
                    className="w-full border rounded-lg p-3 h-20 resize-none"
                  />
                </div>
              </div>

              <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
                <button
                  onClick={() => { setValidateModal(null); setValidateComment(''); }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={submitValidation}
                  className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  Confirmer la validation
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
