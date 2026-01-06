import { useEffect, useState } from 'react';
import { useSafeRouter } from '../lib/useSafeRouter';
import Head from 'next/head';
import { isAuthenticated, getToken } from '../lib/auth';
import { toast, Toaster } from 'react-hot-toast';

// Types
interface ICPERubrique {
  rubrique: string;
  libelle: string;
  regime: string;
  seuilMax: number;
  unite: string;
  dateDeclaration: string;
  seveso?: boolean;
}

interface Warehouse {
  warehouseId: string;
  name: string;
  address: {
    street?: string;
    city?: string;
    postalCode?: string;
  };
  surface?: number;
  icpeStatus?: string;
  icpeNumero?: string;
  icpeRubriques: ICPERubrique[];
  icpeProchainControle?: string;
  alerts?: any[];
}

interface LogisticianPartner {
  partnerId: string;
  partnerName: string;
  partnerType: '3PL' | '4PL';
  contactEmail: string;
  warehouses: Warehouse[];
  totalAlerts: number;
}

interface Dashboard {
  totalPartners: number;
  totalWarehouses: number;
  alerts: {
    warning: number;
    critical: number;
    total: number;
  };
  warehousesByStatus: Record<string, number>;
  upcomingInspections: Array<{
    warehouseName: string;
    partnerName: string;
    date: string;
    daysUntil: number;
  }>;
}

const ICPE_STATUS_LABELS: Record<string, string> = {
  DECLARATION: 'Declaration (D)',
  ENREGISTREMENT: 'Enregistrement (E)',
  AUTORISATION: 'Autorisation (A)',
  SEVESO_SB: 'SEVESO Seuil Bas',
  SEVESO_SH: 'SEVESO Seuil Haut'
};

const REGIME_COLORS: Record<string, string> = {
  D: '#22c55e',
  DC: '#84cc16',
  E: '#f59e0b',
  A: '#ef4444',
  S: '#7c3aed',
  NC: '#6b7280'
};

