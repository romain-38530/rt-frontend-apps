import { useEffect, useState } from 'react';
import { useSafeRouter } from '../lib/useSafeRouter';
import Head from 'next/head';
import { isAuthenticated } from '../lib/auth';
import { kpiApi } from '../lib/api';

interface KPISummary {
  orders: { value: number; trend: string; label: string };
  revenue: { value: number; formatted: string; trend: string; label: string };
  deliveries: { value: number; trend: string; label: string };
  satisfaction: { value: number; formatted: string; trend: string; label: string };
}

interface TopCarrier {
  id: string;
  name: string;
  score: number;
  trend: string;
}

interface Alert {
  id: string;
  type: string;
  severity: string;
  title: string;
  message: string;
  createdAt: string;
}

interface ChartData {
  date: string;
  value: number;
}

export default function DashboardPage() {
  const router = useSafeRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [summary, setSummary] = useState<KPISummary>({
    orders: { value: 0, trend: '+0%', label: 'Commandes' },
    revenue: { value: 0, formatted: '€ 0K', trend: '+0%', label: 'Chiffre d\'affaires' },
    deliveries: { value: 0, trend: '+0%', label: 'Livraisons' },
    satisfaction: { value: 0, formatted: '0%', trend: '+0%', label: 'Satisfaction' }
  });
  const [topCarriers, setTopCarriers] = useState<TopCarrier[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [ordersChart, setOrdersChart] = useState<ChartData[]>([]);
  const [operational, setOperational] = useState<any>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!isAuthenticated()) { router.push('/login'); return; }
    loadDashboardData();
  }, [mounted]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await kpiApi.getDashboard({ universe: 'industry' });

      if (response.success && response.data) {
        const data = response.data;

        // Set summary KPIs
        if (data.summary) {
          setSummary({
            orders: data.summary.orders || { value: 0, trend: '+0%', label: 'Commandes' },
            revenue: data.summary.revenue || { value: 0, formatted: '€ 0K', trend: '+0%', label: 'CA' },
            deliveries: data.summary.deliveries || { value: 0, trend: '+0%', label: 'Livraisons' },
            satisfaction: data.summary.satisfaction || { value: 0, formatted: '0%', trend: '+0%', label: 'Satisfaction' }
          });
        }

        // Set top carriers
        if (data.carriers?.top) {
          setTopCarriers(data.carriers.top);
        }

        // Set alerts
        if (data.alerts) {
          setAlerts(data.alerts);
        }

        // Set chart data
        if (data.charts?.ordersTimeline) {
          setOrdersChart(data.charts.ordersTimeline);
        }

        // Set operational data
        if (data.operational) {
          setOperational(data.operational);
        }
      }
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError('Impossible de charger les KPIs');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#FF4444';
      case 'high': return '#FF8C00';
      case 'medium': return '#FFD700';
      default: return '#4CAF50';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'A l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    return `Il y a ${Math.floor(diffHours / 24)}j`;
  };

  const kpiCards = [
    { key: 'orders', value: summary.orders.value, label: summary.orders.label, trend: summary.orders.trend, color: '#00D084' },
    { key: 'revenue', value: summary.revenue.formatted, label: summary.revenue.label, trend: summary.revenue.trend, color: '#00D084' },
    { key: 'deliveries', value: summary.deliveries.value, label: summary.deliveries.label, trend: summary.deliveries.trend, color: '#00D084' },
    { key: 'satisfaction', value: summary.satisfaction.formatted, label: summary.satisfaction.label, trend: summary.satisfaction.trend, color: '#00D084' }
  ];

  return (
    <>
      <Head>
        <title>Tableau de bord KPI - Industry | SYMPHONI.A</title>
      </Head>

      <div style={{
        minHeight: '100vh',
        background: 'url(https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1920&q=80) center/cover',
        position: 'relative',
        color: 'white',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 0
        }} />

        {/* Header */}
        <div style={{
          padding: '20px 40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(0,0,0,0.1)',
          backdropFilter: 'blur(10px)',
          position: 'relative',
          zIndex: 1,
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button
              onClick={() => router.push('/')}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.2s ease'
              }}>
              &#8592; Retour
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '32px' }}>&#128202;</span>
              <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>Tableau de bord KPI</h1>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={loadDashboardData}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600'
              }}>
              &#8635; Actualiser
            </button>
            <div style={{
              padding: '8px 20px',
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: '700',
              border: '1px solid rgba(255,255,255,0.3)'
            }}>
              &#127981; Industry
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{
          padding: '40px',
          position: 'relative',
          zIndex: 1,
          maxWidth: '1400px',
          margin: '0 auto'
        }}>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>&#8987;</div>
              <p>Chargement des KPIs...</p>
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>&#9888;&#65039;</div>
              <p>{error}</p>
              <button
                onClick={loadDashboardData}
                style={{
                  marginTop: '16px',
                  background: '#667eea',
                  border: 'none',
                  color: 'white',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Reessayer
              </button>
            </div>
          ) : (
            <>
              {/* KPI Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                {kpiCards.map((kpi) => (
                  <div key={kpi.key} style={{
                    background: 'rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '16px',
                    padding: '24px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '36px', fontWeight: '800', marginBottom: '12px', color: kpi.color }}>{kpi.value}</div>
                    <div style={{ fontSize: '14px', opacity: 0.7, marginBottom: '8px' }}>{kpi.label}</div>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#00D084' }}>{kpi.trend}</div>
                  </div>
                ))}
              </div>

              {/* Two column layout */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>

                {/* Top Carriers */}
                <div style={{
                  background: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '16px',
                  padding: '24px',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}>
                  <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '700' }}>&#127942; Top Transporteurs</h3>
                  {topCarriers.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {topCarriers.map((carrier, index) => (
                        <div key={carrier.id} style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 16px',
                          background: 'rgba(255,255,255,0.05)',
                          borderRadius: '8px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              background: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : 'rgba(255,255,255,0.2)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '14px',
                              fontWeight: '700'
                            }}>
                              {index + 1}
                            </span>
                            <span style={{ fontWeight: '600' }}>{carrier.name}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                              padding: '4px 12px',
                              background: carrier.score >= 80 ? 'rgba(0,208,132,0.3)' : carrier.score >= 60 ? 'rgba(255,193,7,0.3)' : 'rgba(255,68,68,0.3)',
                              borderRadius: '12px',
                              fontSize: '14px',
                              fontWeight: '700'
                            }}>
                              {carrier.score}/100
                            </span>
                            <span style={{ fontSize: '12px', opacity: 0.7 }}>
                              {carrier.trend === 'up' ? '&#9650;' : carrier.trend === 'down' ? '&#9660;' : '&#8594;'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ opacity: 0.7, textAlign: 'center' }}>Aucun transporteur</p>
                  )}
                </div>

                {/* Alerts */}
                <div style={{
                  background: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '16px',
                  padding: '24px',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}>
                  <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '700' }}>&#128276; Alertes Actives</h3>
                  {alerts.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {alerts.map((alert) => (
                        <div key={alert.id} style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '12px',
                          padding: '12px 16px',
                          background: 'rgba(255,255,255,0.05)',
                          borderRadius: '8px',
                          borderLeft: `4px solid ${getSeverityColor(alert.severity)}`
                        }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '600', marginBottom: '4px' }}>{alert.title}</div>
                            <div style={{ fontSize: '13px', opacity: 0.7 }}>{alert.message}</div>
                            <div style={{ fontSize: '11px', opacity: 0.5, marginTop: '6px' }}>
                              {alert.createdAt ? formatTimeAgo(alert.createdAt) : ''}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '20px', opacity: 0.7 }}>
                      <span style={{ fontSize: '32px' }}>&#9989;</span>
                      <p>Aucune alerte active</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Operational Stats */}
              {operational && (
                <div style={{
                  background: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '16px',
                  padding: '24px',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}>
                  <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '700' }}>&#128668; Operations en cours</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
                    <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                      <div style={{ fontSize: '28px', fontWeight: '800', color: '#4CAF50' }}>{operational.transportsInProgress?.byStatus?.enRoute || 0}</div>
                      <div style={{ fontSize: '12px', opacity: 0.7 }}>En route</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                      <div style={{ fontSize: '28px', fontWeight: '800', color: '#2196F3' }}>{operational.transportsInProgress?.byStatus?.loading || 0}</div>
                      <div style={{ fontSize: '12px', opacity: 0.7 }}>Chargement</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                      <div style={{ fontSize: '28px', fontWeight: '800', color: '#9C27B0' }}>{operational.transportsInProgress?.byStatus?.unloading || 0}</div>
                      <div style={{ fontSize: '12px', opacity: 0.7 }}>Dechargement</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                      <div style={{ fontSize: '28px', fontWeight: '800', color: '#FF9800' }}>{operational.transportsInProgress?.byStatus?.waiting || 0}</div>
                      <div style={{ fontSize: '12px', opacity: 0.7 }}>En attente</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                      <div style={{ fontSize: '28px', fontWeight: '800', color: '#FF4444' }}>{operational.transportsInProgress?.byStatus?.delayed || 0}</div>
                      <div style={{ fontSize: '12px', opacity: 0.7 }}>En retard</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                      <div style={{ fontSize: '28px', fontWeight: '800', color: '#00BCD4' }}>{operational.eta?.accuracy || 0}%</div>
                      <div style={{ fontSize: '12px', opacity: 0.7 }}>Precision ETA</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Orders Timeline Chart Placeholder */}
              {ordersChart.length > 0 && (
                <div style={{
                  marginTop: '20px',
                  background: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '16px',
                  padding: '24px',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}>
                  <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '700' }}>&#128200; Evolution des commandes (7 jours)</h3>
                  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '150px', gap: '8px' }}>
                    {ordersChart.map((day, index) => {
                      const maxValue = Math.max(...ordersChart.map(d => d.value));
                      const height = (day.value / maxValue) * 100;
                      return (
                        <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                          <div style={{ fontSize: '12px', fontWeight: '600' }}>{day.value}</div>
                          <div style={{
                            width: '100%',
                            height: `${height}%`,
                            background: 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)',
                            borderRadius: '4px 4px 0 0',
                            minHeight: '20px'
                          }} />
                          <div style={{ fontSize: '11px', opacity: 0.7 }}>{day.date}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
