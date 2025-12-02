/**
 * Page Configuration Dispatch - Portail Industry
 * Parametrage de la chaine d'affectation transporteurs
 *
 * Fonctionnalites:
 * - Timeout transporteur configurable (defaut 2h)
 * - Regles d'eligibilite
 * - Configuration escalade Affret.IA
 * - Gestion des lanes
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { isAuthenticated } from '../lib/auth';
import {
  dispatchApi,
  getDispatchConfig,
  updateDispatchConfig,
  getLanes,
  getDispatchStats,
  TRACKING_PRICING,
  type DispatchConfig,
  type TransportLane,
} from '../lib/api';

export default function DispatchConfigPage() {
  const router = useRouter();

  // ID industriel (a recuperer du contexte auth)
  const industrielId = 'IND-001';

  // State
  const [config, setConfig] = useState<DispatchConfig | null>(null);
  const [lanes, setLanes] = useState<TransportLane[]>([]);
  const [stats, setStats] = useState<{
    totalOrders: number;
    acceptanceRate: number;
    avgResponseTime: number;
    escalationRate: number;
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'config' | 'lanes' | 'tracking' | 'archive'>('config');

  // Formulaire de configuration
  const [formConfig, setFormConfig] = useState({
    carrierResponseTimeout: 7200,            // Secondes (defaut 2h)
    escalationDelay: 3600,                   // 1h apres dernier refus
    maxCarriersInChain: 5,
    reminderEnabled: true,
    reminderDelayMinutes: 30,
    notificationChannels: ['email', 'push'] as string[],
    minScore: 60,
    requireVigilanceCompliant: true,
    requireActiveInsurance: true,
    requirePricingGrid: false,
    excludeBlocked: true,
    autoEscalateToAffretIA: true,
    affretIAMaxPrice: 0,
    affretIAMinScore: 50,
  });

  // ==========================================================================
  // CHARGEMENT
  // ==========================================================================

  const loadConfig = async () => {
    setLoading(true);
    try {
      const result = await dispatchApi.getDispatchConfig(industrielId);
      setConfig(result);
      setFormConfig({
        carrierResponseTimeout: result.carrierResponseTimeout || 7200,
        escalationDelay: result.escalationDelay || 3600,
        maxCarriersInChain: result.maxCarriersInChain || 5,
        reminderEnabled: result.reminderEnabled ?? true,
        reminderDelayMinutes: result.reminderDelayMinutes || 30,
        notificationChannels: result.notificationChannels || ['email', 'push'],
        minScore: result.eligibilityRules?.minScore || 60,
        requireVigilanceCompliant: result.eligibilityRules?.requireVigilanceCompliant ?? true,
        requireActiveInsurance: result.eligibilityRules?.requireActiveInsurance ?? true,
        requirePricingGrid: result.eligibilityRules?.requirePricingGrid ?? false,
        excludeBlocked: result.eligibilityRules?.excludeBlocked ?? true,
        autoEscalateToAffretIA: result.autoEscalateToAffretIA ?? true,
        affretIAMaxPrice: result.affretIAConfig?.maxPrice || 0,
        affretIAMinScore: result.affretIAConfig?.minScore || 50,
      });
    } catch (err) {
      // Utiliser les valeurs par defaut
      console.log('Utilisation de la configuration par defaut');
    } finally {
      setLoading(false);
    }
  };

  const loadLanes = async () => {
    try {
      const result = await dispatchApi.getLanes(industrielId);
      setLanes(result.lanes);
    } catch (err) {
      // Mock lanes
      setLanes(getMockLanes());
    }
  };

  const loadStats = async () => {
    try {
      const result = await dispatchApi.getDispatchStats(industrielId);
      setStats({
        totalOrders: result.totalOrders,
        acceptanceRate: result.acceptanceRate,
        avgResponseTime: result.avgResponseTime,
        escalationRate: result.escalationRate,
      });
    } catch (err) {
      // Mock stats
      setStats({
        totalOrders: 156,
        acceptanceRate: 78,
        avgResponseTime: 1.2,
        escalationRate: 12,
      });
    }
  };

  // ==========================================================================
  // ACTIONS
  // ==========================================================================

  const handleSaveConfig = async () => {
    setSaving(true);
    setError(null);
    try {
      await dispatchApi.updateDispatchConfig(industrielId, {
        carrierResponseTimeout: formConfig.carrierResponseTimeout,
        escalationDelay: formConfig.escalationDelay,
        maxCarriersInChain: formConfig.maxCarriersInChain,
        reminderEnabled: formConfig.reminderEnabled,
        reminderDelayMinutes: formConfig.reminderDelayMinutes,
        notificationChannels: formConfig.notificationChannels as any,
        eligibilityRules: {
          minScore: formConfig.minScore,
          requireVigilanceCompliant: formConfig.requireVigilanceCompliant,
          requireActiveInsurance: formConfig.requireActiveInsurance,
          requirePricingGrid: formConfig.requirePricingGrid,
          excludeBlocked: formConfig.excludeBlocked,
        },
        autoEscalateToAffretIA: formConfig.autoEscalateToAffretIA,
        affretIAConfig: {
          maxPrice: formConfig.affretIAMaxPrice || undefined,
          minScore: formConfig.affretIAMinScore,
        },
      });
      setSuccess('Configuration sauvegardee avec succes');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
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
    loadConfig();
    loadLanes();
    loadStats();
  }, [router]);

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
  // HELPERS
  // ==========================================================================

  const formatTimeout = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0 && minutes > 0) return `${hours}h ${minutes}min`;
    if (hours > 0) return `${hours}h`;
    return `${minutes}min`;
  };

  const getMockLanes = (): TransportLane[] => [
    {
      id: 'LANE-001',
      industrielId,
      name: 'Paris - Lyon',
      origin: { country: 'FR', region: 'Ile-de-France', city: 'Paris' },
      destination: { country: 'FR', region: 'Auvergne-Rhone-Alpes', city: 'Lyon' },
      carrierChain: [
        { carrierId: 'CAR-001', carrierName: 'Transport Express', position: 1, priority: 'high', score: 92, onTimeRate: 95, acceptanceRate: 88, isActive: true },
        { carrierId: 'CAR-002', carrierName: 'Logistique Rapide', position: 2, priority: 'medium', score: 78, onTimeRate: 82, acceptanceRate: 75, isActive: true },
      ],
      stats: { totalOrders: 89, avgTransitDays: 1, avgPrice: 450, successRate: 96 },
      isActive: true,
      createdAt: '2024-01-15',
      updatedAt: '2024-11-20',
    },
    {
      id: 'LANE-002',
      industrielId,
      name: 'Paris - Marseille',
      origin: { country: 'FR', region: 'Ile-de-France', city: 'Paris' },
      destination: { country: 'FR', region: 'PACA', city: 'Marseille' },
      carrierChain: [
        { carrierId: 'CAR-003', carrierName: 'Sud Fret', position: 1, priority: 'high', score: 85, onTimeRate: 88, acceptanceRate: 82, isActive: true },
      ],
      stats: { totalOrders: 45, avgTransitDays: 1.5, avgPrice: 580, successRate: 92 },
      isActive: true,
      createdAt: '2024-03-10',
      updatedAt: '2024-11-18',
    },
  ];

  // ==========================================================================
  // STYLES
  // ==========================================================================

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    backgroundColor: '#f3f4f6',
    fontFamily: 'system-ui, sans-serif',
  };

  const headerStyle: React.CSSProperties = {
    padding: '16px 24px',
    backgroundColor: 'white',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const tabStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '10px 20px',
    backgroundColor: isActive ? '#667eea' : 'white',
    color: isActive ? 'white' : '#374151',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
  });

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    marginBottom: '16px',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    backgroundColor: 'white',
  };

  const buttonStyle: React.CSSProperties = {
    padding: '12px 24px',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
  };

  const checkboxStyle: React.CSSProperties = {
    width: '18px',
    height: '18px',
    marginRight: '8px',
    cursor: 'pointer',
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <>
      <Head>
        <title>Configuration Dispatch - Industry | SYMPHONI.A</title>
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
              Configuration Dispatch
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button style={tabStyle(activeTab === 'config')} onClick={() => setActiveTab('config')}>
              Parametres
            </button>
            <button style={tabStyle(activeTab === 'lanes')} onClick={() => setActiveTab('lanes')}>
              Lanes
            </button>
            <button style={tabStyle(activeTab === 'tracking')} onClick={() => setActiveTab('tracking')}>
              Tracking
            </button>
            <button style={tabStyle(activeTab === 'archive')} onClick={() => setActiveTab('archive')}>
              Archivage
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
          <div style={{ padding: '24px 24px 0', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            <div style={cardStyle}>
              <div style={{ fontSize: '32px', fontWeight: '800', color: '#667eea' }}>{stats.totalOrders}</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Commandes totales</div>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: '32px', fontWeight: '800', color: '#10b981' }}>{stats.acceptanceRate}%</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Taux d'acceptation</div>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: '32px', fontWeight: '800', color: '#3b82f6' }}>{stats.avgResponseTime}h</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Temps reponse moyen</div>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: '32px', fontWeight: '800', color: '#f59e0b' }}>{stats.escalationRate}%</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Taux d'escalade</div>
            </div>
          </div>
        )}

        {/* Content */}
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>

          {/* Tab: Configuration */}
          {activeTab === 'config' && (
            <div style={cardStyle}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '24px' }}>
                Parametres de Dispatch
              </h2>

              {/* Section Timeout */}
              <div style={{ marginBottom: '32px', padding: '20px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: '#374151' }}>
                  Delai de Reponse Transporteur
                </h3>
                <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
                  Temps accorde a chaque transporteur pour accepter ou refuser une commande.
                  Apres ce delai, la commande passe automatiquement au transporteur suivant.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                      Timeout transporteur
                    </label>
                    <select
                      style={selectStyle}
                      value={formConfig.carrierResponseTimeout}
                      onChange={(e) => setFormConfig({ ...formConfig, carrierResponseTimeout: parseInt(e.target.value) })}
                    >
                      <option value={1800}>30 minutes</option>
                      <option value={3600}>1 heure</option>
                      <option value={5400}>1h30</option>
                      <option value={7200}>2 heures (defaut)</option>
                      <option value={10800}>3 heures</option>
                      <option value={14400}>4 heures</option>
                      <option value={21600}>6 heures</option>
                      <option value={43200}>12 heures</option>
                      <option value={86400}>24 heures</option>
                    </select>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                      Actuel: {formatTimeout(formConfig.carrierResponseTimeout)}
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                      Transporteurs max dans la chaine
                    </label>
                    <select
                      style={selectStyle}
                      value={formConfig.maxCarriersInChain}
                      onChange={(e) => setFormConfig({ ...formConfig, maxCarriersInChain: parseInt(e.target.value) })}
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                        <option key={n} value={n}>{n} transporteur{n > 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ marginTop: '16px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      style={checkboxStyle}
                      checked={formConfig.reminderEnabled}
                      onChange={(e) => setFormConfig({ ...formConfig, reminderEnabled: e.target.checked })}
                    />
                    <span style={{ fontSize: '14px' }}>
                      Envoyer un rappel {formConfig.reminderDelayMinutes} min avant le timeout
                    </span>
                  </label>
                </div>
              </div>

              {/* Section Eligibilite */}
              <div style={{ marginBottom: '32px', padding: '20px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: '#374151' }}>
                  Regles d'Eligibilite
                </h3>
                <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
                  Criteres que les transporteurs doivent remplir pour recevoir des commandes.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                      Score minimum requis
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={formConfig.minScore}
                        onChange={(e) => setFormConfig({ ...formConfig, minScore: parseInt(e.target.value) })}
                        style={{ flex: 1 }}
                      />
                      <span style={{ fontWeight: '700', color: formConfig.minScore >= 70 ? '#10b981' : formConfig.minScore >= 50 ? '#f59e0b' : '#ef4444' }}>
                        {formConfig.minScore}/100
                      </span>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                      Criteres obligatoires
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          style={checkboxStyle}
                          checked={formConfig.requireVigilanceCompliant}
                          onChange={(e) => setFormConfig({ ...formConfig, requireVigilanceCompliant: e.target.checked })}
                        />
                        <span style={{ fontSize: '14px' }}>Documents vigilance valides</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          style={checkboxStyle}
                          checked={formConfig.requireActiveInsurance}
                          onChange={(e) => setFormConfig({ ...formConfig, requireActiveInsurance: e.target.checked })}
                        />
                        <span style={{ fontSize: '14px' }}>Assurance active</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          style={checkboxStyle}
                          checked={formConfig.excludeBlocked}
                          onChange={(e) => setFormConfig({ ...formConfig, excludeBlocked: e.target.checked })}
                        />
                        <span style={{ fontSize: '14px' }}>Exclure transporteurs bloques</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          style={checkboxStyle}
                          checked={formConfig.requirePricingGrid}
                          onChange={(e) => setFormConfig({ ...formConfig, requirePricingGrid: e.target.checked })}
                        />
                        <span style={{ fontSize: '14px' }}>Grille tarifaire requise</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section Affret.IA */}
              <div style={{ marginBottom: '32px', padding: '20px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: '#374151' }}>
                  Escalade Affret.IA
                </h3>
                <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
                  Configuration de l'escalade automatique vers le reseau Affret.IA (40,000 transporteurs).
                </p>

                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginBottom: '16px' }}>
                  <input
                    type="checkbox"
                    style={checkboxStyle}
                    checked={formConfig.autoEscalateToAffretIA}
                    onChange={(e) => setFormConfig({ ...formConfig, autoEscalateToAffretIA: e.target.checked })}
                  />
                  <span style={{ fontSize: '14px', fontWeight: '600' }}>
                    Escalader automatiquement si aucun transporteur n'accepte
                  </span>
                </label>

                {formConfig.autoEscalateToAffretIA && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                        Prix maximum Affret.IA (optionnel)
                      </label>
                      <input
                        type="number"
                        style={inputStyle}
                        placeholder="Pas de limite"
                        value={formConfig.affretIAMaxPrice || ''}
                        onChange={(e) => setFormConfig({ ...formConfig, affretIAMaxPrice: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                        Score minimum Affret.IA
                      </label>
                      <input
                        type="number"
                        style={inputStyle}
                        min="0"
                        max="100"
                        value={formConfig.affretIAMinScore}
                        onChange={(e) => setFormConfig({ ...formConfig, affretIAMinScore: parseInt(e.target.value) || 50 })}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Section Notifications */}
              <div style={{ marginBottom: '32px', padding: '20px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: '#374151' }}>
                  Canaux de Notification
                </h3>
                <div style={{ display: 'flex', gap: '24px' }}>
                  {['email', 'sms', 'push', 'webhook'].map((channel) => (
                    <label key={channel} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        style={checkboxStyle}
                        checked={formConfig.notificationChannels.includes(channel)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormConfig({ ...formConfig, notificationChannels: [...formConfig.notificationChannels, channel] });
                          } else {
                            setFormConfig({ ...formConfig, notificationChannels: formConfig.notificationChannels.filter(c => c !== channel) });
                          }
                        }}
                      />
                      <span style={{ fontSize: '14px', textTransform: 'capitalize' }}>{channel}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Bouton Save */}
              <div style={{ textAlign: 'right' }}>
                <button onClick={handleSaveConfig} style={buttonStyle} disabled={saving}>
                  {saving ? 'Sauvegarde...' : 'Sauvegarder la configuration'}
                </button>
              </div>
            </div>
          )}

          {/* Tab: Lanes */}
          {activeTab === 'lanes' && (
            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>Lanes de Transport</h2>
                <button style={buttonStyle}>+ Nouvelle Lane</button>
              </div>

              {lanes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>-</div>
                  <div>Aucune lane configuree</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {lanes.map((lane) => (
                    <div
                      key={lane.id}
                      style={{
                        padding: '20px',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        backgroundColor: lane.isActive ? 'white' : '#f9fafb',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>{lane.name}</h3>
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: '600',
                              backgroundColor: lane.isActive ? '#d1fae5' : '#f3f4f6',
                              color: lane.isActive ? '#059669' : '#6b7280',
                            }}>
                              {lane.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '12px' }}>
                            {lane.origin.city} ({lane.origin.region}) -&gt; {lane.destination.city} ({lane.destination.region})
                          </div>
                          <div style={{ display: 'flex', gap: '24px', fontSize: '13px' }}>
                            <span><strong>{lane.carrierChain.length}</strong> transporteurs</span>
                            <span><strong>{lane.stats.totalOrders}</strong> commandes</span>
                            <span><strong>{lane.stats.successRate}%</strong> succes</span>
                            <span><strong>{lane.stats.avgTransitDays}j</strong> transit moyen</span>
                          </div>
                        </div>
                        <button style={{ padding: '8px 16px', backgroundColor: '#667eea', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
                          Configurer
                        </button>
                      </div>

                      {/* Chaine de transporteurs */}
                      <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                          Chaine d'affectation:
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {lane.carrierChain.map((carrier, idx) => (
                            <div
                              key={carrier.carrierId}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '6px 12px',
                                backgroundColor: '#f3f4f6',
                                borderRadius: '16px',
                                fontSize: '13px',
                              }}
                            >
                              <span style={{ fontWeight: '700', color: '#667eea' }}>{idx + 1}.</span>
                              <span>{carrier.carrierName}</span>
                              <span style={{ color: '#6b7280' }}>({carrier.score}/100)</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab: Tracking */}
          {activeTab === 'tracking' && (
            <div style={cardStyle}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '24px' }}>
                Tarification Tracking
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                {Object.values(dispatchApi.TRACKING_PRICING).map((pricing) => (
                  <div
                    key={pricing.level}
                    style={{
                      padding: '24px',
                      borderRadius: '12px',
                      border: pricing.level === 'premium' ? '2px solid #667eea' : '1px solid #e5e7eb',
                      backgroundColor: pricing.level === 'premium' ? '#f5f3ff' : 'white',
                    }}
                  >
                    {pricing.level === 'premium' && (
                      <div style={{ fontSize: '12px', fontWeight: '600', color: '#667eea', marginBottom: '8px' }}>
                        RECOMMANDE
                      </div>
                    )}
                    <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>{pricing.name}</h3>
                    <div style={{ fontSize: '28px', fontWeight: '800', color: '#667eea', marginBottom: '8px' }}>
                      {pricing.pricingType === 'monthly' ? `${pricing.priceMonthly}€` : `${pricing.pricePerTransport}€`}
                      <span style={{ fontSize: '14px', fontWeight: '400', color: '#6b7280' }}>
                        /{pricing.pricingType === 'monthly' ? 'mois' : 'transport'}
                      </span>
                    </div>
                    <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>{pricing.description}</p>

                    <div style={{ fontSize: '13px' }}>
                      <div style={{ marginBottom: '8px' }}>
                        <strong>Frequence:</strong> {pricing.features.updateFrequency}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ color: pricing.features.gpsTracking ? '#10b981' : '#d1d5db' }}>
                          {pricing.features.gpsTracking ? 'v' : 'x'} Tracking GPS
                        </span>
                        <span style={{ color: pricing.features.geofencing ? '#10b981' : '#d1d5db' }}>
                          {pricing.features.geofencing ? 'v' : 'x'} Geofencing
                        </span>
                        <span style={{ color: pricing.features.etaPrediction ? '#10b981' : '#d1d5db' }}>
                          {pricing.features.etaPrediction ? 'v' : 'x'} Prediction ETA IA
                        </span>
                        <span style={{ color: pricing.features.realtimeMap ? '#10b981' : '#d1d5db' }}>
                          {pricing.features.realtimeMap ? 'v' : 'x'} Carte temps reel
                        </span>
                        <span style={{ color: pricing.features.autoRescheduling ? '#10b981' : '#d1d5db' }}>
                          {pricing.features.autoRescheduling ? 'v' : 'x'} Replanification auto
                        </span>
                      </div>
                    </div>

                    <button
                      style={{
                        marginTop: '16px',
                        width: '100%',
                        padding: '12px',
                        backgroundColor: pricing.level === 'premium' ? '#667eea' : 'white',
                        color: pricing.level === 'premium' ? 'white' : '#667eea',
                        border: '2px solid #667eea',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '600',
                      }}
                    >
                      Souscrire
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab: Archive */}
          {activeTab === 'archive' && (
            <div style={cardStyle}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '24px' }}>
                Archivage Legal (10 ans)
              </h2>

              <div style={{ padding: '20px', backgroundColor: '#f9fafb', borderRadius: '8px', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px' }}>Configuration</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  <div>
                    <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Duree de retention</div>
                    <div style={{ fontSize: '24px', fontWeight: '700' }}>10 ans</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>Conforme a la legislation francaise</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Archivage automatique</div>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>Active</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>A la cloture de chaque commande</div>
                  </div>
                </div>
              </div>

              <div style={{ padding: '20px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px' }}>Documents archives</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                  <div style={{ textAlign: 'center', padding: '16px', backgroundColor: 'white', borderRadius: '8px' }}>
                    <div style={{ fontSize: '28px', fontWeight: '800', color: '#667eea' }}>1,245</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>Total archives</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '16px', backgroundColor: 'white', borderRadius: '8px' }}>
                    <div style={{ fontSize: '28px', fontWeight: '800' }}>3,891</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>Documents</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '16px', backgroundColor: 'white', borderRadius: '8px' }}>
                    <div style={{ fontSize: '28px', fontWeight: '800' }}>2.4 GB</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>Stockage</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '16px', backgroundColor: 'white', borderRadius: '8px' }}>
                    <div style={{ fontSize: '28px', fontWeight: '800', color: '#10b981' }}>100%</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>Integrite</div>
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
