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
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  surface?: number;
  dockCount?: number;
  icpeStatus?: string;
  icpeNumero?: string;
  icpePrefecture?: string;
  icpeDateDeclaration?: string;
  icpeProchainControle?: string;
  icpeRubriques: ICPERubrique[];
  icpeAlerts?: any[];
}

interface RubriqueReference {
  code: string;
  libelle: string;
  description: string;
  unite: string;
  seuils: {
    declaration?: { min: number; max: number | null };
    enregistrement?: { min: number; max: number | null };
    autorisation?: { min: number; max: number | null };
  };
  seveso?: boolean;
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

export default function ICPEPage() {
  const router = useSafeRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [rubriquesReference, setRubriquesReference] = useState<RubriqueReference[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [showWarehouseModal, setShowWarehouseModal] = useState(false);
  const [showRubriqueModal, setShowRubriqueModal] = useState(false);
  const [showVolumeModal, setShowVolumeModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

  // Form states
  const [warehouseForm, setWarehouseForm] = useState({
    name: '',
    street: '',
    city: '',
    postalCode: '',
    surface: '',
    dockCount: '1',
    icpeStatus: '',
    icpeNumero: '',
    icpePrefecture: '',
    icpeDateDeclaration: '',
    icpeProchainControle: ''
  });

  const [rubriqueForm, setRubriqueForm] = useState({
    rubrique: '',
    volume: '',
    dateDeclaration: new Date().toISOString().split('T')[0]
  });

  const [volumeForm, setVolumeForm] = useState({
    rubrique: '',
    volume: '',
    date: new Date().toISOString().split('T')[0],
    comment: ''
  });

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
    await Promise.all([loadWarehouses(), loadRubriquesReference()]);
    setLoading(false);
  };

  const loadWarehouses = async () => {
    try {
      const response = await fetch(`${API_URL}/api/icpe/warehouses`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setWarehouses(data.warehouses || []);
      }
    } catch (err) {
      console.error('Error loading warehouses:', err);
      // Mock data for development
      setWarehouses([]);
    }
  };

  const loadRubriquesReference = async () => {
    try {
      const response = await fetch(`${API_URL}/api/icpe/rubriques`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setRubriquesReference(data.rubriques || []);
      }
    } catch (err) {
      console.error('Error loading rubriques:', err);
      // Fallback rubriques
      setRubriquesReference([
        { code: '1510', libelle: 'Entrepot couvert', description: 'Stockage >500 tonnes', unite: 'tonnes', seuils: { declaration: { min: 500, max: 1000 }, enregistrement: { min: 1000, max: null } } },
        { code: '1511', libelle: 'Entrepot frigorifique', description: 'Installations frigorifiques', unite: 'kg', seuils: { declaration: { min: 300, max: 1500 }, autorisation: { min: 1500, max: null } } },
        { code: '2662', libelle: 'Stockage polymeres', description: 'Plastiques, caoutchoucs', unite: 'tonnes', seuils: { declaration: { min: 100, max: 1000 }, enregistrement: { min: 1000, max: null } } },
        { code: '4331', libelle: 'Liquides inflammables', description: 'Categorie 2', unite: 'tonnes', seuils: { declaration: { min: 10, max: 100 }, autorisation: { min: 100, max: null } }, seveso: true },
      ]);
    }
  };

  const handleCreateWarehouse = async () => {
    try {
      const response = await fetch(`${API_URL}/api/icpe/warehouses`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: warehouseForm.name,
          address: {
            street: warehouseForm.street,
            city: warehouseForm.city,
            postalCode: warehouseForm.postalCode,
            country: 'France'
          },
          surface: parseInt(warehouseForm.surface) || 0,
          dockCount: parseInt(warehouseForm.dockCount) || 1,
          icpeStatus: warehouseForm.icpeStatus || null,
          icpeNumero: warehouseForm.icpeNumero || null,
          icpePrefecture: warehouseForm.icpePrefecture || null,
          icpeDateDeclaration: warehouseForm.icpeDateDeclaration || null,
          icpeProchainControle: warehouseForm.icpeProchainControle || null
        }),
      });

      if (response.ok) {
        toast.success('Entrepot cree avec succes');
        setShowWarehouseModal(false);
        resetWarehouseForm();
        loadWarehouses();
      } else {
        const err = await response.json();
        toast.error(err.error || 'Erreur lors de la creation');
      }
    } catch (err) {
      toast.error('Erreur de connexion');
    }
  };

  const handleUpdateWarehouse = async () => {
    if (!selectedWarehouse) return;

    try {
      const response = await fetch(`${API_URL}/api/icpe/warehouses/${selectedWarehouse.warehouseId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: warehouseForm.name,
          address: {
            street: warehouseForm.street,
            city: warehouseForm.city,
            postalCode: warehouseForm.postalCode,
            country: 'France'
          },
          surface: parseInt(warehouseForm.surface) || 0,
          dockCount: parseInt(warehouseForm.dockCount) || 1,
          icpeStatus: warehouseForm.icpeStatus || null,
          icpeNumero: warehouseForm.icpeNumero || null,
          icpePrefecture: warehouseForm.icpePrefecture || null,
          icpeDateDeclaration: warehouseForm.icpeDateDeclaration || null,
          icpeProchainControle: warehouseForm.icpeProchainControle || null
        }),
      });

      if (response.ok) {
        toast.success('Entrepot mis a jour');
        setShowWarehouseModal(false);
        resetWarehouseForm();
        loadWarehouses();
      } else {
        const err = await response.json();
        toast.error(err.error || 'Erreur lors de la mise a jour');
      }
    } catch (err) {
      toast.error('Erreur de connexion');
    }
  };

  const handleAddRubrique = async () => {
    if (!selectedWarehouse) return;

    try {
      const response = await fetch(`${API_URL}/api/icpe/warehouses/${selectedWarehouse.warehouseId}/rubriques`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rubrique: rubriqueForm.rubrique,
          volume: parseFloat(rubriqueForm.volume),
          dateDeclaration: rubriqueForm.dateDeclaration
        }),
      });

      if (response.ok) {
        toast.success('Rubrique ajoutee avec succes');
        setShowRubriqueModal(false);
        setRubriqueForm({ rubrique: '', volume: '', dateDeclaration: new Date().toISOString().split('T')[0] });
        loadWarehouses();
      } else {
        const err = await response.json();
        toast.error(err.error || 'Erreur lors de l\'ajout');
      }
    } catch (err) {
      toast.error('Erreur de connexion');
    }
  };

  const handleDeclareVolume = async () => {
    if (!selectedWarehouse) return;

    try {
      const response = await fetch(`${API_URL}/api/icpe/warehouses/${selectedWarehouse.warehouseId}/volumes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rubrique: volumeForm.rubrique,
          volume: parseFloat(volumeForm.volume),
          date: volumeForm.date,
          comment: volumeForm.comment || null
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Volume declare avec succes');
        if (data.alerts && data.alerts.length > 0) {
          data.alerts.forEach((alert: any) => {
            if (alert.severity === 'critical') {
              toast.error(alert.message);
            } else {
              toast(alert.message, { icon: '?' });
            }
          });
        }
        setShowVolumeModal(false);
        setVolumeForm({ rubrique: '', volume: '', date: new Date().toISOString().split('T')[0], comment: '' });
        loadWarehouses();
      } else {
        const err = await response.json();
        toast.error(err.error || 'Erreur lors de la declaration');
      }
    } catch (err) {
      toast.error('Erreur de connexion');
    }
  };

  const handleDeleteRubrique = async (warehouseId: string, rubriqueCode: string) => {
    if (!confirm('Supprimer cette rubrique ?')) return;

    try {
      const response = await fetch(`${API_URL}/api/icpe/warehouses/${warehouseId}/rubriques/${rubriqueCode}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
        },
      });

      if (response.ok) {
        toast.success('Rubrique supprimee');
        loadWarehouses();
      } else {
        toast.error('Erreur lors de la suppression');
      }
    } catch (err) {
      toast.error('Erreur de connexion');
    }
  };

  const resetWarehouseForm = () => {
    setWarehouseForm({
      name: '',
      street: '',
      city: '',
      postalCode: '',
      surface: '',
      dockCount: '1',
      icpeStatus: '',
      icpeNumero: '',
      icpePrefecture: '',
      icpeDateDeclaration: '',
      icpeProchainControle: ''
    });
    setSelectedWarehouse(null);
  };

  const openEditWarehouse = (warehouse: Warehouse) => {
    setSelectedWarehouse(warehouse);
    setWarehouseForm({
      name: warehouse.name,
      street: warehouse.address?.street || '',
      city: warehouse.address?.city || '',
      postalCode: warehouse.address?.postalCode || '',
      surface: warehouse.surface?.toString() || '',
      dockCount: warehouse.dockCount?.toString() || '1',
      icpeStatus: warehouse.icpeStatus || '',
      icpeNumero: warehouse.icpeNumero || '',
      icpePrefecture: warehouse.icpePrefecture || '',
      icpeDateDeclaration: warehouse.icpeDateDeclaration?.split('T')[0] || '',
      icpeProchainControle: warehouse.icpeProchainControle?.split('T')[0] || ''
    });
    setModalMode('edit');
    setShowWarehouseModal(true);
  };

  const openAddRubrique = (warehouse: Warehouse) => {
    setSelectedWarehouse(warehouse);
    setShowRubriqueModal(true);
  };

  const openDeclareVolume = (warehouse: Warehouse, rubriqueCode?: string) => {
    setSelectedWarehouse(warehouse);
    setVolumeForm({
      rubrique: rubriqueCode || '',
      volume: '',
      date: new Date().toISOString().split('T')[0],
      comment: ''
    });
    setShowVolumeModal(true);
  };

  const getTotalAlerts = () => {
    return warehouses.reduce((sum, w) => sum + (w.icpeAlerts?.length || 0), 0);
  };

  const getCriticalAlerts = () => {
    return warehouses.reduce((sum, w) => sum + (w.icpeAlerts?.filter(a => a.severity === 'critical').length || 0), 0);
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
        <title>Gestion ICPE - SYMPHONI.A Logisticien</title>
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
              ? Retour
            </button>
            <h1 style={{ fontSize: '28px', fontWeight: '700', margin: 0 }}>
              ? Gestion ICPE
            </h1>
            <p style={{ color: '#94a3b8', margin: '4px 0 0 0' }}>
              Installations Classees pour la Protection de l'Environnement
            </p>
          </div>
          <button
            onClick={() => {
              resetWarehouseForm();
              setModalMode('create');
              setShowWarehouseModal(true);
            }}
            style={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              border: 'none',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600'
            }}>
            + Ajouter un entrepot
          </button>
        </div>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>?</div>
            <div style={{ fontSize: '24px', fontWeight: '700' }}>{warehouses.length}</div>
            <div style={{ color: '#94a3b8', fontSize: '14px' }}>Entrepots</div>
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>?</div>
            <div style={{ fontSize: '24px', fontWeight: '700' }}>
              {warehouses.reduce((sum, w) => sum + (w.icpeRubriques?.length || 0), 0)}
            </div>
            <div style={{ color: '#94a3b8', fontSize: '14px' }}>Rubriques declarees</div>
          </div>
          <div style={{
            background: getTotalAlerts() > 0 ? 'rgba(251, 191, 36, 0.1)' : 'rgba(255,255,255,0.05)',
            borderRadius: '12px',
            padding: '20px',
            border: getTotalAlerts() > 0 ? '1px solid rgba(251, 191, 36, 0.3)' : '1px solid rgba(255,255,255,0.1)'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>?</div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: getTotalAlerts() > 0 ? '#fbbf24' : 'white' }}>
              {getTotalAlerts()}
            </div>
            <div style={{ color: '#94a3b8', fontSize: '14px' }}>Alertes</div>
          </div>
          <div style={{
            background: getCriticalAlerts() > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.05)',
            borderRadius: '12px',
            padding: '20px',
            border: getCriticalAlerts() > 0 ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255,255,255,0.1)'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>?</div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: getCriticalAlerts() > 0 ? '#ef4444' : 'white' }}>
              {getCriticalAlerts()}
            </div>
            <div style={{ color: '#94a3b8', fontSize: '14px' }}>Depassements</div>
          </div>
        </div>

        {/* Warehouses List */}
        {warehouses.length === 0 ? (
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '16px',
            padding: '60px',
            textAlign: 'center',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>?</div>
            <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>Aucun entrepot enregistre</h3>
            <p style={{ color: '#94a3b8', marginBottom: '24px' }}>
              Commencez par ajouter vos entrepots et leurs declarations ICPE
            </p>
            <button
              onClick={() => {
                resetWarehouseForm();
                setModalMode('create');
                setShowWarehouseModal(true);
              }}
              style={{
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                border: 'none',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600'
              }}>
              + Ajouter mon premier entrepot
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {warehouses.map((warehouse) => (
              <div
                key={warehouse.warehouseId}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '16px',
                  padding: '24px',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}>
                {/* Warehouse Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <h3 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>{warehouse.name}</h3>
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
                      {warehouse.icpeAlerts && warehouse.icpeAlerts.length > 0 && (
                        <span style={{
                          background: 'rgba(239, 68, 68, 0.2)',
                          color: '#f87171',
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          {warehouse.icpeAlerts.length} alerte(s)
                        </span>
                      )}
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: '14px' }}>
                      {warehouse.address?.street}, {warehouse.address?.postalCode} {warehouse.address?.city}
                      {warehouse.surface && ` - ${warehouse.surface} m²`}
                      {warehouse.icpeNumero && ` - N° ${warehouse.icpeNumero}`}
                    </div>
                    {warehouse.icpeProchainControle && (
                      <div style={{ color: '#94a3b8', fontSize: '13px', marginTop: '4px' }}>
                        ? Prochain controle: {new Date(warehouse.icpeProchainControle).toLocaleDateString('fr-FR')}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => openDeclareVolume(warehouse)}
                      style={{
                        background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                        border: 'none',
                        color: 'white',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '600'
                      }}>
                      ? Declarer volume
                    </button>
                    <button
                      onClick={() => openAddRubrique(warehouse)}
                      style={{
                        background: 'rgba(139, 92, 246, 0.2)',
                        border: '1px solid rgba(139, 92, 246, 0.3)',
                        color: '#a78bfa',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '600'
                      }}>
                      + Rubrique
                    </button>
                    <button
                      onClick={() => openEditWarehouse(warehouse)}
                      style={{
                        background: 'rgba(255,255,255,0.1)',
                        border: 'none',
                        color: 'white',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '13px'
                      }}>
                      ? Modifier
                    </button>
                  </div>
                </div>

                {/* Alerts */}
                {warehouse.icpeAlerts && warehouse.icpeAlerts.length > 0 && (
                  <div style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '16px',
                    border: '1px solid rgba(239, 68, 68, 0.2)'
                  }}>
                    {warehouse.icpeAlerts.map((alert, idx) => (
                      <div key={idx} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '4px 0',
                        color: alert.severity === 'critical' ? '#f87171' : '#fbbf24'
                      }}>
                        <span>{alert.severity === 'critical' ? '?' : '?'}</span>
                        <span style={{ fontSize: '14px' }}>{alert.message}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Rubriques Table */}
                {warehouse.icpeRubriques && warehouse.icpeRubriques.length > 0 ? (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          <th style={{ textAlign: 'left', padding: '12px 8px', color: '#94a3b8', fontWeight: '500', fontSize: '13px' }}>Rubrique</th>
                          <th style={{ textAlign: 'left', padding: '12px 8px', color: '#94a3b8', fontWeight: '500', fontSize: '13px' }}>Libelle</th>
                          <th style={{ textAlign: 'center', padding: '12px 8px', color: '#94a3b8', fontWeight: '500', fontSize: '13px' }}>Regime</th>
                          <th style={{ textAlign: 'right', padding: '12px 8px', color: '#94a3b8', fontWeight: '500', fontSize: '13px' }}>Seuil max</th>
                          <th style={{ textAlign: 'center', padding: '12px 8px', color: '#94a3b8', fontWeight: '500', fontSize: '13px' }}>Date</th>
                          <th style={{ textAlign: 'right', padding: '12px 8px', color: '#94a3b8', fontWeight: '500', fontSize: '13px' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {warehouse.icpeRubriques.map((rub, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <td style={{ padding: '12px 8px', fontWeight: '600' }}>
                              {rub.rubrique}
                              {rub.seveso && <span style={{ marginLeft: '8px', color: '#a78bfa', fontSize: '11px' }}>SEVESO</span>}
                            </td>
                            <td style={{ padding: '12px 8px', color: '#e2e8f0' }}>{rub.libelle}</td>
                            <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                              <span style={{
                                background: `${REGIME_COLORS[rub.regime] || '#6b7280'}20`,
                                color: REGIME_COLORS[rub.regime] || '#6b7280',
                                padding: '4px 12px',
                                borderRadius: '20px',
                                fontSize: '12px',
                                fontWeight: '600'
                              }}>
                                {rub.regime}
                              </span>
                            </td>
                            <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                              {rub.seuilMax?.toLocaleString()} {rub.unite}
                            </td>
                            <td style={{ padding: '12px 8px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                              {rub.dateDeclaration ? new Date(rub.dateDeclaration).toLocaleDateString('fr-FR') : '-'}
                            </td>
                            <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                              <button
                                onClick={() => openDeclareVolume(warehouse, rub.rubrique)}
                                style={{
                                  background: 'rgba(34, 197, 94, 0.1)',
                                  border: 'none',
                                  color: '#4ade80',
                                  padding: '6px 12px',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  marginRight: '8px'
                                }}>
                                ? Volume
                              </button>
                              <button
                                onClick={() => handleDeleteRubrique(warehouse.warehouseId, rub.rubrique)}
                                style={{
                                  background: 'rgba(239, 68, 68, 0.1)',
                                  border: 'none',
                                  color: '#f87171',
                                  padding: '6px 12px',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '12px'
                                }}>
                                ?
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '8px',
                    padding: '24px',
                    textAlign: 'center',
                    color: '#94a3b8'
                  }}>
                    <p>Aucune rubrique ICPE declaree pour cet entrepot</p>
                    <button
                      onClick={() => openAddRubrique(warehouse)}
                      style={{
                        background: 'rgba(139, 92, 246, 0.2)',
                        border: '1px solid rgba(139, 92, 246, 0.3)',
                        color: '#a78bfa',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '600',
                        marginTop: '12px'
                      }}>
                      + Ajouter une rubrique
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Modal Warehouse */}
        {showWarehouseModal && (
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
            zIndex: 1000
          }}>
            <div style={{
              background: '#1e293b',
              borderRadius: '16px',
              padding: '32px',
              width: '600px',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <h2 style={{ marginBottom: '24px' }}>
                {modalMode === 'create' ? '? Nouvel entrepot' : '? Modifier l\'entrepot'}
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', marginBottom: '6px', color: '#94a3b8', fontSize: '14px' }}>Nom de l'entrepot *</label>
                  <input
                    type="text"
                    value={warehouseForm.name}
                    onChange={(e) => setWarehouseForm({ ...warehouseForm, name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.2)',
                      background: 'rgba(255,255,255,0.05)',
                      color: 'white'
                    }}
                    placeholder="Entrepot Lyon"
                  />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', marginBottom: '6px', color: '#94a3b8', fontSize: '14px' }}>Adresse</label>
                  <input
                    type="text"
                    value={warehouseForm.street}
                    onChange={(e) => setWarehouseForm({ ...warehouseForm, street: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.2)',
                      background: 'rgba(255,255,255,0.05)',
                      color: 'white'
                    }}
                    placeholder="123 Rue de l'Industrie"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', color: '#94a3b8', fontSize: '14px' }}>Code postal</label>
                  <input
                    type="text"
                    value={warehouseForm.postalCode}
                    onChange={(e) => setWarehouseForm({ ...warehouseForm, postalCode: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.2)',
                      background: 'rgba(255,255,255,0.05)',
                      color: 'white'
                    }}
                    placeholder="69000"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', color: '#94a3b8', fontSize: '14px' }}>Ville</label>
                  <input
                    type="text"
                    value={warehouseForm.city}
                    onChange={(e) => setWarehouseForm({ ...warehouseForm, city: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.2)',
                      background: 'rgba(255,255,255,0.05)',
                      color: 'white'
                    }}
                    placeholder="Lyon"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', color: '#94a3b8', fontSize: '14px' }}>Surface (m²)</label>
                  <input
                    type="number"
                    value={warehouseForm.surface}
                    onChange={(e) => setWarehouseForm({ ...warehouseForm, surface: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.2)',
                      background: 'rgba(255,255,255,0.05)',
                      color: 'white'
                    }}
                    placeholder="5000"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', color: '#94a3b8', fontSize: '14px' }}>Nombre de quais</label>
                  <input
                    type="number"
                    value={warehouseForm.dockCount}
                    onChange={(e) => setWarehouseForm({ ...warehouseForm, dockCount: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.2)',
                      background: 'rgba(255,255,255,0.05)',
                      color: 'white'
                    }}
                    placeholder="4"
                  />
                </div>

                <div style={{ gridColumn: 'span 2', marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px' }}>
                  <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>? Configuration ICPE</h3>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', color: '#94a3b8', fontSize: '14px' }}>Statut ICPE</label>
                  <select
                    value={warehouseForm.icpeStatus}
                    onChange={(e) => setWarehouseForm({ ...warehouseForm, icpeStatus: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.2)',
                      background: 'rgba(255,255,255,0.05)',
                      color: 'white'
                    }}>
                    <option value="">-- Selectionner --</option>
                    <option value="DECLARATION">Declaration (D)</option>
                    <option value="ENREGISTREMENT">Enregistrement (E)</option>
                    <option value="AUTORISATION">Autorisation (A)</option>
                    <option value="SEVESO_SB">SEVESO Seuil Bas</option>
                    <option value="SEVESO_SH">SEVESO Seuil Haut</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', color: '#94a3b8', fontSize: '14px' }}>N° ICPE</label>
                  <input
                    type="text"
                    value={warehouseForm.icpeNumero}
                    onChange={(e) => setWarehouseForm({ ...warehouseForm, icpeNumero: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.2)',
                      background: 'rgba(255,255,255,0.05)',
                      color: 'white'
                    }}
                    placeholder="ICPE-2024-001"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', color: '#94a3b8', fontSize: '14px' }}>Prefecture</label>
                  <input
                    type="text"
                    value={warehouseForm.icpePrefecture}
                    onChange={(e) => setWarehouseForm({ ...warehouseForm, icpePrefecture: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.2)',
                      background: 'rgba(255,255,255,0.05)',
                      color: 'white'
                    }}
                    placeholder="69"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', color: '#94a3b8', fontSize: '14px' }}>Date declaration</label>
                  <input
                    type="date"
                    value={warehouseForm.icpeDateDeclaration}
                    onChange={(e) => setWarehouseForm({ ...warehouseForm, icpeDateDeclaration: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.2)',
                      background: 'rgba(255,255,255,0.05)',
                      color: 'white'
                    }}
                  />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', marginBottom: '6px', color: '#94a3b8', fontSize: '14px' }}>Prochain controle</label>
                  <input
                    type="date"
                    value={warehouseForm.icpeProchainControle}
                    onChange={(e) => setWarehouseForm({ ...warehouseForm, icpeProchainControle: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.2)',
                      background: 'rgba(255,255,255,0.05)',
                      color: 'white'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button
                  onClick={() => {
                    setShowWarehouseModal(false);
                    resetWarehouseForm();
                  }}
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: 'none',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}>
                  Annuler
                </button>
                <button
                  onClick={modalMode === 'create' ? handleCreateWarehouse : handleUpdateWarehouse}
                  style={{
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                    border: 'none',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}>
                  {modalMode === 'create' ? 'Creer' : 'Enregistrer'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Rubrique */}
        {showRubriqueModal && selectedWarehouse && (
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
            zIndex: 1000
          }}>
            <div style={{
              background: '#1e293b',
              borderRadius: '16px',
              padding: '32px',
              width: '500px'
            }}>
              <h2 style={{ marginBottom: '8px' }}>? Ajouter une rubrique ICPE</h2>
              <p style={{ color: '#94a3b8', marginBottom: '24px', fontSize: '14px' }}>
                Entrepot: {selectedWarehouse.name}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', color: '#94a3b8', fontSize: '14px' }}>Rubrique ICPE *</label>
                  <select
                    value={rubriqueForm.rubrique}
                    onChange={(e) => setRubriqueForm({ ...rubriqueForm, rubrique: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.2)',
                      background: 'rgba(255,255,255,0.05)',
                      color: 'white'
                    }}>
                    <option value="">-- Selectionner une rubrique --</option>
                    {rubriquesReference.map((rub) => (
                      <option key={rub.code} value={rub.code}>
                        {rub.code} - {rub.libelle} ({rub.unite})
                      </option>
                    ))}
                  </select>
                  {rubriqueForm.rubrique && (
                    <p style={{ color: '#94a3b8', fontSize: '12px', marginTop: '4px' }}>
                      {rubriquesReference.find(r => r.code === rubriqueForm.rubrique)?.description}
                    </p>
                  )}
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', color: '#94a3b8', fontSize: '14px' }}>
                    Capacite maximale autorisee *
                    {rubriqueForm.rubrique && (
                      <span style={{ marginLeft: '8px' }}>
                        ({rubriquesReference.find(r => r.code === rubriqueForm.rubrique)?.unite})
                      </span>
                    )}
                  </label>
                  <input
                    type="number"
                    value={rubriqueForm.volume}
                    onChange={(e) => setRubriqueForm({ ...rubriqueForm, volume: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.2)',
                      background: 'rgba(255,255,255,0.05)',
                      color: 'white'
                    }}
                    placeholder="1000"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', color: '#94a3b8', fontSize: '14px' }}>Date de declaration</label>
                  <input
                    type="date"
                    value={rubriqueForm.dateDeclaration}
                    onChange={(e) => setRubriqueForm({ ...rubriqueForm, dateDeclaration: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.2)',
                      background: 'rgba(255,255,255,0.05)',
                      color: 'white'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button
                  onClick={() => setShowRubriqueModal(false)}
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: 'none',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}>
                  Annuler
                </button>
                <button
                  onClick={handleAddRubrique}
                  disabled={!rubriqueForm.rubrique || !rubriqueForm.volume}
                  style={{
                    background: !rubriqueForm.rubrique || !rubriqueForm.volume
                      ? 'rgba(255,255,255,0.1)'
                      : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                    border: 'none',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    cursor: !rubriqueForm.rubrique || !rubriqueForm.volume ? 'not-allowed' : 'pointer',
                    fontWeight: '600'
                  }}>
                  Ajouter
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Volume */}
        {showVolumeModal && selectedWarehouse && (
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
            zIndex: 1000
          }}>
            <div style={{
              background: '#1e293b',
              borderRadius: '16px',
              padding: '32px',
              width: '500px'
            }}>
              <h2 style={{ marginBottom: '8px' }}>? Declarer un volume</h2>
              <p style={{ color: '#94a3b8', marginBottom: '24px', fontSize: '14px' }}>
                Entrepot: {selectedWarehouse.name}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', color: '#94a3b8', fontSize: '14px' }}>Rubrique *</label>
                  <select
                    value={volumeForm.rubrique}
                    onChange={(e) => setVolumeForm({ ...volumeForm, rubrique: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.2)',
                      background: 'rgba(255,255,255,0.05)',
                      color: 'white'
                    }}>
                    <option value="">-- Selectionner --</option>
                    {selectedWarehouse.icpeRubriques?.map((rub) => (
                      <option key={rub.rubrique} value={rub.rubrique}>
                        {rub.rubrique} - {rub.libelle} (max: {rub.seuilMax} {rub.unite})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', color: '#94a3b8', fontSize: '14px' }}>Volume actuel *</label>
                  <input
                    type="number"
                    value={volumeForm.volume}
                    onChange={(e) => setVolumeForm({ ...volumeForm, volume: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.2)',
                      background: 'rgba(255,255,255,0.05)',
                      color: 'white'
                    }}
                    placeholder="750"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', color: '#94a3b8', fontSize: '14px' }}>Date</label>
                  <input
                    type="date"
                    value={volumeForm.date}
                    onChange={(e) => setVolumeForm({ ...volumeForm, date: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.2)',
                      background: 'rgba(255,255,255,0.05)',
                      color: 'white'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', color: '#94a3b8', fontSize: '14px' }}>Commentaire (optionnel)</label>
                  <textarea
                    value={volumeForm.comment}
                    onChange={(e) => setVolumeForm({ ...volumeForm, comment: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.2)',
                      background: 'rgba(255,255,255,0.05)',
                      color: 'white',
                      minHeight: '80px',
                      resize: 'vertical'
                    }}
                    placeholder="Inventaire mensuel..."
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button
                  onClick={() => setShowVolumeModal(false)}
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: 'none',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}>
                  Annuler
                </button>
                <button
                  onClick={handleDeclareVolume}
                  disabled={!volumeForm.rubrique || !volumeForm.volume}
                  style={{
                    background: !volumeForm.rubrique || !volumeForm.volume
                      ? 'rgba(255,255,255,0.1)'
                      : 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                    border: 'none',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    cursor: !volumeForm.rubrique || !volumeForm.volume ? 'not-allowed' : 'pointer',
                    fontWeight: '600'
                  }}>
                  Declarer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
