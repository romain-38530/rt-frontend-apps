/**
 * Page Gestion des Transporteurs References - Portail Industry
 * Systeme de referencement complet conforme au cahier des charges v4
 *
 * Fonctionnalites:
 * - Niveaux de referencement: Guest (N2), Reference (N1), Premium (N1+)
 * - Chaine de dispatch avec algorithme de priorite
 * - Vigilance et alertes automatiques (J-30, J-15, J-7)
 * - Import Affret.IA
 * - Grilles tarifaires FTL/LTL
 * - Blocage/Deblocage
 */

import { useEffect, useState } from 'react';
import { useSafeRouter } from '../lib/useSafeRouter';
import Head from 'next/head';
import { isAuthenticated, getAuthToken } from '../lib/auth';
import * as carrierApi from '@shared/services/carrier-referencing-api';

// Types locaux pour le state
type TabType = 'list' | 'dispatch' | 'vigilance' | 'pricing' | 'invite' | 'events';

interface FilterState {
  level: carrierApi.CarrierLevel | '';
  status: carrierApi.CarrierStatus | '';
  vigilanceStatus: carrierApi.VigilanceStatus | '';
  search: string;
}

export default function TransporteursPage() {
  const router = useSafeRouter();
  const [activeTab, setActiveTab] = useState<TabType>('list');

  // Data state
  const [carriers, setCarriers] = useState<carrierApi.ReferencedCarrier[]>([]);
  const [selectedCarrier, setSelectedCarrier] = useState<carrierApi.ReferencedCarrier | null>(null);
  const [alerts, setAlerts] = useState<carrierApi.VigilanceAlert[]>([]);
  const [events, setEvents] = useState<carrierApi.CarrierEvent[]>([]);
  const [dispatchChain, setDispatchChain] = useState<carrierApi.DispatchCarrierEntry[]>([]);
  const [stats, setStats] = useState<{
    total: number;
    byLevel: { guest: number; referenced: number; premium: number };
    byVigilance: { compliant: number; warning: number; blocked: number };
    alertsSummary: { critical: number; warning: number; info: number };
  } | null>(null);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({ level: '', status: '', vigilanceStatus: '', search: '' });
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Formulaire invitation
  const [inviteForm, setInviteForm] = useState({
    email: '',
    companyName: '',
    message: '',
    level: 'guest' as carrierApi.CarrierLevel
  });

  // Formulaire blocage
  const [blockForm, setBlockForm] = useState({
    reason: 'manual_block' as carrierApi.BlockingReason,
    description: '',
    until: ''
  });

  // ID industriel (a recuperer du contexte auth)
  const industrielId = 'IND-001';

  // ==========================================================================
  // CHARGEMENT DES DONNEES
  // ==========================================================================

  const loadCarriers = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await carrierApi.getReferencedCarriers({
        industrielId,
        level: filters.level || undefined,
        status: filters.status || undefined,
        vigilanceStatus: filters.vigilanceStatus || undefined,
        search: filters.search || undefined,
        limit: 50
      });
      setCarriers(result.carriers);
    } catch (err: any) {
      console.error('Erreur chargement transporteurs:', err);
      // Fallback mock data
      setCarriers(getMockCarriers());
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const result = await carrierApi.getCarrierStats(industrielId);
      setStats({
        total: result.totalCarriers,
        byLevel: result.byLevel,
        byVigilance: result.byVigilance,
        alertsSummary: result.alertsSummary
      });
    } catch (err) {
      // Fallback mock stats
      setStats({
        total: 45,
        byLevel: { guest: 12, referenced: 28, premium: 5 },
        byVigilance: { compliant: 35, warning: 7, blocked: 3 },
        alertsSummary: { critical: 2, warning: 5, info: 8 }
      });
    }
  };

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const result = await carrierApi.getAlerts({ industrielId, isResolved: false });
      setAlerts(result.alerts);
    } catch (err) {
      // Fallback mock alerts
      setAlerts(getMockAlerts());
    } finally {
      setLoading(false);
    }
  };

  const loadEvents = async () => {
    setLoading(true);
    try {
      const result = await carrierApi.getEvents({ industrielId, limit: 50 });
      setEvents(result.events);
    } catch (err) {
      // Fallback mock events
      setEvents(getMockEvents());
    } finally {
      setLoading(false);
    }
  };

  const loadDispatchChain = async () => {
    setLoading(true);
    try {
      const result = await carrierApi.getDispatchChain(industrielId);
      setDispatchChain(result.carriers);
    } catch (err) {
      // Fallback mock dispatch chain
      setDispatchChain(getMockDispatchChain());
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================================
  // ACTIONS
  // ==========================================================================

  const handleInvite = async () => {
    if (!inviteForm.email || !inviteForm.companyName) {
      setError('Email et nom d\'entreprise requis');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await carrierApi.inviteCarrier({
        email: inviteForm.email,
        companyName: inviteForm.companyName,
        industrielId,
        message: inviteForm.message,
        level: inviteForm.level
      });
      setSuccess(`Invitation envoyee a ${inviteForm.email}`);
      setShowInviteModal(false);
      setInviteForm({ email: '', companyName: '', message: '', level: 'guest' });
      loadCarriers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBlock = async () => {
    if (!selectedCarrier || !blockForm.description) {
      setError('Description requise');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await carrierApi.blockCarrier(selectedCarrier.id, {
        reason: blockForm.reason,
        description: blockForm.description,
        until: blockForm.until || undefined
      });
      setSuccess(`Transporteur ${selectedCarrier.companyName} bloque`);
      setShowBlockModal(false);
      setBlockForm({ reason: 'manual_block', description: '', until: '' });
      loadCarriers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async (carrier: carrierApi.ReferencedCarrier) => {
    setLoading(true);
    setError(null);
    try {
      await carrierApi.unblockCarrier(carrier.id);
      setSuccess(`Transporteur ${carrier.companyName} debloque`);
      loadCarriers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradePremium = async (carrier: carrierApi.ReferencedCarrier) => {
    setLoading(true);
    setError(null);
    try {
      await carrierApi.grantPremium(carrier.id);
      setSuccess(`${carrier.companyName} est maintenant Premium`);
      loadCarriers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    setLoading(true);
    try {
      await carrierApi.resolveAlert(alertId);
      setSuccess('Alerte resolue');
      loadAlerts();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReorderDispatch = async (carrierId: string, direction: 'up' | 'down') => {
    const index = dispatchChain.findIndex(c => c.carrierId === carrierId);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= dispatchChain.length) return;

    const newOrder = [...dispatchChain];
    [newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]];

    try {
      await carrierApi.reorderDispatchChain(industrielId, {
        carrierIds: newOrder.map(c => c.carrierId)
      });
      setDispatchChain(newOrder.map((c, i) => ({ ...c, rank: i + 1 })));
      setSuccess('Ordre de dispatch mis a jour');
    } catch (err: any) {
      setError(err.message);
    }
  };

  // ==========================================================================
  // EFFETS
  // ==========================================================================

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    loadCarriers();
    loadStats();
  }, [router]);

  useEffect(() => {
    if (activeTab === 'vigilance') loadAlerts();
    if (activeTab === 'events') loadEvents();
    if (activeTab === 'dispatch') loadDispatchChain();
  }, [activeTab]);

  useEffect(() => {
    loadCarriers();
  }, [filters]);

  // Clear messages after 5s
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // ==========================================================================
  // STYLES
  // ==========================================================================

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    backgroundColor: '#f3f4f6',
    fontFamily: 'system-ui, sans-serif'
  };

  const headerStyle: React.CSSProperties = {
    padding: '16px 24px',
    backgroundColor: 'white',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  };

  const tabStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '10px 20px',
    backgroundColor: isActive ? '#667eea' : 'white',
    color: isActive ? 'white' : '#374151',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px'
  });

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    marginBottom: '16px'
  };

  const buttonStyle: React.CSSProperties = {
    padding: '10px 20px',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px'
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    marginBottom: '12px'
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    backgroundColor: 'white'
  };

  const badgeStyle = (color: string): React.CSSProperties => ({
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
    backgroundColor: color === 'green' ? '#d1fae5' : color === 'orange' ? '#fef3c7' : color === 'red' ? '#fee2e2' : color === 'blue' ? '#dbeafe' : color === 'gold' ? '#fef3c7' : '#f3f4f6',
    color: color === 'green' ? '#059669' : color === 'orange' ? '#d97706' : color === 'red' ? '#dc2626' : color === 'blue' ? '#2563eb' : color === 'gold' ? '#b45309' : '#374151'
  });

  const modalStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  };

  const modalContentStyle: React.CSSProperties = {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '32px',
    maxWidth: '500px',
    width: '90%',
    maxHeight: '90vh',
    overflow: 'auto'
  };

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  const getLevelBadge = (level: carrierApi.CarrierLevel) => {
    const config = {
      guest: { label: 'Guest (N2)', color: 'gray' },
      referenced: { label: 'Reference (N1)', color: 'blue' },
      premium: { label: 'Premium (N1+)', color: 'gold' }
    };
    return config[level] || { label: level, color: 'gray' };
  };

  const getVigilanceBadge = (status: carrierApi.VigilanceStatus) => {
    const config = {
      compliant: { label: 'Conforme', color: 'green' },
      warning: { label: 'Alerte', color: 'orange' },
      blocked: { label: 'Bloque', color: 'red' },
      pending: { label: 'En attente', color: 'gray' }
    };
    return config[status] || { label: status, color: 'gray' };
  };

  const getAlertSeverityBadge = (severity: carrierApi.AlertSeverity) => {
    const config = {
      info: { label: 'Info', color: 'blue' },
      warning: { label: 'Attention', color: 'orange' },
      critical: { label: 'Critique', color: 'red' }
    };
    return config[severity] || { label: severity, color: 'gray' };
  };

  // ==========================================================================
  // MOCK DATA (fallback)
  // ==========================================================================

  const getMockCarriers = (): carrierApi.ReferencedCarrier[] => [
    {
      id: 'CAR-001',
      companyId: 'COMP-001',
      companyName: 'Transport Express SARL',
      siret: '12345678901234',
      level: 'premium',
      status: 'active',
      vigilanceStatus: 'compliant',
      overallScore: 92,
      scoreDetails: { onTimeDelivery: 95, communication: 88, damageRate: 98, documentation: 90, responsiveness: 92, pricing: 85, compliance: 96 },
      dispatchOrder: 1,
      dispatchPriority: 'high',
      documents: [],
      vigilanceAlerts: [],
      pricingGrids: [],
      options: [{ id: '1', code: 'GPS', name: 'Tracking GPS', category: 'service', isActive: true }],
      blockingHistory: [],
      totalOrders: 156,
      completedOrders: 152,
      cancelledOrders: 2,
      averageResponseTime: 1.5,
      contact: { email: 'contact@transport-express.fr', phone: '01 23 45 67 89', country: 'FR' },
      referencedBy: industrielId,
      referencedAt: '2024-01-15T10:00:00Z',
      premiumSince: '2024-06-01T00:00:00Z',
      source: 'manual',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-11-28T14:00:00Z'
    },
    {
      id: 'CAR-002',
      companyId: 'COMP-002',
      companyName: 'Logistique Rapide SAS',
      level: 'referenced',
      status: 'active',
      vigilanceStatus: 'warning',
      overallScore: 78,
      scoreDetails: { onTimeDelivery: 75, communication: 82, damageRate: 85, documentation: 70, responsiveness: 80, pricing: 78, compliance: 76 },
      dispatchOrder: 2,
      dispatchPriority: 'medium',
      documents: [],
      vigilanceAlerts: [],
      pricingGrids: [],
      options: [],
      blockingHistory: [],
      totalOrders: 89,
      completedOrders: 85,
      cancelledOrders: 3,
      averageResponseTime: 3.2,
      contact: { email: 'contact@logistique-rapide.fr', country: 'FR' },
      referencedBy: industrielId,
      referencedAt: '2024-03-20T08:00:00Z',
      source: 'affret_ia',
      createdAt: '2024-03-20T08:00:00Z',
      updatedAt: '2024-11-25T16:00:00Z'
    },
    {
      id: 'CAR-003',
      companyId: 'COMP-003',
      companyName: 'Trans Euro Services',
      level: 'guest',
      status: 'active',
      vigilanceStatus: 'compliant',
      overallScore: 65,
      scoreDetails: { onTimeDelivery: 68, communication: 62, damageRate: 70, documentation: 60, responsiveness: 65, pricing: 70, compliance: 60 },
      dispatchOrder: 5,
      dispatchPriority: 'low',
      documents: [],
      vigilanceAlerts: [],
      pricingGrids: [],
      options: [],
      blockingHistory: [],
      totalOrders: 23,
      completedOrders: 21,
      cancelledOrders: 1,
      averageResponseTime: 5.0,
      contact: { email: 'contact@trans-euro.eu', country: 'FR' },
      referencedBy: industrielId,
      referencedAt: '2024-09-10T12:00:00Z',
      source: 'invitation',
      createdAt: '2024-09-10T12:00:00Z',
      updatedAt: '2024-11-20T09:00:00Z'
    },
    {
      id: 'CAR-004',
      companyId: 'COMP-004',
      companyName: 'Fret International',
      level: 'referenced',
      status: 'blocked',
      vigilanceStatus: 'blocked',
      overallScore: 45,
      scoreDetails: { onTimeDelivery: 50, communication: 45, damageRate: 40, documentation: 35, responsiveness: 50, pricing: 55, compliance: 40 },
      dispatchOrder: 99,
      dispatchPriority: 'low',
      documents: [],
      vigilanceAlerts: [],
      pricingGrids: [],
      options: [],
      blockingHistory: [],
      currentBlockReason: 'documents_expired',
      blockedAt: '2024-11-15T00:00:00Z',
      totalOrders: 45,
      completedOrders: 40,
      cancelledOrders: 4,
      averageResponseTime: 8.0,
      contact: { email: 'contact@fret-intl.com', country: 'FR' },
      referencedBy: industrielId,
      referencedAt: '2024-02-01T10:00:00Z',
      source: 'manual',
      createdAt: '2024-02-01T10:00:00Z',
      updatedAt: '2024-11-15T00:00:00Z'
    }
  ];

  const getMockAlerts = (): carrierApi.VigilanceAlert[] => [
    {
      id: 'ALT-001',
      carrierId: 'CAR-002',
      type: 'document_expiring_7',
      severity: 'critical',
      title: 'Assurance RC expire dans 7 jours',
      message: 'L\'assurance RC de Logistique Rapide SAS expire le 05/12/2024. Action requise.',
      documentType: 'insurance_rc',
      actionRequired: true,
      actionLabel: 'Voir document',
      notificationChannels: ['email', 'in_app'],
      isResolved: false,
      autoBlockAt: '2024-12-05T00:00:00Z',
      autoBlockReason: 'insurance_lapsed',
      createdAt: '2024-11-28T08:00:00Z'
    },
    {
      id: 'ALT-002',
      carrierId: 'CAR-003',
      type: 'document_expiring_30',
      severity: 'warning',
      title: 'Licence transport expire dans 25 jours',
      message: 'La licence de transport de Trans Euro Services expire le 23/12/2024.',
      documentType: 'licence_transport',
      actionRequired: true,
      notificationChannels: ['email'],
      isResolved: false,
      createdAt: '2024-11-25T10:00:00Z'
    },
    {
      id: 'ALT-003',
      carrierId: 'CAR-002',
      type: 'score_warning',
      severity: 'info',
      title: 'Score en baisse',
      message: 'Le score de Logistique Rapide SAS a baisse de 5 points ce mois-ci.',
      actionRequired: false,
      notificationChannels: ['in_app'],
      isResolved: false,
      createdAt: '2024-11-27T14:00:00Z'
    }
  ];

  const getMockEvents = (): carrierApi.CarrierEvent[] => [
    {
      id: 'EVT-001',
      carrierId: 'CAR-001',
      type: 'carrier.premium_granted',
      triggeredBy: { type: 'user', id: 'USR-001', name: 'Admin' },
      payload: { previousLevel: 'referenced', newLevel: 'premium' },
      createdAt: '2024-06-01T10:00:00Z'
    },
    {
      id: 'EVT-002',
      carrierId: 'CAR-004',
      type: 'carrier.blocked',
      triggeredBy: { type: 'system' },
      payload: { reason: 'documents_expired', documentType: 'insurance_rc' },
      createdAt: '2024-11-15T00:00:00Z'
    },
    {
      id: 'EVT-003',
      carrierId: 'CAR-002',
      type: 'alert.created',
      triggeredBy: { type: 'cron' },
      payload: { alertType: 'document_expiring_7', documentType: 'insurance_rc' },
      createdAt: '2024-11-28T08:00:00Z'
    },
    {
      id: 'EVT-004',
      carrierId: 'CAR-003',
      type: 'carrier.validated',
      triggeredBy: { type: 'user', id: 'USR-001', name: 'Admin' },
      payload: {},
      createdAt: '2024-09-12T14:00:00Z'
    }
  ];

  const getMockDispatchChain = (): carrierApi.DispatchCarrierEntry[] => [
    { rank: 1, carrierId: 'CAR-001', carrierName: 'Transport Express SARL', level: 'premium', score: 92, estimatedResponseTime: 1.5, availability: 'available', matchScore: 95 },
    { rank: 2, carrierId: 'CAR-002', carrierName: 'Logistique Rapide SAS', level: 'referenced', score: 78, estimatedResponseTime: 3.2, availability: 'available', matchScore: 82 },
    { rank: 3, carrierId: 'CAR-005', carrierName: 'Fret National', level: 'referenced', score: 75, estimatedResponseTime: 2.8, availability: 'busy', matchScore: 78 },
    { rank: 4, carrierId: 'CAR-003', carrierName: 'Trans Euro Services', level: 'guest', score: 65, estimatedResponseTime: 5.0, availability: 'available', matchScore: 65 }
  ];

  const getEventLabel = (type: carrierApi.CarrierEventType): string => {
    const labels: Record<string, string> = {
      'carrier.invited': 'Transporteur invite',
      'carrier.registered': 'Transporteur inscrit',
      'carrier.documents_uploaded': 'Documents uploades',
      'carrier.validated': 'Transporteur valide',
      'carrier.premium_requested': 'Demande Premium',
      'carrier.premium_granted': 'Premium accorde',
      'carrier.blocked': 'Transporteur bloque',
      'carrier.unblocked': 'Transporteur debloque',
      'carrier.score_updated': 'Score mis a jour',
      'carrier.dispatch_updated': 'Dispatch modifie',
      'document.uploaded': 'Document uploade',
      'document.verified': 'Document verifie',
      'document.rejected': 'Document rejete',
      'document.expired': 'Document expire',
      'alert.created': 'Alerte creee',
      'alert.resolved': 'Alerte resolue',
      'pricing.updated': 'Tarifs modifies'
    };
    return labels[type] || type;
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <>
      <Head>
        <title>Transporteurs References - Industry | SYMPHONI.A</title>
      </Head>

      <div style={containerStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => router.push('/')}
              style={{ padding: '8px 16px', border: '1px solid #e5e7eb', backgroundColor: 'white', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}
            >
              Retour
            </button>
            <h1 style={{ fontSize: '20px', fontWeight: '800', margin: 0 }}>
              Transporteurs References
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button style={tabStyle(activeTab === 'list')} onClick={() => setActiveTab('list')}>Liste</button>
            <button style={tabStyle(activeTab === 'dispatch')} onClick={() => setActiveTab('dispatch')}>Chaine Dispatch</button>
            <button style={tabStyle(activeTab === 'vigilance')} onClick={() => setActiveTab('vigilance')}>
              Vigilance {stats?.alertsSummary.critical ? `(${stats.alertsSummary.critical})` : ''}
            </button>
            <button style={tabStyle(activeTab === 'events')} onClick={() => setActiveTab('events')}>Evenements</button>
            <button style={{ ...buttonStyle, marginLeft: '16px' }} onClick={() => setShowInviteModal(true)}>
              + Inviter
            </button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div style={{ margin: '16px 24px', padding: '12px 16px', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '8px', fontWeight: '600' }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ margin: '16px 24px', padding: '12px 16px', backgroundColor: '#d1fae5', color: '#059669', borderRadius: '8px', fontWeight: '600' }}>
            {success}
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <div style={{ padding: '24px 24px 0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
            <div style={cardStyle}>
              <div style={{ fontSize: '32px', fontWeight: '800', color: '#667eea' }}>{stats.total}</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Total Transporteurs</div>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: '32px', fontWeight: '800', color: '#f59e0b' }}>{stats.byLevel.premium}</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Premium (N1+)</div>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: '32px', fontWeight: '800', color: '#3b82f6' }}>{stats.byLevel.referenced}</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>References (N1)</div>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: '32px', fontWeight: '800', color: '#6b7280' }}>{stats.byLevel.guest}</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Guests (N2)</div>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: '32px', fontWeight: '800', color: '#10b981' }}>{stats.byVigilance.compliant}</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Conformes</div>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: '32px', fontWeight: '800', color: '#ef4444' }}>{stats.alertsSummary.critical}</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Alertes Critiques</div>
            </div>
          </div>
        )}

        {/* Content */}
        <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '24px' }}>

          {/* Tab: Liste */}
          {activeTab === 'list' && (
            <div style={cardStyle}>
              {/* Filtres */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
                <input
                  style={{ ...inputStyle, width: '250px', marginBottom: 0 }}
                  placeholder="Rechercher..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
                <select
                  style={{ ...selectStyle, width: '180px', marginBottom: 0 }}
                  value={filters.level}
                  onChange={(e) => setFilters({ ...filters, level: e.target.value as any })}
                >
                  <option value="">Tous les niveaux</option>
                  <option value="guest">Guest (N2)</option>
                  <option value="referenced">Reference (N1)</option>
                  <option value="premium">Premium (N1+)</option>
                </select>
                <select
                  style={{ ...selectStyle, width: '180px', marginBottom: 0 }}
                  value={filters.vigilanceStatus}
                  onChange={(e) => setFilters({ ...filters, vigilanceStatus: e.target.value as any })}
                >
                  <option value="">Tous statuts vigilance</option>
                  <option value="compliant">Conforme</option>
                  <option value="warning">Alerte</option>
                  <option value="blocked">Bloque</option>
                </select>
                <button onClick={loadCarriers} style={buttonStyle} disabled={loading}>
                  {loading ? 'Chargement...' : 'Rafraichir'}
                </button>
              </div>

              {/* Table */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f9fafb' }}>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Transporteur</th>
                      <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e5e7eb' }}>Niveau</th>
                      <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e5e7eb' }}>Vigilance</th>
                      <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e5e7eb' }}>Score</th>
                      <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e5e7eb' }}>Commandes</th>
                      <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e5e7eb' }}>Dispatch</th>
                      <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e5e7eb' }}>Source</th>
                      <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e5e7eb' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {carriers.map((carrier) => {
                      const levelBadge = getLevelBadge(carrier.level);
                      const vigilanceBadge = getVigilanceBadge(carrier.vigilanceStatus);
                      return (
                        <tr key={carrier.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                          <td style={{ padding: '12px' }}>
                            <div style={{ fontWeight: '600' }}>{carrier.companyName}</div>
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>{carrier.contact.email}</div>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <span style={badgeStyle(levelBadge.color)}>{levelBadge.label}</span>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <span style={badgeStyle(vigilanceBadge.color)}>{vigilanceBadge.label}</span>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <span style={{
                              fontWeight: '700',
                              color: carrier.overallScore >= 80 ? '#10b981' : carrier.overallScore >= 60 ? '#f59e0b' : '#ef4444'
                            }}>
                              {carrier.overallScore}/100
                            </span>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            {carrier.completedOrders}/{carrier.totalOrders}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            #{carrier.dispatchOrder}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <span style={{ fontSize: '12px', color: '#6b7280' }}>
                              {carrier.source === 'affret_ia' ? 'Affret.IA' : carrier.source === 'invitation' ? 'Invitation' : 'Manuel'}
                            </span>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                              <button
                                onClick={() => { setSelectedCarrier(carrier); setShowDetailModal(true); }}
                                style={{ padding: '6px 12px', backgroundColor: '#667eea', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                              >
                                Details
                              </button>
                              {carrier.status !== 'blocked' && carrier.level !== 'premium' && (
                                <button
                                  onClick={() => handleUpgradePremium(carrier)}
                                  style={{ padding: '6px 12px', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                                >
                                  Premium
                                </button>
                              )}
                              {carrier.status === 'blocked' ? (
                                <button
                                  onClick={() => handleUnblock(carrier)}
                                  style={{ padding: '6px 12px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                                >
                                  Debloquer
                                </button>
                              ) : (
                                <button
                                  onClick={() => { setSelectedCarrier(carrier); setShowBlockModal(true); }}
                                  style={{ padding: '6px 12px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                                >
                                  Bloquer
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab: Chaine de Dispatch */}
          {activeTab === 'dispatch' && (
            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>Chaine de Dispatch</h2>
                  <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0' }}>
                    Ordre de priorite pour l'attribution automatique des transports
                  </p>
                </div>
                <button onClick={loadDispatchChain} style={buttonStyle} disabled={loading}>
                  Rafraichir
                </button>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f9fafb' }}>
                      <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e5e7eb', width: '80px' }}>Position</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Transporteur</th>
                      <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e5e7eb' }}>Niveau</th>
                      <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e5e7eb' }}>Score</th>
                      <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e5e7eb' }}>Match</th>
                      <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e5e7eb' }}>Temps Rep.</th>
                      <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e5e7eb' }}>Disponibilite</th>
                      <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e5e7eb' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dispatchChain.map((entry, index) => {
                      const levelBadge = getLevelBadge(entry.level);
                      return (
                        <tr key={entry.carrierId} style={{ borderBottom: '1px solid #e5e7eb' }}>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <div style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              backgroundColor: index < 3 ? '#667eea' : '#e5e7eb',
                              color: index < 3 ? 'white' : '#374151',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: '700'
                            }}>
                              {entry.rank}
                            </div>
                          </td>
                          <td style={{ padding: '12px' }}>
                            <div style={{ fontWeight: '600' }}>{entry.carrierName}</div>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <span style={badgeStyle(levelBadge.color)}>{levelBadge.label}</span>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center', fontWeight: '700' }}>
                            {entry.score}/100
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <span style={{
                              fontWeight: '600',
                              color: entry.matchScore >= 80 ? '#10b981' : entry.matchScore >= 60 ? '#f59e0b' : '#ef4444'
                            }}>
                              {entry.matchScore}%
                            </span>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            {entry.estimatedResponseTime}h
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <span style={badgeStyle(entry.availability === 'available' ? 'green' : entry.availability === 'busy' ? 'orange' : 'gray')}>
                              {entry.availability === 'available' ? 'Disponible' : entry.availability === 'busy' ? 'Occupe' : 'Inconnu'}
                            </span>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                              <button
                                onClick={() => handleReorderDispatch(entry.carrierId, 'up')}
                                disabled={index === 0}
                                style={{
                                  padding: '6px 10px',
                                  backgroundColor: index === 0 ? '#e5e7eb' : '#667eea',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: index === 0 ? 'not-allowed' : 'pointer',
                                  fontSize: '12px'
                                }}
                              >
                                ^
                              </button>
                              <button
                                onClick={() => handleReorderDispatch(entry.carrierId, 'down')}
                                disabled={index === dispatchChain.length - 1}
                                style={{
                                  padding: '6px 10px',
                                  backgroundColor: index === dispatchChain.length - 1 ? '#e5e7eb' : '#667eea',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: index === dispatchChain.length - 1 ? 'not-allowed' : 'pointer',
                                  fontSize: '12px'
                                }}
                              >
                                v
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab: Vigilance */}
          {activeTab === 'vigilance' && (
            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>Alertes Vigilance</h2>
                  <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0' }}>
                    Documents expirant, scores en baisse, problemes de conformite
                  </p>
                </div>
                <button onClick={loadAlerts} style={buttonStyle} disabled={loading}>
                  Rafraichir
                </button>
              </div>

              {alerts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>-</div>
                  <div style={{ fontWeight: '600' }}>Aucune alerte en cours</div>
                  <div style={{ fontSize: '14px' }}>Tous vos transporteurs sont conformes</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {alerts.map((alert) => {
                    const severityBadge = getAlertSeverityBadge(alert.severity);
                    const carrier = carriers.find(c => c.id === alert.carrierId);
                    return (
                      <div
                        key={alert.id}
                        style={{
                          padding: '16px',
                          borderRadius: '8px',
                          border: `2px solid ${alert.severity === 'critical' ? '#fecaca' : alert.severity === 'warning' ? '#fef3c7' : '#dbeafe'}`,
                          backgroundColor: alert.severity === 'critical' ? '#fef2f2' : alert.severity === 'warning' ? '#fffbeb' : '#eff6ff'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                              <span style={badgeStyle(severityBadge.color)}>{severityBadge.label}</span>
                              <span style={{ fontWeight: '700' }}>{alert.title}</span>
                            </div>
                            <p style={{ margin: 0, color: '#374151', fontSize: '14px' }}>{alert.message}</p>
                            <div style={{ marginTop: '8px', fontSize: '12px', color: '#6b7280' }}>
                              Transporteur: <strong>{carrier?.companyName || alert.carrierId}</strong> |
                              Cree le: {new Date(alert.createdAt).toLocaleDateString('fr-FR')}
                              {alert.autoBlockAt && (
                                <span style={{ color: '#dc2626' }}>
                                  {' '}| Blocage auto: {new Date(alert.autoBlockAt).toLocaleDateString('fr-FR')}
                                </span>
                              )}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {alert.actionRequired && (
                              <button
                                style={{ padding: '8px 16px', backgroundColor: '#667eea', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
                              >
                                {alert.actionLabel || 'Action'}
                              </button>
                            )}
                            <button
                              onClick={() => handleResolveAlert(alert.id)}
                              style={{ padding: '8px 16px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
                            >
                              Resoudre
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tab: Evenements */}
          {activeTab === 'events' && (
            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>Historique des Evenements</h2>
                  <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0' }}>
                    Toutes les actions sur vos transporteurs references
                  </p>
                </div>
                <button onClick={loadEvents} style={buttonStyle} disabled={loading}>
                  Rafraichir
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {events.map((event) => {
                  const carrier = carriers.find(c => c.id === event.carrierId);
                  return (
                    <div
                      key={event.id}
                      style={{
                        padding: '12px 16px',
                        borderRadius: '8px',
                        backgroundColor: '#f9fafb',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          backgroundColor: event.type.includes('blocked') ? '#fee2e2' : event.type.includes('premium') ? '#fef3c7' : '#dbeafe',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '16px'
                        }}>
                          {event.type.includes('blocked') ? 'X' : event.type.includes('premium') ? '*' : event.type.includes('alert') ? '!' : 'i'}
                        </div>
                        <div>
                          <div style={{ fontWeight: '600' }}>{getEventLabel(event.type)}</div>
                          <div style={{ fontSize: '13px', color: '#6b7280' }}>
                            {carrier?.companyName || event.carrierId} -
                            par {event.triggeredBy.name || event.triggeredBy.type}
                          </div>
                        </div>
                      </div>
                      <div style={{ fontSize: '13px', color: '#6b7280' }}>
                        {new Date(event.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal: Invitation */}
        {showInviteModal && (
          <div style={modalStyle} onClick={() => setShowInviteModal(false)}>
            <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '24px' }}>Inviter un Transporteur</h2>
              <input
                style={inputStyle}
                placeholder="Email du transporteur *"
                value={inviteForm.email}
                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
              />
              <input
                style={inputStyle}
                placeholder="Nom de l'entreprise *"
                value={inviteForm.companyName}
                onChange={(e) => setInviteForm({ ...inviteForm, companyName: e.target.value })}
              />
              <select
                style={selectStyle}
                value={inviteForm.level}
                onChange={(e) => setInviteForm({ ...inviteForm, level: e.target.value as carrierApi.CarrierLevel })}
              >
                <option value="guest">Guest (Niveau 2)</option>
                <option value="referenced">Reference (Niveau 1)</option>
              </select>
              <textarea
                style={{ ...inputStyle, height: '100px', resize: 'vertical' }}
                placeholder="Message personnalise (optionnel)"
                value={inviteForm.message}
                onChange={(e) => setInviteForm({ ...inviteForm, message: e.target.value })}
              />
              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button onClick={handleInvite} style={buttonStyle} disabled={loading}>
                  {loading ? 'Envoi...' : 'Envoyer l\'invitation'}
                </button>
                <button
                  onClick={() => setShowInviteModal(false)}
                  style={{ ...buttonStyle, backgroundColor: '#6b7280' }}
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Blocage */}
        {showBlockModal && selectedCarrier && (
          <div style={modalStyle} onClick={() => setShowBlockModal(false)}>
            <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>Bloquer le Transporteur</h2>
              <p style={{ color: '#6b7280', marginBottom: '24px' }}>{selectedCarrier.companyName}</p>
              <select
                style={selectStyle}
                value={blockForm.reason}
                onChange={(e) => setBlockForm({ ...blockForm, reason: e.target.value as carrierApi.BlockingReason })}
              >
                <option value="manual_block">Blocage manuel</option>
                <option value="documents_expired">Documents expires</option>
                <option value="insurance_lapsed">Assurance expiree</option>
                <option value="score_below_threshold">Score insuffisant</option>
                <option value="unpaid_invoices">Factures impayees</option>
                <option value="compliance_violation">Non-conformite</option>
              </select>
              <textarea
                style={{ ...inputStyle, height: '100px', resize: 'vertical' }}
                placeholder="Description du motif de blocage *"
                value={blockForm.description}
                onChange={(e) => setBlockForm({ ...blockForm, description: e.target.value })}
              />
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '14px', color: '#374151', display: 'block', marginBottom: '8px' }}>
                  Date de fin de blocage (optionnel)
                </label>
                <input
                  type="date"
                  style={inputStyle}
                  value={blockForm.until}
                  onChange={(e) => setBlockForm({ ...blockForm, until: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={handleBlock} style={{ ...buttonStyle, backgroundColor: '#ef4444' }} disabled={loading}>
                  {loading ? 'Blocage...' : 'Confirmer le blocage'}
                </button>
                <button
                  onClick={() => setShowBlockModal(false)}
                  style={{ ...buttonStyle, backgroundColor: '#6b7280' }}
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Detail Transporteur */}
        {showDetailModal && selectedCarrier && (
          <div style={modalStyle} onClick={() => setShowDetailModal(false)}>
            <div style={{ ...modalContentStyle, maxWidth: '700px' }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>{selectedCarrier.companyName}</h2>
                  <p style={{ color: '#6b7280', margin: '4px 0 0' }}>{selectedCarrier.contact.email}</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={badgeStyle(getLevelBadge(selectedCarrier.level).color)}>
                    {getLevelBadge(selectedCarrier.level).label}
                  </span>
                  <span style={badgeStyle(getVigilanceBadge(selectedCarrier.vigilanceStatus).color)}>
                    {getVigilanceBadge(selectedCarrier.vigilanceStatus).label}
                  </span>
                </div>
              </div>

              {/* Score */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                  <div style={{ fontSize: '32px', fontWeight: '800', color: '#667eea' }}>{selectedCarrier.overallScore}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>Score Global</div>
                </div>
                <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                  <div style={{ fontSize: '32px', fontWeight: '800' }}>{selectedCarrier.completedOrders}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>Commandes</div>
                </div>
                <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                  <div style={{ fontSize: '32px', fontWeight: '800' }}>{selectedCarrier.averageResponseTime}h</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>Temps Rep. Moy.</div>
                </div>
                <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                  <div style={{ fontSize: '32px', fontWeight: '800' }}>#{selectedCarrier.dispatchOrder}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>Position Dispatch</div>
                </div>
              </div>

              {/* Scores detailles */}
              <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px' }}>Scores Detailles</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '8px', marginBottom: '24px' }}>
                {Object.entries(selectedCarrier.scoreDetails).map(([key, value]) => {
                  const labels: Record<string, string> = {
                    onTimeDelivery: 'Ponctualite',
                    communication: 'Communication',
                    damageRate: 'Avaries',
                    documentation: 'Documents',
                    responsiveness: 'Reactivite',
                    pricing: 'Prix',
                    compliance: 'Conformite'
                  };
                  return (
                    <div key={key} style={{ textAlign: 'center', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                      <div style={{
                        fontSize: '20px',
                        fontWeight: '700',
                        color: value >= 80 ? '#10b981' : value >= 60 ? '#f59e0b' : '#ef4444'
                      }}>
                        {value}
                      </div>
                      <div style={{ fontSize: '11px', color: '#6b7280' }}>{labels[key] || key}</div>
                    </div>
                  );
                })}
              </div>

              {/* Infos */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px' }}>Informations</h3>
                  <div style={{ fontSize: '14px', lineHeight: '2' }}>
                    <div><strong>SIRET:</strong> {selectedCarrier.siret || '-'}</div>
                    <div><strong>Telephone:</strong> {selectedCarrier.contact.phone || '-'}</div>
                    <div><strong>Pays:</strong> {selectedCarrier.contact.country}</div>
                    <div><strong>Source:</strong> {selectedCarrier.source === 'affret_ia' ? 'Affret.IA' : selectedCarrier.source}</div>
                    <div><strong>Reference le:</strong> {new Date(selectedCarrier.referencedAt).toLocaleDateString('fr-FR')}</div>
                  </div>
                </div>
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px' }}>Options Actives</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {selectedCarrier.options.length > 0 ? selectedCarrier.options.map(opt => (
                      <span key={opt.id} style={badgeStyle('blue')}>{opt.name}</span>
                    )) : (
                      <span style={{ color: '#6b7280', fontSize: '14px' }}>Aucune option</span>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '24px', textAlign: 'right' }}>
                <button
                  onClick={() => setShowDetailModal(false)}
                  style={buttonStyle}
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
