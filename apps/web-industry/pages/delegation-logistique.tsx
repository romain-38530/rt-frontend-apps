import { useEffect, useState } from 'react';
import { useSafeRouter } from '../lib/useSafeRouter';
import Head from 'next/head';
import { isAuthenticated, getUser, getToken } from '../lib/auth';

interface LogisticsPartner {
  _id: string;
  partnerId: string;
  partnerName: string;
  partnerType: '3PL' | '4PL';
  contactEmail: string;
  contactPhone?: string;
  managedOperations: ('pickup' | 'delivery' | 'both')[];
  partnerSites: PartnerSite[];
  contractStartDate: string;
  contractEndDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PartnerSite {
  siteId: string;
  siteName: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  isActive: boolean;
}

type ModalMode = 'create' | 'edit' | 'view' | null;

export default function DelegationLogistiquePage() {
  const router = useSafeRouter();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [partners, setPartners] = useState<LogisticsPartner[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<LogisticsPartner | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [formData, setFormData] = useState<Partial<LogisticsPartner>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!isAuthenticated()) {
      window.location.href = '/login';
      return;
    }

    const userData = getUser();
    setUser(userData);
    loadPartners();
  }, [mounted]);

  const loadPartners = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.rt-technologie.fr'}/api/logistics-delegation/partners`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPartners(data.partners || []);
      } else {
        // Mock data for development
        setPartners([
          {
            _id: '1',
            partnerId: 'LOG001',
            partnerName: 'DHL Supply Chain',
            partnerType: '3PL',
            contactEmail: 'contact@dhl-sc.fr',
            contactPhone: '+33 1 23 45 67 89',
            managedOperations: ['both'],
            partnerSites: [
              {
                siteId: 'SITE001',
                siteName: 'Entrepot Paris Nord',
                address: '123 Rue de la Logistique',
                city: 'Roissy-en-France',
                postalCode: '95700',
                country: 'France',
                isActive: true
              }
            ],
            contractStartDate: '2024-01-01',
            contractEndDate: '2025-12-31',
            isActive: true,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-06-15T10:30:00Z'
          },
          {
            _id: '2',
            partnerId: 'LOG002',
            partnerName: 'Kuehne + Nagel',
            partnerType: '4PL',
            contactEmail: 'france@kuehne-nagel.com',
            managedOperations: ['pickup'],
            partnerSites: [
              {
                siteId: 'SITE002',
                siteName: 'Hub Lyon',
                address: '45 Avenue du Transport',
                city: 'Saint-Priest',
                postalCode: '69800',
                country: 'France',
                isActive: true
              },
              {
                siteId: 'SITE003',
                siteName: 'Plateforme Marseille',
                address: '78 Boulevard Maritime',
                city: 'Marseille',
                postalCode: '13002',
                country: 'France',
                isActive: true
              }
            ],
            contractStartDate: '2024-03-01',
            isActive: true,
            createdAt: '2024-03-01T00:00:00Z',
            updatedAt: '2024-09-01T14:00:00Z'
          }
        ]);
      }
    } catch (err) {
      console.error('Failed to load partners:', err);
      setError('Impossible de charger les partenaires logistiques');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (mode: ModalMode, partner?: LogisticsPartner) => {
    setModalMode(mode);
    if (partner) {
      setSelectedPartner(partner);
      setFormData({ ...partner });
    } else {
      setSelectedPartner(null);
      setFormData({
        partnerType: '3PL',
        managedOperations: ['both'],
        partnerSites: [],
        isActive: true,
        contractStartDate: new Date().toISOString().split('T')[0]
      });
    }
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedPartner(null);
    setFormData({});
    setError(null);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const token = getToken();
      const url = modalMode === 'create'
        ? `${process.env.NEXT_PUBLIC_API_URL || 'https://api.rt-technologie.fr'}/api/logistics-delegation/partners`
        : `${process.env.NEXT_PUBLIC_API_URL || 'https://api.rt-technologie.fr'}/api/logistics-delegation/partners/${selectedPartner?._id}`;

      const method = modalMode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setSuccessMessage(modalMode === 'create'
          ? 'Partenaire ajoute avec succes'
          : 'Partenaire mis a jour avec succes');
        closeModal();
        loadPartners();
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        const data = await response.json();
        setError(data.message || 'Une erreur est survenue');
      }
    } catch (err) {
      console.error('Failed to save partner:', err);
      setError('Impossible de sauvegarder le partenaire');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (partner: LogisticsPartner) => {
    try {
      const token = getToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'https://api.rt-technologie.fr'}/api/logistics-delegation/partners/${partner._id}/toggle-active`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        loadPartners();
        setSuccessMessage(`Partenaire ${partner.isActive ? 'desactive' : 'active'} avec succes`);
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      console.error('Failed to toggle partner status:', err);
    }
  };

  const containerStyles: React.CSSProperties = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    color: 'white',
    fontFamily: 'system-ui, sans-serif'
  };

  const headerStyles: React.CSSProperties = {
    padding: '20px 40px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'rgba(0,0,0,0.2)',
    backdropFilter: 'blur(10px)',
    borderBottom: '1px solid rgba(255,255,255,0.1)'
  };

  const cardStyles: React.CSSProperties = {
    background: 'rgba(255,255,255,0.1)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    border: '1px solid rgba(255,255,255,0.15)',
    padding: '24px',
    marginBottom: '20px',
    transition: 'all 0.3s ease'
  };

  const buttonPrimaryStyles: React.CSSProperties = {
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: '700',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
  };

  const badgeStyles = (type: '3PL' | '4PL'): React.CSSProperties => ({
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '700',
    background: type === '4PL'
      ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
      : 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    color: 'white'
  });

  const statusBadgeStyles = (isActive: boolean): React.CSSProperties => ({
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    background: isActive ? 'rgba(40, 167, 69, 0.2)' : 'rgba(220, 53, 69, 0.2)',
    color: isActive ? '#28a745' : '#dc3545',
    border: `1px solid ${isActive ? 'rgba(40, 167, 69, 0.3)' : 'rgba(220, 53, 69, 0.3)'}`
  });

  const operationBadgeStyles = (op: string): React.CSSProperties => ({
    padding: '3px 10px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '600',
    background: op === 'both'
      ? 'rgba(255, 193, 7, 0.2)'
      : op === 'pickup'
        ? 'rgba(0, 123, 255, 0.2)'
        : 'rgba(40, 167, 69, 0.2)',
    color: op === 'both'
      ? '#ffc107'
      : op === 'pickup'
        ? '#007bff'
        : '#28a745',
    border: `1px solid ${op === 'both' ? 'rgba(255, 193, 7, 0.3)' : op === 'pickup' ? 'rgba(0, 123, 255, 0.3)' : 'rgba(40, 167, 69, 0.3)'}`
  });

  const getOperationLabel = (op: string) => {
    switch (op) {
      case 'pickup': return 'Chargement';
      case 'delivery': return 'Livraison';
      case 'both': return 'Charg. + Livr.';
      default: return op;
    }
  };

  if (loading) {
    return (
      <div style={{
        ...containerStyles,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔄</div>
          <p>Chargement des partenaires logistiques...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Delegation Logistique - SYMPHONI.A Industry</title>
      </Head>

      <div style={containerStyles}>
        {/* Header */}
        <div style={headerStyles}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button
              onClick={() => router.push('/')}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                padding: '8px 16px',
                color: 'white',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              ← Retour
            </button>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>
                🤝 Delegation Logistique
              </h1>
              <p style={{ fontSize: '14px', opacity: 0.8, margin: '4px 0 0 0' }}>
                Gerez vos partenaires logistiques 3PL/4PL
              </p>
            </div>
          </div>
          <button
            style={buttonPrimaryStyles}
            onClick={() => openModal('create')}
          >
            ➕ Ajouter un partenaire
          </button>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div style={{
            margin: '20px 40px 0',
            padding: '16px 24px',
            background: 'rgba(40, 167, 69, 0.2)',
            border: '1px solid rgba(40, 167, 69, 0.3)',
            borderRadius: '12px',
            color: '#28a745',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{ fontSize: '20px' }}>✅</span>
            {successMessage}
          </div>
        )}

        {/* Main Content */}
        <div style={{ padding: '40px' }}>
          {/* Stats Row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            marginBottom: '40px'
          }}>
            {[
              { icon: '🤝', label: 'Partenaires actifs', value: partners.filter(p => p.isActive).length },
              { icon: '📦', label: '3PL', value: partners.filter(p => p.partnerType === '3PL').length },
              { icon: '🌐', label: '4PL', value: partners.filter(p => p.partnerType === '4PL').length },
              { icon: '🏭', label: 'Sites delegues', value: partners.reduce((acc, p) => acc + p.partnerSites.length, 0) }
            ].map((stat, i) => (
              <div key={i} style={{
                ...cardStyles,
                textAlign: 'center',
                padding: '20px'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>{stat.icon}</div>
                <div style={{ fontSize: '28px', fontWeight: '800' }}>{stat.value}</div>
                <div style={{ fontSize: '13px', opacity: 0.7 }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Partners List */}
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px' }}>
              Partenaires Logistiques
            </h2>
          </div>

          {partners.length === 0 ? (
            <div style={{
              ...cardStyles,
              textAlign: 'center',
              padding: '60px 40px'
            }}>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>📦</div>
              <h3 style={{ fontSize: '20px', marginBottom: '12px' }}>Aucun partenaire configure</h3>
              <p style={{ opacity: 0.7, marginBottom: '24px' }}>
                Ajoutez vos partenaires logistiques 3PL/4PL pour deleguer la gestion des RDV
              </p>
              <button
                style={buttonPrimaryStyles}
                onClick={() => openModal('create')}
              >
                ➕ Ajouter votre premier partenaire
              </button>
            </div>
          ) : (
            partners.map((partner) => (
              <div
                key={partner._id}
                style={{
                  ...cardStyles,
                  cursor: 'pointer'
                }}
                onClick={() => openModal('view', partner)}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: '16px'
                }}>
                  {/* Left Side - Partner Info */}
                  <div style={{ flex: 1, minWidth: '250px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <span style={{ fontSize: '28px' }}>
                        {partner.partnerType === '4PL' ? '🌐' : '📦'}
                      </span>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <h3 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>
                            {partner.partnerName}
                          </h3>
                          <span style={badgeStyles(partner.partnerType)}>
                            {partner.partnerType}
                          </span>
                          <span style={statusBadgeStyles(partner.isActive)}>
                            {partner.isActive ? 'Actif' : 'Inactif'}
                          </span>
                        </div>
                        <p style={{ fontSize: '13px', opacity: 0.7, margin: '4px 0 0 0' }}>
                          ID: {partner.partnerId} • {partner.contactEmail}
                        </p>
                      </div>
                    </div>

                    {/* Operations Managed */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
                      <span style={{ fontSize: '12px', opacity: 0.6, marginRight: '4px' }}>Operations:</span>
                      {partner.managedOperations.map((op, i) => (
                        <span key={i} style={operationBadgeStyles(op)}>
                          {getOperationLabel(op)}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Middle - Sites */}
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <div style={{ fontSize: '12px', opacity: 0.6, marginBottom: '8px' }}>
                      Sites delegues ({partner.partnerSites.length})
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {partner.partnerSites.slice(0, 3).map((site, i) => (
                        <div key={i} style={{
                          fontSize: '13px',
                          padding: '4px 8px',
                          background: 'rgba(255,255,255,0.05)',
                          borderRadius: '6px'
                        }}>
                          📍 {site.siteName} - {site.city}
                        </div>
                      ))}
                      {partner.partnerSites.length > 3 && (
                        <div style={{ fontSize: '12px', opacity: 0.6, paddingLeft: '8px' }}>
                          +{partner.partnerSites.length - 3} autres sites
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Side - Contract & Actions */}
                  <div style={{ textAlign: 'right', minWidth: '150px' }}>
                    <div style={{ fontSize: '12px', opacity: 0.6, marginBottom: '4px' }}>Contrat</div>
                    <div style={{ fontSize: '13px', marginBottom: '16px' }}>
                      {new Date(partner.contractStartDate).toLocaleDateString('fr-FR')}
                      {partner.contractEndDate && (
                        <> → {new Date(partner.contractEndDate).toLocaleDateString('fr-FR')}</>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openModal('edit', partner);
                        }}
                        style={{
                          padding: '8px 16px',
                          background: 'rgba(255,255,255,0.1)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '8px',
                          color: 'white',
                          cursor: 'pointer',
                          fontSize: '13px'
                        }}
                      >
                        ✏️ Modifier
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleActive(partner);
                        }}
                        style={{
                          padding: '8px 16px',
                          background: partner.isActive
                            ? 'rgba(220, 53, 69, 0.2)'
                            : 'rgba(40, 167, 69, 0.2)',
                          border: `1px solid ${partner.isActive ? 'rgba(220, 53, 69, 0.3)' : 'rgba(40, 167, 69, 0.3)'}`,
                          borderRadius: '8px',
                          color: partner.isActive ? '#dc3545' : '#28a745',
                          cursor: 'pointer',
                          fontSize: '13px'
                        }}
                      >
                        {partner.isActive ? '⏸️ Desactiver' : '▶️ Activer'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Info Section */}
          <div style={{
            ...cardStyles,
            marginTop: '40px',
            background: 'rgba(102, 126, 234, 0.1)',
            border: '1px solid rgba(102, 126, 234, 0.3)'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              💡 Comment fonctionne la delegation logistique ?
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '20px',
              fontSize: '14px',
              opacity: 0.9
            }}>
              <div>
                <strong style={{ color: '#4facfe' }}>3PL (Third Party Logistics)</strong>
                <p style={{ margin: '8px 0 0 0', lineHeight: 1.6 }}>
                  Sous-traitance des operations logistiques (entreposage, transport, preparation).
                  Le 3PL gere les RDV pour les sites qu'il opere.
                </p>
              </div>
              <div>
                <strong style={{ color: '#f093fb' }}>4PL (Fourth Party Logistics)</strong>
                <p style={{ margin: '8px 0 0 0', lineHeight: 1.6 }}>
                  Orchestration complete de la supply chain. Le 4PL coordonne plusieurs prestataires
                  et gere l'ensemble des RDV pour vous.
                </p>
              </div>
              <div>
                <strong style={{ color: '#ffc107' }}>Routage automatique</strong>
                <p style={{ margin: '8px 0 0 0', lineHeight: 1.6 }}>
                  Les demandes de RDV sont automatiquement envoyees au bon destinataire selon
                  la configuration: vous, votre logisticien, ou le fournisseur.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal */}
        {modalMode && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }} onClick={closeModal}>
            <div
              style={{
                background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                borderRadius: '20px',
                border: '1px solid rgba(255,255,255,0.2)',
                width: '100%',
                maxWidth: '700px',
                maxHeight: '90vh',
                overflow: 'auto',
                padding: '32px'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px'
              }}>
                <h2 style={{ fontSize: '22px', fontWeight: '700', margin: 0 }}>
                  {modalMode === 'create' && '➕ Ajouter un partenaire'}
                  {modalMode === 'edit' && '✏️ Modifier le partenaire'}
                  {modalMode === 'view' && '👁️ Details du partenaire'}
                </h2>
                <button
                  onClick={closeModal}
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '18px'
                  }}
                >
                  ✕
                </button>
              </div>

              {error && (
                <div style={{
                  padding: '12px 16px',
                  background: 'rgba(220, 53, 69, 0.2)',
                  border: '1px solid rgba(220, 53, 69, 0.3)',
                  borderRadius: '8px',
                  color: '#dc3545',
                  marginBottom: '20px'
                }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Partner Name */}
                <div>
                  <label style={{ fontSize: '13px', opacity: 0.8, display: 'block', marginBottom: '8px' }}>
                    Nom du partenaire *
                  </label>
                  <input
                    type="text"
                    value={formData.partnerName || ''}
                    onChange={(e) => setFormData({ ...formData, partnerName: e.target.value })}
                    disabled={modalMode === 'view'}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '10px',
                      color: 'white',
                      fontSize: '14px'
                    }}
                    placeholder="Ex: DHL Supply Chain"
                  />
                </div>

                {/* Partner Type & ID */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '13px', opacity: 0.8, display: 'block', marginBottom: '8px' }}>
                      Type de partenaire *
                    </label>
                    <select
                      value={formData.partnerType || '3PL'}
                      onChange={(e) => setFormData({ ...formData, partnerType: e.target.value as '3PL' | '4PL' })}
                      disabled={modalMode === 'view'}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '10px',
                        color: 'white',
                        fontSize: '14px'
                      }}
                    >
                      <option value="3PL" style={{ background: '#1a1a2e' }}>3PL - Third Party Logistics</option>
                      <option value="4PL" style={{ background: '#1a1a2e' }}>4PL - Fourth Party Logistics</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '13px', opacity: 0.8, display: 'block', marginBottom: '8px' }}>
                      ID Partenaire *
                    </label>
                    <input
                      type="text"
                      value={formData.partnerId || ''}
                      onChange={(e) => setFormData({ ...formData, partnerId: e.target.value })}
                      disabled={modalMode === 'view'}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '10px',
                        color: 'white',
                        fontSize: '14px'
                      }}
                      placeholder="Ex: LOG001"
                    />
                  </div>
                </div>

                {/* Contact */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '13px', opacity: 0.8, display: 'block', marginBottom: '8px' }}>
                      Email de contact *
                    </label>
                    <input
                      type="email"
                      value={formData.contactEmail || ''}
                      onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                      disabled={modalMode === 'view'}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '10px',
                        color: 'white',
                        fontSize: '14px'
                      }}
                      placeholder="contact@partner.com"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '13px', opacity: 0.8, display: 'block', marginBottom: '8px' }}>
                      Telephone
                    </label>
                    <input
                      type="tel"
                      value={formData.contactPhone || ''}
                      onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                      disabled={modalMode === 'view'}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '10px',
                        color: 'white',
                        fontSize: '14px'
                      }}
                      placeholder="+33 1 23 45 67 89"
                    />
                  </div>
                </div>

                {/* Managed Operations */}
                <div>
                  <label style={{ fontSize: '13px', opacity: 0.8, display: 'block', marginBottom: '12px' }}>
                    Operations deleguees *
                  </label>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {[
                      { value: 'pickup', label: '📥 Chargements uniquement' },
                      { value: 'delivery', label: '📤 Livraisons uniquement' },
                      { value: 'both', label: '🔄 Chargements + Livraisons' }
                    ].map((op) => (
                      <label
                        key={op.value}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px 16px',
                          background: formData.managedOperations?.includes(op.value as any)
                            ? 'rgba(102, 126, 234, 0.3)'
                            : 'rgba(255,255,255,0.05)',
                          border: `1px solid ${formData.managedOperations?.includes(op.value as any)
                            ? 'rgba(102, 126, 234, 0.5)'
                            : 'rgba(255,255,255,0.1)'}`,
                          borderRadius: '10px',
                          cursor: modalMode === 'view' ? 'default' : 'pointer',
                          fontSize: '13px'
                        }}
                      >
                        <input
                          type="radio"
                          name="managedOperations"
                          checked={formData.managedOperations?.includes(op.value as any)}
                          onChange={() => setFormData({ ...formData, managedOperations: [op.value as any] })}
                          disabled={modalMode === 'view'}
                          style={{ display: 'none' }}
                        />
                        {op.label}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Contract Dates */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '13px', opacity: 0.8, display: 'block', marginBottom: '8px' }}>
                      Debut du contrat *
                    </label>
                    <input
                      type="date"
                      value={formData.contractStartDate?.split('T')[0] || ''}
                      onChange={(e) => setFormData({ ...formData, contractStartDate: e.target.value })}
                      disabled={modalMode === 'view'}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '10px',
                        color: 'white',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '13px', opacity: 0.8, display: 'block', marginBottom: '8px' }}>
                      Fin du contrat (optionnel)
                    </label>
                    <input
                      type="date"
                      value={formData.contractEndDate?.split('T')[0] || ''}
                      onChange={(e) => setFormData({ ...formData, contractEndDate: e.target.value })}
                      disabled={modalMode === 'view'}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '10px',
                        color: 'white',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                </div>

                {/* Active Toggle */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px',
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '12px'
                }}>
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive !== false}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    disabled={modalMode === 'view'}
                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                  />
                  <label htmlFor="isActive" style={{ cursor: 'pointer' }}>
                    <strong>Partenaire actif</strong>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', opacity: 0.7 }}>
                      Les demandes de RDV seront routees vers ce partenaire s'il est actif
                    </p>
                  </label>
                </div>

                {/* Actions */}
                {modalMode !== 'view' && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '12px',
                    marginTop: '12px',
                    paddingTop: '20px',
                    borderTop: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    <button
                      onClick={closeModal}
                      style={{
                        padding: '12px 24px',
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '10px',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      style={{
                        ...buttonPrimaryStyles,
                        opacity: saving ? 0.7 : 1
                      }}
                    >
                      {saving ? '⏳ Sauvegarde...' : '💾 Sauvegarder'}
                    </button>
                  </div>
                )}

                {modalMode === 'view' && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '12px',
                    marginTop: '12px',
                    paddingTop: '20px',
                    borderTop: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    <button
                      onClick={() => setModalMode('edit')}
                      style={buttonPrimaryStyles}
                    >
                      ✏️ Modifier
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