export default function ICPEPartenairesPage() {
  const router = useSafeRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [logisticians, setLogisticians] = useState<LogisticianPartner[]>([]);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'partners' | 'alerts'>('overview');

  const API_URL = process.env.NEXT_PUBLIC_SUBSCRIPTIONS_API_URL || 'https://d39uizi9hzozo8.cloudfront.net';

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!isAuthenticated()) {
      window.location.href = '/login';
      return;
    }
    loadData();
  }, [mounted]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadDashboard(), loadLogisticians()]);
    setLoading(false);
  };

  const loadDashboard = async () => {
    try {
      const response = await fetch(`${API_URL}/api/icpe/industrial/dashboard`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setDashboard(data.dashboard);
      }
    } catch (err) {
      console.error('Error loading dashboard:', err);
      // Mock data
      setDashboard({
        totalPartners: 2,
        totalWarehouses: 3,
        alerts: { warning: 1, critical: 0, total: 1 },
        warehousesByStatus: { DECLARATION: 1, ENREGISTREMENT: 2 },
        upcomingInspections: []
      });
    }
  };

  const loadLogisticians = async () => {
    try {
      const response = await fetch(`${API_URL}/api/icpe/industrial/logisticians`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setLogisticians(data.logisticians || []);
      }
    } catch (err) {
      console.error('Error loading logisticians:', err);
      // Mock data
      setLogisticians([
        {
          partnerId: 'LOG001',
          partnerName: 'DHL Supply Chain',
          partnerType: '3PL',
          contactEmail: 'contact@dhl-sc.fr',
          warehouses: [
            {
              warehouseId: 'WH001',
              name: 'Entrepot Paris Nord',
              address: { city: 'Roissy-en-France', postalCode: '95700' },
              surface: 15000,
              icpeStatus: 'ENREGISTREMENT',
              icpeNumero: 'ICPE-2023-001',
              icpeRubriques: [
                { rubrique: '1510', libelle: 'Entrepot couvert', regime: 'E', seuilMax: 2000, unite: 'tonnes', dateDeclaration: '2023-01-15' }
              ],
              icpeProchainControle: '2025-03-15',
              alerts: []
            }
          ],
          totalAlerts: 0
        },
        {
          partnerId: 'LOG002',
          partnerName: 'Kuehne + Nagel',
          partnerType: '4PL',
          contactEmail: 'france@kuehne-nagel.com',
          warehouses: [
            {
              warehouseId: 'WH002',
              name: 'Hub Lyon',
              address: { city: 'Saint-Priest', postalCode: '69800' },
              surface: 25000,
              icpeStatus: 'AUTORISATION',
              icpeNumero: 'ICPE-2022-045',
              icpeRubriques: [
                { rubrique: '1510', libelle: 'Entrepot couvert', regime: 'A', seuilMax: 5000, unite: 'tonnes', dateDeclaration: '2022-06-20' },
                { rubrique: '2662', libelle: 'Stockage polymeres', regime: 'E', seuilMax: 1500, unite: 'tonnes', dateDeclaration: '2022-06-20' }
              ],
              icpeProchainControle: '2025-06-20',
              alerts: [{ severity: 'warning', message: 'Approche du seuil (85%)' }]
            }
          ],
          totalAlerts: 1
        }
      ]);
    }
  };

  const getAllAlerts = () => {
    const alerts: any[] = [];
    logisticians.forEach(partner => {
      partner.warehouses.forEach(warehouse => {
        warehouse.alerts?.forEach(alert => {
          alerts.push({
            ...alert,
            partnerName: partner.partnerName,
            warehouseName: warehouse.name
          });
        });
      });
    });
    return alerts;
  };

  if (!mounted || loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        color: 'white'
      }}>
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>ICPE Partenaires - SYMPHONI.A Industrie</title>
      </Head>
      <Toaster position="top-right" />

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        color: 'white',
        padding: '24px'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <button
              onClick={() => router.push('/')}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                marginBottom: '8px'
              }}>
              &#8592; Retour
            </button>
            <h1 style={{ fontSize: '28px', fontWeight: '700', margin: 0 }}>
              &#128300; Conformite ICPE - Partenaires Logistiques
            </h1>
            <p style={{ color: '#94a3b8', margin: '4px 0 0 0' }}>
              Suivi des installations classees de vos partenaires 3PL/4PL
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {[
            { key: 'overview', label: 'Vue d\'ensemble', icon: '&#128202;' },
            { key: 'partners', label: 'Partenaires', icon: '&#127970;' },
            { key: 'alerts', label: `Alertes (${dashboard?.alerts.total || 0})`, icon: '&#128680;' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                background: activeTab === tab.key ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255,255,255,0.05)',
                border: activeTab === tab.key ? '1px solid rgba(139, 92, 246, 0.4)' : '1px solid rgba(255,255,255,0.1)',
                color: activeTab === tab.key ? '#a78bfa' : '#94a3b8',
                padding: '12px 20px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: activeTab === tab.key ? '600' : '400'
              }}
              dangerouslySetInnerHTML={{ __html: `${tab.icon} ${tab.label}` }}
            />
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && dashboard && (
          <>
            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '24px' }}>
              <div style={{
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>&#129309;</div>
                <div style={{ fontSize: '24px', fontWeight: '700' }}>{dashboard.totalPartners}</div>
                <div style={{ color: '#94a3b8', fontSize: '14px' }}>Partenaires</div>
              </div>
              <div style={{
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>&#127970;</div>
                <div style={{ fontSize: '24px', fontWeight: '700' }}>{dashboard.totalWarehouses}</div>
                <div style={{ color: '#94a3b8', fontSize: '14px' }}>Entrepots</div>
              </div>
              <div style={{
                background: dashboard.alerts.warning > 0 ? 'rgba(251, 191, 36, 0.1)' : 'rgba(255,255,255,0.05)',
                borderRadius: '12px',
                padding: '20px',
                border: dashboard.alerts.warning > 0 ? '1px solid rgba(251, 191, 36, 0.3)' : '1px solid rgba(255,255,255,0.1)'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>&#9888;</div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: dashboard.alerts.warning > 0 ? '#fbbf24' : 'white' }}>
                  {dashboard.alerts.warning}
                </div>
                <div style={{ color: '#94a3b8', fontSize: '14px' }}>Avertissements</div>
              </div>
              <div style={{
                background: dashboard.alerts.critical > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.05)',
                borderRadius: '12px',
                padding: '20px',
                border: dashboard.alerts.critical > 0 ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255,255,255,0.1)'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>&#10060;</div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: dashboard.alerts.critical > 0 ? '#ef4444' : 'white' }}>
                  {dashboard.alerts.critical}
                </div>
                <div style={{ color: '#94a3b8', fontSize: '14px' }}>Depassements</div>
              </div>
              <div style={{
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>&#9989;</div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#22c55e' }}>
                  {dashboard.totalWarehouses - dashboard.alerts.total}
                </div>
                <div style={{ color: '#94a3b8', fontSize: '14px' }}>Conformes</div>
              </div>
            </div>

            {/* Charts / Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {/* Repartition par statut */}
              <div style={{
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <h3 style={{ fontSize: '18px', marginBottom: '20px' }}>&#128202; Repartition par statut ICPE</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {Object.entries(dashboard.warehousesByStatus).map(([status, count]) => (
                    <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '120px',
                        fontSize: '14px',
                        color: '#94a3b8'
                      }}>
                        {ICPE_STATUS_LABELS[status] || status}
                      </div>
                      <div style={{
                        flex: 1,
                        height: '24px',
                        background: 'rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${(count / dashboard.totalWarehouses) * 100}%`,
                          height: '100%',
                          background: status.includes('SEVESO') ? '#7c3aed' : status === 'AUTORISATION' ? '#ef4444' : status === 'ENREGISTREMENT' ? '#f59e0b' : '#22c55e',
                          borderRadius: '12px'
                        }} />
                      </div>
                      <div style={{ width: '40px', textAlign: 'right', fontWeight: '600' }}>{count}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Prochains controles */}
              <div style={{
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <h3 style={{ fontSize: '18px', marginBottom: '20px' }}>&#128197; Prochains controles</h3>
                {dashboard.upcomingInspections.length === 0 ? (
                  <div style={{ color: '#94a3b8', textAlign: 'center', padding: '20px' }}>
                    Aucun controle prevu dans les 90 jours
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {dashboard.upcomingInspections.map((inspection, idx) => (
                      <div key={idx} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px',
                        background: inspection.daysUntil <= 30 ? 'rgba(251, 191, 36, 0.1)' : 'rgba(255,255,255,0.03)',
                        borderRadius: '8px',
                        border: inspection.daysUntil <= 30 ? '1px solid rgba(251, 191, 36, 0.2)' : 'none'
                      }}>
                        <div>
                          <div style={{ fontWeight: '600' }}>{inspection.warehouseName}</div>
                          <div style={{ fontSize: '13px', color: '#94a3b8' }}>{inspection.partnerName}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: '600', color: inspection.daysUntil <= 30 ? '#fbbf24' : 'white' }}>
                            J-{inspection.daysUntil}
                          </div>
                          <div style={{ fontSize: '13px', color: '#94a3b8' }}>
                            {new Date(inspection.date).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Partners Tab */}
        {activeTab === 'partners' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {logisticians.length === 0 ? (
              <div style={{
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '16px',
                padding: '60px',
                textAlign: 'center',
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>&#129309;</div>
                <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>Aucun partenaire logistique</h3>
                <p style={{ color: '#94a3b8' }}>
                  Ajoutez des partenaires 3PL/4PL dans la section Delegation Logistique
                </p>
                <button
                  onClick={() => router.push('/delegation-logistique')}
                  style={{
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                    border: 'none',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    marginTop: '16px'
                  }}>
                  Gerer les partenaires
                </button>
              </div>
            ) : (
              logisticians.map((partner) => (
                <div
                  key={partner.partnerId}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '16px',
                    padding: '24px',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}>
                  {/* Partner Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '24px' }}>{partner.partnerType === '3PL' ? '&#128230;' : '&#127760;'}</span>
                        <h3 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>{partner.partnerName}</h3>
                        <span style={{
                          background: partner.partnerType === '3PL' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                          color: partner.partnerType === '3PL' ? '#4ade80' : '#60a5fa',
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          {partner.partnerType}
                        </span>
                        {partner.totalAlerts > 0 && (
                          <span style={{
                            background: 'rgba(239, 68, 68, 0.2)',
                            color: '#f87171',
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            {partner.totalAlerts} alerte(s)
                          </span>
                        )}
                      </div>
                      <div style={{ color: '#94a3b8', fontSize: '14px' }}>
                        {partner.contactEmail} - {partner.warehouses.length} entrepot(s)
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedPartner(selectedPartner === partner.partnerId ? null : partner.partnerId)}
                      style={{
                        background: 'rgba(255,255,255,0.1)',
                        border: 'none',
                        color: 'white',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '13px'
                      }}>
                      {selectedPartner === partner.partnerId ? '&#9660; Masquer' : '&#9654; Details'}
                    </button>
                  </div>

                  {/* Partner Warehouses (Expanded) */}
                  {selectedPartner === partner.partnerId && (
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                      {partner.warehouses.map((warehouse) => (
                        <div key={warehouse.warehouseId} style={{
                          background: 'rgba(255,255,255,0.03)',
                          borderRadius: '12px',
                          padding: '16px',
                          marginBottom: '12px'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <div>
                              <div style={{ fontWeight: '600', marginBottom: '4px' }}>{warehouse.name}</div>
                              <div style={{ fontSize: '13px', color: '#94a3b8' }}>
                                {warehouse.address?.city} {warehouse.address?.postalCode}
                                {warehouse.surface && ` - ${warehouse.surface.toLocaleString()} m2`}
                                {warehouse.icpeNumero && ` - N ${warehouse.icpeNumero}`}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              {warehouse.icpeStatus && (
                                <span style={{
                                  background: warehouse.icpeStatus.includes('SEVESO') ? 'rgba(124, 58, 237, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                                  color: warehouse.icpeStatus.includes('SEVESO') ? '#a78bfa' : '#4ade80',
                                  padding: '4px 12px',
                                  borderRadius: '20px',
                                  fontSize: '12px',
                                  fontWeight: '600'
                                }}>
                                  {ICPE_STATUS_LABELS[warehouse.icpeStatus] || warehouse.icpeStatus}
                                </span>
                              )}
                              {warehouse.icpeProchainControle && (
                                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                                  Prochain controle: {new Date(warehouse.icpeProchainControle).toLocaleDateString('fr-FR')}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Alerts */}
                          {warehouse.alerts && warehouse.alerts.length > 0 && (
                            <div style={{
                              background: 'rgba(239, 68, 68, 0.1)',
                              borderRadius: '8px',
                              padding: '10px',
                              marginBottom: '12px'
                            }}>
                              {warehouse.alerts.map((alert, idx) => (
                                <div key={idx} style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  color: alert.severity === 'critical' ? '#f87171' : '#fbbf24',
                                  fontSize: '13px'
                                }}>
                                  <span>{alert.severity === 'critical' ? '&#10060;' : '&#9888;'}</span>
                                  <span>{alert.message}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Rubriques */}
                          {warehouse.icpeRubriques && warehouse.icpeRubriques.length > 0 && (
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                              <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                  <th style={{ textAlign: 'left', padding: '8px', color: '#94a3b8', fontWeight: '500' }}>Rubrique</th>
                                  <th style={{ textAlign: 'left', padding: '8px', color: '#94a3b8', fontWeight: '500' }}>Libelle</th>
                                  <th style={{ textAlign: 'center', padding: '8px', color: '#94a3b8', fontWeight: '500' }}>Regime</th>
                                  <th style={{ textAlign: 'right', padding: '8px', color: '#94a3b8', fontWeight: '500' }}>Seuil max</th>
                                </tr>
                              </thead>
                              <tbody>
                                {warehouse.icpeRubriques.map((rub, idx) => (
                                  <tr key={idx}>
                                    <td style={{ padding: '8px', fontWeight: '600' }}>
                                      {rub.rubrique}
                                      {rub.seveso && <span style={{ marginLeft: '6px', color: '#a78bfa', fontSize: '10px' }}>SEVESO</span>}
                                    </td>
                                    <td style={{ padding: '8px' }}>{rub.libelle}</td>
                                    <td style={{ padding: '8px', textAlign: 'center' }}>
                                      <span style={{
                                        background: `${REGIME_COLORS[rub.regime] || '#6b7280'}20`,
                                        color: REGIME_COLORS[rub.regime] || '#6b7280',
                                        padding: '2px 10px',
                                        borderRadius: '12px',
                                        fontSize: '11px',
                                        fontWeight: '600'
                                      }}>
                                        {rub.regime}
                                      </span>
                                    </td>
                                    <td style={{ padding: '8px', textAlign: 'right' }}>
                                      {rub.seuilMax?.toLocaleString()} {rub.unite}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Alerts Tab */}
        {activeTab === 'alerts' && (
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <h3 style={{ fontSize: '18px', marginBottom: '20px' }}>&#128680; Alertes ICPE actives</h3>

            {getAllAlerts().length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>&#9989;</div>
                <p>Aucune alerte active - Tous les partenaires sont conformes</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {getAllAlerts().map((alert, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px',
                    background: alert.severity === 'critical' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(251, 191, 36, 0.1)',
                    borderRadius: '12px',
                    border: alert.severity === 'critical' ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(251, 191, 36, 0.2)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <span style={{ fontSize: '24px' }}>{alert.severity === 'critical' ? '&#10060;' : '&#9888;'}</span>
                      <div>
                        <div style={{ fontWeight: '600', color: alert.severity === 'critical' ? '#f87171' : '#fbbf24' }}>
                          {alert.message}
                        </div>
                        <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
                          {alert.partnerName} - {alert.warehouseName}
                        </div>
                      </div>
                    </div>
                    <span style={{
                      background: alert.severity === 'critical' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(251, 191, 36, 0.2)',
                      color: alert.severity === 'critical' ? '#f87171' : '#fbbf24',
                      padding: '6px 14px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600',
                      textTransform: 'uppercase'
                    }}>
                      {alert.severity}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
